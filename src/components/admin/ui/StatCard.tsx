'use client'
import { ReactNode } from 'react'
import Link from 'next/link'

interface AdminStatCardProps {
  title: string
  value: string | number
  sub?: string
  icon: ReactNode
  color?: string
  trend?: { value: number; label: string }
  href?: string
}

export function AdminStatCard({ title, value, sub, icon, color = '#f59e0b', trend, href }: AdminStatCardProps) {
  const content = (
    <div className="card flex flex-col gap-3 hover:border-noir-700 transition-all group">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend.value >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
          }`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-noir-400 font-medium mt-0.5">{title}</p>
        {sub && <p className="text-xs text-noir-600 mt-0.5">{sub}</p>}
      </div>
      {href && (
        <p className="text-xs text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Voir détails →
        </p>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}