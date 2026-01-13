'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { VAULT_ABI, ERC20_ABI } from '@/lib/contracts'
import { mantle } from '@/lib/wagmi'
import { useToast } from '@/hooks/useToast'
import { Skeleton } from './Skeleton'
import { StrategyChart, USDC_STRATEGIES, WETH_STRATEGIES } from './StrategyChart'
import { VaultDetails } from './VaultDetails'

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
  const { address, isConnected, chainId } = useAccount()
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [mounted, setMounted] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { switchChain } = useSwitchChain()
  const { showToast, updateToast } = useToast()
  const [toastId, setToastId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isWrongNetwork = mounted && isConnected && chainId !== mantle.id

  const { writeContract, data: hash, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash })

  // Read vault data
  const { data: totalAssets, isLoading: loadingAssets, refetch: refetchAssets } = useReadContract({
    address: vault.address as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  })

  const { data: weightedAPY, isLoading: loadingAPY } = useReadContract({
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

  // Handle transaction states with toasts
  useEffect(() => {
    if (isPending && !toastId) {
      const id = showToast('pending', 'Waiting for wallet confirmation...')
      setToastId(id)
    }
  }, [isPending, toastId, showToast])

  useEffect(() => {
    if (hash && toastId) {
      updateToast(toastId, 'pending', 'Transaction pending...', hash)
    }
  }, [hash, toastId, updateToast])

  useEffect(() => {
    if (isSuccess && toastId) {
      updateToast(toastId, 'success', 'Transaction confirmed!', hash)
      setToastId(null)
      refetchAssets()
      refetchShares()
      refetchUserAssets()
      refetchAssetBalance()
      refetchAllowance()
      setAmount('')
      reset()
    }
  }, [isSuccess, toastId, hash, updateToast, refetchAssets, refetchShares, refetchUserAssets, refetchAssetBalance, refetchAllowance, reset])

  useEffect(() => {
    if (isError && toastId) {
      updateToast(toastId, 'error', 'Transaction failed', hash)
      setToastId(null)
      reset()
    }
  }, [isError, toastId, hash, updateToast, reset])

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

  const handleHarvest = () => {
    writeContract({
      address: vault.address as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'harvest',
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

  const strategies = vault.assetSymbol === 'USDC' ? USDC_STRATEGIES : WETH_STRATEGIES

  return (
    <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{vault.name}</h2>
          <p className="text-xs text-gray-400 line-clamp-2">{vault.description}</p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          {loadingAPY ? (
            <Skeleton className="h-7 w-16 mb-1" />
          ) : (
            <div className="text-xl font-bold text-green-400">{formatAPY(weightedAPY)}%</div>
          )}
          <div className="text-xs text-gray-400">APY</div>
        </div>
      </div>

      {/* Strategy Chart */}
      <div className="mb-4 p-3 bg-gray-800/30 rounded-xl">
        <StrategyChart strategies={strategies} size={70} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-xl p-3">
          <div className="text-xs text-gray-400 mb-1">TVL</div>
          {loadingAssets ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <div className="font-semibold text-sm sm:text-base truncate">{formatBalance(totalAssets)} {vault.assetSymbol}</div>
          )}
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3">
          <div className="text-xs text-gray-400 mb-1">Your Position</div>
          <div className="font-semibold text-sm sm:text-base truncate">{formatBalance(userAssets)} {vault.assetSymbol}</div>
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
          <span className="truncate ml-2">
            Bal: {activeTab === 'deposit' ? formatBalance(assetBalance) : formatBalance(userAssets)} {vault.assetSymbol}
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-800 rounded-xl px-4 py-3 pr-16 outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
      {!mounted || !isConnected ? (
        <div className="text-center text-gray-400 py-3 text-sm">Connect wallet</div>
      ) : isWrongNetwork ? (
        <button
          onClick={() => switchChain({ chainId: mantle.id })}
          className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-colors text-sm sm:text-base"
        >
          Switch to Mantle
        </button>
      ) : activeTab === 'deposit' ? (
        needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming || !amount}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors text-sm sm:text-base"
          >
            {isPending || isConfirming ? 'Approving...' : `Approve ${vault.assetSymbol}`}
          </button>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={isPending || isConfirming || !amount}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors text-sm sm:text-base"
          >
            {isPending || isConfirming ? 'Depositing...' : 'Deposit'}
          </button>
        )
      ) : (
        <button
          onClick={handleWithdraw}
          disabled={isPending || isConfirming || !amount}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors text-sm sm:text-base"
        >
          {isPending || isConfirming ? 'Withdrawing...' : 'Withdraw'}
        </button>
      )}

      {/* Harvest Button */}
      {mounted && isConnected && !isWrongNetwork && userShares && userShares > BigInt(0) && (
        <button
          onClick={handleHarvest}
          disabled={isPending || isConfirming}
          className="w-full mt-2 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors text-green-400"
        >
          {isPending || isConfirming ? 'Harvesting...' : 'Harvest Rewards'}
        </button>
      )}

      {/* Details Button */}
      <button
        onClick={() => setShowDetails(true)}
        className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
      >
        View Details & Risk Analysis
      </button>

      {/* Details Modal */}
      {showDetails && (
        <VaultDetails
          vaultType={vault.assetSymbol === 'USDC' ? 'usdc' : 'weth'}
          apy={weightedAPY ? Number(weightedAPY) / 100 : 0}
          symbol={vault.assetSymbol}
          currentPosition={userAssets ? parseFloat(formatUnits(userAssets, vault.decimals)) : 0}
          tvl={totalAssets ? parseFloat(formatUnits(totalAssets, vault.decimals)) : 0}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  )
}
