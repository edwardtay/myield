import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Mantle Mainnet
export const mantle = {
  id: 5000,
  name: 'Mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MantleScan', url: 'https://mantlescan.xyz' },
  },
} as const

export const config = createConfig({
  chains: [mantle],
  connectors: [injected()],
  transports: {
    [mantle.id]: http(),
  },
})
