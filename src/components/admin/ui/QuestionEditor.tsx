'use client'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export interface ExamenQuestion {
  id?: string
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

const TYPES = [
  { value: 'qcm',           label: 'QCM — une bonne réponse' },
  { value: 'qcm_multiple',  label: 'QCM — plusieurs bonnes réponses' },
  { value: 'vrai_faux',     label: 'Vrai / Faux' },
  { value: 'reponse_courte',label: 'Réponse courte' },
  { value: 'audio',         label: 'Question audio' },
  { value: 'image',         label: 'Question avec image' },
  { value: 'video',         label: 'Question avec vidéo' },
]

const EMPTY_Q: ExamenQuestion = {
  type: 'qcm', question: '', options: ['', '', '', ''],
  bonne_reponse: '', explication: '', audio_url: '', image_url: '', video_url: '',
  points: 1, position: 0,
}

interface Props {
  questions: ExamenQuestion[]
  onChange: (questions: ExamenQuestion[]) => void
  hideAddButton?: boolean
}

export function QuestionEditor({ questions, onChange, hideAddButton = false }: Props) {
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [form, setForm] = useState<ExamenQuestion>({ ...EMPTY_Q })

  function addQuestion() {
    setForm({ ...EMPTY_Q, position: questions.length })
    setEditIdx(-1)  // -1 = nouvelle question
  }

  function saveQuestion() {
    if (editIdx === -1) {
      onChange([...questions, form])
    } else if (editIdx !== null) {
      const updated = [...questions]
      updated[editIdx] = form
      onChange(updated)
    }
    setEditIdx(null)
  }

  function deleteQuestion(idx: number) {
    onChange(questions.filter((_, i) => i !== idx))
  }

  function editQuestion(idx: number) {
    setForm({ ...questions[idx] })
    setEditIdx(idx)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="label">Questions ({questions.length})</label>
        {!hideAddButton && (
          <button type="button" onClick={addQuestion} className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1">
            <Plus size={12} /> Ajouter une question
          </button>
        )}
      </div>

      {/* Liste des questions */}
      {questions.length > 0 && (
        <div className="space-y-2 mb-3">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2 bg-noir-800/50 border border-noir-700 rounded-xl px-3 py-2">
              <span className="text-noir-600 text-xs w-5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{q.question || '(sans texte)'}</p>
                <p className="text-noir-500 text-[10px]">{TYPES.find(t => t.value === q.type)?.label} · {q.points} pt{q.points > 1 ? 's' : ''}</p>
              </div>
              <button type="button" onClick={() => editQuestion(i)} className="text-noir-400 hover:text-gold-400 p-1">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" onClick={() => deleteQuestion(i)} className="text-noir-600 hover:text-red-400 p-1">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'édition */}
      {editIdx !== null && (
        <div className="border border-gold-500/20 bg-gold-500/5 rounded-xl p-4 space-y-3">
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider">
            {editIdx === -1 ? 'Nouvelle question' : `Modifier la question ${editIdx + 1}`}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full text-xs">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-1 block">Points</label>
              <input type="number" min="1" max="10" value={form.points} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 1 }))} className="input w-full text-xs" />
            </div>
          </div>

          <div>
            <label className="label mb-1 block">Question *</label>
            <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              className="input w-full h-16 resize-none text-sm" placeholder="Posez votre question..." required />
          </div>

          {/* Médias */}
          <div className="space-y-2">
            <div>
              <label className="label mb-1 block">Audio (URL)</label>
              <input value={form.audio_url} onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))}
                className="input w-full text-xs" placeholder="https://... (mp3, wav, Cloudinary...)" />
              {form.audio_url && <audio controls className="w-full mt-1 h-8" src={form.audio_url} />}
            </div>
            <div>
              <label className="label mb-1 block">Image (URL)</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                className="input w-full text-xs" placeholder="https://... (jpg, png, webp)" />
              {form.image_url && <img src={form.image_url} alt="Aperçu" className="w-full max-h-24 object-contain rounded-lg mt-1 bg-noir-900" />}
            </div>
            <div>
              <label className="label mb-1 block">Vidéo (URL YouTube ou directe)</label>
              <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                className="input w-full text-xs" placeholder="https://youtube.com/... ou lien direct mp4" />
            </div>
          </div>

          {/* Options QCM */}
          {['qcm', 'qcm_multiple'].includes(form.type) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label">Options</label>
                <button type="button" onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
                  className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                  <Plus size={10} /> Ajouter
                </button>
              </div>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-noir-600 w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                  <input value={opt} onChange={e => { const o = [...form.options]; o[i] = e.target.value; setForm(f => ({ ...f, options: o })) }}
                    className="input flex-1 text-xs py-1.5" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}
                      className="text-noir-600 hover:text-red-400 p-1"><Trash2 size={10} /></button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Vrai/Faux */}
          {form.type === 'vrai_faux' && (
            <div>
              <label className="label mb-1 block">Bonne réponse</label>
              <div className="flex gap-2">
                {['Vrai', 'Faux'].map(v => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, bonne_reponse: v }))}
                    className={`flex-1 py-2 rounded-xl border text-sm transition-all ${form.bonne_reponse === v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bonne réponse pour QCM */}
          {['qcm', 'reponse_courte', 'audio', 'image', 'video'].includes(form.type) && (
            <div>
              <label className="label mb-1 block">Bonne réponse</label>
              <input value={form.bonne_reponse} onChange={e => setForm(f => ({ ...f, bonne_reponse: e.target.value }))}
                className="input w-full text-xs" placeholder="Réponse correcte..." />
            </div>
          )}

          <div>
            <label className="label mb-1 block">Explication (après correction)</label>
            <textarea value={form.explication} onChange={e => setForm(f => ({ ...f, explication: e.target.value }))}
              className="input w-full h-12 resize-none text-xs" placeholder="Explication de la bonne réponse..." />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setEditIdx(null)} className="btn-outline flex-1 text-xs py-2">Annuler</button>
            <button type="button" onClick={saveQuestion} className="btn-gold flex-1 text-xs py-2">
              {editIdx === -1 ? 'Ajouter' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
