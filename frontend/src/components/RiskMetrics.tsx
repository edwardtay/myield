'use client'

interface RiskMetricsProps {
  vaultType: 'usdc' | 'weth'
  apy: number
}

export function RiskMetrics({ vaultType, apy }: RiskMetricsProps) {
  // Risk profiles based on strategy composition
  const riskProfiles = {
    usdc: {
      riskLevel: 'Low',
      riskScore: 2,
      maxScore: 10,
      volatility: '~1%',
      protocols: 1,
      audited: true,
      impermanentLoss: false,
      factors: [
        { name: 'Smart Contract', level: 'Low', description: 'Lendle - Aave V2 fork, battle-tested' },
        { name: 'Liquidity', level: 'Low', description: 'USDC highly liquid on Mantle' },
        { name: 'Peg Risk', level: 'Low', description: 'USDC maintains strong peg' },
      ]
    },
    weth: {
      riskLevel: 'Medium',
      riskScore: 4,
      maxScore: 10,
      volatility: '~5%',
      protocols: 2,
      audited: true,
      impermanentLoss: false,
      factors: [
        { name: 'Smart Contract', level: 'Medium', description: '2 protocols: Lendle + Merchant Moe' },
        { name: 'mETH Depeg', level: 'Low-Med', description: 'LST may trade at discount' },
        { name: 'Slippage', level: 'Low', description: 'DEX swap with 1% slippage protection' },
      ]
    }
  }

  const profile = riskProfiles[vaultType]

  const riskColor = {
    'Low': 'text-green-400',
    'Medium': 'text-yellow-400',
    'High': 'text-red-400',
  }[profile.riskLevel] || 'text-gray-400'

  const riskBg = {
    'Low': 'bg-green-400',
    'Medium': 'bg-yellow-400',
    'High': 'bg-red-400',
  }[profile.riskLevel] || 'bg-gray-400'

  return (
    <div className="bg-gray-800/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-300">Risk Assessment</h4>
        <span className={`text-sm font-semibold ${riskColor}`}>{profile.riskLevel} Risk</span>
      </div>

      {/* Risk Score Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Risk Score</span>
          <span>{profile.riskScore}/{profile.maxScore}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${riskBg} rounded-full transition-all`}
            style={{ width: `${(profile.riskScore / profile.maxScore) * 100}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-xs text-gray-500">Volatility</div>
          <div className="text-sm font-medium">{profile.volatility}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-xs text-gray-500">Protocols</div>
          <div className="text-sm font-medium">{profile.protocols}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-xs text-gray-500">IL Risk</div>
          <div className="text-sm font-medium">{profile.impermanentLoss ? 'Yes' : 'None'}</div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="space-y-2">
        {profile.factors.map((factor) => (
          <div key={factor.name} className="flex items-start gap-2 text-xs">
            <span className={`px-1.5 py-0.5 rounded ${
              factor.level === 'Low' ? 'bg-green-900/50 text-green-400' :
              factor.level === 'Low-Med' ? 'bg-yellow-900/50 text-yellow-400' :
              factor.level === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-red-900/50 text-red-400'
            }`}>
              {factor.level}
            </span>
            <div>
              <span className="text-gray-300">{factor.name}:</span>
              <span className="text-gray-500 ml-1">{factor.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
