'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Volume2 } from 'lucide-react'

interface Quiz {
  id: string; titre: string; description: string | null; niveau: string
  score_min: number; statut: string; created_at: string
  quiz_questions?: { count: number }[]
}
interface Question {
  id: string; type: string; question: string; options: string[] | null
  bonne_reponse: string | null; explication: string | null; audio_url: string | null
  image_url: string | null; points: number; position: number
}

const NIVEAUX = ['fondamentaux', 'comprehension', 'expression', 'tous']
const TYPES_Q = [
  { value: 'qcm', label: 'QCM (choix multiple)' },
  { value: 'vrai_faux', label: 'Vrai / Faux' },
  { value: 'reponse_courte', label: 'Réponse courte' },
  { value: 'reponse_libre', label: 'Réponse libre' },
  { value: 'audio', label: 'Question audio' },
]

const EMPTY_QUIZ = { titre: '', description: '', niveau: 'fondamentaux', score_min: 70, statut: 'brouillon' }
const EMPTY_Q = { type: 'qcm', question: '', options: ['', '', '', ''], bonne_reponse: '', explication: '', audio_url: '', points: 1 }

export default function AdminQuizPage() {
  const [quiz, setQuiz] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null)
  const [quizForm, setQuizForm] = useState({ ...EMPTY_QUIZ })
  const [saving, setSaving] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showQForm, setShowQForm] = useState(false)
  const [editQ, setEditQ] = useState<Question | null>(null)
  const [qForm, setQForm] = useState({ ...EMPTY_Q })

  useEffect(() => { loadQuiz() }, [])

  async function loadQuiz() {
    setLoading(true)
    const data = await fetch('/api/admin/quiz').then(r => r.json())
    setQuiz(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function loadQuestions(quizId: string) {
    const data = await fetch(`/api/admin/quiz?id=${quizId}`).then(r => r.json())
    setQuestions(data.questions || [])
  }

  async function handleSaveQuiz(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (editQuiz) {
      await fetch('/api/admin/quiz', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editQuiz.id, ...quizForm }) })
    } else {
      await fetch('/api/admin/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quizForm) })
    }
    await loadQuiz(); setShowQuizForm(false); setEditQuiz(null); setQuizForm({ ...EMPTY_QUIZ }); setSaving(false)
  }

  async function handleDeleteQuiz(id: string) {
    if (!confirm('Supprimer ce quiz et toutes ses questions ?')) return
    await fetch('/api/admin/quiz', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setQuiz(prev => prev.filter(q => q.id !== id))
    if (selectedQuiz === id) setSelectedQuiz(null)
  }

  async function togglePublish(q: Quiz) {
    const newStatut = q.statut === 'publie' ? 'brouillon' : 'publie'
    await fetch('/api/admin/quiz', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: q.id, statut: newStatut }) })
    setQuiz(prev => prev.map(x => x.id === q.id ? { ...x, statut: newStatut } : x))
  }

  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = {
      ...qForm,
      quiz_id: selectedQuiz,
      options: qForm.type === 'qcm' ? qForm.options.filter(Boolean) : null,
      position: questions.length,
    }
    if (editQ) {
      await fetch('/api/admin/quiz/questions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editQ.id, ...payload }) })
    } else {
      await fetch('/api/admin/quiz/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    if (selectedQuiz) await loadQuestions(selectedQuiz)
    setShowQForm(false); setEditQ(null); setQForm({ ...EMPTY_Q }); setSaving(false)
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('Supprimer cette question ?')) return
    await fetch('/api/admin/quiz/questions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const nbQ = (q: Quiz) => q.quiz_questions?.[0]?.count || 0

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Quiz pédagogiques</h1>
          <p className="text-noir-400 text-sm mt-1">Créez des quiz pour évaluer la progression des élèves</p>
        </div>
        <button onClick={() => { setShowQuizForm(true); setEditQuiz(null); setQuizForm({ ...EMPTY_QUIZ }) }} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Nouveau quiz
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-3"><p className="text-2xl font-bold text-gold-400">{quiz.length}</p><p className="text-xs text-noir-400">Quiz créés</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-green-400">{quiz.filter(q => q.statut === 'publie').length}</p><p className="text-xs text-noir-400">Publiés</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-blue-400">{quiz.reduce((s, q) => s + nbQ(q), 0)}</p><p className="text-xs text-noir-400">Questions</p></div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : quiz.length === 0 ? (
        <div className="card text-center py-16"><p className="text-noir-400 text-lg">Aucun quiz créé</p></div>
      ) : (
        <div className="space-y-3">
          {quiz.map(q => (
            <div key={q.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold">{q.titre}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${q.statut === 'publie' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-noir-500 border-noir-700'}`}>
                      {q.statut === 'publie' ? 'Publié' : 'Brouillon'}
                    </span>
                    <span className="text-xs text-noir-500 bg-noir-800 px-2 py-0.5 rounded-full capitalize">{q.niveau}</span>
                  </div>
                  <p className="text-noir-500 text-xs mt-1">{nbQ(q)} question{nbQ(q) > 1 ? 's' : ''} · Score min : {q.score_min}%</p>
                  {q.description && <p className="text-noir-400 text-xs mt-1 line-clamp-1">{q.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => togglePublish(q)} title={q.statut === 'publie' ? 'Dépublier' : 'Publier'}
                    className={`p-1.5 rounded transition-colors ${q.statut === 'publie' ? 'text-green-400 hover:text-noir-400' : 'text-noir-500 hover:text-green-400'}`}>
                    {q.statut === 'publie' ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => { setEditQuiz(q); setQuizForm({ titre: q.titre, description: q.description || '', niveau: q.niveau, score_min: q.score_min, statut: q.statut }); setShowQuizForm(true) }}
                    className="text-noir-500 hover:text-gold-400 p-1.5 rounded transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDeleteQuiz(q.id)} className="text-noir-500 hover:text-red-400 p-1.5 rounded transition-colors"><Trash2 size={14} /></button>
                  <button onClick={() => {
                    if (selectedQuiz === q.id) { setSelectedQuiz(null) } else { setSelectedQuiz(q.id); loadQuestions(q.id) }
                  }} className="text-noir-500 hover:text-gold-400 p-1.5 rounded transition-colors">
                    {selectedQuiz === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Questions du quiz */}
              {selectedQuiz === q.id && (
                <div className="mt-4 border-t border-noir-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gold-400 text-xs font-bold uppercase tracking-wider">Questions ({questions.length})</p>
                    <button onClick={() => { setShowQForm(true); setEditQ(null); setQForm({ ...EMPTY_Q }) }} className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1">
                      <Plus size={12} /> Ajouter
                    </button>
                  </div>
                  {questions.length === 0 ? (
                    <p className="text-noir-600 text-sm text-center py-4">Aucune question. Ajoutez-en une !</p>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((question, i) => (
                        <div key={question.id} className="bg-noir-800/60 rounded-xl p-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-noir-600 font-mono">{i + 1}.</span>
                              <span className="text-xs bg-noir-700 text-noir-400 px-1.5 py-0.5 rounded">{TYPES_Q.find(t => t.value === question.type)?.label || question.type}</span>
                              {question.audio_url && <Volume2 size={12} className="text-blue-400" />}
                              <span className="text-xs text-noir-600">{question.points} pt{question.points > 1 ? 's' : ''}</span>
                            </div>
                            <p className="text-white text-sm">{question.question}</p>
                            {question.options && <p className="text-noir-500 text-xs mt-1">{question.options.join(' · ')}</p>}
                            {question.bonne_reponse && <p className="text-green-400 text-xs mt-0.5">✓ {question.bonne_reponse}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditQ(question); setQForm({ type: question.type, question: question.question, options: question.options || ['', '', '', ''], bonne_reponse: question.bonne_reponse || '', explication: question.explication || '', audio_url: question.audio_url || '', points: question.points }); setShowQForm(true) }}
                              className="text-noir-500 hover:text-gold-400 p-1 rounded transition-colors"><Pencil size={12} /></button>
                            <button onClick={() => handleDeleteQuestion(question.id)} className="text-noir-500 hover:text-red-400 p-1 rounded transition-colors"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modale Quiz */}
      {showQuizForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'480px'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">{editQuiz ? 'Modifier le quiz' : 'Nouveau quiz'}</h2>
              <button onClick={() => setShowQuizForm(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSaveQuiz} id="quiz-form" className="space-y-4">
                <div><label className="label mb-1 block">Titre *</label><input value={quizForm.titre} onChange={e => setQuizForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Ex: Quiz - Accords majeurs" /></div>
                <div><label className="label mb-1 block">Description</label><textarea value={quizForm.description} onChange={e => setQuizForm(f => ({ ...f, description: e.target.value }))} className="input w-full h-16 resize-none" /></div>
                <div><label className="label mb-1 block">Niveau</label>
                  <select value={quizForm.niveau} onChange={e => setQuizForm(f => ({ ...f, niveau: e.target.value }))} className="input w-full">
                    {NIVEAUX.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
                  </select>
                </div>
                <div><label className="label mb-1 block">Score minimum de réussite : {quizForm.score_min}%</label>
                  <input type="range" min="50" max="100" step="5" value={quizForm.score_min} onChange={e => setQuizForm(f => ({ ...f, score_min: parseInt(e.target.value) }))} className="w-full" />
                </div>
                <div><label className="label mb-2 block">Statut</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['brouillon', 'publie'].map(s => (
                      <button key={s} type="button" onClick={() => setQuizForm(f => ({ ...f, statut: s }))}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all capitalize ${quizForm.statut === s ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
                        {s === 'publie' ? 'Publié' : 'Brouillon'}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => setShowQuizForm(false)} className="btn-outline flex-1">Annuler</button>
              <button type="submit" form="quiz-form" disabled={saving} className="btn-gold flex-1">{saving ? 'Enregistrement...' : editQuiz ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Question */}
      {showQForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'520px'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">{editQ ? 'Modifier la question' : 'Nouvelle question'}</h2>
              <button onClick={() => setShowQForm(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSaveQuestion} id="q-form" className="space-y-4">
                <div><label className="label mb-1 block">Type de question</label>
                  <select value={qForm.type} onChange={e => setQForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                    {TYPES_Q.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div><label className="label mb-1 block">Question *</label><textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} className="input w-full h-20 resize-none" required placeholder="Posez votre question..." /></div>

                {qForm.type === 'audio' && (
                  <div><label className="label mb-1 block">URL Audio</label><input value={qForm.audio_url} onChange={e => setQForm(f => ({ ...f, audio_url: e.target.value }))} className="input w-full" placeholder="https://..." /></div>
                )}

                {qForm.type === 'qcm' && (
                  <div>
                    <label className="label mb-2 block">Options de réponse</label>
                    {qForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-noir-600 w-4">{String.fromCharCode(65 + i)}.</span>
                        <input value={opt} onChange={e => { const opts = [...qForm.options]; opts[i] = e.target.value; setQForm(f => ({ ...f, options: opts })) }} className="input flex-1" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                      </div>
                    ))}
                  </div>
                )}

                {qForm.type === 'vrai_faux' && (
                  <div><label className="label mb-2 block">Bonne réponse</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Vrai', 'Faux'].map(v => (
                        <button key={v} type="button" onClick={() => setQForm(f => ({ ...f, bonne_reponse: v }))}
                          className={`py-2 rounded-xl border text-sm font-medium transition-all ${qForm.bonne_reponse === v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                )}

                {qForm.type !== 'vrai_faux' && (
                  <div><label className="label mb-1 block">Bonne réponse *</label><input value={qForm.bonne_reponse} onChange={e => setQForm(f => ({ ...f, bonne_reponse: e.target.value }))} className="input w-full" placeholder={qForm.type === 'qcm' ? 'Ex: A ou texte exact de l\'option' : 'Réponse correcte'} /></div>
                )}

                <div><label className="label mb-1 block">Explication (après réponse)</label><textarea value={qForm.explication} onChange={e => setQForm(f => ({ ...f, explication: e.target.value }))} className="input w-full h-16 resize-none" placeholder="Explication affichée après la réponse..." /></div>
                <div><label className="label mb-1 block">Points : {qForm.points}</label><input type="range" min="1" max="5" value={qForm.points} onChange={e => setQForm(f => ({ ...f, points: parseInt(e.target.value) }))} className="w-full" /></div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => setShowQForm(false)} className="btn-outline flex-1">Annuler</button>
              <button type="submit" form="q-form" disabled={saving} className="btn-gold flex-1">{saving ? 'Enregistrement...' : editQ ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}