'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DateTime } from 'luxon'

interface Cours {
  slot_start: string
  slot_end: string
  zoom_link?: string | null
  status: string
}

export default function CoursBanner() {
  const [prochainCours, setProchainCours] = useState<Cours | null>(null)
  const [zoomLink, setZoomLink] = useState<string | null>(null)
  const [heuresAvant, setHeuresAvant] = useState<number>(999)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Charger le prochain cours et le lien Zoom
    Promise.all([
      fetch('/api/eleve/reservations').then(r => r.ok ? r.json() : []),
      fetch('/api/settings').then(r => r.ok ? r.json() : {}),
    ]).then(([reservations, settings]) => {
      if (Array.isArray(reservations)) {
        const now = new Date()
        const upcoming = reservations
          .filter((c: Cours) => new Date(c.slot_start) > now && c.status === 'confirmed')
          .sort((a: Cours, b: Cours) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime())
        if (upcoming[0]) {
          setProchainCours(upcoming[0])
          const h = (new Date(upcoming[0].slot_start).getTime() - now.getTime()) / 3600000
          setHeuresAvant(h)
        }
      }
      const s = settings as Record<string, string>
      if (s?.zoom_cours) setZoomLink(s.zoom_cours)
    }).catch(() => {})
  }, [])

  // Mettre à jour le compte à rebours chaque minute
  useEffect(() => {
    if (!prochainCours) return
    const interval = setInterval(() => {
      const h = (new Date(prochainCours.slot_start).getTime() - Date.now()) / 3600000
      setHeuresAvant(h)
    }, 60000)
    return () => clearInterval(interval)
  }, [prochainCours])

  // Afficher seulement si cours dans moins de 2h
  if (!prochainCours || heuresAvant > 2 || heuresAvant < 0 || dismissed) return null

  const start = DateTime.fromISO(prochainCours.slot_start)
  const isVeryClose = heuresAvant < 0.25 // moins de 15 min

  const getCountdown = () => {
    if (heuresAvant < 1/60) return 'maintenant'
    if (heuresAvant < 1) return `dans ${Math.round(heuresAvant * 60)} min`
    return `dans ${Math.floor(heuresAvant)}h${Math.round((heuresAvant % 1) * 60).toString().padStart(2, '0')}`
  }

  return (
    <div className={`mx-4 mt-4 md:mx-6 lg:mx-8 rounded-2xl border p-4 flex items-center justify-between gap-3 flex-wrap ${
      isVeryClose
        ? 'bg-red-500/10 border-red-500/40 animate-pulse'
        : 'bg-blue-500/10 border-blue-500/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isVeryClose ? 'bg-red-400' : 'bg-blue-400'} animate-pulse`} />
        <div>
          <p className={`text-sm font-semibold ${isVeryClose ? 'text-red-300' : 'text-blue-300'}`}>
            Votre cours commence {getCountdown()}
          </p>
          <p className="text-xs text-noir-400">
            {start.setLocale('fr').toFormat("EEEE d MMMM 'à' HH'h'mm")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {zoomLink && (
          <a href={zoomLink} target="_blank" rel="noopener noreferrer"
            className="btn-gold text-xs px-4 py-2 flex items-center gap-1.5">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/></svg>
            Rejoindre Zoom
          </a>
        )}
        <Link href="/espace-eleve/reserver" className="btn-outline text-xs px-3 py-2">
          Détails
        </Link>
        <button onClick={() => setDismissed(true)} className="text-noir-600 hover:text-noir-400 p-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}
