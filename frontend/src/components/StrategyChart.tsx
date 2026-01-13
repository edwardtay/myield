'use client'

interface Strategy {
  name: string
  allocation: number
  color: string
}

interface StrategyChartProps {
  strategies: Strategy[]
  size?: number
}

export function StrategyChart({ strategies, size = 80 }: StrategyChartProps) {
  const total = strategies.reduce((sum, s) => sum + s.allocation, 0)
  let currentAngle = -90 // Start from top

  const createArc = (startAngle: number, endAngle: number, color: string) => {
    const start = polarToCartesian(size / 2, size / 2, size / 2 - 4, startAngle)
    const end = polarToCartesian(size / 2, size / 2, size / 2 - 4, endAngle)
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    return (
      <path
        d={`M ${size / 2} ${size / 2} L ${start.x} ${start.y} A ${size / 2 - 4} ${size / 2 - 4} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`}
        fill={color}
        className="transition-all duration-300 hover:opacity-80"
      />
    )
  }

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="transform -rotate-0">
        {strategies.map((strategy, i) => {
          const angle = (strategy.allocation / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          currentAngle = endAngle
          return (
            <g key={strategy.name}>
              {createArc(startAngle, endAngle - 1, strategy.color)}
            </g>
          )
        })}
        {/* Center circle for donut effect */}
        <circle cx={size / 2} cy={size / 2} r={size / 4} fill="#111827" />
      </svg>
      <div className="flex flex-col gap-1">
        {strategies.map((strategy) => (
          <div key={strategy.name} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: strategy.color }}
            />
            <span className="text-gray-400">{strategy.name}</span>
            <span className="font-medium">{strategy.allocation}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Predefined strategy configs
export const USDC_STRATEGIES: Strategy[] = [
  { name: 'Lendle', allocation: 100, color: '#3B82F6' },
]

export const WETH_STRATEGIES: Strategy[] = [
  { name: 'Lendle', allocation: 60, color: '#3B82F6' },
  { name: 'mETH', allocation: 40, color: '#8B5CF6' },
]
