'use client'

import { useState } from 'react'

interface EarningsCalculatorProps {
  apy: number
  symbol: string
  currentPosition: number
}

export function EarningsCalculator({ apy, symbol, currentPosition }: EarningsCalculatorProps) {
  const [amount, setAmount] = useState(currentPosition.toString())
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('year')

  const principal = parseFloat(amount) || 0
  const apyDecimal = apy / 100

  // Calculate earnings for different periods
  const periodMultipliers = {
    day: 1 / 365,
    week: 7 / 365,
    month: 30 / 365,
    year: 1,
  }

  const periodLabels = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    year: 'Yearly',
  }

  const earnings = principal * apyDecimal * periodMultipliers[period]
  const totalValue = principal + earnings

  // Compound calculation (for comparison)
  const compoundedValue = principal * Math.pow(1 + apyDecimal / 365, 365 * periodMultipliers[period])
  const compoundedEarnings = compoundedValue - principal

  return (
    <div className="bg-gray-800/30 rounded-xl p-4">
      <h4 className="text-sm font-medium text-gray-300 mb-3">Earnings Calculator</h4>

      {/* Amount Input */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 mb-1 block">Deposit Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 pr-16 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0.00"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            {symbol}
          </span>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 mb-4">
        {(['day', 'week', 'month', 'year'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
              period === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2">
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-xs text-gray-400">APY</span>
          <span className="text-sm font-medium text-green-400">{apy.toFixed(2)}%</span>
        </div>

        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-xs text-gray-400">{periodLabels[period]} Earnings (Simple)</span>
          <span className="text-sm font-medium text-green-400">
            +{earnings.toFixed(symbol === 'USDC' ? 2 : 6)} {symbol}
          </span>
        </div>

        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-xs text-gray-400">{periodLabels[period]} Earnings (Compounded)</span>
          <span className="text-sm font-medium text-green-400">
            +{compoundedEarnings.toFixed(symbol === 'USDC' ? 2 : 6)} {symbol}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-800/30">
          <span className="text-xs text-gray-300">Projected Value</span>
          <span className="text-base font-bold">
            {compoundedValue.toFixed(symbol === 'USDC' ? 2 : 6)} {symbol}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-3">
        * Projections assume constant APY. Actual returns may vary.
      </p>
    </div>
  )
}
