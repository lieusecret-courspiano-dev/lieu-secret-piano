'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { DateTime } from 'luxon'

interface DefiProgress {
  label: string
  current: number
  target: number
  unit: string
  done: boolean
  icon: React.ReactNode
  color: string
  href: string
}

export default function DefisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [defis, setDefis] = useState<DefiProgress[]>([])
  const [streak, setStreak] = useState(0)
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    const debutSemaine = DateTime.now().startOf('week')
    const finSemaine   = DateTime.now().endOf('week')

    Promise.all([
      fetch('/api/eleve/journal').then(r => r.ok ? r.json() : []),
      fetch('/api/eleve/quiz').then(r => r.ok ? r.json() : []),
      fetch('/api/eleve/repertoire').then(r => r.ok ? r.json() : []),
      fetch('/api/eleve/me').then(r => r.ok ? r.json() : null),
    ]).then(([journal, quiz, repertoire, me]: [any[], any[], any[], any]) => {
      if (!me?.id) { router.push('/espace-eleve/login'); return }

      // Calculer les progrès de la semaine
      const journalSemaine = (Array.isArray(journal) ? journal : [])
        .filter((e: any) => DateTime.fromISO(e.date_pratique) >= debutSemaine)
      const minutesSemaine = journalSemaine.reduce((s: number, e: any) => s + (e.duree_minutes || 0), 0)
      const heuresSemaine  = minutesSemaine / 60

      const quizSemaine = (Array.isArray(quiz) ? quiz : [])
        .filter((q: any) => q.nb_tentatives > 0 && q.reussi)

      const morceauxAjoutes = (Array.isArray(repertoire) ? repertoire : [])
        .filter((m: any) => DateTime.fromISO(m.created_at) >= debutSemaine)

      const sessionsSemaine = journalSemaine.length

      const defisData: DefiProgress[] = [
        {
          label: 'Pratiquer 3h cette semaine',
          current: Math.round(heuresSemaine * 10) / 10,
          target: 3,
          unit: 'h',
          done: heuresSemaine >= 3,
          color: '#fb923c',
          href: '/espace-eleve/journal',
          icon: <svg width="20" height="20" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        },
        {
          label: 'Réussir 2 quiz',
          current: Math.min(quizSemaine.length, 2),
          target: 2,
          unit: 'quiz',
          done: quizSemaine.length >= 2,
          color: '#a78bfa',
          href: '/espace-eleve/quiz',
          icon: <svg width="20" height="20" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
        },
        {
          label: 'Pratiquer 4 jours cette semaine',
          current: Math.min(sessionsSemaine, 4),
          target: 4,
          unit: 'jours',
          done: sessionsSemaine >= 4,
          color: '#34d399',
          href: '/espace-eleve/journal',
          icon: <svg width="20" height="20" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
        },
        {
          label: 'Ajouter 1 morceau au répertoire',
          current: Math.min(morceauxAjoutes.length, 1),
          target: 1,
          unit: 'morceau',
          done: morceauxAjoutes.length >= 1,
          color: '#60a5fa',
          href: '/espace-eleve/repertoire',
          icon: <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
        },
      ]

      setDefis(defisData)
      setStreak(me.streak_semaines || 0)
      setAllDone(defisData.every(d => d.done))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [router])

  const daysLeft = 7 - DateTime.now().weekday
  const completed = defis.filter(d => d.done).length

  if (loading) return <EleveLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div></EleveLayout>

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl text-white">Défis de la semaine</h1>
            <p className="text-noir-400 text-sm mt-1">{daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''} · {completed}/{defis.length} complétés</p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2">
              <svg width="14" height="14" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <span className="text-orange-400 text-sm font-bold">{streak} semaine{streak > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {allDone && (
          <div className="card border-gold-500/40 bg-gold-500/5 text-center mb-6 py-6">
            <svg width="40" height="40" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <h2 className="font-serif text-xl text-gold-400 mb-1">Tous les défis complétés !</h2>
            <p className="text-noir-400 text-sm">Excellent travail cette semaine. Continuez ainsi !</p>
          </div>
        )}

        <div className="space-y-4">
          {defis.map((defi, i) => (
            <a key={i} href={defi.href} className={`card block transition-all hover:border-opacity-50 ${defi.done ? 'border-opacity-30' : 'hover:-translate-y-0.5'}`}
              style={{ borderColor: defi.done ? `${defi.color}40` : undefined }}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${defi.done ? 'opacity-100' : 'opacity-70'}`}
                  style={{ background: `${defi.color}15` }}>
                  {defi.done ? (
                    <svg width="22" height="22" fill="none" stroke={defi.color} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : defi.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${defi.done ? 'line-through text-noir-500' : 'text-white'}`}>{defi.label}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-noir-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((defi.current / defi.target) * 100, 100)}%`, background: defi.color }} />
                    </div>
                    <span className="text-xs text-noir-400 shrink-0">{defi.current}/{defi.target} {defi.unit}</span>
                  </div>
                </div>
                {defi.done && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${defi.color}20` }}>
                    <svg width="14" height="14" fill="none" stroke={defi.color} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>

        <p className="text-noir-600 text-xs text-center mt-6">Les défis se renouvellent chaque lundi</p>
      </div>
    </EleveLayout>
  )
}
