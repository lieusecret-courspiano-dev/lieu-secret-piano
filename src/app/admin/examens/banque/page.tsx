'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronRight, Save } from 'lucide-react'

const CATEGORIES = ['Fondamentaux', 'Compréhension et autonomie', 'Expression et maîtrise']

const TYPES = [
  { value: 'qcm',           label: 'QCM — une bonne réponse' },
  { value: 'vrai_faux',     label: 'Vrai / Faux' },
  { value: 'reponse_courte',label: 'Réponse courte' },
  { value: 'audio',         label: 'Question audio' },
  { value: 'image',         label: 'Question avec image' },
  { value: 'video',         label: 'Question avec vidéo' },
]

interface BanqueQuestion {
  id?: string
  categorie: string
  type: string
  question: string
  options: string[]
  bonne_reponse: string
  explication: string
  audio_url: string
  image_url: string
  video_url: string
  points: number
  position: number
}

const EMPTY_Q: BanqueQuestion = {
  categorie: 'Fondamentaux', type: 'qcm', question: '',
  options: ['', '', '', ''], bonne_reponse: '', explication: '',
  audio_url: '', image_url: '', video_url: '', points: 1, position: 0,
}

export default function BanqueQuestionsPage() {
  const pathname = usePathname()
  const [questions, setQuestions]   = useState<BanqueQuestion[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState<{ type: 'ok'|'err'; text: string } | null>(null)
  const [openCat, setOpenCat]       = useState<string>(CATEGORIES[0])
  const [editQ, setEditQ]           = useState<BanqueQuestion | null>(null)
  const [editIdx, setEditIdx]       = useState<number | null>(null)
  const [isNew, setIsNew]           = useState(false)

  useEffect(() => { fetchQuestions() }, [])

  async function fetchQuestions() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/banque-questions')
      const data = await res.json()
      setQuestions(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  function showMsg(type: 'ok'|'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  function startNew(categorie: string) {
    setEditQ({ ...EMPTY_Q, categorie })
    setEditIdx(null)
    setIsNew(true)
  }

  function startEdit(q: BanqueQuestion, idx: number) {
    setEditQ({ ...q })
    setEditIdx(idx)
    setIsNew(false)
  }

  function cancelEdit() { setEditQ(null); setEditIdx(null); setIsNew(false) }

  async function saveQuestion() {
    if (!editQ || !editQ.question.trim()) return
    setSaving(true)
    try {
      const method = isNew ? 'POST' : 'PATCH'
      const payload = isNew ? editQ : { id: editQ.id, ...editQ }
      const res = await fetch('/api/admin/banque-questions', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erreur')
      showMsg('ok', isNew ? 'Question ajoutée' : 'Question modifiée')
      cancelEdit()
      fetchQuestions()
    } catch (e: any) {
      showMsg('err', e.message)
    }
    setSaving(false)
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Supprimer cette question ?')) return
    await fetch('/api/admin/banque-questions', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchQuestions()
  }

  const byCategorie = (cat: string) => questions.filter(q => q.categorie === cat)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl">
      {/* Onglets */}
      <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
        <a href="/admin/examens" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/examens' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Examens finaux</a>
        <a href="/admin/examens/banque" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/examens/banque' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Banque de questions</a>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-white">Banque de questions</h1>
          <p className="text-noir-400 text-sm mt-1">Créez vos questions une fois, réutilisez-les pour tous les examens</p>
        </div>
        <div className="text-right">
          <span className="text-gold-400 font-bold text-lg">{questions.length}</span>
          <span className="text-noir-400 text-sm ml-1">question{questions.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'ok' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const qs = byCategorie(cat)
            const isOpen = openCat === cat
            return (
              <div key={cat} className="card">
                {/* En-tête catégorie */}
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpenCat(isOpen ? '' : cat)}>
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown size={16} className="text-gold-400" /> : <ChevronRight size={16} className="text-noir-400" />}
                    <h2 className="text-white font-semibold">{cat}</h2>
                    <span className="bg-gold-500/10 text-gold-400 text-xs px-2 py-0.5 rounded-full border border-gold-500/20">
                      {qs.length} question{qs.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenCat(cat); startNew(cat) }}
                    className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-2">
                    {/* Formulaire nouvelle/édition question */}
                    {editQ && editQ.categorie === cat && (
                      <div className="border border-gold-500/30 bg-gold-500/5 rounded-xl p-4 space-y-3 mb-4">
                        <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider">
                          {isNew ? 'Nouvelle question' : 'Modifier la question'}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label mb-1 block">Type</label>
                            <select value={editQ.type} onChange={e => setEditQ(q => q ? { ...q, type: e.target.value } : q)} className="input w-full text-sm">
                              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="label mb-1 block">Points</label>
                            <input type="number" min="1" max="10" value={editQ.points}
                              onChange={e => setEditQ(q => q ? { ...q, points: parseInt(e.target.value) || 1 } : q)}
                              className="input w-full" />
                          </div>
                        </div>

                        <div>
                          <label className="label mb-1 block">Question *</label>
                          <textarea value={editQ.question}
                            onChange={e => setEditQ(q => q ? { ...q, question: e.target.value } : q)}
                            className="input w-full h-20 resize-none" placeholder="Posez votre question..." />
                        </div>

                        {/* Médias */}
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="label mb-1 block">Audio (URL Cloudinary ou autre)</label>
                            <input value={editQ.audio_url}
                              onChange={e => setEditQ(q => q ? { ...q, audio_url: e.target.value } : q)}
                              className="input w-full text-sm" placeholder="https://..." />
                            {editQ.audio_url && <audio controls className="w-full mt-1 h-8" src={editQ.audio_url} />}
                          </div>
                          <div>
                            <label className="label mb-1 block">Image (URL)</label>
                            <input value={editQ.image_url}
                              onChange={e => setEditQ(q => q ? { ...q, image_url: e.target.value } : q)}
                              className="input w-full text-sm" placeholder="https://..." />
                            {editQ.image_url && <img src={editQ.image_url} alt="Aperçu" className="w-full max-h-32 object-contain rounded-lg mt-1 bg-noir-900" />}
                          </div>
                          <div>
                            <label className="label mb-1 block">Vidéo (YouTube ou directe)</label>
                            <input value={editQ.video_url}
                              onChange={e => setEditQ(q => q ? { ...q, video_url: e.target.value } : q)}
                              className="input w-full text-sm" placeholder="https://youtube.com/..." />
                          </div>
                        </div>

                        {/* Options QCM */}
                        {editQ.type === 'qcm' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="label">Options</label>
                              <button type="button" onClick={() => setEditQ(q => q ? { ...q, options: [...q.options, ''] } : q)}
                                className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"><Plus size={10} /> Ajouter</button>
                            </div>
                            {editQ.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs text-noir-600 w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                                <input value={opt}
                                  onChange={e => { const o = [...editQ.options]; o[i] = e.target.value; setEditQ(q => q ? { ...q, options: o } : q) }}
                                  className="input flex-1 text-sm py-1.5" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                                {editQ.options.length > 2 && (
                                  <button type="button" onClick={() => setEditQ(q => q ? { ...q, options: q.options.filter((_, j) => j !== i) } : q)}
                                    className="text-noir-600 hover:text-red-400 p-1"><Trash2 size={10} /></button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Vrai/Faux */}
                        {editQ.type === 'vrai_faux' && (
                          <div>
                            <label className="label mb-1 block">Bonne réponse</label>
                            <div className="flex gap-2">
                              {['Vrai', 'Faux'].map(v => (
                                <button key={v} type="button" onClick={() => setEditQ(q => q ? { ...q, bonne_reponse: v } : q)}
                                  className={`flex-1 py-2 rounded-xl border text-sm transition-all ${editQ.bonne_reponse === v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>{v}</button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bonne réponse (autres types) */}
                        {editQ.type !== 'vrai_faux' && (
                          <div>
                            <label className="label mb-1 block">Bonne réponse</label>
                            <input value={editQ.bonne_reponse}
                              onChange={e => setEditQ(q => q ? { ...q, bonne_reponse: e.target.value } : q)}
                              className="input w-full text-sm" placeholder="Réponse correcte..." />
                          </div>
                        )}

                        <div>
                          <label className="label mb-1 block">Explication</label>
                          <textarea value={editQ.explication}
                            onChange={e => setEditQ(q => q ? { ...q, explication: e.target.value } : q)}
                            className="input w-full h-14 resize-none text-sm" placeholder="Explication de la bonne réponse..." />
                        </div>

                        <div className="flex gap-2">
                          <button type="button" onClick={cancelEdit} className="btn-outline flex-1 text-sm py-2">Annuler</button>
                          <button type="button" onClick={saveQuestion} disabled={saving}
                            className="btn-gold flex-1 text-sm py-2 flex items-center justify-center gap-2">
                            <Save size={14} /> {saving ? 'Enregistrement...' : isNew ? 'Ajouter' : 'Enregistrer'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Liste des questions */}
                    {qs.length === 0 && !editQ ? (
                      <p className="text-noir-500 text-sm text-center py-6">Aucune question — cliquez sur Ajouter</p>
                    ) : (
                      qs.map((q, i) => (
                        <div key={q.id || i} className="flex items-start gap-3 bg-noir-800/40 border border-noir-700 rounded-xl px-3 py-2.5">
                          <span className="text-noir-600 text-xs w-5 shrink-0 mt-0.5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium leading-snug">{q.question}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-noir-500 text-xs">{TYPES.find(t => t.value === q.type)?.label}</span>
                              <span className="text-noir-600 text-xs">·</span>
                              <span className="text-noir-500 text-xs">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                              {q.audio_url && <span className="text-blue-400 text-xs">Audio</span>}
                              {q.image_url && <span className="text-purple-400 text-xs">Image</span>}
                              {q.video_url && <span className="text-red-400 text-xs">Vidéo</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setOpenCat(cat); startEdit(q, i) }}
                              className="text-noir-400 hover:text-gold-400 p-1.5 transition-colors" title="Modifier">
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => q.id && deleteQuestion(q.id)}
                              className="text-noir-600 hover:text-red-400 p-1.5 transition-colors" title="Supprimer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}