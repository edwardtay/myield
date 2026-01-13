'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { mantle } from '@/lib/wagmi'

export function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isWrongNetwork = isConnected && chainId !== mantle.id

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium opacity-50">
        Connect Wallet
      </button>
    )
  }

  if (isConnected && isWrongNetwork) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-red-400">Wrong Network</span>
        <button
          onClick={() => switchChain({ chainId: mantle.id })}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 rounded-lg transition-colors font-medium"
        >
          Switch to Mantle
        </button>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-green-400">Mantle</span>
        <span className="text-sm text-gray-400">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all"
    >
      Connect Wallet
    </button>
  )
}
