# mYield

**Multi-strategy yield aggregator for Mantle.** Auto-rebalancing ERC4626 vaults that route deposits to optimal DeFi yield sources.

## Live on Mantle Mainnet

| Contract | Address |
|----------|---------|
| **USDC Vault** | [`0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE`](https://mantlescan.xyz/address/0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE#code) |
| **WETH Vault** | [`0x073b61f5Ed26d802b05301e0E019f78Ac1A41D23`](https://mantlescan.xyz/address/0x073b61f5Ed26d802b05301e0E019f78Ac1A41D23#code) |
| Lendle USDC Adapter | [`0xf98a4A0482d534c004cdB9A3358fd71347c4395B`](https://mantlescan.xyz/address/0xf98a4A0482d534c004cdB9A3358fd71347c4395B#code) |
| Lendle WETH Adapter | [`0x8F878deCd44f7Cf547D559a6e6D0577E370fa0Db`](https://mantlescan.xyz/address/0x8F878deCd44f7Cf547D559a6e6D0577E370fa0Db#code) |
| mETH Adapter | [`0xEff2eC240CEB2Ddf582Df0e42fc66a6910D3Fe3f`](https://mantlescan.xyz/address/0xEff2eC240CEB2Ddf582Df0e42fc66a6910D3Fe3f#code) |

## Vaults

### USDC Vault (myUSDC)
- **Strategy:** 100% Lendle lending
- **Yield Source:** Supply interest + LEND rewards
- **APY:** ~4-8%

### WETH Vault (myWETH)
- **Strategy:** 60% Lendle + 40% mETH
- **Yield Sources:**
  - Lendle: WETH lending yield + LEND rewards
  - mETH: Liquid staking yield via Merchant Moe swap
- **APY:** ~4-6% blended

## Protocol Integrations

| Protocol | Type | Integration |
|----------|------|-------------|
| **Lendle** | Lending (Aave V2 fork) | Deposit/withdraw via LendingPool |
| **mETH** | Liquid Staking Token | WETH → mETH swap via Merchant Moe |
| **Merchant Moe** | DEX | Real-time swaps for mETH strategy |

## Architecture

```
User deposits USDC/WETH
        ↓
   mYieldVault (ERC4626)
        ↓
   ┌────┴────┐
   │ Router  │ ← Target allocations
   └────┬────┘
        ↓
  ┌─────┴─────┐
  │  Adapters │
  ├───────────┤
  │ Lendle    │ → Lending yield (USDC/WETH)
  │ mETH      │ → LST yield via DEX swap
  └───────────┘
```

## Key Features

- **ERC4626 Standard** - Composable vault shares (myUSDC, myWETH)
- **Multi-Strategy** - Automatic allocation across yield sources
- **Auto-Rebalancing** - Maintains target allocations
- **Harvesting** - Claims and compounds rewards
- **Real Protocol Integration** - Live on Mantle mainnet with real TVL

## Build & Deploy

```bash
cd contracts
forge install
forge build

# Deploy
source .env
forge script script/Deploy.s.sol:DeployWETHVault --rpc-url https://rpc.mantle.xyz --broadcast
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Addresses

### Mantle Mainnet Tokens
```
USDC:   0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9
WETH:   0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111
mETH:   0xcDA86A272531e8640cD7F1a92c01839911B90bb0
```

### Integrated Protocols
```
Lendle LendingPool:   0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3
Lendle Incentives:    0x79e2fd1c484EB9EE45001A98Ce31F28918F27C41
Merchant Moe Router:  0xeaEE7EE68874218c3558b40063c42B82D3E7232a
```

## Security

- ERC4626 standard (OpenZeppelin audited)
- ReentrancyGuard on deposit/withdraw
- Owner-only adapter management
- Emergency withdrawal functions
- Slippage protection on DEX swaps

## Hackathon Track

**DeFi & Composability**
- Composable yield optimizer (ERC4626)
- Multi-protocol integration (Lendle + mETH + Merchant Moe)
- Real mainnet deployment with TVL

## License

MIT
