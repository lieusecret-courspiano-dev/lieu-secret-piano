'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'
import { StatCard } from '@/components/eleve/StatCard'
import { ProgressBar } from '@/components/eleve/ProgressBar'
import { SkeletonDashboard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'
import { DateTime } from 'luxon'

// ── Types ────────────────────────────────────────────────────
interface Me {
  id: string; prenom: string; nom: string; email: string; avatar?: string
}
interface Pack {
  pack_label: string; heures_restantes: number; heures_total: number; code: string
}
interface Cours {
  slot_start: string; slot_end: string; status: string
}
interface ProgStats {
  total: number; validees: number; pourcentage: number
  statsParCategorie: Record<string, { total: number; validees: number; pourcentage: number }>
}
interface Badge {
  badge_key: string; badge_nom: string; badge_icon: string | null; obtenu_at: string
}
interface Notif {
  id: string; type: string; titre: string; message: string | null; lu: boolean; created_at: string
}
interface Travail {
  id: string; titre: string; echeance: string | null; termine: boolean
}
interface QuizResult {
  quiz_id: string; score: number; reussi: boolean
}

const AVATARS = [
  { key: 'piano',  svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg> },
  { key: 'notes',  svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  { key: 'star',   svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { key: 'heart',  svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { key: 'crown',  svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 20h20M5 20l-2-9 5 4 4-8 4 8 5-4-2 9"/></svg> },
  { key: 'treble', svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 3c-1.2 5.4-2 8.5-2 11a4 4 0 0 0 8 0c0-2.5-.8-5.6-2-11"/><path d="M10 9c2 1 4 1 6 0"/></svg> },
]

function AvatarIcon({ key: k, size = 28 }: { key: string; size?: number }) {
  const av = AVATARS.find(a => a.key === k) || AVATARS[0]
  return <span style={{ fontSize: size }}>{av.svg}</span>
}

function getGreeting(prenom: string): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 17) return `Bonjour, ${prenom} !`
  return `Bonsoir, ${prenom} !`
}

// ── Composant principal ──────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<Me | null>(null)
  const [pack, setPack] = useState<Pack | null>(null)
  const [prochainCours, setProchainCours] = useState<Cours | null>(null)
  const [prog, setProg] = useState<ProgStats | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [travaux, setTravaux] = useState<Travail[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [nbCours, setNbCours] = useState(0)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState('piano')

  const loadData = useCallback(async () => {
    try {
      const [meRes, progRes, badgesRes, notifsRes, travauxRes, packRes, coursRes, quizRes] = await Promise.all([
        fetch('/api/eleve/me'),
        fetch('/api/eleve/progression'),
        fetch('/api/eleve/badges'),
        fetch('/api/eleve/notifications'),
        fetch('/api/eleve/travaux'),
        fetch('/api/eleve/pack'),
        fetch('/api/eleve/reservations'),
        fetch('/api/eleve/quiz'),
      ])

      if (meRes.status === 401) { router.push('/espace-eleve/login'); return }

      const [meData, progData, badgesData, notifsData, travauxData, packData, coursData, quizData] = await Promise.all([
        meRes.json(), progRes.json(), badgesRes.json(), notifsRes.json(),
        travauxRes.json(), packRes.json(), coursRes.json(), quizRes.json(),
      ])

      setMe(meData)
      setCurrentAvatar(meData.avatar || 'piano')
      setProg(progData)
      setBadges(Array.isArray(badgesData) ? badgesData.slice(0, 6) : [])
      setNotifs(Array.isArray(notifsData) ? notifsData.filter((n: Notif) => !n.lu).slice(0, 5) : [])
      setTravaux(Array.isArray(travauxData) ? travauxData.filter((t: Travail) => !t.termine).slice(0, 3) : [])

      if (packData && packData.packs) {
        const activePack = packData.packs.find((p: any) => p.status === 'active')
        if (activePack) {
          setPack({ pack_label: activePack.pack_label, heures_restantes: activePack.heures_restantes, heures_total: activePack.heures_total, code: activePack.code })
        }
      } else if (packData && !packData.error && packData.pack_label) {
        setPack(packData)
      }

      if (Array.isArray(coursData)) {
        const now = new Date()
        const upcoming = coursData.filter((c: Cours) => new Date(c.slot_start) > now && c.status === 'confirmed')
        setProchainCours(upcoming[0] || null)
        setNbCours(coursData.filter((c: Cours) => new Date(c.slot_start) < now).length)
      }

      if (Array.isArray(quizData)) {
        setQuizResults(quizData.filter((q: any) => q.nb_tentatives > 0))
      }
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  async function changeAvatar(key: string) {
    setCurrentAvatar(key)
    setShowAvatarPicker(false)
    await fetch('/api/eleve/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: key }) })
  }

  if (loading) return <EleveLayout><SkeletonDashboard /></EleveLayout>
  if (!me) return null

  const progPct = prog?.pourcentage || 0
  const notifsNonLues = notifs.length
  const travauxEnAttente = travaux.length
  const quizReussis = quizResults.filter(q => q.reussi).length

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="w-14 h-14 rounded-2xl bg-gold-500/10 border-2 border-gold-500/30 flex items-center justify-center hover:border-gold-500/60 transition-all relative group"
            >
              <AvatarIcon key={currentAvatar} />
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
            </button>
            <div>
              <h1 className="text-xl font-serif text-white">{getGreeting(me.prenom)}</h1>
              <p className="text-noir-400 text-sm">{me.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifsNonLues > 0 && (
              <Link href="/espace-eleve/notifications"
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-1.5 rounded-full hover:bg-red-500/20 transition-all">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {notifsNonLues} nouvelle{notifsNonLues > 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg>}
            label="Cours suivis" value={nbCours} color="#60a5fa"
          />
          <StatCard
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            label="Progression" value={`${progPct}%`} color="#a78bfa"
          />
          <StatCard
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>}
            label="Badges" value={badges.length} color="#f59e0b"
          />
          <StatCard
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
            label="Quiz réussis" value={quizReussis} color="#34d399"
          />
        </div>

        {/* ── Progression globale ── */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Ma progression globale</h2>
            <Link href="/espace-eleve/progression" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
              Voir détails →
            </Link>
          </div>
          <ProgressBar value={progPct} showLabel animated color="#f59e0b" height={8} />
          <p className="text-noir-500 text-xs mt-2">{prog?.validees || 0} / {prog?.total || 0} compétences validées</p>

          {prog?.statsParCategorie && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
              {Object.entries(prog.statsParCategorie).map(([cat, stats]) => (
                <div key={cat} className="bg-noir-800/50 rounded-xl p-3">
                  <p className="text-xs text-noir-400 mb-2 truncate">{cat}</p>
                  <ProgressBar
                    value={stats.validees} max={stats.total}
                    color={cat.includes('Fond') ? '#3b82f6' : cat.includes('Comp') ? '#f59e0b' : '#22c55e'}
                    height={4}
                  />
                  <p className="text-xs text-noir-500 mt-1">{stats.validees}/{stats.total}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Grille principale ── */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">

          {/* Prochain cours */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Prochain cours
              </h2>
              <Link href="/espace-eleve/reserver" className="text-xs text-gold-400 hover:text-gold-300">Réserver →</Link>
            </div>
            {prochainCours ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">
                  {DateTime.fromISO(prochainCours.slot_start).setLocale('fr').toFormat('EEEE d MMMM')}
                </p>
                <p className="text-blue-400 text-xs mt-1">
                  {DateTime.fromISO(prochainCours.slot_start).toFormat('HH:mm')} — {DateTime.fromISO(prochainCours.slot_end).toFormat('HH:mm')}
                </p>
                <Link href="/espace-eleve/reservations"
                  className="mt-3 btn-gold text-xs px-4 py-2 inline-flex items-center gap-1.5">
                  Voir mes réservations
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                title="Aucun cours à venir"
                description="Réservez votre prochain cours"
                action={<Link href="/espace-eleve/reserver" className="btn-gold text-xs px-4 py-2">Réserver un cours</Link>}
              />
            )}
          </div>

          {/* Mon pack */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                Mon pack
              </h2>
              <Link href="/espace-eleve/pack" className="text-xs text-gold-400 hover:text-gold-300">Détails →</Link>
            </div>
            {pack ? (
              <div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-2xl">{pack.heures_restantes}h</p>
                    <p className="text-noir-400 text-xs">restantes sur {pack.heures_total}h</p>
                  </div>
                  <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-1 rounded-full">Actif</span>
                </div>
                <ProgressBar
                  value={pack.heures_restantes} max={pack.heures_total}
                  color={pack.heures_restantes <= 2 ? '#f87171' : pack.heures_restantes <= 4 ? '#fb923c' : '#22c55e'}
                  height={6}
                />
                <p className="text-noir-600 text-xs mt-2 font-mono">{pack.code}</p>
              </div>
            ) : (
              <EmptyState
                icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
                title="Aucun pack actif"
                action={<Link href="/espace-eleve/acheter-pack" className="btn-gold text-xs px-4 py-2">Acheter un pack</Link>}
              />
            )}
          </div>

          {/* Travaux à faire */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Travaux à faire
                {travauxEnAttente > 0 && (
                  <span className="bg-orange-500/20 text-orange-400 text-xs px-1.5 py-0.5 rounded-full border border-orange-500/30">{travauxEnAttente}</span>
                )}
              </h2>
              <Link href="/espace-eleve/travaux" className="text-xs text-gold-400 hover:text-gold-300">Voir tout →</Link>
            </div>
            {travaux.length > 0 ? (
              <div className="space-y-2">
                {travaux.map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-noir-800/50 rounded-xl px-3 py-2.5">
                    <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{t.titre}</p>
                      {t.echeance && (
                        <p className="text-noir-500 text-xs">
                          Échéance : {DateTime.fromISO(t.echeance).setLocale('fr').toFormat('d MMM')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                title="Tout est à jour !"
                description="Aucun travail en attente"
              />
            )}
          </div>

          {/* Quiz disponibles */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Quiz
              </h2>
              <Link href="/espace-eleve/quiz" className="text-xs text-gold-400 hover:text-gold-300">Voir tout →</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{quizReussis}</p>
                <p className="text-xs text-noir-400">Réussis</p>
              </div>
              <div className="w-px h-10 bg-noir-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{quizResults.length}</p>
                <p className="text-xs text-noir-400">Tentés</p>
              </div>
              <div className="flex-1">
                <Link href="/espace-eleve/quiz" className="btn-gold text-xs px-4 py-2 w-full text-center block">
                  Passer un quiz
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Badges récents ── */}
        {badges.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                Mes badges
              </h2>
              <Link href="/espace-eleve/badges" className="text-xs text-gold-400 hover:text-gold-300">Voir tous →</Link>
            </div>
            <div className="flex gap-2 flex-wrap">
              {badges.map(b => (
                <div key={b.badge_key} className="flex flex-col items-center gap-1 bg-noir-800/50 rounded-xl p-3 min-w-[72px]">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20">
                        <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                      </span>
                  <p className="text-xs text-noir-400 text-center leading-tight">{b.badge_nom}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notifications récentes ── */}
        {notifs.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Notifications
                <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full border border-red-500/30">{notifs.length}</span>
              </h2>
              <Link href="/espace-eleve/notifications" className="text-xs text-gold-400 hover:text-gold-300">Tout voir →</Link>
            </div>
            <div className="space-y-2">
              {notifs.map(n => (
                <div key={n.id} className="flex items-start gap-3 bg-noir-800/50 rounded-xl px-3 py-2.5">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    n.type === 'badge' ? 'bg-gold-400' :
                    n.type === 'certificat' ? 'bg-blue-400' :
                    n.type === 'media' ? 'bg-purple-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{n.titre}</p>
                    {n.message && <p className="text-noir-500 text-xs truncate">{n.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Avatar picker ── */}
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-serif text-lg">Choisir un avatar</h3>
                <button onClick={() => setShowAvatarPicker(false)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {AVATARS.map(av => (
                  <button key={av.key} onClick={() => changeAvatar(av.key)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      currentAvatar === av.key
                        ? 'bg-gold-500/10 border-gold-500 text-gold-400'
                        : 'border-noir-700 text-noir-400 hover:border-gold-500/50 hover:text-white'
                    }`}>
                    {av.svg}
                    <span className="text-xs capitalize">{av.key}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}