'use client'
import { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
  onClick?: () => void
}

export function StatCard({ icon, label, value, sub, color = '#f59e0b', onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`card flex flex-col gap-2 ${onClick ? 'cursor-pointer hover:border-gold-500/30 transition-all' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-noir-400 font-medium uppercase tracking-wider mt-0.5">{label}</p>
        {sub && <p className="text-xs text-noir-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}