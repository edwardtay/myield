'use client'

import { useState } from 'react'
import { RiskMetrics } from './RiskMetrics'
import { EarningsCalculator } from './EarningsCalculator'

interface VaultDetailsProps {
  vaultType: 'usdc' | 'weth'
  apy: number
  symbol: string
  currentPosition: number
  tvl: number
  onClose: () => void
}

export function VaultDetails({ vaultType, apy, symbol, currentPosition, tvl, onClose }: VaultDetailsProps) {
  const [activeTab, setActiveTab] = useState<'risk' | 'calculator' | 'strategy'>('risk')

  const strategyDetails = {
    usdc: {
      name: 'Lendle USDC Lending',
      description: 'Deposits USDC into Lendle lending pool to earn interest from borrowers.',
      mechanism: [
        'User deposits USDC into mYield vault',
        'Vault deposits to Lendle LendingPool',
        'Receives aUSDC (interest-bearing token)',
        'Interest accrues automatically',
        'Harvest claims LEND rewards and compounds',
      ],
      yieldSources: [
        { source: 'Lending Interest', percentage: 85, description: 'Paid by borrowers' },
        { source: 'LEND Rewards', percentage: 15, description: 'Protocol incentives' },
      ],
      contracts: [
        { name: 'Lendle LendingPool', address: '0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3' },
        { name: 'aUSDC Token', address: '0x8Be9B3b5e09D5D646e30b495E5A7247f5dEAA358' },
      ]
    },
    weth: {
      name: 'Multi-Strategy ETH Yield',
      description: 'Splits WETH between Lendle lending (60%) and mETH liquid staking via Merchant Moe (40%).',
      mechanism: [
        'User deposits WETH into mYield vault',
        '60% → Lendle lending (same as USDC)',
        '40% → Swapped to mETH via Merchant Moe DEX',
        'mETH accrues staking yield automatically',
        'Rebalance maintains target allocation',
      ],
      yieldSources: [
        { source: 'Lendle Lending (60%)', percentage: 60, description: 'Interest + LEND rewards' },
        { source: 'mETH Staking (40%)', percentage: 40, description: 'ETH staking yield (~3-4%)' },
      ],
      contracts: [
        { name: 'Lendle LendingPool', address: '0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3' },
        { name: 'Merchant Moe Router', address: '0xeaEE7EE68874218c3558b40063c42B82D3E7232a' },
        { name: 'mETH Token', address: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0' },
      ]
    }
  }

  const details = strategyDetails[vaultType]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold">{details.name}</h3>
            <p className="text-sm text-gray-400">{symbol} Vault Details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {[
            { id: 'risk', label: 'Risk Analysis' },
            { id: 'calculator', label: 'Calculator' },
            { id: 'strategy', label: 'Strategy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'risk' && (
            <RiskMetrics vaultType={vaultType} apy={apy} />
          )}

          {activeTab === 'calculator' && (
            <EarningsCalculator apy={apy} symbol={symbol} currentPosition={currentPosition} />
          )}

          {activeTab === 'strategy' && (
            <div className="space-y-4">
              {/* Description */}
              <div className="bg-gray-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">How It Works</h4>
                <p className="text-sm text-gray-400 mb-3">{details.description}</p>
                <ol className="space-y-2">
                  {details.mechanism.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-gray-400">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Yield Sources */}
              <div className="bg-gray-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Yield Sources</h4>
                <div className="space-y-2">
                  {details.yieldSources.map((source) => (
                    <div key={source.source} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{source.source}</span>
                          <span className="text-gray-500">{source.percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            style={{ width: `${source.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{source.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contracts */}
              <div className="bg-gray-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Protocol Contracts</h4>
                <div className="space-y-2">
                  {details.contracts.map((contract) => (
                    <div key={contract.name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-gray-400">{contract.name}</span>
                      <a
                        href={`https://mantlescan.xyz/address/${contract.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-400 hover:underline"
                      >
                        {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
