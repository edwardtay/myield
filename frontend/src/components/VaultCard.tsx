'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { CONTRACTS, VAULT_ABI, ERC20_ABI } from '@/lib/contracts'

export function VaultCard() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read vault data
  const { data: totalAssets, refetch: refetchAssets } = useReadContract({
    address: CONTRACTS.MYIELD_VAULT,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  })

  const { data: vaultName } = useReadContract({
    address: CONTRACTS.MYIELD_VAULT,
    abi: VAULT_ABI,
    functionName: 'name',
  })

  const { data: weightedAPY } = useReadContract({
    address: CONTRACTS.MYIELD_VAULT,
    abi: VAULT_ABI,
    functionName: 'getWeightedAPY',
  })

  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: CONTRACTS.MYIELD_VAULT,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: userAssets, refetch: refetchUserAssets } = useReadContract({
    address: CONTRACTS.MYIELD_VAULT,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
  })

  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.MYIELD_VAULT] : undefined,
  })

  // Refetch on success
  useEffect(() => {
    if (isSuccess) {
      refetchAssets()
      refetchShares()
      refetchUserAssets()
      refetchUsdcBalance()
      refetchAllowance()
      setAmount('')
    }
  }, [isSuccess])

  const parsedAmount = amount ? parseUnits(amount, 6) : BigInt(0)
  const needsApproval = allowance !== undefined && parsedAmount > allowance

  const handleApprove = () => {
    writeContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.MYIELD_VAULT, parsedAmount],
    })
  }

  const handleDeposit = () => {
    if (!address) return
    writeContract({
      address: CONTRACTS.MYIELD_VAULT,
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [parsedAmount, address],
    })
  }

  const handleWithdraw = () => {
    if (!address) return
    writeContract({
      address: CONTRACTS.MYIELD_VAULT,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [parsedAmount, address, address],
    })
  }

  const formatUSDC = (value: bigint | undefined) => {
    if (value === undefined) return '0.00'
    return parseFloat(formatUnits(value, 6)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatAPY = (value: bigint | undefined) => {
    if (value === undefined) return '0.00'
    return (Number(value) / 100).toFixed(2)
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{vaultName || 'mYield USDC Vault'}</h2>
          <p className="text-sm text-gray-400 mt-1">Earn yield on USDC via Lendle</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">{formatAPY(weightedAPY)}%</div>
          <div className="text-xs text-gray-400">APY</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Total Value Locked</div>
          <div className="text-lg font-semibold">${formatUSDC(totalAssets)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Your Deposit</div>
          <div className="text-lg font-semibold">${formatUSDC(userAssets)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'deposit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'withdraw'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Input */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Amount</span>
          <span>
            Balance: {activeTab === 'deposit' ? formatUSDC(usdcBalance) : formatUSDC(userAssets)} USDC
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-800 rounded-xl px-4 py-3 pr-20 text-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              const max = activeTab === 'deposit' ? usdcBalance : userAssets
              if (max) setAmount(formatUnits(max, 6))
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Action Button */}
      {!isConnected ? (
        <div className="text-center text-gray-400 py-4">Connect wallet to continue</div>
      ) : activeTab === 'deposit' ? (
        needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming || !amount}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
          >
            {isPending || isConfirming ? 'Approving...' : 'Approve USDC'}
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
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="text-sm text-gray-400">
            {isConfirming ? 'Confirming transaction...' : isSuccess ? 'Transaction confirmed!' : 'Transaction sent'}
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
