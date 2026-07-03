'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'
import { ProgressBar } from '@/components/eleve/ProgressBar'
import { NiveauGlobal } from '@/components/eleve/NiveauGlobal'
import { SkeletonDashboard } from '@/components/eleve/SkeletonCard'
import { DateTime } from 'luxon'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Me { id: string; prenom: string; nom: string; email: string; avatar?: string; streak_semaines?: number; total_heures_pratique?: number }
interface Pack { pack_label: string; heures_restantes: number; heures_total: number; code: string }
interface Cours { slot_start: string; slot_end: string; status: string }
interface ProgStats { total: number; validees: number; pourcentage: number; statsParCategorie: Record<string, { total: number; validees: number; pourcentage: number }> }
interface Badge { badge_key: string; badge_nom: string; badge_icon: string | null; obtenu_at: string }
interface Travail { id: string; titre: string; echeance: string | null; termine: boolean }
interface QuizResult { quiz_id: string; score: number; reussi: boolean }
interface JournalEntry { duree_minutes: number; date_pratique: string }

const AVATARS = [
  { key: 'piano',  svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg> },
  { key: 'notes',  svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  { key: 'star',   svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { key: 'heart',  svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { key: 'crown',  svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 20h20M5 20l-2-9 5 4 4-8 4 8 5-4-2 9"/></svg> },
  { key: 'treble', svg: <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 3c-1.2 5.4-2 8.5-2 11a4 4 0 0 0 8 0c0-2.5-.8-5.6-2-11"/><path d="M10 9c2 1 4 1 6 0"/></svg> },
]

function getGreeting(prenom: string): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return `Bonjour, ${prenom}`
  if (h >= 12 && h < 18) return `Bon après-midi, ${prenom}`
  return `Bonsoir, ${prenom}`
}

function getCountdown(slotStart: string): string {
  const diff = DateTime.fromISO(slotStart, { zone: 'utc' }).diff(DateTime.now(), ['days', 'hours', 'minutes'])
  if (diff.days >= 1) return `dans ${Math.floor(diff.days)} jour${Math.floor(diff.days) > 1 ? 's' : ''}`
  if (diff.hours >= 1) return `dans ${Math.floor(diff.hours)}h${Math.floor(diff.minutes)}min`
  return `dans ${Math.floor(diff.minutes)} min`
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<Me | null>(null)
  const [pack, setPack] = useState<Pack | null>(null)
  const [prochainCours, setProchainCours] = useState<Cours | null>(null)
  const [prog, setProg] = useState<ProgStats | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [travaux, setTravaux] = useState<Travail[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [nbCours, setNbCours] = useState(0)
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState('piano')

  const loadData = useCallback(async (forceRefresh = false) => {
    // Cache 5 minutes dans sessionStorage
    const CACHE_KEY = 'dashboard_cache'
    const CACHE_TTL = 5 * 60 * 1000
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_TTL) {
            const { meData, progData, badgesData, travauxData, packData, coursData, quizData, journalData } = data
            setMe(meData); setCurrentAvatar(meData.avatar || 'piano'); setProg(progData)
            setBadges(Array.isArray(badgesData) ? badgesData.slice(0, 5) : [])
            setTravaux(Array.isArray(travauxData) ? travauxData.filter((t: Travail) => !t.termine).slice(0, 3) : [])
            setJournal(Array.isArray(journalData) ? journalData : [])
            if (packData?.packs) { const active = packData.packs.find((p: any) => p.status === 'active'); if (active) setPack({ pack_label: active.pack_label, heures_restantes: active.heures_restantes, heures_total: active.heures_total, code: active.code }) } else if (packData?.pack_label) { setPack(packData) }
            if (Array.isArray(coursData)) { const now = new Date(); const upcoming = coursData.filter((c: Cours) => new Date(c.slot_start) > now && c.status === 'confirmed'); setProchainCours(upcoming[0] || null); setNbCours(coursData.filter((c: Cours) => new Date(c.slot_start) < now).length) }
            if (Array.isArray(quizData)) setQuizResults(quizData.filter((q: any) => q.nb_tentatives > 0))
            setLoading(false); return
          }
        }
      } catch {}
    }
    try {
      const [meRes, progRes, badgesRes, travauxRes, packRes, coursRes, quizRes, journalRes] = await Promise.all([
        fetch('/api/eleve/me'),
        fetch('/api/eleve/progression'),
        fetch('/api/eleve/badges'),
        fetch('/api/eleve/travaux'),
        fetch('/api/eleve/pack'),
        fetch('/api/eleve/reservations'),
        fetch('/api/eleve/quiz'),
        fetch('/api/eleve/journal'),
      ])
      if (meRes.status === 401) { router.push('/espace-eleve/login'); return }
      const [meData, progData, badgesData, travauxData, packData, coursData, quizData, journalData] = await Promise.all([
        meRes.json(), progRes.json(), badgesRes.json(), travauxRes.json(),
        packRes.json(), coursRes.json(), quizRes.json(), journalRes.json(),
      ])
      setMe(meData)
      setCurrentAvatar(meData.avatar || 'piano')
      setProg(progData)
      setBadges(Array.isArray(badgesData) ? badgesData.slice(0, 5) : [])
      setTravaux(Array.isArray(travauxData) ? travauxData.filter((t: Travail) => !t.termine).slice(0, 3) : [])
      setJournal(Array.isArray(journalData) ? journalData : [])
      if (packData?.packs) {
        const active = packData.packs.find((p: any) => p.status === 'active')
        if (active) setPack({ pack_label: active.pack_label, heures_restantes: active.heures_restantes, heures_total: active.heures_total, code: active.code })
      } else if (packData?.pack_label) { setPack(packData) }
      if (Array.isArray(coursData)) {
        const now = new Date()
        const upcoming = coursData.filter((c: Cours) => new Date(c.slot_start) > now && c.status === 'confirmed')
        setProchainCours(upcoming[0] || null)
        setNbCours(coursData.filter((c: Cours) => new Date(c.slot_start) < now).length)
      }
      if (Array.isArray(quizData)) setQuizResults(quizData.filter((q: any) => q.nb_tentatives > 0))
      // Sauvegarder dans le cache
      try { sessionStorage.setItem('dashboard_cache', JSON.stringify({ data: { meData, progData, badgesData, travauxData, packData, coursData, quizData, journalData }, timestamp: Date.now() })) } catch {}
    } catch (e) { console.error('Dashboard:', e) } finally { setLoading(false) }
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  async function changeAvatar(key: string) {
    setCurrentAvatar(key); setShowAvatarPicker(false)
    await fetch('/api/eleve/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: key }) })
  }

  if (loading) return <EleveLayout><SkeletonDashboard /></EleveLayout>
  if (!me) return null

  const progPct = prog?.pourcentage || 0
  const travauxEnAttente = travaux.length
  const quizReussis = quizResults.filter(q => q.reussi).length
  const streak = me.streak_semaines || 0

  // Résumé semaine courante
  const debutSemaine = DateTime.now().startOf('week')
  const journalSemaine = journal.filter(e => DateTime.fromISO(e.date_pratique) >= debutSemaine)
  const minutesSemaine = journalSemaine.reduce((s, e) => s + e.duree_minutes, 0)
  const heuresSemaine = Math.floor(minutesSemaine / 60)
  const minRestantes = minutesSemaine % 60

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowAvatarPicker(true)}
              className="w-14 h-14 rounded-2xl bg-gold-500/10 border-2 border-gold-500/30 flex items-center justify-center hover:border-gold-500/60 transition-all relative group shrink-0">
              {AVATARS.find(a => a.key === currentAvatar)?.svg || AVATARS[0].svg}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
            </button>
            <div>
              <h1 className="text-xl font-serif text-white">{getGreeting(me.prenom)}</h1>
              <p className="text-noir-400 text-sm">{me.email}</p>
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5">
              <svg width="16" height="16" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <div>
                <p className="text-orange-400 font-bold text-sm leading-none">{streak} semaine{streak > 1 ? 's' : ''}</p>
                <p className="text-orange-600 text-xs">consécutives</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Prochain cours — carte hero ── */}
        {prochainCours ? (
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-noir-900 to-noir-900 p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-1">Prochain cours</p>
                <p className="text-white font-serif text-xl capitalize">
                  {DateTime.fromISO(prochainCours.slot_start, { zone: 'utc' }).setZone('local').setLocale('fr').toFormat('EEEE d MMMM')}
                </p>
                <p className="text-blue-300 text-sm mt-0.5">
                  {DateTime.fromISO(prochainCours.slot_start, { zone: 'utc' }).setZone('local').toFormat('HH:mm')} — {DateTime.fromISO(prochainCours.slot_end, { zone: 'utc' }).setZone('local').toFormat('HH:mm')}
                  <span className="ml-2 text-blue-400 font-medium">· {getCountdown(prochainCours.slot_start)}</span>
                </p>
              </div>
              <Link href="/espace-eleve/reserver" className="btn-gold text-sm shrink-0">
                Voir mes cours
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-noir-800 bg-noir-900/50 p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-noir-400 text-sm">Aucun cours à venir</p>
              <p className="text-noir-600 text-xs mt-0.5">Réservez votre prochain cours</p>
            </div>
            <Link href="/espace-eleve/reserver" className="btn-gold text-sm">Réserver un cours</Link>
          </div>
        )}

        {/* ── Résumé semaine + Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Cours suivis', value: nbCours, color: '#60a5fa',
              icon: <svg width="16" height="16" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg> },
            { label: 'Cette semaine', value: minutesSemaine > 0 ? `${heuresSemaine > 0 ? heuresSemaine + 'h' : ''}${minRestantes > 0 ? minRestantes + 'min' : ''}` : '—', color: '#fb923c',
              icon: <svg width="16" height="16" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Progression', value: `${progPct}%`, color: '#a78bfa',
              icon: <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
            { label: 'Quiz réussis', value: quizReussis, color: '#34d399',
              icon: <svg width="16" height="16" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
          ].map(s => (
            <div key={s.label} className="card py-4 text-center">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-noir-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Progression globale ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Ma progression globale</h2>
            <Link href="/espace-eleve/progression" className="text-xs text-gold-400 hover:text-gold-300">Voir détails →</Link>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <ProgressBar value={progPct} showLabel animated color="#f59e0b" height={10} />
          </div>
          <p className="text-noir-500 text-xs mb-4">{prog?.validees || 0} / {prog?.total || 0} compétences validées</p>
          {prog?.statsParCategorie && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(prog.statsParCategorie).map(([cat, stats]) => (
                <div key={cat} className="bg-noir-800/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-noir-300 truncate font-medium">{cat}</p>
                    <p className="text-xs text-noir-500 shrink-0 ml-1">{stats.validees}/{stats.total}</p>
                  </div>
                  <ProgressBar
                    value={stats.validees} max={stats.total}
                    color={cat.toLowerCase().includes('fond') ? '#3b82f6' : cat.toLowerCase().includes('comp') ? '#f59e0b' : '#22c55e'}
                    height={5}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Grille: Pack + Travaux ── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Mon pack */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                Mon pack
              </h2>
              <Link href="/espace-eleve/pack" className="text-xs text-gold-400 hover:text-gold-300">Détails →</Link>
            </div>
            {pack ? (
              <div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-3xl leading-none">{pack.heures_restantes}<span className="text-lg text-noir-400 ml-1">h</span></p>
                    <p className="text-noir-400 text-xs mt-1">restantes sur {pack.heures_total}h · {pack.pack_label}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${pack.heures_restantes <= 2 ? 'bg-red-500/10 border-red-500/30 text-red-400' : pack.heures_restantes <= 4 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    {pack.heures_restantes <= 2 ? 'Faible' : pack.heures_restantes <= 4 ? 'Bientôt épuisé' : 'Actif'}
                  </span>
                </div>
                <ProgressBar value={pack.heures_restantes} max={pack.heures_total}
                  color={pack.heures_restantes <= 2 ? '#f87171' : pack.heures_restantes <= 4 ? '#fb923c' : '#22c55e'} height={6} />
                <p className="text-noir-700 text-xs mt-2 font-mono">{pack.code}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-noir-400 text-sm mb-3">Aucun pack actif</p>
                <Link href="/espace-eleve/acheter-pack" className="btn-gold text-xs px-4 py-2">Acheter un pack</Link>
              </div>
            )}
          </div>

          {/* Travaux à faire */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="15" height="15" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Travaux à faire
                {travauxEnAttente > 0 && <span className="bg-orange-500/20 text-orange-400 text-xs px-1.5 py-0.5 rounded-full border border-orange-500/30">{travauxEnAttente}</span>}
              </h2>
              <Link href="/espace-eleve/travaux" className="text-xs text-gold-400 hover:text-gold-300">Voir tout →</Link>
            </div>
            {travaux.length > 0 ? (
              <div className="space-y-2">
                {travaux.map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-noir-800/50 rounded-xl px-3 py-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{t.titre}</p>
                      {t.echeance && <p className="text-noir-500 text-xs">Échéance : {DateTime.fromISO(t.echeance).setLocale('fr').toFormat('d MMM')}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-3">
                <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <p className="text-noir-400 text-sm">Tout est à jour !</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Badges récents ── */}
        {badges.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                Mes badges
              </h2>
              <Link href="/espace-eleve/badges" className="text-xs text-gold-400 hover:text-gold-300">Voir tous →</Link>
            </div>
            <div className="flex gap-2 flex-wrap">
              {badges.map(b => (
                <div key={b.badge_key} className="flex flex-col items-center gap-1.5 bg-noir-800/50 rounded-xl p-3 min-w-[72px] border border-noir-700 hover:border-gold-500/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                  </div>
                  <p className="text-xs text-noir-400 text-center leading-tight">{b.badge_nom}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Niveau global ── */}
        <NiveauGlobal
          progPct={progPct}
          nbCours={nbCours}
          badges={badges.length}
          quizReussis={quizReussis}
          heuresPratique={me.total_heures_pratique || 0}
        />

        {/* ── Accès rapides ── */}
        <div>
          <p className="text-noir-500 text-xs uppercase tracking-widest mb-3">Accès rapides</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { href: '/espace-eleve/quiz', label: 'Quiz', icon: <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              { href: '/espace-eleve/journal', label: 'Journal', icon: <svg width="16" height="16" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
              { href: '/espace-eleve/metronome', label: 'Métronome', icon: <svg width="16" height="16" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 22 20 2 20"/><line x1="12" y1="9" x2="16" y2="17"/></svg> },
              { href: '/espace-eleve/mes-ressources', label: 'Ressources', icon: <svg width="16" height="16" fill="none" stroke="#38bdf8" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 bg-noir-900 border border-noir-800 hover:border-gold-500/30 rounded-xl px-4 py-3 transition-all group">
                {item.icon}
                <span className="text-noir-300 text-sm group-hover:text-white transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

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
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${currentAvatar === av.key ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-gold-500/50 hover:text-white'}`}>
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
