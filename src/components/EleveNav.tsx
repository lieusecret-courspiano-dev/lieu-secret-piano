'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeProvider'
import { useState, useEffect, useCallback, useRef } from 'react'

// ── Icônes SVG colorées par section ──────────────────────────────────────────
const Icons = {
  dashboard:    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="#f59e0b" opacity=".8"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="#f59e0b" opacity=".5"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="#f59e0b" opacity=".5"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="#f59e0b" opacity=".3"/></svg>,
  reserver:     <svg width="18" height="18" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>,
  reservations: <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
  acheterPack:  <svg width="18" height="18" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  monPack:      <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  progression:  <svg width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><rect x="4" y="18" width="4" height="2" rx="0.5" fill="#a78bfa" opacity=".4"/><rect x="10" y="2" width="4" height="18" rx="0.5" fill="#a78bfa" opacity=".2"/><rect x="16" y="8" width="4" height="12" rx="0.5" fill="#a78bfa" opacity=".3"/></svg>,
  travaux:      <svg width="18" height="18" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  ressources:   <svg width="18" height="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  notes:        <svg width="18" height="18" fill="none" stroke="#fbbf24" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  certificats:  <svg width="18" height="18" fill="none" stroke="#fcd34d" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  mediatheque:  <svg width="18" height="18" fill="none" stroke="#c084fc" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  notifications:<svg width="18" height="18" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  parrainage:   <svg width="18" height="18" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  temoignage:   <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  messages:     <svg width="18" height="18" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  repertoire:   <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="9" y1="9" x2="21" y2="7"/></svg>,
  metronome:    <svg width="18" height="18" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 22 20 2 20"/><line x1="12" y1="9" x2="16" y2="17"/><circle cx="12" cy="17" r="1" fill="#60a5fa"/></svg>,
  objectifs:    <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="#f59e0b"/></svg>,
  journal:      <svg width="18" height="18" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  badges:       <svg width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  historique:   <svg width="18" height="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><polyline points="3 3 3 7 7 7"/></svg>,
  bibliotheque: <svg width="18" height="18" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/></svg>,
  partager:     <svg width="18" height="18" fill="none" stroke="#f472b6" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  enregistrements: <svg width="18" height="18" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
}

// ── Groupes de navigation avec ordre logique ──────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Accueil',
    items: [
      { href: '/espace-eleve/dashboard',    label: 'Tableau de bord',   icon: Icons.dashboard,    badge: null },
      { href: '/espace-eleve/notifications',label: 'Notifications',     icon: Icons.notifications, badge: 'notifs' },
    ],
  },
  {
    label: 'Mes cours',
    items: [
      { href: '/espace-eleve/reserver',     label: 'Réserver un cours', icon: Icons.reserver,     badge: null },
      { href: '/espace-eleve/reservations', label: 'Mes réservations',  icon: Icons.reservations, badge: null },
      { href: '/espace-eleve/messages',     label: 'Messages',          icon: Icons.messages,     badge: 'messages' },
      { href: '/espace-eleve/travaux',      label: 'Travail à faire',   icon: Icons.travaux,      badge: 'travaux' },
      { href: '/espace-eleve/notes',        label: 'Notes de cours',    icon: Icons.notes,        badge: null },
    ],
  },
  {
    label: 'Ma formation',
    items: [
      { href: '/espace-eleve/progression',  label: 'Ma progression',    icon: Icons.progression,  badge: null },
      { href: '/espace-eleve/objectifs',    label: 'Mes objectifs',     icon: Icons.objectifs,    badge: null },
      { href: '/espace-eleve/badges',       label: 'Mes badges',        icon: Icons.badges,       badge: null },
      { href: '/espace-eleve/certificats',  label: 'Mes certificats',   icon: Icons.certificats,  badge: null },
      { href: '/espace-eleve/historique',   label: 'Mon parcours',      icon: Icons.historique,   badge: null },
    ],
  },
  {
    label: 'Ressources',
    items: [
      { href: '/espace-eleve/ressources',    label: 'Mes ressources',    icon: Icons.ressources,   badge: 'ressources' },
      { href: '/espace-eleve/partitions',    label: 'Médiathèque',       icon: Icons.mediatheque,  badge: 'medias' },
      { href: '/espace-eleve/mes-supports',  label: 'Mes supports',      icon: Icons.bibliotheque, badge: null },
      { href: '/espace-eleve/quiz',          label: 'Quiz',              icon: Icons.progression,  badge: null },
      { href: '/espace-eleve/bibliotheque',  label: 'Gammes & Accords',  icon: Icons.bibliotheque, badge: null },
    ],
  },
  {
    label: 'Mon pack',
    items: [
      { href: '/espace-eleve/pack',         label: 'Mon pack',          icon: Icons.monPack,      badge: null },
      { href: '/espace-eleve/acheter-pack', label: 'Acheter un pack',   icon: Icons.acheterPack,  badge: null },
    ],
  },
  {
    label: 'Outils',
    items: [
      { href: '/espace-eleve/enregistrements', label: 'Enregistrements',   icon: Icons.enregistrements, badge: 'enregistrements' },
      { href: '/espace-eleve/journal',         label: 'Journal de pratique',icon: Icons.journal,        badge: null },
      { href: '/espace-eleve/repertoire',      label: 'Mon répertoire',    icon: Icons.repertoire,      badge: null },
      { href: '/espace-eleve/metronome',       label: 'Métronome',         icon: Icons.metronome,       badge: null },
      { href: '/espace-eleve/partager',        label: 'Partager mes progrès',icon: Icons.partager,      badge: null },
    ],
  },
  {
    label: 'Espace personnel',
    items: [
      { href: '/espace-eleve/parrainage',   label: 'Parrainage',        icon: Icons.parrainage,   badge: null },
      { href: '/espace-eleve/temoignage',   label: 'Laisser un avis',   icon: Icons.temoignage,   badge: null },
    ],
  },
]

// Tous les items à plat pour la barre mobile
const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items)

// Bottom nav mobile — 5 raccourcis essentiels
const BOTTOM_NAV = [
  { href: '/espace-eleve/dashboard',    label: 'Accueil',    icon: Icons.dashboard,    badge: null },
  { href: '/espace-eleve/reserver',     label: 'Réserver',   icon: Icons.reserver,     badge: null },
  { href: '/espace-eleve/travaux',      label: 'Travaux',    icon: Icons.travaux,      badge: 'travaux' },
  { href: '/espace-eleve/progression',  label: 'Progression',icon: Icons.progression,  badge: null },
  { href: '/espace-eleve/pack',         label: 'Mon pack',   icon: Icons.monPack,      badge: null },
]

interface EleveLayoutProps {
  prenom?: string
  nbNotifs?: number
  nbMedias?: number
  nbRessources?: number
  nbTravaux?: number
  nbMessages?: number
  nbEnregistrements?: number
  children: React.ReactNode
}

export default function EleveLayout({
  prenom,
  nbNotifs: nbNotifsProp = 0,
  nbMedias: nbMediasProp = 0,
  nbRessources: nbRessourcesProp = 0,
  nbTravaux: nbTravauxProp = 0,
  nbMessages: nbMessagesProp = 0,
  nbEnregistrements: nbEnregistrementsProp = 0,
  children,
}: EleveLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  // Compteurs persistants — chargés une fois et conservés entre navigations
  const [nbNotifs,    setNbNotifs]    = useState(nbNotifsProp)
  const [nbMedias,    setNbMedias]    = useState(nbMediasProp)
  const [nbRessources,setNbRessources]= useState(nbRessourcesProp)
  const [nbTravaux,   setNbTravaux]   = useState(nbTravauxProp)
  const [nbMessages,  setNbMessages]  = useState(nbMessagesProp)
  const [nbEnregistrements, setNbEnregistrements] = useState(nbEnregistrementsProp)

  // Charger les compteurs au montage et les garder à jour
  const loadCounters = useCallback(async () => {
    try {
      const [medias, res, travaux, notifs, msgs, enreg] = await Promise.all([
        fetch('/api/partitions').then(r => r.ok ? r.json() : []),
        fetch('/api/eleve/ressources').then(r => r.ok ? r.json() : []),
        fetch('/api/eleve/travaux').then(r => r.ok ? r.json() : []),
        fetch('/api/eleve/notifications').then(r => r.ok ? r.json() : []),
        fetch('/api/eleve/messages').then(r => r.ok ? r.json() : []),
        fetch('/api/eleve/medias-prives').then(r => r.ok ? r.json() : []),
      ])
      setNbMedias(Array.isArray(medias) ? medias.length : 0)
      setNbRessources(Array.isArray(res) ? res.length : 0)
      setNbTravaux(Array.isArray(travaux) ? travaux.filter((t: { termine: boolean }) => !t.termine).length : 0)
      setNbNotifs(Array.isArray(notifs) ? notifs.filter((n: { lu?: boolean; lue?: boolean }) => !n.lu && !n.lue).length : 0)
      setNbMessages(Array.isArray(msgs) ? msgs.filter((m: { expediteur: string; lu: boolean }) => m.expediteur === 'admin' && !m.lu).length : 0)
      setNbEnregistrements(Array.isArray(enreg) ? enreg.filter((e: { commentaire_admin: string | null; lu_eleve: boolean }) => e.commentaire_admin && !e.lu_eleve).length : 0)
    } catch {}
  }, [])

  useEffect(() => {
    loadCounters()
  }, [loadCounters])

  

  // Écouter les mises à jour du badge enregistrements
  useEffect(() => {
    function handleEnregUpdate(e: Event) {
      const detail = (e as CustomEvent).detail
      if (typeof detail?.count === 'number') setNbEnregistrements(detail.count)
    }
    window.addEventListener('enreg-count-update', handleEnregUpdate)
    return () => window.removeEventListener('enreg-count-update', handleEnregUpdate)
  }, [])

  // Mettre à jour les compteurs quand les props changent
  useEffect(() => { if (nbNotifsProp > 0) setNbNotifs(nbNotifsProp) }, [nbNotifsProp])
  useEffect(() => { if (nbTravauxProp > 0) setNbTravaux(nbTravauxProp) }, [nbTravauxProp])

  // Son de notification via Web Audio API
  const prevNotifsRef = useRef(0)
  useEffect(() => {
    if (nbNotifs > prevNotifsRef.current && prevNotifsRef.current >= 0) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        // Mélodie douce : deux notes courtes
        const playNote = (freq: number, start: number, dur: number) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'sine'; osc.frequency.value = freq
          gain.gain.setValueAtTime(0, ctx.currentTime + start)
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
          osc.start(ctx.currentTime + start)
          osc.stop(ctx.currentTime + start + dur)
        }
        playNote(880, 0, 0.15)    // La5 — première note
        playNote(1047, 0.18, 0.2) // Do6 — deuxième note plus haute
      } catch {}
    }
    prevNotifsRef.current = nbNotifs
  }, [nbNotifs])

  // Scroll vers le haut du contenu principal lors de la navigation
  useEffect(() => {
    const main = document.getElementById('eleve-main-content')
    if (main) main.scrollTop = 0
  }, [pathname])

  function getBadge(key: string | null): number {
    if (!key) return 0
    if (key === 'notifs')    return nbNotifs
    if (key === 'medias')    return nbMedias
    if (key === 'ressources')return nbRessources
    if (key === 'travaux')   return nbTravaux
    if (key === 'messages')  return nbMessages
    if (key === 'enregistrements') return nbEnregistrements
    return 0
  }

  async function handleLogout() {
    await fetch('/api/eleve/logout', { method: 'POST' })
    router.push('/espace-eleve/login')
  }

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      {/* ── Header ── */}
      <header className="border-b border-noir-800 bg-noir-900/95 backdrop-blur-sm sticky top-0 z-40 h-14">
        <div className="h-full px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" prefetch={false} scroll={false}>
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-base text-gold-400 tracking-widest">LIEU SECRET</span>
          </Link>
          <div className="flex items-center gap-2">
            {prenom && (
              <span className="text-noir-400 text-sm hidden md:block">
                Bonjour, <strong className="text-white">{prenom}</strong>
              </span>
            )}
            <ThemeToggle />
            {/* Cloche notifs */}
            <Link href="/espace-eleve/notifications" className="relative p-2 text-noir-400 hover:text-gold-400 transition-colors" prefetch={true} scroll={false}>
              {Icons.notifications}
              {nbNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {nbNotifs > 9 ? '9+' : nbNotifs}
                </span>
              )}
            </Link>
            {/* Burger mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-noir-400 hover:text-white p-2 rounded-lg hover:bg-noir-800/60 transition-colors"
              aria-label="Menu"
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

      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {/* ── Sidebar desktop ── */}
        <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-noir-800/60 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto bg-noir-950">
          <nav className="flex-1 px-2 py-3 space-y-4">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-bold text-noir-700 uppercase tracking-widest px-3 mb-1">{group.label}</p>
                <div className="space-y-0.5">
                  {( group.items || []).map(item => {
                    const isActive = pathname === item.href
                    const badge = getBadge(item.badge)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        scroll={false}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                          isActive
                            ? 'bg-gold-500/10 border border-gold-500/20 text-white'
                            : 'text-noir-400 hover:text-white hover:bg-noir-800/60 border border-transparent'
                        }`}
                      >
                        <span className="shrink-0 opacity-90">{item.icon}</span>
                        <span className="font-medium flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            item.badge === 'notifs' ? 'bg-red-500 text-white' :
                            item.badge === 'travaux' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Déconnexion */}
          <div className="px-2 py-3 border-t border-noir-800/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-noir-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Contenu principal ── */}
        <main className="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-0 overflow-y-auto" id="eleve-main-content">
          {children}
        </main>
        
      </div>

      {/* ── Menu latéral mobile (slide depuis la gauche) ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-14 bottom-0 w-[min(280px,85vw)] bg-noir-900 border-r border-noir-800 overflow-y-auto shadow-2xl flex flex-col">
            <nav className="flex-1 px-2 py-3 space-y-4">
              {NAV_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-noir-700 uppercase tracking-widest px-3 mb-1">{group.label}</p>
                  <div className="space-y-0.5">
                    {( group.items || []).map(item => {
                      const isActive = pathname === item.href
                      const badge = getBadge(item.badge)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          scroll={false}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                            isActive
                              ? 'bg-gold-500/10 border border-gold-500/20 text-white'
                              : 'text-noir-300 hover:text-white hover:bg-noir-800/50 border border-transparent'
                          }`}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          <span className="font-medium flex-1">{item.label}</span>
                          {badge > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              item.badge === 'notifs' ? 'bg-red-500 text-white' :
                              item.badge === 'travaux' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="px-2 py-3 border-t border-noir-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Barre de navigation inférieure mobile ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-noir-900/95 backdrop-blur-sm border-t border-noir-800">
        <div className="flex items-center justify-around px-1 py-1.5">
          {BOTTOM_NAV.map(item => {
            const isActive = pathname === item.href
            const badge = getBadge(item.badge)
            return (
              <Link
                key={item.href}
                href={item.href}
                scroll={false}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors relative min-w-[52px] ${
                  isActive ? 'text-gold-400' : 'text-noir-500 hover:text-noir-300'
                }`}
              >
                <span className="opacity-90">{item.icon}</span>
                <span className="text-[9px] font-medium leading-tight">{item.label}</span>
                {badge > 0 && (
                  <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
          {/* Bouton "Plus" pour ouvrir le menu complet */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-noir-500 hover:text-noir-300 transition-colors min-w-[52px]"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
            <span className="text-[9px] font-medium">Plus</span>
          </button>
        </div>
      </nav>
    </div>
  )
}