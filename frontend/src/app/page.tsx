'use client'

import { ConnectWallet } from '@/components/ConnectWallet'
import { VaultCard } from '@/components/VaultCard'
import { CONTRACTS } from '@/lib/contracts'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold">mYield</span>
          </div>
          <ConnectWallet />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Yield Aggregator for{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Mantle
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Auto-rebalancing ERC4626 vaults that route deposits to optimal DeFi yield sources.
            Deposit USDC and earn yield from Lendle lending protocol.
          </p>
        </div>

        {/* Vault Card */}
        <div className="max-w-md mx-auto mb-12">
          <VaultCard />
        </div>

        {/* How it Works */}
        <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="font-semibold mb-2">Deposit USDC</h3>
              <p className="text-sm text-gray-400">
                Deposit USDC into the vault and receive myUSDC shares representing your position.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="font-semibold mb-2">Earn Yield</h3>
              <p className="text-sm text-gray-400">
                Your USDC is deployed to Lendle protocol to earn lending interest and LEND rewards.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="font-semibold mb-2">Withdraw Anytime</h3>
              <p className="text-sm text-gray-400">
                Redeem your shares for USDC plus accumulated yield at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Contracts */}
        <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-center">Verified Contracts</h2>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400 mb-2 md:mb-0">mYield USDC Vault</span>
              <a
                href={`https://mantlescan.xyz/address/${CONTRACTS.MYIELD_VAULT}#code`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-blue-400 hover:underline break-all"
              >
                {CONTRACTS.MYIELD_VAULT}
              </a>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400 mb-2 md:mb-0">Lendle Adapter</span>
              <a
                href={`https://mantlescan.xyz/address/${CONTRACTS.LENDLE_ADAPTER}#code`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-blue-400 hover:underline break-all"
              >
                {CONTRACTS.LENDLE_ADAPTER}
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Built for Mantle Hackathon | DeFi &amp; Composability Track
        </div>
      </footer>
    </div>
  )
}
