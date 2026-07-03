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
  { href: '/contact', alwaysLink: true, label: 'Contact' },
  { href: '/cadeau', alwaysLink: true, label: 'Bon cadeau' },
  { href: '/mon-pack', alwaysLink: true, label: 'Mon pack' },
  { href: '/packs', alwaysLink: true, label: 'Acheter un pack' },
  { href: '/espace-eleve/login', alwaysLink: true, label: 'Espace Élève' },
  { href: '/essai', label: 'Cours d\'essai gratuit', alwaysLink: true },
  { href: '/aide', label: 'Aide & FAQ', alwaysLink: true },
  { href: '/bibliotheque-pedagogique', alwaysLink: true, label: 'Bibliothèque' },
]

// Groupes de navigation pour le menu mobile
const NAV_GROUPS = [
  {
    label: 'Le site',
    items: ['/', '#apropos', '#professeur', '#offres', '#tarifs', '#temoignages', '#contact'],
  },
  {
    label: 'Réservations',
    items: ['/reservation?tab=evenements', '/inscription', '/essai'],
  },
  {
    label: 'Packs & Cadeaux',
    items: ['/packs', '/mon-pack', '/cadeau'],
  },
  {
    label: 'Ressources',
    items: ['/bibliotheque-pedagogique'],
  },
  {
    label: 'Espace élève',
    items: ['/espace-eleve/login', '/aide'],
  },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="border-b border-noir-800 bg-noir-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-px h-5 bg-gold-500 shrink-0" />
            <span className="font-serif text-base md:text-lg text-gold-400 tracking-widest truncate">LIEU SECRET</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <ThemeToggle />
            <Link href="/reservation" className="btn-gold text-sm px-3 py-2 hidden sm:inline-flex">Réserver</Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-noir-400 hover:text-white p-2 rounded-lg hover:bg-noir-800/60 transition-colors"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block w-full h-0.5 bg-current transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block w-full h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                <span className={`block w-full h-0.5 bg-current transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Overlay menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 bottom-0 w-[min(320px,90vw)] bg-noir-900 border-l border-noir-800 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header menu */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-noir-800 shrink-0">
              <span className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-noir-400 hover:text-white p-1.5 rounded-lg hover:bg-noir-800 transition-colors"
                aria-label="Fermer"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Bouton réserver visible sur mobile */}
            <div className="px-5 py-3 border-b border-noir-800 shrink-0 sm:hidden">
              <Link
                href="/reservation"
                onClick={() => setMenuOpen(false)}
                className="btn-gold w-full text-center text-sm py-2.5"
              >
                Réserver un cours
              </Link>
            </div>

            {/* Navigation groupée */}
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV_GROUPS.map(group => {
                const groupItems = NAV_ITEMS.filter(item => group.items.includes(item.href))
                if (groupItems.length === 0) return null
                return (
                  <div key={group.label} className="mb-1">
                    <div className="px-5 py-2 text-xs font-bold text-noir-600 uppercase tracking-widest">
                      {group.label}
                    </div>
                    {groupItems.map(item => {
                      const href = item.href.startsWith('#') && !isHome ? '/' + item.href : item.href
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 text-sm py-2.5 px-5 transition-all ${
                            isActive
                              ? 'text-gold-400 bg-gold-500/10'
                              : 'text-noir-300 hover:text-white hover:bg-noir-800/60'
                          }`}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}