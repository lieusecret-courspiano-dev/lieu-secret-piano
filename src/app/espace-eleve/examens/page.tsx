'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { DateTime } from 'luxon'

interface Examen {
  id: string; titre: string; categorie: string; score_min: number
  duree_minutes: number; date_examen: string; nb_tentatives: number
  tentatives_utilisees: number
  derniere_session: { score: number; reussi: boolean; niveau_medaille: string | null; submitted_at: string } | null
}
interface Question {
  id: string; type: string; question: string; options: string[] | null
  audio_url: string | null; image_url: string | null; video_url: string | null; points: number
}

const MEDAILLE = {
  or:     { label: 'Mention Or',     color: 'text-yellow-400', icon: <svg width="18" height="18" fill="none" stroke="#fbbf24" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  argent: { label: 'Mention Argent', color: 'text-gray-300',   icon: <svg width="18" height="18" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  bronze: { label: 'Mention Bronze', color: 'text-orange-400', icon: <svg width="18" height="18" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
}

export default function ExamensPage() {
  const router = useRouter()
  const [examens, setExamens] = useState<Examen[]>([])
  const [loading, setLoading] = useState(true)
  const [activeExamen, setActiveExamen] = useState<Examen | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; reussi: boolean; niveau_medaille: string | null; score_min: number; corrections?: any[] } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/eleve/examens')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setExamens(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  const submitExamen = useCallback(async (reponsesFinales: Record<string, string>) => {
    if (!sessionId || !activeExamen || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/eleve/examens/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', examen_id: activeExamen.id, session_id: sessionId, reponses: reponsesFinales }),
      })
      const d = await res.json()
      if (res.ok) {
        setResult(d)
        fetch('/api/eleve/examens').then(r => r.json()).then(data => {
          if (Array.isArray(data)) setExamens(data)
        }).catch(() => {})
      }
    } catch {} finally { setSubmitting(false) }
  }, [sessionId, activeExamen, submitting])

  // Timer
  useEffect(() => {
    if (!startedAt || !activeExamen || result) return
    const endTime = new Date(startedAt.getTime() + activeExamen.duree_minutes * 60 * 1000)
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(timerRef.current!)
        submitExamen(reponses)
      }
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startedAt, activeExamen, result, reponses, submitExamen])

  async function startExamen(examen: Examen) {
    if (!examen.id) return

    let qs: any[] = []
    try {
      const eqRes = await fetch(`/api/eleve/examens/questions?examen_id=${examen.id}`)
      if (eqRes.ok) { const eqData = await eqRes.json(); qs = Array.isArray(eqData) ? eqData : [] }
    } catch {}

    if (qs.length === 0) {
      const exData = await fetch('/api/eleve/examens').then(r => r.json())
      const ex = (Array.isArray(exData) ? exData : []).find((e: any) => e.id === examen.id)
      if (ex?.quiz_id) {
        const qData = await fetch(`/api/admin/quiz?id=${ex.quiz_id}`).then(r => r.json())
        qs = qData?.questions || []
      }
    }

    if (qs.length === 0) { alert('Aucune question dans cet examen. Veuillez contacter votre professeur.'); return }

    // Démarrer la session
    const res = await fetch('/api/eleve/examens/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', examen_id: examen.id }),
    })
    const d = await res.json()
    if (!res.ok) { alert(d.error || 'Erreur'); return }

    setActiveExamen(examen)
    setQuestions(qs)
    setSessionId(d.session_id)
    setStartedAt(new Date(d.started_at))
    setTimeLeft(examen.duree_minutes * 60)
    setReponses({})
    setCurrentQ(0)
    setResult(null)
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60); const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const isUrgent = timeLeft < 300 // moins de 5 min

  if (loading) return <EleveLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div></EleveLayout>

  // ── Vue résultat ──────────────────────────────────────────────────────────────
  if (result) {
    const med = result.niveau_medaille ? MEDAILLE[result.niveau_medaille as keyof typeof MEDAILLE] : null
    return (
      <EleveLayout>
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          <div className="card text-center py-10">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.reussi ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'}`}>
              {result.reussi
                ? <svg width="36" height="36" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                : <svg width="36" height="36" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              }
            </div>
            <h2 className="font-serif text-2xl text-white mb-2">{result.reussi ? 'Examen réussi !' : 'Examen non réussi'}</h2>
            <p className="text-5xl font-bold mb-2" style={{ color: result.reussi ? '#4ade80' : '#f87171' }}>{Math.round(result.score)}%</p>
            <p className="text-noir-400 text-sm mb-4">Score minimum requis : {result.score_min}%</p>
            {med && <p className={`text-xl font-bold mb-4 ${med.color}`}>{med.icon} {med.label}</p>}
            {result.reussi ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-green-400 font-medium text-sm mb-1">Compétences validées automatiquement</p>
                <p className="text-noir-400 text-xs">Toutes les compétences de la catégorie "{activeExamen?.categorie}" ont été marquées comme acquises. Votre tableau de progression a été mis à jour.</p>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-red-400 font-medium text-sm mb-1">Compétences non validées</p>
                <p className="text-noir-400 text-xs">Vous n'avez pas atteint le score minimum. Continuez à vous entraîner et demandez à votre professeur une nouvelle tentative.</p>
              </div>
            )}
            {/* Détail des corrections */}
            {result.corrections && result.corrections.length > 0 && (
              <div className="mt-6 text-left">
                <p className="text-white font-semibold text-sm mb-3">Détail des réponses</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.corrections.map((c, i) => (
                    <div key={i} className={`rounded-xl p-3 border text-xs ${c.type === 'reponse_libre' ? 'border-noir-700 bg-noir-800/50' : c.correct ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                      <p className="text-white font-medium mb-1">{i + 1}. {c.question}</p>
                      {c.type === 'reponse_libre' ? (
                        <p className="text-noir-400 italic">Question ouverte — correction manuelle</p>
                      ) : (
                        <>
                          <p className={c.correct ? 'text-green-400' : 'text-red-400'}>
                            Votre réponse : {c.reponse_eleve || '(sans réponse)'} {c.correct ? '✓' : '✗'}
                          </p>
                          {!c.correct && c.bonne_reponse && (
                            <p className="text-gold-400">Bonne réponse : {c.bonne_reponse}</p>
                          )}
                          {c.explication && <p className="text-noir-400 mt-1 italic">{c.explication}</p>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => { setActiveExamen(null); setResult(null); setSessionId(null); setQuestions([]) }} className="btn-outline">Retour aux examens</button>
              <a href="/espace-eleve/progression" className="btn-gold">Voir ma progression</a>
            </div>
          </div>
        </div>
      </EleveLayout>
    )
  }

  // ── Vue examen en cours ───────────────────────────────────────────────────────
  if (activeExamen && sessionId && questions.length > 0) {
    const q = questions[currentQ]
    return (
      <EleveLayout>
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          {/* Header avec timer */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-xl text-white">{activeExamen.titre}</h1>
              <p className="text-noir-400 text-xs mt-0.5">{currentQ + 1} / {questions.length} questions</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-lg font-bold ${isUrgent ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-noir-800 border-noir-700 text-white'}`}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Barre de progression */}
          <div className="h-1.5 bg-noir-800 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-gold-500 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Question */}
          <div className="card mb-4">
            {q.audio_url && <div className="mb-4 bg-noir-800 rounded-xl p-3 flex items-center gap-3"><svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg><audio controls className="flex-1 h-8" src={q.audio_url} /></div>}
            {q.image_url && <div className="mb-4 rounded-xl overflow-hidden border border-noir-700"><img src={q.image_url} alt="Question" className="w-full max-h-48 object-contain bg-noir-900" /></div>}
            {q.video_url && (() => {
              const yt = q.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
              return yt ? (
                <div className="mb-4 rounded-xl overflow-hidden border border-noir-700" style={{ aspectRatio: '16/9' }}>
                  <iframe src={`https://www.youtube.com/embed/${yt[1]}`} className="w-full h-full" allowFullScreen />
                </div>
              ) : null
            })()}
            <p className="text-white text-base font-medium mb-4">{q.question}</p>
            {q.type === 'qcm' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => setReponses(r => ({ ...r, [q.id]: opt }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${reponses[q.id] === opt ? 'bg-gold-500/10 border-gold-500/40 text-gold-400' : 'border-noir-700 text-noir-300 hover:border-noir-600 hover:text-white'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {q.type === 'vrai_faux' && (
              <div className="flex gap-3">
                {['Vrai', 'Faux'].map(v => (
                  <button key={v} onClick={() => setReponses(r => ({ ...r, [q.id]: v }))}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${reponses[q.id] === v ? 'bg-gold-500/10 border-gold-500/40 text-gold-400' : 'border-noir-700 text-noir-300 hover:border-noir-600'}`}>
                    {v}
                  </button>
                ))}
              </div>
            )}
            {(q.type === 'reponse_courte' || q.type === 'reponse_libre' || q.type === 'audio' || q.type === 'image' || q.type === 'video') && (
              <input value={reponses[q.id] || ''} onChange={e => setReponses(r => ({ ...r, [q.id]: e.target.value }))}
                className="input w-full mt-2" placeholder="Votre réponse..." />
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentQ > 0 && <button onClick={() => setCurrentQ(i => i - 1)} className="btn-outline flex-1">Précédent</button>}
            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(i => i + 1)} className="btn-gold flex-1">Suivant →</button>
            ) : (
              <button onClick={() => submitExamen(reponses)} disabled={submitting} className="btn-gold flex-1">
                {submitting ? 'Envoi...' : "Terminer l'examen"}
              </button>
            )}
          </div>
          <p className="text-noir-600 text-xs text-center mt-3">L'examen sera automatiquement soumis à la fin du temps imparti</p>
        </div>
      </EleveLayout>
    )
  }

  // ── Liste des examens ─────────────────────────────────────────────────────────
  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-white">Mes examens</h1>
          <p className="text-noir-400 text-sm mt-1">Examens finaux de validation des compétences</p>
        </div>

        {examens.length === 0 ? (
          <div className="card text-center py-16">
            <svg width="40" height="40" fill="none" stroke="#404070" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p className="text-noir-400">Aucun examen programmé pour le moment</p>
            <p className="text-noir-600 text-sm mt-1">Votre professeur vous informera quand un examen sera disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {examens.map(ex => {
              const now = new Date()
              const dateEx = new Date(ex.date_examen)
              const isAvailable = now >= dateEx  // dateEx est en UTC, now aussi → comparaison correcte
              const tentativesRestantes = ex.nb_tentatives - ex.tentatives_utilisees
              const derniereSession = ex.derniere_session
              const med = derniereSession?.niveau_medaille ? MEDAILLE[derniereSession.niveau_medaille as keyof typeof MEDAILLE] : null

              return (
                <div key={ex.id} className={`card transition-all ${isAvailable && tentativesRestantes > 0 ? 'border-gold-500/20' : ''}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold mb-1">{ex.titre}</h3>
                      <p className="text-gold-400 text-xs font-medium mb-2">{ex.categorie}</p>
                      <div className="flex items-center gap-3 text-xs text-noir-400 flex-wrap">
                        <span>{DateTime.fromISO(ex.date_examen, { zone: 'utc' }).setZone('local').setLocale('fr').toFormat("d MMM yyyy 'à' HH'h'mm")}</span>
                        <span>{ex.duree_minutes} min</span>
                        <span>Score min : {ex.score_min}%</span>
                      </div>

                      {/* Résultat précédent */}
                      {derniereSession && (
                        <div className={`mt-3 flex items-center gap-2 text-xs ${derniereSession.reussi ? 'text-green-400' : 'text-red-400'}`}>
                          {derniereSession.reussi
                            ? <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          }
                          Dernière tentative : {Math.round(derniereSession.score)}%
                          {med && <span className={`font-bold ${med.color}`}>{med.icon} {med.label}</span>}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {!isAvailable ? (
                        <div className="text-center">
                          <div className="bg-noir-800 border border-noir-700 rounded-xl px-4 py-3 text-center">
                            <p className="text-noir-400 text-xs mb-1">Disponible dans</p>
                            <p className="text-white font-mono text-sm font-bold">
                              {(() => {
                                const diff = DateTime.fromISO(ex.date_examen, { zone: 'utc' }).diff(DateTime.now(), ['days', 'hours', 'minutes'])
                                const d = Math.floor(diff.days || 0)
                                const h = Math.floor(diff.hours || 0)
                                const m = Math.floor(diff.minutes || 0)
                                if (d > 0) return `${d}j ${h}h ${m}min`
                                if (h > 0) return `${h}h ${m}min`
                                return `${m}min`
                              })()}
                            </p>
                          </div>
                        </div>
                      ) : tentativesRestantes <= 0 ? (
                        <span className="text-xs text-noir-500 border border-noir-700 px-3 py-2 rounded-xl block text-center">
                          Tentatives épuisées
                        </span>
                      ) : (
                        <button onClick={() => startExamen(ex)} className="btn-gold text-sm px-5 py-2.5">
                          {derniereSession ? 'Nouvelle tentative' : "Commencer l'examen"}
                        </button>
                      )}
                      {tentativesRestantes > 0 && tentativesRestantes < ex.nb_tentatives && isAvailable && (
                        <p className="text-noir-600 text-xs text-center mt-1">{tentativesRestantes} tentative{tentativesRestantes > 1 ? 's' : ''} restante{tentativesRestantes > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
