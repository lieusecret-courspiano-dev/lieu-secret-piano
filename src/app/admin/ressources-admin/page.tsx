'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Pencil } from 'lucide-react'

interface Ressource {
  id: string; titre: string; description: string | null; type: string
  url: string | null; categorie: string | null; is_public: boolean
  created_at: string; eleve_id: string | null
  eleves?: { prenom: string; nom: string } | null
}
interface Eleve { id: string; prenom: string; nom: string; email: string }

const TYPES = ['pdf', 'video', 'audio', 'partition', 'exercice', 'lien', 'autre']
const TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  pdf:       { color: 'text-red-400',    icon: <svg width="16" height="16" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  video:     { color: 'text-blue-400',   icon: <svg width="16" height="16" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
  audio:     { color: 'text-purple-400', icon: <svg width="16" height="16" fill="none" stroke="#c084fc" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  partition: { color: 'text-gold-400',   icon: <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  exercice:  { color: 'text-green-400',  icon: <svg width="16" height="16" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  lien:      { color: 'text-cyan-400',   icon: <svg width="16" height="16" fill="none" stroke="#22d3ee" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  autre:     { color: 'text-noir-400',   icon: <svg width="16" height="16" fill="none" stroke="#a0a0c0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
}
const TYPE_LABELS: Record<string, string> = { pdf: 'PDF', video: 'Vidéo', audio: 'Audio', partition: 'Partition', exercice: 'Exercice', lien: 'Lien', autre: 'Document' }

const EMPTY_FORM = { titre: '', description: '', type: 'pdf', url: '', categorie: '', eleve_id: '', is_public: false }

export default function AdminRessourcesPage() {
  const pathname = usePathname()
  const [ressources, setRessources] = useState<Ressource[]>([])
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('tous')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Ressource | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [res, elv] = await Promise.all([
      fetch('/api/admin/ressources').then(r => r.json()),
      fetch('/api/admin/eleves').then(r => r.json()),
    ])
    setRessources(Array.isArray(res) ? res : [])
    setEleves(Array.isArray(elv) ? elv : [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setEditTarget(null)
    setShowCreate(true)
  }

  function openEdit(r: Ressource) {
    setForm({
      titre: r.titre,
      description: r.description || '',
      type: r.type,
      url: r.url || '',
      categorie: r.categorie || '',
      eleve_id: r.eleve_id || '',
      is_public: r.is_public,
    })
    setEditTarget(r)
    setShowCreate(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
    const payload = { ...form, eleve_id: form.eleve_id || null }

    if (editTarget) {
      // Modification
      const res = await fetch('/api/admin/ressources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id, ...payload }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRessources(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...updated } : r))
        setShowCreate(false)
      }
    } else {
      // Création
      const res = await fetch('/api/admin/ressources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await loadData()
        setShowCreate(false)
      }
    }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette ressource ?')) return
    await fetch('/api/admin/ressources', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setRessources(prev => prev.filter(r => r.id !== id))
  }

  const types = ['tous', ...TYPES.filter(t => ressources.some(r => r.type === t))]
  const filtered = ressources.filter(r => {
    const matchSearch = !search || r.titre.toLowerCase().includes(search.toLowerCase()) || (r.categorie || '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'tous' || r.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Ressources pédagogiques</h1>
          <p className="text-noir-400 text-sm mt-1">Partagez des liens, PDF et documents avec vos élèves</p>
        </div>
        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
          <a href="/admin/ressources-premium" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/ressources-premium' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Premium</a>
        <a href="/admin/ressources-admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/ressources-admin' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Élèves</a>
        <a href="/admin/partitions" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/partitions' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Médiathèque</a>
        <a href="/admin/supports" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/supports' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Bibliothèque</a>
        </div>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input w-full pl-9" />
        </div>
        <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === t ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {t === 'tous' ? 'Tout' : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="card hover:border-gold-500/30 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`${(TYPE_ICONS[r.type] || TYPE_ICONS.autre).color}`}>{(TYPE_ICONS[r.type] || TYPE_ICONS.autre).icon}</span>
                  <span className={`text-xs uppercase tracking-wider ${(TYPE_ICONS[r.type] || TYPE_ICONS.autre).color}`}>{TYPE_LABELS[r.type] || r.type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.is_public && <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Public</span>}
                  <button onClick={() => openEdit(r)} className="text-noir-500 hover:text-gold-400 transition-colors p-1" title="Modifier">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-noir-500 hover:text-red-400 transition-colors p-1" title="Supprimer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <h3 className="text-white font-medium text-sm mb-1 leading-tight">{r.titre}</h3>
              {r.description && <p className="text-noir-400 text-xs mb-2 line-clamp-2">{r.description}</p>}
              {r.categorie && <span className="text-xs text-gold-500 font-medium">{r.categorie}</span>}
              {r.eleves && <p className="text-xs text-noir-500 mt-1">Pour : {r.eleves.prenom} {r.eleves.nom}</p>}
              {!r.eleves && !r.is_public && r.eleve_id && <p className="text-xs text-noir-600 mt-1">Élève spécifique</p>}
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gold-400 hover:text-gold-300 mt-2 inline-block truncate max-w-full">
                  {r.url.length > 45 ? r.url.substring(0, 45) + '...' : r.url}
                </a>
              )}
              <p className="text-noir-700 text-xs mt-2">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-noir-400">
              <p className="text-lg">Aucune ressource</p>
              <p className="text-sm mt-1">Cliquez sur "Ajouter" pour créer votre première ressource.</p>
            </div>
          )}
        </div>
      )}

      {/* Modale création / modification */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'440px'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">{editTarget ? 'Modifier la ressource' : 'Ajouter une ressource'}</h2>
              <button onClick={() => setShowCreate(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4" id="ressource-form">
                <div>
                  <label className="label mb-1 block">Titre *</label>
                  <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required />
                </div>
                <div>
                  <label className="label mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label mb-1 block">URL ou lien</label>
                  <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="input w-full" />
                </div>
                <div>
                  <label className="label mb-1 block">Catégorie</label>
                  <input value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} placeholder="Ex: Théorie, Technique..." className="input w-full" />
                </div>
                <div>
                  <label className="label mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input w-full h-16 resize-none" />
                </div>
                <div>
                  <label className="label mb-1 block">Élève spécifique (optionnel)</label>
                  <select value={form.eleve_id} onChange={e => setForm(f => ({ ...f, eleve_id: e.target.value }))} className="input w-full">
                    <option value="">Tous les élèves</option>
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
              <button type="submit" form="ressource-form" disabled={saving} className="btn-gold flex-1">
                {saving ? 'Enregistrement...' : editTarget ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}