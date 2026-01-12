// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAdapter - Yield adapter interface
/// @notice Standard interface for all yield source adapters
interface IAdapter {
    /// @notice Deposit assets into the yield source
    /// @param amount Amount of underlying to deposit
    /// @return shares Amount of shares/receipt tokens received
    function deposit(uint256 amount) external returns (uint256 shares);

    /// @notice Withdraw assets from the yield source
    /// @param amount Amount of underlying to withdraw
    /// @return received Actual amount received
    function withdraw(uint256 amount) external returns (uint256 received);

    /// @notice Get total value in underlying terms
    /// @return Total value of adapter position in underlying
    function totalValue() external view returns (uint256);

    /// @notice Get current APY estimate (in basis points, 10000 = 100%)
    /// @return Current APY in basis points
    function currentAPY() external view returns (uint256);

    /// @notice Harvest any pending rewards
    /// @return harvested Amount of rewards harvested (in underlying terms)
    function harvest() external returns (uint256 harvested);

    /// @notice Get the underlying asset address
    function underlying() external view returns (address);

    /// @notice Check if adapter is active
    function isActive() external view returns (bool);
}
