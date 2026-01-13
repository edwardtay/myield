'use client'

import { ConnectWallet } from '@/components/ConnectWallet'
import { VaultCard } from '@/components/VaultCard'
import { Portfolio } from '@/components/Portfolio'
import { CONTRACTS, VAULTS } from '@/lib/contracts'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur-sm z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="mYield" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-xl font-bold">mYield</span>
          </div>
          <ConnectWallet />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Yield Aggregator for{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Mantle
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Multi-strategy ERC4626 vaults that route deposits to optimal DeFi yield sources.
            Lendle lending, mETH staking, and more.
          </p>
        </div>

        {/* Portfolio Summary */}
        <Portfolio />

        {/* Vault Cards */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {VAULTS.map((vault) => (
            <VaultCard key={vault.address} vault={vault} />
          ))}
        </div>

        {/* Protocol Integration */}
        <div className="bg-gray-900/50 rounded-2xl p-4 sm:p-8 border border-gray-800 mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Protocol Integrations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-gray-800/30 rounded-xl">
              <div className="text-2xl sm:text-3xl mb-2">🏦</div>
              <h3 className="font-semibold mb-1">Lendle</h3>
              <p className="text-xs sm:text-sm text-gray-400">Aave V2 fork - Lending yield + LEND rewards</p>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-xl">
              <div className="text-2xl sm:text-3xl mb-2">🔷</div>
              <h3 className="font-semibold mb-1">mETH</h3>
              <p className="text-xs sm:text-sm text-gray-400">Mantle LST - Staking yield via Merchant Moe</p>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-xl">
              <div className="text-2xl sm:text-3xl mb-2">🔄</div>
              <h3 className="font-semibold mb-1">Merchant Moe</h3>
              <p className="text-xs sm:text-sm text-gray-400">DEX for WETH ↔ mETH swaps</p>
            </div>
          </div>
        </div>

        {/* Contracts */}
        <div className="bg-gray-900/50 rounded-2xl p-4 sm:p-8 border border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Verified Contracts</h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400 text-sm mb-1 sm:mb-0">USDC Vault</span>
              <a href={`https://mantlescan.xyz/address/${CONTRACTS.USDC_VAULT}#code`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-400 hover:underline break-all">
                {CONTRACTS.USDC_VAULT}
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400 text-sm mb-1 sm:mb-0">WETH Vault</span>
              <a href={`https://mantlescan.xyz/address/${CONTRACTS.WETH_VAULT}#code`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-400 hover:underline break-all">
                {CONTRACTS.WETH_VAULT}
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400 text-sm mb-1 sm:mb-0">Lendle USDC Adapter</span>
              <a href={`https://mantlescan.xyz/address/${CONTRACTS.USDC_LENDLE_ADAPTER}#code`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-400 hover:underline break-all">
                {CONTRACTS.USDC_LENDLE_ADAPTER}
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400 text-sm mb-1 sm:mb-0">Lendle WETH Adapter</span>
              <a href={`https://mantlescan.xyz/address/${CONTRACTS.WETH_LENDLE_ADAPTER}#code`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-400 hover:underline break-all">
                {CONTRACTS.WETH_LENDLE_ADAPTER}
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400 text-sm mb-1 sm:mb-0">mETH Adapter</span>
              <a href={`https://mantlescan.xyz/address/${CONTRACTS.WETH_METH_ADAPTER}#code`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-400 hover:underline break-all">
                {CONTRACTS.WETH_METH_ADAPTER}
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-8 sm:mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-center gap-3 sm:gap-4 text-gray-500 text-xs sm:text-sm">
          <span>mYield</span>
          <span>·</span>
          <a href="https://github.com/edwardtay/myield" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">GitHub</a>
          <span>·</span>
          <a href="https://mantlescan.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">MantleScan</a>
        </div>
      </footer>
    </div>
  )
}
