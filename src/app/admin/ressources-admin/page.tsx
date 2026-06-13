'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'

interface Ressource {
  id: string; titre: string; description: string | null; type: string
  url: string | null; categorie: string | null; is_public: boolean
  created_at: string; eleves?: { prenom: string; nom: string } | null
}
interface Eleve { id: string; prenom: string; nom: string; email: string }

const TYPES = ['pdf', 'video', 'partition', 'exercice', 'lien', 'autre']
const TYPE_ICONS: Record<string, string> = { pdf: '📄', video: '🎥', partition: '🎵', exercice: '✏️', lien: '🔗', autre: '📎' }

export default function AdminRessourcesPage() {
  const [ressources, setRessources] = useState<Ressource[]>([])
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', type: 'pdf', url: '', categorie: '', eleve_id: '', is_public: false })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/ressources').then(r => r.json()),
      fetch('/api/admin/eleves').then(r => r.json()),
    ]).then(([res, elv]) => {
      setRessources(Array.isArray(res) ? res : [])
      setEleves(Array.isArray(elv) ? elv : [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/admin/ressources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, eleve_id: form.eleve_id || null }),
    })
    if (res.ok) {
      const data = await res.json()
      setRessources(prev => [data, ...prev])
      setShowCreate(false)
      setForm({ titre: '', description: '', type: 'pdf', url: '', categorie: '', eleve_id: '', is_public: false })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette ressource ?')) return
    await fetch('/api/admin/ressources', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setRessources(prev => prev.filter(r => r.id !== id))
  }

  const filtered = ressources.filter(r =>
    r.titre.toLowerCase().includes(search.toLowerCase()) ||
    (r.categorie || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Ressources pédagogiques</h1>
          <p className="text-noir-400 text-sm mt-1">Partagez des liens, PDF et documents avec vos élèves</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input w-full pl-9 max-w-sm" />
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="card hover:border-gold-500/30 transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{TYPE_ICONS[r.type] || '📎'}</span>
                <div className="flex items-center gap-2">
                  {r.is_public && <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Public</span>}
                  <button onClick={() => handleDelete(r.id)} className="text-noir-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-white font-medium text-sm mb-1">{r.titre}</h3>
              {r.description && <p className="text-noir-400 text-xs mb-2 line-clamp-2">{r.description}</p>}
              {r.categorie && <span className="text-xs text-gold-500">{r.categorie}</span>}
              {r.eleves && <p className="text-xs text-noir-500 mt-1">Pour : {r.eleves.prenom} {r.eleves.nom}</p>}
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-400 hover:text-gold-300 mt-2 inline-block truncate max-w-full">{r.url.substring(0, 45)}...</a>}
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-3 text-center py-12 text-noir-400">Aucune ressource</div>}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">Ajouter une ressource</h2>
              <button onClick={() => setShowCreate(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleCreate} className="space-y-4" id="ressource-form">
                <div><label className="label mb-1 block">Titre *</label><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required /></div>
                <div><label className="label mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label mb-1 block">URL ou lien *</label><input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="input w-full" /></div>
                <div><label className="label mb-1 block">Catégorie</label><input value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} placeholder="Ex: Théorie, Technique..." className="input w-full" /></div>
                <div><label className="label mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input w-full h-16 resize-none" /></div>
                <div><label className="label mb-1 block">Élève spécifique (optionnel)</label>
                  <select value={form.eleve_id} onChange={e => setForm(f => ({ ...f, eleve_id: e.target.value }))} className="input w-full">
                    <option value="">Tous les élèves (public)</option>
                    {eleves.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.email}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                  <span className="text-sm text-noir-300">Visible par tous les élèves connectés</span>
                </label>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-outline flex-1">Annuler</button>
              <button type="submit" form="ressource-form" disabled={saving} className="btn-gold flex-1">{saving ? 'Ajout...' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
