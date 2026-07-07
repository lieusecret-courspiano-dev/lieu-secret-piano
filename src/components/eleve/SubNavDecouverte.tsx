'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/espace-eleve/defis',      label: 'Défis',       color: '#fb923c' },
  { href: '/espace-eleve/fiches',     label: 'Fiches',      color: '#34d399' },
  { href: '/espace-eleve/playlist',   label: 'Playlist',    color: '#f59e0b' },
  { href: '/espace-eleve/bibliotheque', label: 'Gammes & Accords', color: '#60a5fa' },
  { href: '/espace-eleve/metronome',  label: 'Métronome',   color: '#60a5fa' },
  { href: '/espace-eleve/parrainage', label: 'Parrainage',  color: '#4ade80' },
]

export default function SubNavDecouverte() {
  const pathname = usePathname()
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-3">
        <Link href="/espace-eleve/decouverte"
          className="text-noir-500 hover:text-gold-400 text-xs transition-colors flex items-center gap-1">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          Découverte
        </Link>
        <span className="text-noir-700 text-xs">/</span>
        <span className="text-noir-400 text-xs">{ITEMS.find(i => i.href === pathname)?.label}</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} scroll={false}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                active
                  ? 'text-noir-950 font-semibold'
                  : 'bg-noir-800 text-noir-400 hover:text-white hover:bg-noir-700'
              }`}
              style={active ? { background: item.color, color: '#0a0a1a' } : {}}>
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
