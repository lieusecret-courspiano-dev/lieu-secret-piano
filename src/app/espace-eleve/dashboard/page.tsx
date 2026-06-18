'use client'
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'
import { DateTime } from 'luxon'

interface DashboardData {
  id: string; prenom: string; nom: string; email: string; avatar?: string
  prochain_cours: { slot_start: string; slot_end: string } | null
  pack_actif: { pack_label: string; heures_restantes: number; heures_total: number; code: string } | null
  nb_certificats: number; nb_cours_total: number; cours_passes: number; nb_notifs_non_lues: number
}

interface ProgStats {
  total: number; validees: number; pourcentage: number
  statsParCategorie: Record<string, { total: number; validees: number; pourcentage: number; certificat: boolean }>
}

const CAT_COLORS: Record<string, string> = {
  'Fondamentaux': '#3b82f6',
  'Compréhension et autonomie': '#f59e0b',
  'Expression et maîtrise': '#22c55e',
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [prog, setProg] = useState<ProgStats | null>(null)
  const [nbTravaux, setNbTravaux] = useState(0)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallPopup, setShowInstallPopup] = useState(false)

  useEffect(() => {
    // ── Détection fiable "déjà installé" ──────────────────────────────
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||  // Android/Desktop PWA
      window.matchMedia('(display-mode: fullscreen)').matches ||  // Fullscreen PWA
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true || // iOS Safari
      document.referrer.includes('android-app://') ||             // Android TWA
      localStorage.getItem('ls_pwa_installed') === 'true'         // Marqué manuellement

    if (isStandalone) {
      setIsInstalled(true)
      localStorage.setItem('ls_pwa_installed', 'true')
      return
    }

    // ── Capturer le prompt d'installation (Chrome/Android) ────────────
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Détecter si l'app vient d'être installée
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPopup(false)
      setInstallPrompt(null)
      localStorage.setItem('ls_pwa_installed', 'true')
    })

    // ── Afficher le popup après 2 secondes ────────────────────────────
    // Seulement si pas déjà refusé aujourd'hui
    const lastDismissed = localStorage.getItem('ls_install_dismissed')
    const today = new Date().toDateString()
    if (lastDismissed !== today) {
      const timer = setTimeout(() => setShowInstallPopup(true), 2000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handler)
      }
    }
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    const prompt = installPrompt as BeforeInstallPromptEvent
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') { setIsInstalled(true); setInstallPrompt(null) }
  }
  const [currentAvatar, setCurrentAvatar] = useState('piano')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/progression').then(r => r.json()).catch(() => null),
      fetch('/api/eleve/travaux').then(r => r.json()).catch(() => []),
    ]).then(([me, progData, travaux]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setData(me)
      if (me.avatar) setCurrentAvatar(me.avatar)
      if (progData) setProg(progData)
      setNbTravaux(Array.isArray(travaux) ? travaux.filter((t: { termine: boolean }) => !t.termine).length : 0)
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return null

  const tz = 'Europe/Paris'
  const prochainCours = data.prochain_cours
    ? DateTime.fromISO(data.prochain_cours.slot_start, { zone: 'utc' }).setZone(tz)
    : null
  const packPct = data.pack_actif
    ? Math.round((data.pack_actif.heures_restantes / data.pack_actif.heures_total) * 100)
    : 0
  const globalPct = prog?.pourcentage || 0
  const globalColor = globalPct >= 66 ? '#22c55e' : globalPct >= 33 ? '#f59e0b' : '#3b82f6'

  function dismissInstallPopup() {
    setShowInstallPopup(false)
    // Ne plus afficher aujourd'hui
    localStorage.setItem('ls_install_dismissed', new Date().toDateString())
  }

  return (
    <>
    {/* Popup installation PWA — compact */}
    {showInstallPopup && !isInstalled && (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
        onClick={dismissInstallPopup}>
        <div className="w-full max-w-lg bg-noir-900 border-t-2 border-gold-500/60 rounded-t-2xl shadow-2xl p-5 pb-8"
          onClick={e => e.stopPropagation()}>

          {/* Handle + fermer */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-1 bg-noir-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
            <p className="text-white font-bold text-base">Installer l'application</p>
            <button onClick={dismissInstallPopup}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-noir-800 text-noir-400 hover:text-white transition-colors">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <p className="text-noir-400 text-xs mb-4 leading-relaxed">
            Accédez à votre espace depuis l'écran d'accueil, même sans connexion.
          </p>

          {installPrompt ? (
            <button onClick={async () => { await handleInstall(); setShowInstallPopup(false) }}
              className="btn-gold w-full py-3 font-bold mb-3">
              Installer maintenant
            </button>
          ) : (
            <div className="space-y-2 mb-3">
              <div className="flex items-start gap-3 bg-noir-800 rounded-xl p-3">
                <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                <div>
                  <p className="text-gold-400 text-xs font-bold mb-0.5">iPhone / iPad (Safari)</p>
                  <p className="text-noir-400 text-xs">Bouton <strong className="text-white">Partager</strong> → <strong className="text-white">Sur l'écran d'accueil</strong> → Ajouter</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-noir-800 rounded-xl p-3">
                <svg width="16" height="16" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="#4ade80"/></svg>
                <div>
                  <p className="text-green-400 text-xs font-bold mb-0.5">Android (Chrome)</p>
                  <p className="text-noir-400 text-xs">Menu <strong className="text-white">⋮</strong> → <strong className="text-white">Ajouter à l'écran d'accueil</strong></p>
                </div>
              </div>
            </div>
          )}

          <button onClick={dismissInstallPopup}
            className="w-full text-noir-600 hover:text-noir-400 text-xs py-1.5 transition-colors">
            Me le rappeler demain
          </button>
        </div>
      </div>
    )}
        <EleveLayout prenom={data.prenom} nbNotifs={data.nb_notifs_non_lues} nbTravaux={nbTravaux}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">

        {/* Salutation + Avatar */}
        <div className="mb-6 flex items-center gap-4">
          {/* Avatar cliquable */}
          <button onClick={() => setShowAvatarPicker(true)} className="shrink-0 group relative" title="Changer d'avatar">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-500/5 border border-gold-500/30 flex items-center justify-center group-hover:border-gold-500/60 transition-all">
              {currentAvatar === 'piano' && <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg>}
              {currentAvatar === 'notes' && <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
              {currentAvatar === 'treble' && <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 3c-1.2 5.4-2 8.5-2 11a4 4 0 0 0 8 0c0-2.5-.8-5.6-2-11"/><path d="M10 9c2 1 4 1 6 0"/></svg>}
              {currentAvatar === 'star' && <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
              {currentAvatar === 'heart' && <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
              {currentAvatar === 'crown' && <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 20h20M5 20l-2-9 5 4 4-8 4 8 5-4-2 9"/></svg>}
              {!['piano','notes','treble','star','heart','crown'].includes(currentAvatar) && <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg>}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="10" height="10" fill="none" stroke="#1a1a2e" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
          </button>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-1">
              Bonjour, {data.prenom} !
            </h1>
            <p className="text-noir-400 text-sm">Bienvenue dans votre espace élève Lieu Secret</p>
          </div>
        </div>

        {/* Sélecteur d'avatar */}
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-serif text-lg">Choisir un avatar</h2>
                <button onClick={() => setShowAvatarPicker(false)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'piano', label: 'Piano', icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg> },
                  { key: 'notes', label: 'Notes', icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
                  { key: 'treble', label: 'Clé', icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 3c-1.2 5.4-2 8.5-2 11a4 4 0 0 0 8 0c0-2.5-.8-5.6-2-11"/><path d="M10 9c2 1 4 1 6 0"/></svg> },
                  { key: 'star', label: 'Étoile', icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
                  { key: 'heart', label: 'Cœur', icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
                  { key: 'crown', label: 'Couronne', icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 20h20M5 20l-2-9 5 4 4-8 4 8 5-4-2 9"/></svg> },
                ].map(av => (
                  <button key={av.key} onClick={async () => {
                    setCurrentAvatar(av.key)
                    setShowAvatarPicker(false)
                    await fetch('/api/eleve/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: av.key }) })
                  }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${currentAvatar === av.key ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-gold-500/50 hover:text-white'}`}>
                    {av.icon}
                    <span className="text-xs font-medium">{av.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Progression globale — bien visible ── */}
        <Link href="/espace-eleve/progression" className="block card border-gold-500/20 mb-5 hover:border-gold-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <line x1="18" y1="20" x2="18" y2="10" stroke="#a78bfa" strokeWidth="2"/>
                <line x1="12" y1="20" x2="12" y2="4" stroke="#a78bfa" strokeWidth="2"/>
                <line x1="6" y1="20" x2="6" y2="14" stroke="#a78bfa" strokeWidth="2"/>
              </svg>
              <span className="text-white font-semibold text-sm">Ma progression</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: globalColor }}>{globalPct}%</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-noir-600 group-hover:text-gold-400 transition-colors">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>

          {/* Barre globale */}
          <div className="w-full bg-noir-800 rounded-full h-2.5 mb-3 overflow-hidden">
            <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${globalPct}%`, backgroundColor: globalColor }} />
          </div>

          {/* Mini-barres par catégorie */}
          {prog?.statsParCategorie && (
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(prog.statsParCategorie).map(([cat, stats]) => {
                const color = CAT_COLORS[cat] || '#f59e0b'
                const shortName = cat === 'Fondamentaux' ? 'Fondamentaux' :
                                  cat === 'Compréhension et autonomie' ? 'Compréhension' : 'Expression'
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-noir-500 truncate">{shortName}</span>
                      <span className="text-[10px] font-bold ml-1 shrink-0" style={{ color }}>{stats.pourcentage}%</span>
                    </div>
                    <div className="w-full bg-noir-800 rounded-full h-1 overflow-hidden">
                      <div className="h-1 rounded-full transition-all" style={{ width: `${stats.pourcentage}%`, backgroundColor: color }} />
                    </div>
                    {stats.certificat && (
                      <p className="text-[9px] text-gold-400 mt-0.5">Certifié</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-noir-600 text-xs mt-2">{prog?.validees || 0} / {prog?.total || 0} compétences validées — Cliquer pour voir le détail</p>
        </Link>

        {/* ── Cartes principales ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">

          {/* Prochain cours */}
          <div className="card border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <div className="flex items-start justify-between mb-3">
              <svg width="18" height="18" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="text-[10px] text-noir-600 uppercase tracking-wider">Prochain cours</span>
            </div>
            {prochainCours ? (
              <>
                <p className="text-white font-semibold capitalize text-sm">{prochainCours.setLocale('fr').toFormat('EEEE d MMMM')}</p>
                <p className="text-blue-400 text-xl font-bold mt-0.5">{prochainCours.toFormat('HH:mm')}</p>
                <Link href="/espace-eleve/reservations" className="text-xs text-noir-500 hover:text-blue-400 mt-2 inline-block transition-colors">
                  Voir mes réservations →
                </Link>
              </>
            ) : (
              <>
                <p className="text-noir-400 text-sm">Aucun cours à venir</p>
                <Link href="/espace-eleve/reserver" className="btn-gold text-xs px-3 py-1.5 mt-3 inline-block">
                  Réserver un cours
                </Link>
              </>
            )}
          </div>

          {/* Mon pack */}
          <div className="card border-gold-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            <div className="flex items-start justify-between mb-3">
              <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              <span className="text-[10px] text-noir-600 uppercase tracking-wider">Mon pack</span>
            </div>
            {data.pack_actif ? (
              <>
                <p className="text-white font-semibold text-sm">{data.pack_actif.pack_label}</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-3xl font-bold text-gold-400">{data.pack_actif.heures_restantes}</span>
                  <span className="text-noir-400 text-sm mb-1">h restantes</span>
                </div>
                <div className="w-full bg-noir-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-gold-500 transition-all" style={{ width: `${packPct}%` }} />
                </div>
                <Link href="/espace-eleve/pack" className="text-xs text-noir-500 hover:text-gold-400 mt-2 inline-block transition-colors">
                  Voir mon pack →
                </Link>
              </>
            ) : (
              <>
                <p className="text-noir-400 text-sm">Aucun pack actif</p>
                <Link href="/espace-eleve/acheter-pack" className="btn-gold text-xs px-3 py-1.5 mt-3 inline-block">
                  Acheter un pack
                </Link>
              </>
            )}
          </div>

          {/* Travaux à faire */}
          <div className="card border-orange-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
            <div className="flex items-start justify-between mb-3">
              <svg width="18" height="18" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <span className="text-[10px] text-noir-600 uppercase tracking-wider">Travaux</span>
            </div>
            {nbTravaux > 0 ? (
              <>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-orange-400">{nbTravaux}</span>
                  <span className="text-noir-400 text-sm mb-1">à faire</span>
                </div>
                <Link href="/espace-eleve/travaux" className="btn-gold text-xs px-3 py-1.5 mt-3 inline-block">
                  Voir les travaux
                </Link>
              </>
            ) : (
              <>
                <p className="text-green-400 font-semibold text-sm">Tout est à jour !</p>
                <p className="text-noir-500 text-xs mt-1">Aucun travail en attente</p>
                <Link href="/espace-eleve/travaux" className="text-xs text-noir-500 hover:text-orange-400 mt-2 inline-block transition-colors">
                  Voir l'historique →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Accès rapides ── */}
        <h2 className="font-serif text-lg text-white mb-3">Accès rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-6">
          {[
            { href: '/espace-eleve/notes',       color: '#fbbf24', label: 'Notes de cours',
              icon: <svg width="22" height="22" fill="none" stroke="#fbbf24" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
            { href: '/espace-eleve/ressources',  color: '#38bdf8', label: 'Mes ressources',
              icon: <svg width="22" height="22" fill="none" stroke="#38bdf8" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
            { href: '/espace-eleve/certificats', color: '#fcd34d', label: 'Mes certificats',
              icon: <svg width="22" height="22" fill="none" stroke="#fcd34d" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
            { href: '/espace-eleve/partitions',  color: '#c084fc', label: 'Médiathèque',
              icon: <svg width="22" height="22" fill="none" stroke="#c084fc" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="card hover:border-gold-500/40 transition-all text-center py-4 cursor-pointer group">
              <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
              <p className="text-xs text-noir-300 font-medium">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* CTA réservation */}
        <div className="card border-dashed border-gold-500/20 text-center py-5">
          <p className="text-noir-400 text-sm mb-3">Prêt pour votre prochain cours ?</p>
          <Link href="/espace-eleve/reserver" className="btn-gold px-8">Réserver un cours</Link>
        </div>

        {/* Installer l'application — bannière proéminente */}
        {!isInstalled && (
          <div className="mt-4 relative overflow-hidden rounded-2xl border-2 border-gold-500/40 bg-gradient-to-br from-gold-500/15 to-gold-500/5 p-5">
            {/* Décoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gold-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gold-500 flex items-center justify-center shrink-0 shadow-lg">
                <svg width="26" height="26" fill="none" stroke="#1a1a2e" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-base">Installez l'application !</p>
                <p className="text-gold-400 text-xs font-medium mt-0.5">Accès rapide · Mode hors-ligne · Écran d'accueil</p>
              </div>
            </div>

            {installPrompt ? (
              <button onClick={handleInstall} className="w-full btn-gold py-3 text-base font-bold shadow-lg">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="inline mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Installer sur cet appareil
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-noir-900/40 rounded-xl px-4 py-3">
                  <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  <div>
                    <p className="text-white text-xs font-bold">iPhone / iPad</p>
                    <p className="text-noir-400 text-xs">Safari → Partager → "Sur l'écran d'accueil"</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-noir-900/40 rounded-xl px-4 py-3">
                  <svg width="20" height="20" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="#4ade80"/></svg>
                  <div>
                    <p className="text-white text-xs font-bold">Android</p>
                    <p className="text-noir-400 text-xs">Chrome → menu ⋮ → "Ajouter à l'écran d'accueil"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Supprimer compte */}
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              if (!confirm('Supprimer définitivement votre compte ?')) return
              await fetch('/api/eleve/delete-account', { method: 'DELETE' })
              router.push('/espace-eleve/login')
            }}
            className="text-xs text-noir-700 hover:text-red-400 transition-colors"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </EleveLayout>
  </>
  )
}