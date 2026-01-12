'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { VAULT_ABI, ERC20_ABI } from '@/lib/contracts'

interface VaultConfig {
  name: string
  symbol: string
  address: string
  asset: string
  assetSymbol: string
  decimals: number
  strategies: string[]
  allocation: string
  description: string
}

export function VaultCard({ vault }: { vault: VaultConfig }) {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read vault data
  const { data: totalAssets, refetch: refetchAssets } = useReadContract({
    address: vault.address as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  })

  const { data: weightedAPY } = useReadContract({
    address: vault.address as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'getWeightedAPY',
  })

  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: vault.address as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: userAssets, refetch: refetchUserAssets } = useReadContract({
    address: vault.address as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
  })

  const { data: assetBalance, refetch: refetchAssetBalance } = useReadContract({
    address: vault.asset as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: vault.asset as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, vault.address as `0x${string}`] : undefined,
  })

  // Refetch on success
  useEffect(() => {
    if (isSuccess) {
      refetchAssets()
      refetchShares()
      refetchUserAssets()
      refetchAssetBalance()
      refetchAllowance()
      setAmount('')
    }
  }, [isSuccess])

  const parsedAmount = amount ? parseUnits(amount, vault.decimals) : BigInt(0)
  const needsApproval = allowance !== undefined && parsedAmount > allowance

  const handleApprove = () => {
    writeContract({
      address: vault.asset as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vault.address as `0x${string}`, parsedAmount],
    })
  }

  const handleDeposit = () => {
    if (!address) return
    writeContract({
      address: vault.address as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [parsedAmount, address],
    })
  }

  const handleWithdraw = () => {
    if (!address) return
    writeContract({
      address: vault.address as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [parsedAmount, address, address],
    })
  }

  const formatBalance = (value: bigint | undefined) => {
    if (value === undefined) return '0.00'
    const formatted = parseFloat(formatUnits(value, vault.decimals))
    if (vault.decimals === 18) {
      return formatted.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    }
    return formatted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatAPY = (value: bigint | undefined) => {
    if (value === undefined) return '0.00'
    return (Number(value) / 100).toFixed(2)
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">{vault.name}</h2>
          <p className="text-xs text-gray-400">{vault.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-400">{formatAPY(weightedAPY)}%</div>
          <div className="text-xs text-gray-400">APY</div>
        </div>
      </div>

      {/* Strategy Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {vault.strategies.map((strategy) => (
          <span key={strategy} className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
            {strategy}
          </span>
        ))}
        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
          {vault.allocation}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-xl p-3">
          <div className="text-xs text-gray-400 mb-1">TVL</div>
          <div className="font-semibold">{formatBalance(totalAssets)} {vault.assetSymbol}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3">
          <div className="text-xs text-gray-400 mb-1">Your Position</div>
          <div className="font-semibold">{formatBalance(userAssets)} {vault.assetSymbol}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'deposit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'withdraw'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Input */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Amount</span>
          <span>
            Bal: {activeTab === 'deposit' ? formatBalance(assetBalance) : formatBalance(userAssets)} {vault.assetSymbol}
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-800 rounded-xl px-4 py-3 pr-16 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              const max = activeTab === 'deposit' ? assetBalance : userAssets
              if (max) setAmount(formatUnits(max, vault.decimals))
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Action Button */}
      {!isConnected ? (
        <div className="text-center text-gray-400 py-3 text-sm">Connect wallet</div>
      ) : activeTab === 'deposit' ? (
        needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming || !amount}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
          >
            {isPending || isConfirming ? 'Approving...' : `Approve ${vault.assetSymbol}`}
          </button>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={isPending || isConfirming || !amount}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
          >
            {isPending || isConfirming ? 'Depositing...' : 'Deposit'}
          </button>
        )
      ) : (
        <button
          onClick={handleWithdraw}
          disabled={isPending || isConfirming || !amount}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
        >
          {isPending || isConfirming ? 'Withdrawing...' : 'Withdraw'}
        </button>
      )}

      {/* Transaction Status */}
      {hash && (
        <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400">
            {isConfirming ? 'Confirming...' : isSuccess ? 'Confirmed!' : 'Sent'}
          </div>
          <a
            href={`https://mantlescan.xyz/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            View on MantleScan
          </a>
        </div>
      )}
    </div>
  )
}
