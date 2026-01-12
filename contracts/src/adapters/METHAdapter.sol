// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";

/// @title IMETHOracle - mETH exchange rate oracle
interface IMETHOracle {
    function mETHToETH(uint256 mETHAmount) external view returns (uint256);
    function ethToMETH(uint256 ethAmount) external view returns (uint256);
}

/// @title METHAdapter
/// @notice Adapter for mETH liquid staking yield on Mantle
/// @dev Holds mETH (bridged from L1) and tracks value appreciation
contract METHAdapter is IAdapter {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    // Mantle Mainnet addresses
    address public constant METH = 0xcDA86A272531e8640cD7F1a92c01839911B90bb0; // mETH on Mantle
    address public constant WETH = 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111; // WETH on Mantle
    address public constant WMNT = 0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8; // Wrapped MNT

    // mETH staking APY oracle (estimated from L1 data)
    // In production, use Chainlink or custom oracle
    uint256 public constant BASE_STAKING_APY = 400; // 4% base APY in bps

    // ============ State ============

    address public immutable vault;
    address public immutable override underlying;
    bool public override isActive;

    // Track deposited amounts for accounting
    uint256 public totalMETHDeposited;
    uint256 public lastExchangeRate;

    // ============ Events ============

    event Deposited(uint256 wethAmount, uint256 mETHReceived);
    event Withdrawn(uint256 mETHAmount, uint256 wethReceived);
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);

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
        lastExchangeRate = 1e18; // Start at 1:1
    }

    // ============ Core Functions ============

    /// @notice Deposit WETH and receive mETH position
    /// @dev On Mantle mainnet, swaps WETH -> mETH via DEX (Agni/Merchant Moe)
    function deposit(uint256 amount) external override onlyVault returns (uint256) {
        require(isActive, "Adapter inactive");
        require(amount > 0, "Zero amount");

        // Transfer WETH from vault
        IERC20(underlying).safeTransferFrom(vault, address(this), amount);

        // In production: swap WETH -> mETH via Agni
        // For now, simulate by tracking the deposit
        // The value accrues as mETH appreciates vs ETH

        uint256 mETHReceived = _simulateSwapToMETH(amount);
        totalMETHDeposited += mETHReceived;

        emit Deposited(amount, mETHReceived);
        return mETHReceived;
    }

    /// @notice Withdraw mETH position back to WETH
    function withdraw(uint256 amount) external override onlyVault returns (uint256) {
        if (amount == 0) return 0;

        uint256 available = totalValue();
        if (amount > available) amount = available;

        // Calculate how much mETH to sell
        uint256 mETHToSell = _wethToMETH(amount);
        if (mETHToSell > totalMETHDeposited) mETHToSell = totalMETHDeposited;

        // In production: swap mETH -> WETH via Agni
        uint256 wethReceived = _simulateSwapToWETH(mETHToSell);
        totalMETHDeposited -= mETHToSell;

        // Transfer to vault
        IERC20(underlying).safeTransfer(vault, wethReceived);

        emit Withdrawn(mETHToSell, wethReceived);
        return wethReceived;
    }

    /// @notice Get total value in WETH terms
    function totalValue() public view override returns (uint256) {
        if (totalMETHDeposited == 0) return 0;

        // mETH value = mETH amount * exchange rate
        return _mETHToWETH(totalMETHDeposited);
    }

    /// @notice Get current staking APY
    function currentAPY() external pure override returns (uint256) {
        // mETH staking yield is ~4% APY
        // Plus any additional incentives from Mantle ecosystem
        return BASE_STAKING_APY;
    }

    /// @notice Harvest is a no-op for mETH (yield accrues in exchange rate)
    function harvest() external override onlyVault returns (uint256) {
        // mETH yield accrues automatically via exchange rate
        // Update our tracked rate
        uint256 oldRate = lastExchangeRate;
        lastExchangeRate = _getCurrentExchangeRate();

        emit ExchangeRateUpdated(oldRate, lastExchangeRate);
        return 0;
    }

    // ============ Internal Functions ============

    function _mETHToWETH(uint256 mETHAmount) internal view returns (uint256) {
        // mETH to ETH exchange rate (mETH appreciates over time)
        // Current rate is approximately 1.04 mETH = 1.04 ETH
        return (mETHAmount * _getCurrentExchangeRate()) / 1e18;
    }

    function _wethToMETH(uint256 wethAmount) internal view returns (uint256) {
        return (wethAmount * 1e18) / _getCurrentExchangeRate();
    }

    function _getCurrentExchangeRate() internal view returns (uint256) {
        // In production, fetch from oracle or Agni pool
        // For now, use a simulated appreciation rate
        // ~4% APY = 0.011% daily = 0.00046% hourly

        // Simulate based on time elapsed (simplified)
        // In production, use actual mETH/ETH price from DEX
        return 1.04e18; // 1 mETH = 1.04 ETH (approximate current rate)
    }

    function _simulateSwapToMETH(uint256 wethAmount) internal view returns (uint256) {
        // Simulate WETH -> mETH swap
        // In production, call Agni router
        return _wethToMETH(wethAmount);
    }

    function _simulateSwapToWETH(uint256 mETHAmount) internal view returns (uint256) {
        // Simulate mETH -> WETH swap
        // In production, call Agni router
        return _mETHToWETH(mETHAmount);
    }

    // ============ Admin ============

    function setActive(bool active_) external {
        require(msg.sender == vault, "Only vault");
        isActive = active_;
    }

    function emergencyWithdraw() external onlyVault returns (uint256) {
        uint256 mETHBalance = IERC20(METH).balanceOf(address(this));
        if (mETHBalance > 0) {
            IERC20(METH).safeTransfer(vault, mETHBalance);
        }

        uint256 wethBalance = IERC20(underlying).balanceOf(address(this));
        if (wethBalance > 0) {
            IERC20(underlying).safeTransfer(vault, wethBalance);
        }

        totalMETHDeposited = 0;
        return wethBalance;
    }

    // ============ View Functions ============

    function getMETHBalance() external view returns (uint256) {
        return totalMETHDeposited;
    }

    function getExchangeRate() external view returns (uint256) {
        return _getCurrentExchangeRate();
    }
}
