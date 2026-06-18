'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Volume2, Copy, GripVertical, Image, Video, Music } from 'lucide-react'

interface Quiz {
  id: string
  titre: string
  description: string | null
  niveau: string
  score_min: number
  statut: string
  duree_minutes?: number
  created_at: string
  quiz_questions?: { count: number }[]
}

interface Question {
  id: string
  type: string
  type_reponse?: string
  question: string
  options: string[] | null
  bonne_reponse: string | null
  explication: string | null
  audio_url: string | null
  image_url: string | null
  video_url: string | null
  points: number
  position: number
  statut?: string
}

const NIVEAUX = ['fondamentaux', 'comprehension', 'expression', 'tous']
const TYPES_Q = [
  { value: 'qcm', label: 'QCM — une bonne réponse' },
  { value: 'qcm_multiple', label: 'QCM — plusieurs bonnes réponses' },
  { value: 'vrai_faux', label: 'Vrai / Faux' },
  { value: 'reponse_courte', label: 'Réponse courte' },
  { value: 'reponse_libre', label: 'Réponse libre' },
  { value: 'audio', label: 'Question audio' },
  { value: 'image', label: 'Question avec image' },
  { value: 'video', label: 'Question avec vidéo' },
]

const EMPTY_QUIZ = { titre: '', description: '', niveau: 'fondamentaux', score_min: 70, statut: 'brouillon', duree_minutes: 0 }
const EMPTY_Q = { type: 'qcm', type_reponse: 'unique', question: '', options: ['', '', '', ''], bonne_reponse: '', explication: '', audio_url: '', image_url: '', video_url: '', points: 1, statut: 'publie' }

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
  const [qForm, setQForm] = useState<typeof EMPTY_Q>({ ...EMPTY_Q })
  const [filterNiveau, setFilterNiveau] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => { loadQuiz() }, [])

  async function loadQuiz() {
    setLoading(true)
    const data = await fetch('/api/admin/quiz').then(r => r.json())
    setQuiz(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function loadQuestions(quizId: string) {
    const data = await fetch(`/api/admin/quiz?id=${quizId}`).then(r => r.json())
    setQuestions((data.questions || []).sort((a: Question, b: Question) => a.position - b.position))
  }

  function showMsg(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleSaveQuiz(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editQuiz) {
        const res = await fetch('/api/admin/quiz', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editQuiz.id, ...quizForm }) })
        if (!res.ok) throw new Error('Erreur modification')
        showMsg('ok', 'Quiz modifié avec succès')
      } else {
        const res = await fetch('/api/admin/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quizForm) })
        if (!res.ok) throw new Error('Erreur création')
        showMsg('ok', 'Quiz créé avec succès')
      }
      await loadQuiz()
      setShowQuizForm(false)
      setEditQuiz(null)
      setQuizForm({ ...EMPTY_QUIZ })
    } catch (err: any) {
      showMsg('err', err.message || 'Erreur')
    }
    setSaving(false)
  }

  async function handleDeleteQuiz(id: string) {
    if (!confirm('Supprimer ce quiz et toutes ses questions ?')) return
    await fetch('/api/admin/quiz', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setQuiz(prev => prev.filter(q => q.id !== id))
    if (selectedQuiz === id) setSelectedQuiz(null)
    showMsg('ok', 'Quiz supprimé')
  }

  async function handleDuplicateQuiz(q: Quiz) {
    const res = await fetch('/api/admin/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titre: `${q.titre} (copie)`, description: q.description, niveau: q.niveau, score_min: q.score_min, statut: 'brouillon', duree_minutes: q.duree_minutes || 0 })
    })
    if (res.ok) { await loadQuiz(); showMsg('ok', 'Quiz dupliqué') }
  }

  async function togglePublish(q: Quiz) {
    const newStatut = q.statut === 'publie' ? 'brouillon' : 'publie'
    await fetch('/api/admin/quiz', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: q.id, statut: newStatut }) })
    setQuiz(prev => prev.map(x => x.id === q.id ? { ...x, statut: newStatut } : x))
  }

  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...qForm,
        quiz_id: selectedQuiz,
        options: ['qcm', 'qcm_multiple'].includes(qForm.type) ? qForm.options.filter(Boolean) : null,
        image_url: qForm.image_url || null,
        video_url: qForm.video_url || null,
        audio_url: qForm.audio_url || null,
        position: editQ ? editQ.position : questions.length,
      }
      if (editQ) {
        const res = await fetch('/api/admin/quiz/questions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editQ.id, ...payload }) })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erreur modification') }
        showMsg('ok', 'Question modifiée')
      } else {
        const res = await fetch('/api/admin/quiz/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erreur création') }
        showMsg('ok', 'Question ajoutée')
      }
      if (selectedQuiz) { await loadQuestions(selectedQuiz); await loadQuiz() }
      setShowQForm(false)
      setEditQ(null)
      setQForm({ ...EMPTY_Q })
    } catch (err: any) {
      showMsg('err', err.message || 'Erreur')
    }
    setSaving(false)
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('Supprimer cette question ?')) return
    await fetch('/api/admin/quiz/questions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setQuestions(prev => prev.filter(q => q.id !== id))
    if (selectedQuiz) loadQuiz()
    showMsg('ok', 'Question supprimée')
  }

  async function handleDuplicateQuestion(q: Question) {
    const payload = { ...q, id: undefined, position: questions.length, quiz_id: selectedQuiz }
    const res = await fetch('/api/admin/quiz/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) { if (selectedQuiz) { await loadQuestions(selectedQuiz); await loadQuiz() }; showMsg('ok', 'Question dupliquée') }
  }

  async function moveQuestion(q: Question, dir: 'up' | 'down') {
    const idx = questions.findIndex(x => x.id === q.id)
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= questions.length) return
    const other = questions[newIdx]
    await Promise.all([
      fetch('/api/admin/quiz/questions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: q.id, position: other.position }) }),
      fetch('/api/admin/quiz/questions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: other.id, position: q.position }) }),
    ])
    if (selectedQuiz) loadQuestions(selectedQuiz)
  }

  const nbQ = (q: Quiz) => q.quiz_questions?.[0]?.count || 0

  const filteredQuiz = quiz.filter(q => {
    const niveauOk = filterNiveau === 'tous' || q.niveau === filterNiveau
    const searchOk = !searchTerm || q.titre.toLowerCase().includes(searchTerm.toLowerCase())
    return niveauOk && searchOk
  })

  const niveauOrder: Record<string, number> = { fondamentaux: 0, comprehension: 1, expression: 2 }
  const sortedQuiz = [...filteredQuiz].sort((a, b) => (niveauOrder[a.niveau] ?? 9) - (niveauOrder[b.niveau] ?? 9))

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* Message flash */}
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'ok' ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'bg-red-500/20 border border-red-500/40 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Gestionnaire de quiz</h1>
          <p className="text-noir-400 text-sm mt-1">{quiz.length} quiz · {quiz.reduce((s, q) => s + nbQ(q), 0)} questions au total</p>
        </div>
        <button onClick={() => { setShowQuizForm(true); setEditQuiz(null); setQuizForm({ ...EMPTY_QUIZ }) }} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Nouveau quiz
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card text-center py-3"><p className="text-2xl font-bold text-gold-400">{quiz.length}</p><p className="text-xs text-noir-400">Quiz créés</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-green-400">{quiz.filter(q => q.statut === 'publie').length}</p><p className="text-xs text-noir-400">Publiés</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-blue-400">{quiz.reduce((s, q) => s + nbQ(q), 0)}</p><p className="text-xs text-noir-400">Questions</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-purple-400">{quiz.filter(q => q.niveau === 'fondamentaux').length}</p><p className="text-xs text-noir-400">Fondamentaux</p></div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input flex-1 min-w-48" placeholder="Rechercher un quiz..." />
        <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)} className="input w-48">
          <option value="tous">Tous les niveaux</option>
          {NIVEAUX.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : sortedQuiz.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-noir-400 text-lg">Aucun quiz trouvé</p>
          <button onClick={() => { setShowQuizForm(true); setEditQuiz(null); setQuizForm({ ...EMPTY_QUIZ }) }} className="btn-gold mt-4">Créer le premier quiz</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQuiz.map(q => (
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
                  <p className="text-noir-500 text-xs mt-1">
                    {nbQ(q)} question{nbQ(q) > 1 ? 's' : ''} · Score min : {q.score_min}%
                    {q.duree_minutes ? ` · ${q.duree_minutes} min` : ''}
                  </p>
                  {q.description && <p className="text-noir-400 text-xs mt-1 line-clamp-1">{q.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  <button onClick={() => togglePublish(q)} title={q.statut === 'publie' ? 'Dépublier' : 'Publier'}
                    className={`p-1.5 rounded transition-colors ${q.statut === 'publie' ? 'text-green-400 hover:text-noir-400' : 'text-noir-500 hover:text-green-400'}`}>
                    {q.statut === 'publie' ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => handleDuplicateQuiz(q)} title="Dupliquer" className="text-noir-500 hover:text-blue-400 p-1.5 rounded transition-colors"><Copy size={14} /></button>
                  <button onClick={() => { setEditQuiz(q); setQuizForm({ titre: q.titre, description: q.description || '', niveau: q.niveau, score_min: q.score_min, statut: q.statut, duree_minutes: q.duree_minutes || 0 }); setShowQuizForm(true) }}
                    className="text-noir-500 hover:text-gold-400 p-1.5 rounded transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDeleteQuiz(q.id)} className="text-noir-500 hover:text-red-400 p-1.5 rounded transition-colors"><Trash2 size={14} /></button>
                  <button onClick={() => {
                    if (selectedQuiz === q.id) { setSelectedQuiz(null) }
                    else { setSelectedQuiz(q.id); loadQuestions(q.id) }
                  }} className="text-noir-500 hover:text-gold-400 p-1.5 rounded transition-colors">
                    {selectedQuiz === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Questions du quiz */}
              {selectedQuiz === q.id && (
                <div className="mt-4 border-t border-noir-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gold-400 text-xs font-bold uppercase tracking-wider">
                      Questions ({questions.length})
                    </p>
                    <button onClick={() => { setShowQForm(true); setEditQ(null); setQForm({ ...EMPTY_Q }) }}
                      className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1">
                      <Plus size={12} /> Ajouter une question
                    </button>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-noir-600 text-sm mb-3">Aucune question. Commencez par en ajouter une !</p>
                      <button onClick={() => { setShowQForm(true); setEditQ(null); setQForm({ ...EMPTY_Q }) }}
                        className="btn-gold text-xs px-4 py-2">
                        + Ajouter la première question
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((question, i) => (
                        <div key={question.id} className="bg-noir-800/60 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                                <button onClick={() => moveQuestion(question, 'up')} disabled={i === 0}
                                  className="text-noir-600 hover:text-white disabled:opacity-20 p-0.5">
                                  <ChevronUp size={12} />
                                </button>
                                <button onClick={() => moveQuestion(question, 'down')} disabled={i === questions.length - 1}
                                  className="text-noir-600 hover:text-white disabled:opacity-20 p-0.5">
                                  <ChevronDown size={12} />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs text-noir-600 font-mono">{i + 1}.</span>
                                  <span className="text-xs bg-noir-700 text-noir-400 px-1.5 py-0.5 rounded">
                                    {TYPES_Q.find(t => t.value === question.type)?.label || question.type}
                                  </span>
                                  {question.audio_url && <Music size={11} className="text-blue-400" />}
                                  {question.image_url && <Image size={11} className="text-purple-400" />}
                                  {question.video_url && <Video size={11} className="text-green-400" />}
                                  <span className="text-xs text-noir-600">{question.points} pt{question.points > 1 ? 's' : ''}</span>
                                  {question.statut === 'brouillon' && <span className="text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">Brouillon</span>}
                                </div>
                                <p className="text-white text-sm line-clamp-2">{question.question}</p>
                                {question.options && (
                                  <p className="text-noir-500 text-xs mt-0.5 line-clamp-1">{question.options.join(' · ')}</p>
                                )}
                                {question.bonne_reponse && (
                                  <p className="text-green-400 text-xs mt-0.5">✓ {question.bonne_reponse}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => handleDuplicateQuestion(question)} title="Dupliquer"
                                className="text-noir-500 hover:text-blue-400 p-1 rounded transition-colors"><Copy size={12} /></button>
                              <button onClick={() => {
                                setEditQ(question)
                                setQForm({
                                  type: question.type, type_reponse: question.type_reponse || 'unique',
                                  question: question.question, options: question.options || ['', '', '', ''],
                                  bonne_reponse: question.bonne_reponse || '', explication: question.explication || '',
                                  audio_url: question.audio_url || '', image_url: question.image_url || '',
                                  video_url: question.video_url || '', points: question.points, statut: question.statut || 'publie'
                                })
                                setShowQForm(true)
                              }} className="text-noir-500 hover:text-gold-400 p-1 rounded transition-colors"><Pencil size={12} /></button>
                              <button onClick={() => handleDeleteQuestion(question.id)}
                                className="text-noir-500 hover:text-red-400 p-1 rounded transition-colors"><Trash2 size={12} /></button>
                            </div>
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

      {/* ── Modale Quiz ── */}
      {showQuizForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'520px'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">{editQuiz ? 'Modifier le quiz' : 'Nouveau quiz'}</h2>
              <button onClick={() => { setShowQuizForm(false); setEditQuiz(null) }} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSaveQuiz} id="quiz-form" className="space-y-4">
                <div>
                  <label className="label mb-1 block">Titre *</label>
                  <input value={quizForm.titre} onChange={e => setQuizForm(f => ({ ...f, titre: e.target.value }))}
                    className="input w-full" required placeholder="Ex: Les accords majeurs" />
                </div>
                <div>
                  <label className="label mb-1 block">Description</label>
                  <textarea value={quizForm.description} onChange={e => setQuizForm(f => ({ ...f, description: e.target.value }))}
                    className="input w-full h-16 resize-none" placeholder="Description du quiz..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label mb-1 block">Niveau</label>
                    <select value={quizForm.niveau} onChange={e => setQuizForm(f => ({ ...f, niveau: e.target.value }))} className="input w-full">
                      {NIVEAUX.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label mb-1 block">Durée (min, 0 = illimitée)</label>
                    <input type="number" min="0" value={quizForm.duree_minutes}
                      onChange={e => setQuizForm(f => ({ ...f, duree_minutes: parseInt(e.target.value) || 0 }))}
                      className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="label mb-1 block">Score minimum de réussite : {quizForm.score_min}%</label>
                  <input type="range" min="50" max="100" step="5" value={quizForm.score_min}
                    onChange={e => setQuizForm(f => ({ ...f, score_min: parseInt(e.target.value) }))} className="w-full" />
                  <div className="flex justify-between text-xs text-noir-600 mt-1"><span>50%</span><span>75%</span><span>100%</span></div>
                </div>
                <div>
                  <label className="label mb-2 block">Statut</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 'brouillon', l: 'Brouillon' }, { v: 'publie', l: 'Publié' }].map(s => (
                      <button key={s.v} type="button" onClick={() => setQuizForm(f => ({ ...f, statut: s.v }))}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all ${quizForm.statut === s.v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => { setShowQuizForm(false); setEditQuiz(null) }} className="btn-outline flex-1">Annuler</button>
              <button type="submit" form="quiz-form" disabled={saving} className="btn-gold flex-1">
                {saving ? 'Enregistrement...' : editQuiz ? 'Enregistrer' : 'Créer le quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Question ── */}
      {showQForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'560px'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">{editQ ? 'Modifier la question' : 'Nouvelle question'}</h2>
              <button onClick={() => { setShowQForm(false); setEditQ(null); setQForm({ ...EMPTY_Q }) }} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSaveQuestion} id="q-form" className="space-y-4">
                {/* Type */}
                <div>
                  <label className="label mb-1 block">Type de question</label>
                  <select value={qForm.type} onChange={e => setQForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                    {TYPES_Q.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {/* Question */}
                <div>
                  <label className="label mb-1 block">Question *</label>
                  <textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))}
                    className="input w-full h-20 resize-none" required placeholder="Posez votre question..." />
                </div>

                {/* Médias selon le type */}
                {(qForm.type === 'audio') && (
                  <div>
                    <label className="label mb-1 block">URL Audio *</label>
                    <input value={qForm.audio_url} onChange={e => setQForm(f => ({ ...f, audio_url: e.target.value }))}
                      className="input w-full" placeholder="https://... (mp3, wav, ogg)" />
                    {qForm.audio_url && (
                      <audio controls className="w-full mt-2 h-8" src={qForm.audio_url} />
                    )}
                  </div>
                )}

                {(qForm.type === 'image') && (
                  <div>
                    <label className="label mb-1 block">URL Image *</label>
                    <input value={qForm.image_url} onChange={e => setQForm(f => ({ ...f, image_url: e.target.value }))}
                      className="input w-full" placeholder="https://... (jpg, png, webp)" />
                    {qForm.image_url && (
                      <img src={qForm.image_url} alt="Aperçu" className="w-full h-32 object-cover rounded-xl mt-2" />
                    )}
                  </div>
                )}

                {(qForm.type === 'video') && (
                  <div>
                    <label className="label mb-1 block">URL Vidéo *</label>
                    <input value={qForm.video_url} onChange={e => setQForm(f => ({ ...f, video_url: e.target.value }))}
                      className="input w-full" placeholder="https://youtube.com/... ou lien direct" />
                  </div>
                )}

                {/* Ajout optionnel de médias pour QCM/VF */}
                {!['audio', 'image', 'video'].includes(qForm.type) && (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="label mb-1 block">Image (optionnel)</label>
                      <input value={qForm.image_url} onChange={e => setQForm(f => ({ ...f, image_url: e.target.value }))}
                        className="input w-full" placeholder="URL image pour illustrer la question" />
                    </div>
                    <div>
                      <label className="label mb-1 block">Audio (optionnel)</label>
                      <input value={qForm.audio_url} onChange={e => setQForm(f => ({ ...f, audio_url: e.target.value }))}
                        className="input w-full" placeholder="URL audio pour illustrer la question" />
                    </div>
                  </div>
                )}

                {/* Options QCM */}
                {['qcm', 'qcm_multiple'].includes(qForm.type) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label">Options de réponse</label>
                      <button type="button" onClick={() => setQForm(f => ({ ...f, options: [...f.options, ''] }))}
                        className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                        <Plus size={12} /> Ajouter une option
                      </button>
                    </div>
                    {qForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-noir-600 w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                        <input value={opt} onChange={e => { const opts = [...qForm.options]; opts[i] = e.target.value; setQForm(f => ({ ...f, options: opts })) }}
                          className="input flex-1" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                        {qForm.options.length > 2 && (
                          <button type="button" onClick={() => setQForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}
                            className="text-noir-600 hover:text-red-400 p-1"><Trash2 size={12} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Vrai/Faux */}
                {qForm.type === 'vrai_faux' && (
                  <div>
                    <label className="label mb-2 block">Bonne réponse</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Vrai', 'Faux'].map(v => (
                        <button key={v} type="button" onClick={() => setQForm(f => ({ ...f, bonne_reponse: v }))}
                          className={`py-2 rounded-xl border text-sm font-medium transition-all ${qForm.bonne_reponse === v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bonne réponse pour les autres types */}
                {qForm.type !== 'vrai_faux' && (
                  <div>
                    <label className="label mb-1 block">
                      {qForm.type === 'qcm_multiple' ? 'Bonnes réponses (séparées par |)' : 'Bonne réponse *'}
                    </label>
                    <input value={qForm.bonne_reponse} onChange={e => setQForm(f => ({ ...f, bonne_reponse: e.target.value }))}
                      className="input w-full"
                      placeholder={qForm.type === 'qcm' ? 'Texte exact de la bonne option' : qForm.type === 'qcm_multiple' ? 'Option A|Option B' : 'Réponse correcte'} />
                  </div>
                )}

                {/* Explication */}
                <div>
                  <label className="label mb-1 block">Explication (affichée après la réponse)</label>
                  <textarea value={qForm.explication} onChange={e => setQForm(f => ({ ...f, explication: e.target.value }))}
                    className="input w-full h-16 resize-none" placeholder="Explication pédagogique..." />
                </div>

                {/* Points et statut */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label mb-1 block">Points : {qForm.points}</label>
                    <input type="range" min="1" max="5" value={qForm.points}
                      onChange={e => setQForm(f => ({ ...f, points: parseInt(e.target.value) }))} className="w-full" />
                  </div>
                  <div>
                    <label className="label mb-2 block">Statut</label>
                    <div className="grid grid-cols-2 gap-1">
                      {[{ v: 'publie', l: 'Publiée' }, { v: 'brouillon', l: 'Brouillon' }].map(s => (
                        <button key={s.v} type="button" onClick={() => setQForm(f => ({ ...f, statut: s.v }))}
                          className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${qForm.statut === s.v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>
                          {s.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => { setShowQForm(false); setEditQ(null); setQForm({ ...EMPTY_Q }) }} className="btn-outline flex-1">Annuler</button>
              <button type="submit" form="q-form" disabled={saving} className="btn-gold flex-1">
                {saving ? 'Enregistrement...' : editQ ? 'Enregistrer' : 'Ajouter la question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}