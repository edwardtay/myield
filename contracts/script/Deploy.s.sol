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
