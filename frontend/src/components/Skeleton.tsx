'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-700/50 rounded ${className}`}
    />
  )
}

export function VaultCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="text-right">
          <Skeleton className="h-7 w-16 mb-1" />
          <Skeleton className="h-3 w-8 ml-auto" />
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-xl p-3">
          <Skeleton className="h-3 w-8 mb-2" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="flex-1 h-10 rounded-lg" />
      </div>

      {/* Input */}
      <Skeleton className="h-12 w-full rounded-xl mb-3" />

      {/* Button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

export function PortfolioSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-gray-800 mb-8">
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
    </div>
  )
}
