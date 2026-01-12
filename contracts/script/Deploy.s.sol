// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {mYieldVault} from "../src/mYieldVault.sol";
import {LendleAdapter} from "../src/adapters/LendleAdapter.sol";
import {METHAdapter} from "../src/adapters/METHAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title DeployScript - Deploy mYield USDC Vault to Mantle Mainnet
contract DeployScript is Script {
    // Mantle Mainnet verified addresses
    address constant WETH = 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111;
    address constant USDC = 0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9;
    address constant USDT = 0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== mYield Deployment to Mantle Mainnet ===");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy USDC Vault (ERC4626)
        mYieldVault usdcVault = new mYieldVault(
            IERC20(USDC),
            "mYield USDC Vault",
            "myUSDC",
            deployer
        );
        console.log("USDC Vault:", address(usdcVault));

        // 2. Deploy Lendle Adapter for USDC
        LendleAdapter lendleAdapter = new LendleAdapter(
            address(usdcVault),
            USDC
        );
        console.log("Lendle Adapter:", address(lendleAdapter));

        // 3. Add adapter to vault (100% allocation to Lendle)
        usdcVault.addAdapter(address(lendleAdapter), 10000);
        console.log("Adapter added with 100% allocation");

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("Vault:   ", address(usdcVault));
        console.log("Adapter: ", address(lendleAdapter));
        console.log("Asset:    USDC");
    }
}

/// @title DeployWETHVault - Deploy WETH Vault with Multi-Strategy (Lendle + mETH)
contract DeployWETHVault is Script {
    address constant WETH = 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== mYield WETH Multi-Strategy Vault ===");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy WETH Vault (ERC4626)
        mYieldVault wethVault = new mYieldVault(
            IERC20(WETH),
            "mYield WETH Vault",
            "myWETH",
            deployer
        );
        console.log("WETH Vault:", address(wethVault));

        // 2. Deploy Lendle Adapter for WETH (60% allocation)
        LendleAdapter lendleAdapter = new LendleAdapter(
            address(wethVault),
            WETH
        );
        console.log("Lendle WETH Adapter:", address(lendleAdapter));

        // 3. Deploy mETH Adapter (40% allocation) - Liquid Staking Yield
        METHAdapter methAdapter = new METHAdapter(
            address(wethVault),
            WETH
        );
        console.log("mETH Adapter:", address(methAdapter));

        // 4. Add adapters with allocation split
        // 60% Lendle (lending yield ~4-8% APY)
        // 40% mETH (staking yield ~4% APY)
        wethVault.addAdapter(address(lendleAdapter), 6000);
        wethVault.addAdapter(address(methAdapter), 4000);
        console.log("Adapters configured: 60% Lendle, 40% mETH");

        vm.stopBroadcast();

        console.log("\n=== WETH Vault Deployment Complete ===");
        console.log("WETH Vault:      ", address(wethVault));
        console.log("Lendle Adapter:  ", address(lendleAdapter));
        console.log("mETH Adapter:    ", address(methAdapter));
        console.log("Strategy:         Multi-yield (Lending + LST)");
    }
}

/// @title DepositToVault - Make deposits to show real TVL
contract DepositToVault is Script {
    address constant USDC = 0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9;
    address constant WETH = 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111;

    // Deployed vault addresses
    address constant USDC_VAULT = 0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address depositor = vm.addr(deployerPrivateKey);

        console.log("=== Deposit to mYield Vaults ===");
        console.log("Depositor:", depositor);

        vm.startBroadcast(deployerPrivateKey);

        // Check USDC balance
        uint256 usdcBalance = IERC20(USDC).balanceOf(depositor);
        console.log("USDC Balance:", usdcBalance);

        if (usdcBalance > 0) {
            // Approve and deposit USDC
            IERC20(USDC).approve(USDC_VAULT, usdcBalance);
            mYieldVault(USDC_VAULT).deposit(usdcBalance, depositor);
            console.log("Deposited USDC:", usdcBalance);
        }

        vm.stopBroadcast();

        // Show vault stats
        console.log("\n=== Vault Stats ===");
        console.log("USDC Vault TVL:", mYieldVault(USDC_VAULT).totalAssets());
    }
}

contract DeployUSDCVault is Script {
    address constant USDC = 0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy USDC Vault
        mYieldVault usdcVault = new mYieldVault(
            IERC20(USDC),
            "mYield USDC Vault",
            "myUSDC",
            deployer
        );
        console.log("USDC Vault deployed:", address(usdcVault));

        // Deploy Lendle Adapter for USDC
        LendleAdapter lendleAdapter = new LendleAdapter(
            address(usdcVault),
            USDC
        );
        console.log("Lendle USDC Adapter deployed:", address(lendleAdapter));

        // Add adapter (100% to Lendle for stablecoins)
        usdcVault.addAdapter(address(lendleAdapter), 10000);

        vm.stopBroadcast();

        console.log("\n=== USDC Vault Deployment ===");
        console.log("USDC Vault:", address(usdcVault));
        console.log("Lendle Adapter:", address(lendleAdapter));
    }
}
