# mYield

Multi-strategy ERC4626 yield aggregator on Mantle. Routes capital across Lendle and mETH via Merchant Moe.

## Deployments (Mantle Mainnet)

| Contract | Address |
|----------|---------|
| USDC Vault | [`0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE`](https://mantlescan.xyz/address/0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE#code) |
| WETH Vault | [`0x073b61f5Ed26d802b05301e0E019f78Ac1A41D23`](https://mantlescan.xyz/address/0x073b61f5Ed26d802b05301e0E019f78Ac1A41D23#code) |
| Lendle USDC Adapter | [`0xf98a4A0482d534c004cdB9A3358fd71347c4395B`](https://mantlescan.xyz/address/0xf98a4A0482d534c004cdB9A3358fd71347c4395B#code) |
| Lendle WETH Adapter | [`0x8F878deCd44f7Cf547D559a6e6D0577E370fa0Db`](https://mantlescan.xyz/address/0x8F878deCd44f7Cf547D559a6e6D0577E370fa0Db#code) |
| mETH Adapter | [`0xEff2eC240CEB2Ddf582Df0e42fc66a6910D3Fe3f`](https://mantlescan.xyz/address/0xEff2eC240CEB2Ddf582Df0e42fc66a6910D3Fe3f#code) |

## Strategies

**USDC Vault** → 100% Lendle (supply USDC, earn interest + LEND)

**WETH Vault** → 60% Lendle / 40% mETH
- Lendle: `LendingPool.deposit()` → aWETH
- mETH: `MoeRouter.swapExactTokensForTokens(WETH, mETH)` → LST yield

## Protocol Integration

```solidity
// Lendle (Aave V2)
ILendingPool(0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3).deposit(asset, amount, onBehalfOf, 0);

// mETH via Merchant Moe
IMoeRouter(0xeaEE7EE68874218c3558b40063c42B82D3E7232a).swapExactTokensForTokens(
    amount, minOut, [WETH, METH], address(this), deadline
);
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    mYieldVault (ERC4626)                │
│  - deposit(assets, receiver) → shares                   │
│  - withdraw(assets, receiver, owner) → shares           │
│  - rebalance() → redistribute to target allocations     │
│  - harvest() → claim rewards, compound                  │
├─────────────────────────────────────────────────────────┤
│                    Adapter Router                       │
│  AdapterInfo[] adapters                                 │
│  - allocation (bps)                                     │
│  - deposited                                            │
│  - active                                               │
├──────────────────────┬──────────────────────────────────┤
│   LendleAdapter      │         METHAdapter              │
│   - LendingPool      │   - MoeRouter.swap()             │
│   - aToken receipt   │   - holds mETH                   │
│   - harvest LEND     │   - yield via rate appreciation  │
└──────────────────────┴──────────────────────────────────┘
```

## On-Chain State

```bash
# USDC Vault TVL
cast call 0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE "totalAssets()" --rpc-url https://rpc.mantle.xyz

# WETH Vault TVL
cast call 0x073b61f5Ed26d802b05301e0E019f78Ac1A41D23 "totalAssets()" --rpc-url https://rpc.mantle.xyz

# mETH held in adapter (real swap happened)
cast call 0xcDA86A272531e8640cD7F1a92c01839911B90bb0 "balanceOf(address)" 0xEff2eC240CEB2Ddf582Df0e42fc66a6910D3Fe3f --rpc-url https://rpc.mantle.xyz
```

## Vault Interface

```solidity
// ERC4626
function deposit(uint256 assets, address receiver) external returns (uint256 shares);
function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

// Extensions
function getWeightedAPY() external view returns (uint256);  // bps
function rebalance() external;                              // keeper
function harvest() external returns (uint256);              // claim + compound
```

## Run

```bash
# Contracts
cd contracts && forge build

# Frontend
cd frontend && npm i && npm run dev
```

## Addresses

```
USDC:                 0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9
WETH:                 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111
mETH:                 0xcDA86A272531e8640cD7F1a92c01839911B90bb0
Lendle LendingPool:   0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3
Merchant Moe Router:  0xeaEE7EE68874218c3558b40063c42B82D3E7232a
```

## License

MIT
