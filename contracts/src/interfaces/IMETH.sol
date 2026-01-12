// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IMETH - Mantle Staked ETH interface
/// @dev mETH is on Ethereum L1, bridged to Mantle as wrapped mETH
interface IMETH {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title IMETHStaking - L1 staking contract (reference)
interface IMETHStaking {
    function stake(uint256 minMETHAmount) external payable returns (uint256 mETHAmount);
    function unstakeRequest(uint128 mETHAmount, uint128 minETHAmount) external returns (uint256 requestId);
    function claimUnstakeRequest(uint256 requestId) external;
    function mETHToETH(uint256 mETHAmount) external view returns (uint256 ethAmount);
    function ethToMETH(uint256 ethAmount) external view returns (uint256 mETHAmount);
}

/// @title IcmETH - cmETH restaking token
interface IcmETH {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function deposit(uint256 mETHAmount) external returns (uint256 cmETHAmount);
    function withdraw(uint256 cmETHAmount) external returns (uint256 mETHAmount);
}
