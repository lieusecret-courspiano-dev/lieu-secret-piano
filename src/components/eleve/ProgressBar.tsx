'use client'

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  height?: number
  showLabel?: boolean
  label?: string
  animated?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  color = '#f59e0b',
  height = 6,
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-noir-400">{label}</span>}
          {showLabel && <span className="text-xs font-bold text-white">{pct}%</span>}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden bg-noir-800"
        style={{ height }}
      >
        <div
          className={`h-full rounded-full ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}