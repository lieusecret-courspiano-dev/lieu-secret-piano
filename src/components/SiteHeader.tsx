'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeProvider'

const NAV_ITEMS = [
  { href: '/', label: 'Page d\'accueil', alwaysLink: true },
  { href: '#apropos', label: 'À propos' },
  { href: '#professeur', label: 'Votre professeur' },
  { href: '#offres', label: 'Offres' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '/reservation?tab=evenements', alwaysLink: true, label: 'Événements' },
  { href: '/inscription', alwaysLink: true, label: 'Inscription' },
  { href: '#temoignages', label: 'Témoignages' },
  { href: '#contact', label: 'Contact' },
  { href: '/cadeau', alwaysLink: true, label: 'Bon cadeau' },
  { href: '/mon-pack', alwaysLink: true, label: 'Mon pack' },
  { href: '/packs', alwaysLink: true, label: 'Acheter un pack' },
  { href: '/espace-eleve/login', alwaysLink: true, label: 'Espace Élève' },
  { href: '/essai', label: "Cours d'essai gratuit", alwaysLink: true },
  { href: '/aide', label: 'Aide & FAQ', alwaysLink: true },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="border-b border-noir-800 bg-noir-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-lg text-gold-400 tracking-widest">LIEU SECRET</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/reservation" className="btn-gold text-sm px-4 py-2 hidden sm:inline-flex">Réserver</Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-noir-400 hover:text-white p-2">
              <div className="space-y-1.5">
                <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-noir-900 border-l border-noir-800 overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <span className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</span>
              <button onClick={() => setMenuOpen(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(item => {
                // Si c'est une ancre (#) et qu'on n'est pas sur la page d'accueil, préfixer avec /
                const href = item.href.startsWith('#') && !isHome ? '/' + item.href : item.href
                return (
                  <Link key={item.href} href={href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 text-sm text-noir-300 hover:text-white hover:bg-noir-800/60 transition-all py-2.5 px-3 rounded-xl">
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
