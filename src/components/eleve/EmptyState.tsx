'use client'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-noir-800 border border-noir-700 flex items-center justify-center mb-4 text-noir-500">
        {icon}
      </div>
      <p className="text-white font-medium text-sm mb-1">{title}</p>
      {description && <p className="text-noir-500 text-xs max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}