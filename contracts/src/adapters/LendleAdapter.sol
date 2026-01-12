// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";
import {ILendingPool, IAToken, IChefIncentivesController} from "../interfaces/ILendle.sol";

/// @title LendleAdapter
/// @notice Adapter for Lendle lending protocol on Mantle
/// @dev Deposits underlying into Lendle LendingPool, receives aTokens
contract LendleAdapter is IAdapter {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    // Lendle Mantle Mainnet
    address public constant LENDING_POOL = 0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3;
    address public constant INCENTIVES = 0x79e2fd1c484EB9EE45001A98Ce31F28918F27C41;
    address public constant LEND_TOKEN = 0x25356aeca4210eF7553140edb9b8026089E49396;

    uint256 public constant RAY = 1e27;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // ============ State ============

    address public immutable vault;
    address public immutable override underlying;
    address public aToken;
    bool public override isActive;

    // ============ Events ============

    event Deposited(uint256 amount, uint256 aTokenReceived);
    event Withdrawn(uint256 amount, uint256 received);
    event Harvested(uint256 lendAmount, uint256 underlyingValue);

    // ============ Modifiers ============

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault");
        _;
    }

    // ============ Constructor ============

    constructor(address vault_, address underlying_) {
        vault = vault_;
        underlying = underlying_;
        isActive = true;

        // Get aToken address from Lendle
        ILendingPool.ReserveData memory data = ILendingPool(LENDING_POOL).getReserveData(underlying_);
        aToken = data.aTokenAddress;
        require(aToken != address(0), "Asset not supported");

        // Approve LendingPool
        IERC20(underlying_).approve(LENDING_POOL, type(uint256).max);
    }

    // ============ Core Functions ============

    /// @notice Deposit underlying into Lendle
    function deposit(uint256 amount) external override onlyVault returns (uint256) {
        require(isActive, "Adapter inactive");
        require(amount > 0, "Zero amount");

        // Transfer from vault
        IERC20(underlying).safeTransferFrom(vault, address(this), amount);

        uint256 aTokenBefore = IERC20(aToken).balanceOf(address(this));

        // Deposit to Lendle
        ILendingPool(LENDING_POOL).deposit(underlying, amount, address(this), 0);

        uint256 aTokenAfter = IERC20(aToken).balanceOf(address(this));
        uint256 received = aTokenAfter - aTokenBefore;

        emit Deposited(amount, received);
        return received;
    }

    /// @notice Withdraw underlying from Lendle
    function withdraw(uint256 amount) external override onlyVault returns (uint256) {
        if (amount == 0) return 0;

        uint256 available = totalValue();
        if (amount > available) amount = available;

        uint256 balanceBefore = IERC20(underlying).balanceOf(address(this));

        // Withdraw from Lendle (amount is in underlying terms)
        ILendingPool(LENDING_POOL).withdraw(underlying, amount, address(this));

        uint256 received = IERC20(underlying).balanceOf(address(this)) - balanceBefore;

        // Transfer to vault
        IERC20(underlying).safeTransfer(vault, received);

        emit Withdrawn(amount, received);
        return received;
    }

    /// @notice Get total value in underlying terms
    function totalValue() public view override returns (uint256) {
        // aTokens are 1:1 with underlying + accrued interest
        return IERC20(aToken).balanceOf(address(this));
    }

    /// @notice Get current supply APY from Lendle
    function currentAPY() external view override returns (uint256) {
        ILendingPool.ReserveData memory data = ILendingPool(LENDING_POOL).getReserveData(underlying);

        // currentLiquidityRate is in RAY (1e27) and represents per-second rate
        // Convert to APY in basis points
        uint256 liquidityRate = data.currentLiquidityRate;

        // APY = (1 + rate/secondsPerYear)^secondsPerYear - 1
        // Simplified: APY ≈ rate (for small rates)
        // Return in basis points (multiply by 10000, divide by RAY)
        return (liquidityRate * 10000) / RAY;
    }

    /// @notice Harvest LEND rewards and swap to underlying
    function harvest() external override onlyVault returns (uint256) {
        // Claim LEND rewards
        address[] memory tokens = new address[](1);
        tokens[0] = aToken;

        uint256 lendBefore = IERC20(LEND_TOKEN).balanceOf(address(this));
        IChefIncentivesController(INCENTIVES).claim(address(this), tokens);
        uint256 lendClaimed = IERC20(LEND_TOKEN).balanceOf(address(this)) - lendBefore;

        if (lendClaimed == 0) return 0;

        // Transfer LEND to vault for handling
        // In production, could swap to underlying via DEX
        IERC20(LEND_TOKEN).safeTransfer(vault, lendClaimed);

        emit Harvested(lendClaimed, 0);
        return 0; // Return 0 since we're not converting to underlying here
    }

    // ============ View Functions ============

    function pendingRewards() external view returns (uint256) {
        address[] memory tokens = new address[](1);
        tokens[0] = aToken;
        uint256[] memory rewards = IChefIncentivesController(INCENTIVES).claimableReward(address(this), tokens);
        return rewards.length > 0 ? rewards[0] : 0;
    }

    // ============ Admin ============

    function setActive(bool active_) external {
        require(msg.sender == vault, "Only vault");
        isActive = active_;
    }

    /// @notice Emergency withdraw all funds
    function emergencyWithdraw() external onlyVault returns (uint256) {
        uint256 balance = IERC20(aToken).balanceOf(address(this));
        if (balance == 0) return 0;

        ILendingPool(LENDING_POOL).withdraw(underlying, type(uint256).max, vault);
        return IERC20(underlying).balanceOf(vault);
    }
}
