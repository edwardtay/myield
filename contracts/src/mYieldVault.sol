// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IAdapter} from "./interfaces/IAdapter.sol";

/// @title mYieldVault
/// @notice Auto-rebalancing yield aggregator vault for Mantle
/// @dev ERC4626-compliant vault that routes deposits to optimal yield sources
contract mYieldVault is ERC4626, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Types ============

    struct AdapterInfo {
        IAdapter adapter;
        uint256 allocation;     // Target allocation in basis points (10000 = 100%)
        uint256 deposited;      // Amount deposited to this adapter
        bool active;
    }

    struct Strategy {
        uint256 minAllocation;  // Minimum allocation per adapter (bps)
        uint256 maxAllocation;  // Maximum allocation per adapter (bps)
        uint256 rebalanceThreshold; // Rebalance if deviation > threshold (bps)
    }

    // ============ State ============

    address public owner;
    address public keeper;

    AdapterInfo[] public adapters;
    Strategy public strategy;

    uint256 public totalDeposited;
    uint256 public lastHarvest;
    uint256 public performanceFee; // in basis points (500 = 5%)
    address public feeRecipient;

    uint256 public constant MAX_ADAPTERS = 10;
    uint256 public constant BPS = 10000;

    // ============ Events ============

    event AdapterAdded(address indexed adapter, uint256 allocation);
    event AdapterRemoved(address indexed adapter);
    event AllocationUpdated(uint256[] allocations);
    event Rebalanced(uint256 timestamp);
    event Harvested(uint256 amount, uint256 fee);
    event StrategyUpdated(uint256 minAlloc, uint256 maxAlloc, uint256 threshold);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner, "Not keeper");
        _;
    }

    // ============ Constructor ============

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address feeRecipient_
    ) ERC4626(asset_) ERC20(name_, symbol_) {
        owner = msg.sender;
        keeper = msg.sender;
        feeRecipient = feeRecipient_;
        performanceFee = 500; // 5% default

        strategy = Strategy({
            minAllocation: 1000,    // 10% minimum per adapter
            maxAllocation: 8000,    // 80% maximum per adapter
            rebalanceThreshold: 500 // 5% deviation triggers rebalance
        });
    }

    // ============ Admin Functions ============

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    function setKeeper(address newKeeper) external onlyOwner {
        keeper = newKeeper;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }

    function setPerformanceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 2000, "Fee too high"); // Max 20%
        performanceFee = newFee;
    }

    function setStrategy(
        uint256 minAlloc,
        uint256 maxAlloc,
        uint256 threshold
    ) external onlyOwner {
        require(minAlloc <= maxAlloc, "Invalid range");
        require(maxAlloc <= BPS, "Max exceeds 100%");
        strategy = Strategy(minAlloc, maxAlloc, threshold);
        emit StrategyUpdated(minAlloc, maxAlloc, threshold);
    }

    // ============ Adapter Management ============

    function addAdapter(address adapter, uint256 allocation) external onlyOwner {
        require(adapters.length < MAX_ADAPTERS, "Max adapters");
        require(adapter != address(0), "Invalid adapter");
        require(IAdapter(adapter).underlying() == asset(), "Asset mismatch");

        adapters.push(AdapterInfo({
            adapter: IAdapter(adapter),
            allocation: allocation,
            deposited: 0,
            active: true
        }));

        // Approve adapter to spend underlying
        IERC20(asset()).approve(adapter, type(uint256).max);

        emit AdapterAdded(adapter, allocation);
    }

    function removeAdapter(uint256 index) external onlyOwner {
        require(index < adapters.length, "Invalid index");

        AdapterInfo storage info = adapters[index];

        // Withdraw all from adapter
        if (info.deposited > 0) {
            info.adapter.withdraw(info.deposited);
            info.deposited = 0;
        }

        // Revoke approval
        IERC20(asset()).approve(address(info.adapter), 0);

        emit AdapterRemoved(address(info.adapter));

        // Remove from array
        adapters[index] = adapters[adapters.length - 1];
        adapters.pop();
    }

    function setAdapterActive(uint256 index, bool active) external onlyOwner {
        require(index < adapters.length, "Invalid index");
        adapters[index].active = active;
    }

    function updateAllocations(uint256[] calldata allocations) external onlyOwner {
        require(allocations.length == adapters.length, "Length mismatch");

        uint256 total;
        for (uint256 i = 0; i < allocations.length; i++) {
            require(allocations[i] >= strategy.minAllocation, "Below min");
            require(allocations[i] <= strategy.maxAllocation, "Above max");
            adapters[i].allocation = allocations[i];
            total += allocations[i];
        }
        require(total == BPS, "Must sum to 100%");

        emit AllocationUpdated(allocations);
    }

    // ============ Core Vault Functions ============

    function totalAssets() public view override returns (uint256) {
        uint256 total = IERC20(asset()).balanceOf(address(this));
        for (uint256 i = 0; i < adapters.length; i++) {
            if (adapters[i].active) {
                total += adapters[i].adapter.totalValue();
            }
        }
        return total;
    }

    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant {
        super._deposit(caller, receiver, assets, shares);
        _deployCapital(assets);
    }

    function _withdraw(
        address caller,
        address receiver,
        address owner_,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant {
        _withdrawFromAdapters(assets);
        super._withdraw(caller, receiver, owner_, assets, shares);
    }

    // ============ Capital Deployment ============

    function _deployCapital(uint256 amount) internal {
        if (adapters.length == 0) return;

        for (uint256 i = 0; i < adapters.length; i++) {
            AdapterInfo storage info = adapters[i];
            if (!info.active) continue;

            uint256 toDeposit = (amount * info.allocation) / BPS;
            if (toDeposit > 0) {
                info.adapter.deposit(toDeposit);
                info.deposited += toDeposit;
            }
        }
        totalDeposited += amount;
    }

    function _withdrawFromAdapters(uint256 amount) internal {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        if (balance >= amount) return;

        uint256 needed = amount - balance;

        // Withdraw proportionally from each adapter
        for (uint256 i = 0; i < adapters.length && needed > 0; i++) {
            AdapterInfo storage info = adapters[i];
            if (!info.active || info.deposited == 0) continue;

            uint256 adapterValue = info.adapter.totalValue();
            uint256 toWithdraw = (needed * adapterValue) / _totalAdapterValue();
            if (toWithdraw > adapterValue) toWithdraw = adapterValue;

            if (toWithdraw > 0) {
                uint256 received = info.adapter.withdraw(toWithdraw);
                info.deposited = info.deposited > received ? info.deposited - received : 0;
                needed = needed > received ? needed - received : 0;
            }
        }
    }

    function _totalAdapterValue() internal view returns (uint256 total) {
        for (uint256 i = 0; i < adapters.length; i++) {
            if (adapters[i].active) {
                total += adapters[i].adapter.totalValue();
            }
        }
    }

    // ============ Rebalancing ============

    function rebalance() external onlyKeeper {
        uint256 total = totalAssets();
        if (total == 0) return;

        // First, withdraw everything
        for (uint256 i = 0; i < adapters.length; i++) {
            AdapterInfo storage info = adapters[i];
            if (info.deposited > 0) {
                info.adapter.withdraw(type(uint256).max);
                info.deposited = 0;
            }
        }

        // Re-deploy according to target allocations
        uint256 available = IERC20(asset()).balanceOf(address(this));
        for (uint256 i = 0; i < adapters.length; i++) {
            AdapterInfo storage info = adapters[i];
            if (!info.active) continue;

            uint256 toDeposit = (available * info.allocation) / BPS;
            if (toDeposit > 0) {
                info.adapter.deposit(toDeposit);
                info.deposited = toDeposit;
            }
        }

        emit Rebalanced(block.timestamp);
    }

    function needsRebalance() external view returns (bool) {
        uint256 total = _totalAdapterValue();
        if (total == 0) return false;

        for (uint256 i = 0; i < adapters.length; i++) {
            AdapterInfo storage info = adapters[i];
            if (!info.active) continue;

            uint256 currentAlloc = (info.adapter.totalValue() * BPS) / total;
            uint256 targetAlloc = info.allocation;

            uint256 deviation = currentAlloc > targetAlloc
                ? currentAlloc - targetAlloc
                : targetAlloc - currentAlloc;

            if (deviation > strategy.rebalanceThreshold) {
                return true;
            }
        }
        return false;
    }

    // ============ Harvesting ============

    function harvest() external onlyKeeper returns (uint256 totalHarvested) {
        for (uint256 i = 0; i < adapters.length; i++) {
            if (adapters[i].active) {
                totalHarvested += adapters[i].adapter.harvest();
            }
        }

        if (totalHarvested > 0 && performanceFee > 0) {
            uint256 fee = (totalHarvested * performanceFee) / BPS;
            IERC20(asset()).safeTransfer(feeRecipient, fee);
            emit Harvested(totalHarvested, fee);
        }

        lastHarvest = block.timestamp;
    }

    // ============ View Functions ============

    function getAdaptersCount() external view returns (uint256) {
        return adapters.length;
    }

    function getAdapterInfo(uint256 index) external view returns (
        address adapter,
        uint256 allocation,
        uint256 deposited,
        uint256 currentValue,
        uint256 apy,
        bool active
    ) {
        AdapterInfo storage info = adapters[index];
        return (
            address(info.adapter),
            info.allocation,
            info.deposited,
            info.adapter.totalValue(),
            info.adapter.currentAPY(),
            info.active
        );
    }

    function getAllAllocations() external view returns (uint256[] memory current, uint256[] memory target) {
        uint256 total = _totalAdapterValue();
        current = new uint256[](adapters.length);
        target = new uint256[](adapters.length);

        for (uint256 i = 0; i < adapters.length; i++) {
            target[i] = adapters[i].allocation;
            if (total > 0) {
                current[i] = (adapters[i].adapter.totalValue() * BPS) / total;
            }
        }
    }

    function getWeightedAPY() external view returns (uint256) {
        uint256 total = _totalAdapterValue();
        if (total == 0) return 0;

        uint256 weightedSum;
        for (uint256 i = 0; i < adapters.length; i++) {
            if (adapters[i].active) {
                uint256 value = adapters[i].adapter.totalValue();
                uint256 apy = adapters[i].adapter.currentAPY();
                weightedSum += (value * apy) / total;
            }
        }
        return weightedSum;
    }
}
