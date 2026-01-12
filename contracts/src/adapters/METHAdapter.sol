// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";

/// @title IMoeRouter - Merchant Moe Router interface
interface IMoeRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}

/// @title METHAdapter
/// @notice Adapter for mETH liquid staking yield on Mantle
/// @dev Swaps WETH -> mETH via Merchant Moe for LST yield exposure
contract METHAdapter is IAdapter {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    // Mantle Mainnet addresses
    address public constant METH = 0xcDA86A272531e8640cD7F1a92c01839911B90bb0;
    address public constant WETH = 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111;
    address public constant MOE_ROUTER = 0xeaEE7EE68874218c3558b40063c42B82D3E7232a;

    // mETH staking APY (approximately 4% from Ethereum staking)
    uint256 public constant STAKING_APY = 400; // 4% in bps

    // ============ State ============

    address public immutable vault;
    address public immutable override underlying;
    bool public override isActive;

    // ============ Events ============

    event Deposited(uint256 wethAmount, uint256 mETHReceived);
    event Withdrawn(uint256 mETHAmount, uint256 wethReceived);

    // ============ Modifiers ============

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault");
        _;
    }

    // ============ Constructor ============

    constructor(address vault_, address underlying_) {
        require(underlying_ == WETH, "Must be WETH");
        vault = vault_;
        underlying = underlying_;
        isActive = true;

        // Approve router for WETH and mETH
        IERC20(WETH).approve(MOE_ROUTER, type(uint256).max);
        IERC20(METH).approve(MOE_ROUTER, type(uint256).max);
    }

    // ============ Core Functions ============

    /// @notice Deposit WETH and swap to mETH
    function deposit(uint256 amount) external override onlyVault returns (uint256) {
        require(isActive, "Adapter inactive");
        require(amount > 0, "Zero amount");

        // Transfer WETH from vault
        IERC20(WETH).safeTransferFrom(vault, address(this), amount);

        // Swap WETH -> mETH via Merchant Moe
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = METH;

        uint256 mETHBefore = IERC20(METH).balanceOf(address(this));

        // Get minimum amount out (allow 1% slippage)
        uint256[] memory amountsOut = IMoeRouter(MOE_ROUTER).getAmountsOut(amount, path);
        uint256 minOut = (amountsOut[1] * 99) / 100;

        IMoeRouter(MOE_ROUTER).swapExactTokensForTokens(
            amount,
            minOut,
            path,
            address(this),
            block.timestamp + 300
        );

        uint256 mETHReceived = IERC20(METH).balanceOf(address(this)) - mETHBefore;

        emit Deposited(amount, mETHReceived);
        return mETHReceived;
    }

    /// @notice Withdraw by swapping mETH back to WETH
    function withdraw(uint256 amount) external override onlyVault returns (uint256) {
        if (amount == 0) return 0;

        uint256 mETHBalance = IERC20(METH).balanceOf(address(this));
        if (mETHBalance == 0) return 0;

        // Calculate mETH to sell based on requested WETH amount
        address[] memory pathOut = new address[](2);
        pathOut[0] = METH;
        pathOut[1] = WETH;

        // Get how much mETH needed for desired WETH
        address[] memory pathIn = new address[](2);
        pathIn[0] = WETH;
        pathIn[1] = METH;

        // Estimate mETH needed (reverse calculation)
        uint256[] memory amountsIn = IMoeRouter(MOE_ROUTER).getAmountsOut(amount, pathIn);
        uint256 mETHToSell = amountsIn[1];

        if (mETHToSell > mETHBalance) {
            mETHToSell = mETHBalance;
        }

        uint256 wethBefore = IERC20(WETH).balanceOf(address(this));

        // Swap mETH -> WETH
        uint256[] memory amountsOut = IMoeRouter(MOE_ROUTER).getAmountsOut(mETHToSell, pathOut);
        uint256 minOut = (amountsOut[1] * 99) / 100;

        IMoeRouter(MOE_ROUTER).swapExactTokensForTokens(
            mETHToSell,
            minOut,
            pathOut,
            address(this),
            block.timestamp + 300
        );

        uint256 wethReceived = IERC20(WETH).balanceOf(address(this)) - wethBefore;

        // Transfer to vault
        IERC20(WETH).safeTransfer(vault, wethReceived);

        emit Withdrawn(mETHToSell, wethReceived);
        return wethReceived;
    }

    /// @notice Get total value in WETH terms
    function totalValue() public view override returns (uint256) {
        uint256 mETHBalance = IERC20(METH).balanceOf(address(this));
        if (mETHBalance == 0) return 0;

        // Get WETH value of mETH holdings
        address[] memory path = new address[](2);
        path[0] = METH;
        path[1] = WETH;

        uint256[] memory amounts = IMoeRouter(MOE_ROUTER).getAmountsOut(mETHBalance, path);
        return amounts[1];
    }

    /// @notice Get current staking APY
    function currentAPY() external pure override returns (uint256) {
        return STAKING_APY;
    }

    /// @notice mETH yield accrues via exchange rate appreciation
    function harvest() external override onlyVault returns (uint256) {
        // mETH yield is automatic via exchange rate
        // No action needed
        return 0;
    }

    // ============ Admin ============

    function setActive(bool active_) external {
        require(msg.sender == vault, "Only vault");
        isActive = active_;
    }

    function emergencyWithdraw() external onlyVault returns (uint256) {
        uint256 mETHBalance = IERC20(METH).balanceOf(address(this));

        if (mETHBalance > 0) {
            // Swap all mETH to WETH
            address[] memory path = new address[](2);
            path[0] = METH;
            path[1] = WETH;

            uint256[] memory amounts = IMoeRouter(MOE_ROUTER).getAmountsOut(mETHBalance, path);
            uint256 minOut = (amounts[1] * 95) / 100; // 5% slippage for emergency

            IMoeRouter(MOE_ROUTER).swapExactTokensForTokens(
                mETHBalance,
                minOut,
                path,
                vault,
                block.timestamp + 300
            );
        }

        uint256 wethBalance = IERC20(WETH).balanceOf(address(this));
        if (wethBalance > 0) {
            IERC20(WETH).safeTransfer(vault, wethBalance);
        }

        return IERC20(WETH).balanceOf(vault);
    }

    // ============ View Functions ============

    function getMETHBalance() external view returns (uint256) {
        return IERC20(METH).balanceOf(address(this));
    }

    function getExpectedMETH(uint256 wethAmount) external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = METH;
        uint256[] memory amounts = IMoeRouter(MOE_ROUTER).getAmountsOut(wethAmount, path);
        return amounts[1];
    }
}
