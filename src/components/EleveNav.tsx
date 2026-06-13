'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeProvider'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/espace-eleve/dashboard',     label: 'Tableau de bord',  icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { href: '/espace-eleve/reserver',      label: 'Réserver un cours', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg> },
  { href: '/espace-eleve/reservations',  label: 'Mes réservations', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { href: '/espace-eleve/acheter-pack',  label: 'Acheter un pack',  icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { href: '/espace-eleve/pack',          label: 'Mon pack',         icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { href: '/espace-eleve/progression',   label: 'Ma progression',   icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { href: '/espace-eleve/ressources',    label: 'Mes ressources',   icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { href: '/espace-eleve/notes',         label: 'Notes de cours',   icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { href: '/espace-eleve/certificats',   label: 'Mes certificats',  icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { href: '/espace-eleve/notifications', label: 'Notifications',    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { href: '/espace-eleve/partitions',    label: 'Médiathèque',      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  { href: '/espace-eleve/parrainage',    label: 'Parrainage',       icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/espace-eleve/temoignage',    label: 'Témoignage',       icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
]

interface EleveLayoutProps { prenom?: string; nbNotifs?: number; nbMedias?: number; nbRessources?: number; children: React.ReactNode }

export default function EleveLayout({ prenom, nbNotifs = 0, nbMedias: nbMediasProp = 0, nbRessources: nbRessourcesProp = 0, children }: EleveLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [nbMedias, setNbMedias] = useState(nbMediasProp)
  const [nbRessources, setNbRessources] = useState(nbRessourcesProp)

  // Charger les compteurs automatiquement sur toutes les pages
  useState(() => {
    fetch('/api/partitions').then(r => r.json()).then(d => setNbMedias(Array.isArray(d) ? d.length : 0)).catch(() => {})
    fetch('/api/eleve/ressources').then(r => r.json()).then(d => setNbRessources(Array.isArray(d) ? d.length : 0)).catch(() => {})
  })

  async function handleLogout() {
    await fetch('/api/eleve/logout', { method: 'POST' })
    router.push('/espace-eleve/login')
  }

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <header className="border-b border-noir-800 bg-noir-900/95 backdrop-blur-sm sticky top-0 z-40 h-14">
        <div className="h-full px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-base text-gold-400 tracking-widest">LIEU SECRET</span>
          </Link>
          <div className="flex items-center gap-3">
            {prenom && <span className="text-noir-400 text-sm hidden md:block">Bonjour, <strong className="text-white">{prenom}</strong></span>}
            <ThemeToggle />
            <Link href="/espace-eleve/notifications" className="relative p-2 text-noir-400 hover:text-gold-400 transition-colors">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {nbNotifs > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{nbNotifs}</span>}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-noir-400 hover:text-white p-2">
              <div className="space-y-1.5">
                <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </header>
      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-noir-800/60 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto bg-noir-950">
          <nav className="flex-1 p-3 space-y-0.5 pt-4">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} prefetch={true}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${isActive ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'text-noir-400 hover:text-white hover:bg-noir-800/60 border border-transparent'}`}>
                  <span className={`shrink-0 ${isActive ? 'text-gold-400' : 'text-noir-500 group-hover:text-noir-300'}`}>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {item.href === '/espace-eleve/notifications' && nbNotifs > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{nbNotifs}</span>}
                  {item.href === '/espace-eleve/partitions' && nbMedias > 0 && <span className="ml-auto bg-gold-500/20 text-gold-400 text-xs px-1.5 py-0.5 rounded-full border border-gold-500/30">{nbMedias}</span>}
                  {item.href === '/espace-eleve/ressources' && nbRessources > 0 && <span className="ml-auto bg-blue-500/20 text-blue-400 text-xs px-1.5 py-0.5 rounded-full border border-blue-500/30">{nbRessources}</span>}
                </Link>
              )
            })}
          </nav>
          <div className="p-3 border-t border-noir-800/60 pb-6">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-noir-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-14 bottom-0 w-64 bg-noir-900 border-r border-noir-800 overflow-y-auto">
            <nav className="p-3 space-y-0.5 pt-4">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${pathname === item.href ? 'bg-gold-500/10 text-gold-400' : 'text-noir-300 hover:text-white hover:bg-noir-800/50'}`}>
                  <span className="shrink-0">{item.icon}</span><span>{item.label}</span>
                </Link>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all mt-4">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Déconnexion
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
