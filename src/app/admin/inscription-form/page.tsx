'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, CheckCircle } from 'lucide-react'

interface Question {
  id: string
  label: string
  type: string
  options: string | null
  required: boolean
  position: number
  is_active: boolean
}

const TYPES = [
  { value: 'text',        label: 'Texte court' },
  { value: 'textarea',    label: 'Texte long' },
  { value: 'email',       label: 'Email' },
  { value: 'tel',         label: 'Telephone' },
  { value: 'number',      label: 'Nombre' },
  { value: 'select',      label: 'Liste deroulante (choix unique)' },
  { value: 'multiselect', label: 'Cases a cocher (choix multiple)' },
  { value: 'radio',       label: 'Boutons radio (choix unique)' },
]

const EMPTY_Q = { label: '', type: 'text', options: '', required: true, position: 0, is_active: true }

export default function AdminInscriptionForm() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Question | null>(null)
  const [form, setForm]           = useState(EMPTY_Q)
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')

  useEffect(() => { fetchQuestions() }, [])

  async function fetchQuestions() {
    setLoading(true)
    const res  = await fetch('/api/admin/inscription-form')
    const data = await res.json()
    setQuestions(Array.isArray(data) ? data.sort((a: Question, b: Question) => a.position - b.position) : [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_Q, position: questions.length + 1 })
    setError('')
    setShowForm(true)
  }

  function openEdit(q: Question) {
    setEditing(q)
    setForm({ label: q.label, type: q.type, options: q.options || '', required: q.required, position: q.position, is_active: q.is_active })
    setError('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) { setError('Le libelle est requis'); return }
    setSaving(true); setError('')
    try {
      const url    = editing ? `/api/admin/inscription-form/${editing.id}` : '/api/admin/inscription-form'
      const method = editing ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false)
      setSuccess(editing ? 'Question modifiee' : 'Question ajoutee')
      setTimeout(() => setSuccess(''), 3000)
      fetchQuestions()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setSaving(false) }
  }

  async function handleToggle(q: Question) {
    await fetch(`/api/admin/inscription-form/${q.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !q.is_active }),
    })
    fetchQuestions()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette question ?')) return
    await fetch(`/api/admin/inscription-form/${id}`, { method: 'DELETE' })
    fetchQuestions()
  }

  const typeLabel = (t: string) => TYPES.find(x => x.value === t)?.label || t

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Formulaire d'inscription</h1>
          <p className="text-noir-400 text-sm mt-1">Gerez les questions du formulaire d'inscription public</p>
        </div>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Ajouter une question
        </button>
      </div>

      {success && <div className="bg-green-900/30 border border-green-500/50 text-green-300 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div key={q.id} className={`card flex items-center gap-4 ${!q.is_active ? 'opacity-40' : ''}`}>
              <GripVertical size={16} className="text-noir-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium text-sm">{q.label}</span>
                  {q.required && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">Obligatoire</span>}
                  <span className="text-xs bg-noir-800 text-noir-400 border border-noir-700 rounded-full px-2 py-0.5">{typeLabel(q.type)}</span>
                  {!q.is_active && <span className="text-xs text-noir-600">Desactive</span>}
                </div>
                {q.options && <p className="text-noir-500 text-xs mt-1 truncate">Options : {q.options}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-noir-600">#{q.position}</span>
                <button onClick={() => handleToggle(q)} className={`text-xs px-2 py-1 rounded transition-colors ${q.is_active ? 'text-green-400 hover:text-green-300' : 'text-noir-500 hover:text-white'}`}>
                  {q.is_active ? 'Actif' : 'Inactif'}
                </button>
                <button onClick={() => openEdit(q)} className="text-noir-400 hover:text-gold-400 transition-colors text-xs px-2 py-1">
                  Modifier
                </button>
                <button onClick={() => handleDelete(q.id)} className="text-noir-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="card text-center py-12 text-noir-400">
              <p>Aucune question configuree</p>
              <button onClick={openCreate} className="btn-gold mt-4">Ajouter la premiere question</button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md p-6 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-serif text-xl">{editing ? 'Modifier la question' : 'Nouvelle question'}</h2>
              <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label mb-1 block">Libelle de la question *</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Votre prenom" className="input w-full" required />
              </div>
              <div>
                <label className="label mb-1 block">Type de champ</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {(form.type === 'select' || form.type === 'multiselect' || form.type === 'radio') && (
                <div>
                  <label className="label mb-1 block">Options (separees par des virgules)</label>
                  <textarea value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" rows={3} className="input w-full resize-none" />
                </div>
              )}
              <div>
                <label className="label mb-1 block">Position (ordre d'affichage)</label>
                <input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: Number(e.target.value) }))} className="input w-full" min={1} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.required} onChange={e => setForm(f => ({ ...f, required: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                  <span className="text-sm text-white">Obligatoire</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                  <span className="text-sm text-white">Actif</span>
                </label>
              </div>
              {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" className="btn-gold flex-1" disabled={saving}>
                  {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}