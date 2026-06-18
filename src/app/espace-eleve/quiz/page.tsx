'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { CheckCircle, XCircle, Volume2, ChevronRight, RotateCcw, Trophy } from 'lucide-react'

// ── Sons du quiz générés via Web Audio API ──────────────────
function useQuizSounds() {
  const ctxRef = useRef<AudioContext | null>(null)

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return ctxRef.current
  }

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.3) => {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }, [])

  const playCorrect = useCallback(() => {
    playTone(523, 0.1, 'sine', 0.2)
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 80)
    setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 160)
  }, [playTone])

  const playSuccess = useCallback(() => {
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => setTimeout(() => playTone(freq, 0.3, 'sine', 0.35), i * 180))
    setTimeout(() => {
      playTone(784, 0.15, 'sine', 0.3)
      setTimeout(() => playTone(1047, 0.6, 'sine', 0.4), 150)
    }, notes.length * 180)
  }, [playTone])

  const playFailure = useCallback(() => {
    const notes = [392, 349, 330, 294]
    notes.forEach((freq, i) => setTimeout(() => playTone(freq, 0.35, 'triangle', 0.25), i * 200))
  }, [playTone])

  return { playCorrect, playSuccess, playFailure }
}

interface Quiz {
  id: string
  titre: string
  description: string | null
  niveau: string
  score_min: number
  statut: string
  quiz_questions?: { count: number }[]
  quiz_resultats?: { score: number; reussi: boolean; created_at: string }[]
}

interface Question {
  id: string
  type: string
  question: string
  options: string[] | null
  bonne_reponse: string | null
  explication: string | null
  audio_url: string | null
  points: number
  position: number
}

const NIVEAU_LABELS: Record<string, string> = {
  fondamentaux: 'Fondamentaux',
  comprehension: 'Compréhension',
  expression: 'Expression',
  tous: 'Tous niveaux',
}

export default function EleveQuizPage() {
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; questions: Question[] } | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; reussi: boolean; details: any[]; badge?: any } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('tous')
  const sounds = useQuizSounds()

  useEffect(() => {
    fetch('/api/eleve/me').then(r => {
      if (r.status === 401) { router.push('/espace-eleve/login'); return null }
      return r.json()
    }).then(me => {
      if (!me) return
      loadQuiz()
    }).catch(() => router.push('/espace-eleve/login'))
  }, [])

  async function loadQuiz() {
    setLoading(true)
    try {
      const data = await fetch('/api/eleve/quiz').then(r => r.json())
      setQuiz(Array.isArray(data) ? data : [])
    } catch { setQuiz([]) }
    setLoading(false)
  }

  async function startQuiz(q: Quiz) {
    try {
      const res = await fetch(`/api/eleve/quiz?id=${q.id}`)
      if (res.status === 401) { router.push('/espace-eleve/login'); return }
      const data = await res.json()
      if (data.error) { console.error('[startQuiz] error:', data.error); return }
      setActiveQuiz({ quiz: q, questions: data.questions || [] })
      setCurrentQ(0)
      setReponses({})
      setSubmitted(false)
      setResult(null)
    } catch (e) { console.error('startQuiz error:', e) }
  }

  

  function selectReponse(qId: string, val: string) {
    setReponses(prev => ({ ...prev, [qId]: val }))
    sounds.playCorrect()
  }

  const nbQ = (q: Quiz) => q.quiz_questions?.[0]?.count || 0
  const lastResult = (q: Quiz) => q.quiz_resultats?.[0]
  const filtered = filter === 'tous' ? quiz : quiz.filter(q => q.niveau === filter || q.niveau === 'tous')

  // ── Vue quiz actif ──
  if (activeQuiz && !submitted) {
    const questions = activeQuiz.questions

    if (!questions || questions.length === 0) {
      return (
        <EleveLayout>
          <div className="p-6 max-w-xl mx-auto text-center">
            <div className="card py-12">
              <p className="text-white font-serif text-xl mb-2">Quiz non disponible</p>
              <p className="text-noir-400 text-sm mb-6">Les questions de ce quiz ne sont pas encore disponibles.</p>
              <button onClick={() => setActiveQuiz(null)} className="btn-gold">Retour aux quiz</button>
            </div>
          </div>
        </EleveLayout>
      )
    }

    const q = questions[currentQ]
    if (!q) return null
    const progress = (currentQ / questions.length) * 100
    const answered = Object.keys(reponses).length

    return (
      <EleveLayout>
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActiveQuiz(null)} className="text-noir-400 hover:text-white text-sm flex items-center gap-1">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Quitter
            </button>
            <span className="text-noir-400 text-sm">{currentQ + 1} / {questions.length}</span>
          </div>

          <div className="h-1.5 bg-noir-800 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-gold-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <h2 className="text-white font-serif text-xl mb-4">{activeQuiz.quiz.titre}</h2>

          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full">{currentQ + 1}/{questions.length}</span>
              <span className="text-xs text-noir-500">{q.points} pt{q.points > 1 ? 's' : ''}</span>
            </div>

            {q.audio_url && (
              <div className="mb-4 bg-noir-800 rounded-xl p-3 flex items-center gap-3">
                <Volume2 size={18} className="text-gold-400 shrink-0" />
                <audio controls className="flex-1 h-8" src={q.audio_url} />
              </div>
            )}

            <p className="text-white text-base font-medium mb-4">{q.question}</p>

            {q.type === 'qcm' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => selectReponse(q.id, opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      reponses[q.id] === opt
                        ? 'bg-gold-500/10 border-gold-500/40 text-gold-400'
                        : 'border-noir-700 text-noir-300 hover:border-noir-600 hover:text-white'
                    }`}>
                    <span className="font-mono text-xs text-noir-600 mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'vrai_faux' && (
              <div className="grid grid-cols-2 gap-3">
                {['Vrai', 'Faux'].map(v => (
                  <button key={v} onClick={() => selectReponse(q.id, v)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      reponses[q.id] === v
                        ? 'bg-gold-500/10 border-gold-500/40 text-gold-400'
                        : 'border-noir-700 text-noir-300 hover:border-noir-600'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
            )}

            {(q.type === 'reponse_courte' || q.type === 'reponse_libre' || q.type === 'audio') && (
              <textarea
                value={reponses[q.id] || ''}
                onChange={e => selectReponse(q.id, e.target.value)}
                className="input w-full h-24 resize-none"
                placeholder="Votre réponse..."
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0}
              className="btn-outline disabled:opacity-30">Précédent</button>

            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(c => c + 1)} disabled={!reponses[q.id]}
                className="btn-gold flex items-center gap-2 disabled:opacity-50">
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={submitQuiz} disabled={submitting || answered < questions.length}
                className="btn-gold disabled:opacity-50">
                {submitting ? 'Correction...' : `Terminer (${answered}/${questions.length})`}
              </button>
            )}
          </div>
        </div>
      </EleveLayout>
    )
  }

  // ── Vue résultats ──
  if (submitted && result) {
    const pct = Math.round(result.score)
    const reussi = result.reussi
    return (
      <EleveLayout>
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          {/* Carte score */}
          <div className="card text-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              reussi ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'
            }`}>
              {reussi ? <Trophy size={36} className="text-green-400" /> : <XCircle size={36} className="text-red-400" />}
            </div>
            <h2 className="font-serif text-2xl text-white mb-2">{reussi ? 'Bravo !' : 'Continuez vos efforts'}</h2>
            <p className="text-5xl font-bold mb-2" style={{ color: reussi ? '#4ade80' : '#f87171' }}>{pct}%</p>
            <p className="text-noir-400 text-sm">Score minimum requis : {activeQuiz?.quiz.score_min}%</p>
            <p className={`text-sm font-medium mt-2 ${reussi ? 'text-green-400' : 'text-red-400'}`}>
              {reussi ? 'Quiz réussi !' : 'Quiz non réussi — réessayez !'}
            </p>
            {reussi && result.badge && (
              <div className="mt-4 bg-gold-500/10 border border-gold-500/30 rounded-xl px-4 py-3 inline-block">
                <p className="text-gold-400 font-bold text-sm">{result.badge.icone} Badge obtenu : {result.badge.nom}</p>
                <p className="text-noir-400 text-xs mt-0.5">{result.badge.description}</p>
              </div>
            )}
          </div>

          {/* Corrections détaillées */}
          <div className="space-y-3 mb-6">
            {result.details?.map((d: any, i: number) => (
              <div key={i} className={`card border ${d.correct ? 'border-green-500/20' : 'border-red-500/20'}`}>
                <div className="flex items-start gap-3">
                  {d.correct
                    ? <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                    : <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{d.question}</p>
                    <p className="text-noir-400 text-xs mt-1">
                      Votre réponse : <span className={d.correct ? 'text-green-400' : 'text-red-400'}>{d.reponse || '(sans réponse)'}</span>
                    </p>
                    {!d.correct && d.bonne_reponse && (
                      <p className="text-green-400 text-xs">Bonne réponse : {d.bonne_reponse}</p>
                    )}
                    {d.explication && (
                      <p className="text-noir-500 text-xs mt-1 italic">{d.explication}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button onClick={() => { setActiveQuiz(null); setResult(null); setSubmitted(false) }}
              className="btn-outline flex-1">Retour aux quiz</button>
            <button onClick={() => { setResult(null); setSubmitted(false); startQuiz(activeQuiz!.quiz) }}
              className="btn-gold flex-1 flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Recommencer
            </button>
          </div>
        </div>
      </EleveLayout>
    )
  }

  // ── Liste des quiz ──
  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-serif text-white">Quiz pédagogiques</h1>
          <p className="text-noir-400 text-sm mt-1">Testez vos connaissances et validez vos compétences</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['tous', 'fondamentaux', 'comprehension', 'expression'] as const).map(n => (
            <button key={n} onClick={() => setFilter(n)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === n
                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                  : 'border-noir-700 text-noir-400 hover:border-noir-600'
              }`}>
              {NIVEAU_LABELS[n] || 'Tous'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-noir-400 text-lg">Aucun quiz disponible pour le moment</p>
            <p className="text-noir-600 text-sm mt-2">Votre professeur ajoutera des quiz prochainement</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(q => {
              const last = lastResult(q)
              const nb = nbQ(q)
              return (
                <div key={q.id}
                  className="card hover:border-gold-500/30 transition-all cursor-pointer group"
                  onClick={() => startQuiz(q)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-white font-semibold group-hover:text-gold-400 transition-colors">{q.titre}</p>
                        <span className="text-xs bg-noir-800 text-noir-400 px-2 py-0.5 rounded-full capitalize">
                          {NIVEAU_LABELS[q.niveau] || q.niveau}
                        </span>
                      </div>
                      {q.description && (
                        <p className="text-noir-500 text-xs mb-2 line-clamp-2">{q.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-noir-500">
                        <span>{nb} question{nb > 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>Score min : {q.score_min}%</span>
                      </div>
                      {last && (
                        <div className={`mt-2 flex items-center gap-1.5 text-xs ${last.reussi ? 'text-green-400' : 'text-red-400'}`}>
                          {last.reussi ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          Dernier score : {Math.round(last.score)}%
                        </div>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-noir-600 group-hover:text-gold-400 transition-colors shrink-0 mt-1" />
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