# mYield

**Composable yield aggregator for Mantle.** Auto-rebalancing ERC4626 vaults that route deposits to optimal DeFi yield sources.

## Live

| | URL |
|--|-----|
| App | Coming soon |

## Contracts (Mantle Mainnet, Verified)

| Contract | Address |
|----------|---------|
| mYield USDC Vault | [`0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE`](https://mantlescan.xyz/address/0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE#code) |
| Lendle Adapter | [`0xf98a4A0482d534c004cdB9A3358fd71347c4395B`](https://mantlescan.xyz/address/0xf98a4A0482d534c004cdB9A3358fd71347c4395B#code) |

## Stack

- **Vault**: ERC4626 (OpenZeppelin)
- **Yield Sources**: Lendle (Aave V2 fork), mETH (planned)
- **Network**: Mantle Mainnet (Chain ID: 5000)
- **Framework**: Foundry

## Architecture

```
User deposits USDC
        ↓
   mYieldVault (ERC4626)
        ↓
   ┌────┴────┐
   │ Router  │ ← Allocation strategy
   └────┬────┘
        ↓
  ┌─────┴─────┐
  │  Adapters │
  ├───────────┤
  │ Lendle    │ → Lending yield (~4-8% APY)
  │ mETH      │ → LST yield (~4% APY)
  └───────────┘
```

## Vault Interface

```solidity
// ERC4626 standard
function deposit(uint256 assets, address receiver) external returns (uint256 shares);
function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

// View
function totalAssets() external view returns (uint256);
function convertToShares(uint256 assets) external view returns (uint256);
function convertToAssets(uint256 shares) external view returns (uint256);

// mYield extensions
function getWeightedAPY() external view returns (uint256);  // Current blended APY in bps
function needsRebalance() external view returns (bool);
function harvest() external returns (uint256);              // Claim & compound rewards
function rebalance() external;                              // Rebalance to target allocations
```

## Adapters

| Adapter | Protocol | Asset | APY Source |
|---------|----------|-------|------------|
| LendleAdapter | Lendle | USDC | Supply interest + LEND rewards |
| METHAdapter | mETH Protocol | WETH | Staking yield |

## Integration

```solidity
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

IERC4626 vault = IERC4626(0xcfF09905F8f18B35F5A1Ba6d2822D62B3d8c48bE);

// Deposit
IERC20(USDC).approve(address(vault), amount);
uint256 shares = vault.deposit(amount, msg.sender);

// Withdraw
uint256 assets = vault.redeem(shares, msg.sender, msg.sender);
```

## Build

```bash
cd contracts
forge install
forge build

# Deploy
source .env
forge script script/Deploy.s.sol:DeployScript --rpc-url https://rpc.mantle.xyz --broadcast

# Verify
forge verify-contract <ADDRESS> src/mYieldVault.sol:mYieldVault --chain-id 5000 --verifier sourcify
```

## Addresses

### Mantle Mainnet
```
USDC:   0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9
WETH:   0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111
mETH:   0xcDA86A272531e8640cD7F1a92c01839911B90bb0
```

### Lendle (Integrated)
```
LendingPool:  0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3
Incentives:   0x79e2fd1c484EB9EE45001A98Ce31F28918F27C41
LEND Token:   0x25356aeca4210eF7553140edb9b8026089E49396
```

## Security

- ERC4626 standard implementation (audited by OZ)
- ReentrancyGuard on deposit/withdraw
- Owner-only adapter management
- Emergency withdrawal functions

## License

MIT
