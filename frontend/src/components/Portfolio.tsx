'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { VAULT_ABI, CONTRACTS } from '@/lib/contracts'
import { Skeleton } from './Skeleton'

export function Portfolio() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // USDC Vault position
  const { data: usdcShares } = useReadContract({
    address: CONTRACTS.USDC_VAULT as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: usdcAssets, isLoading: usdcLoading } = useReadContract({
    address: CONTRACTS.USDC_VAULT as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: usdcShares ? [usdcShares] : undefined,
  })

  // WETH Vault position
  const { data: wethShares } = useReadContract({
    address: CONTRACTS.WETH_VAULT as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: wethAssets, isLoading: wethLoading } = useReadContract({
    address: CONTRACTS.WETH_VAULT as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: wethShares ? [wethShares] : undefined,
  })

  // APYs
  const { data: usdcAPY } = useReadContract({
    address: CONTRACTS.USDC_VAULT as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'getWeightedAPY',
  })

  const { data: wethAPY } = useReadContract({
    address: CONTRACTS.WETH_VAULT as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'getWeightedAPY',
  })

  if (!mounted || !isConnected) return null

  const isLoading = usdcLoading || wethLoading

  const usdcValue = usdcAssets ? parseFloat(formatUnits(usdcAssets, 6)) : 0
  const wethValue = wethAssets ? parseFloat(formatUnits(wethAssets, 18)) : 0

  // Rough USD estimate (assume WETH ~$3000)
  const wethUsdValue = wethValue * 3000
  const totalUsdValue = usdcValue + wethUsdValue

  const hasPosition = usdcValue > 0 || wethValue > 0

  // Weighted average APY
  const avgAPY = totalUsdValue > 0
    ? ((usdcValue * (Number(usdcAPY || 0) / 100)) + (wethUsdValue * (Number(wethAPY || 0) / 100))) / totalUsdValue
    : 0

  if (!hasPosition && !isLoading) return null

  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-gray-800 mb-8">
      {isLoading ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="flex gap-6">
            <div>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Your Portfolio</p>
            <p className="text-3xl font-bold">
              ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">USDC Position</p>
              <p className="font-semibold">{usdcValue.toFixed(2)} USDC</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">WETH Position</p>
              <p className="font-semibold">{wethValue.toFixed(4)} WETH</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Avg APY</p>
              <p className="font-semibold text-green-400">{avgAPY.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
