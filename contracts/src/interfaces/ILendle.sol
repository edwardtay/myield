// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ILendingPool - Lendle (Aave V2 fork) LendingPool interface
interface ILendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getReserveData(address asset) external view returns (ReserveData memory);
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralETH,
        uint256 totalDebtETH,
        uint256 availableBorrowsETH,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    );

    struct ReserveData {
        uint256 configuration;
        uint128 liquidityIndex;
        uint128 variableBorrowIndex;
        uint128 currentLiquidityRate;
        uint128 currentVariableBorrowRate;
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint8 id;
    }
}

/// @title ILendingPoolAddressesProvider
interface ILendingPoolAddressesProvider {
    function getLendingPool() external view returns (address);
    function getPriceOracle() external view returns (address);
}

/// @title IAToken - Lendle aToken interface
interface IAToken {
    function balanceOf(address account) external view returns (uint256);
    function scaledBalanceOf(address user) external view returns (uint256);
    function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256);
    function totalSupply() external view returns (uint256);
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}

/// @title IChefIncentivesController - Lendle rewards
interface IChefIncentivesController {
    function claim(address _user, address[] calldata _tokens) external;
    function claimableReward(address _user, address[] calldata _tokens) external view returns (uint256[] memory);
}

/// @title IWETHGateway - For ETH deposits
interface IWETHGateway {
    function depositETH(address lendingPool, address onBehalfOf, uint16 referralCode) external payable;
    function withdrawETH(address lendingPool, uint256 amount, address to) external;
}
