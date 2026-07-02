'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SubNavItem {
  href: string
  label: string
  icon?: React.ReactNode
}

interface SubNavProps {
  items: SubNavItem[]
  className?: string
}

export default function SubNav({ items, className = '' }: SubNavProps) {
  const pathname = usePathname()

  return (
    <div className={`flex gap-1 flex-wrap mb-6 bg-noir-900/50 border border-noir-800 rounded-xl p-1 ${className}`}>
      {items.map(item => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            scroll={false}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-gold-500 text-noir-950'
                : 'text-noir-400 hover:text-white hover:bg-noir-800'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
