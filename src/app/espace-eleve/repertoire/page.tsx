'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'

interface Morceau {
  id: string
  titre: string
  compositeur: string | null
  tonalite: string | null
  niveau: string | null
  statut: 'en_cours' | 'maitrise' | 'a_apprendre'
  notes: string | null
  created_at: string
}

const STATUT_CONFIG = {
  en_cours:    { label: 'En cours',     emoji: '', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',
    icon: <svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  maitrise:    { label: 'Maîtrisé',     emoji: '', color: 'text-gold-400',   bg: 'bg-gold-500/10 border-gold-500/20',
    icon: <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
  a_apprendre: { label: 'À apprendre',  emoji: '', color: 'text-noir-400',   bg: 'bg-noir-800/50 border-noir-700',
    icon: <svg width="16" height="16" fill="none" stroke="#a0a0c0" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
}

const NIVEAUX = ['Débutant', 'Intermédiaire', 'Avancé']

export default function RepertoirePage() {
  const router = useRouter()
  const [morceaux, setMorceaux] = useState<Morceau[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('tous')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ titre: '', compositeur: '', tonalite: '', niveau: '', statut: 'a_apprendre', notes: '' })

  useEffect(() => {
    fetch('/api/eleve/repertoire')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setMorceaux(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/eleve/repertoire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, compositeur: form.compositeur || null, tonalite: form.tonalite || null, niveau: form.niveau || null, notes: form.notes || null }),
    })
    const data = await res.json()
    if (res.ok) { setMorceaux(prev => [data, ...prev]); setShowForm(false); setForm({ titre: '', compositeur: '', tonalite: '', niveau: '', statut: 'a_apprendre', notes: '' }) }
    setSaving(false)
  }

  async function updateStatut(id: string, statut: string) {
    const res = await fetch('/api/eleve/repertoire', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }) })
    if (res.ok) setMorceaux(prev => prev.map(m => m.id === id ? { ...m, statut: statut as any } : m))
  }

  async function deleteMorceau(id: string) {
    if (!confirm('Supprimer ce morceau ?')) return
    await fetch('/api/eleve/repertoire', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setMorceaux(prev => prev.filter(m => m.id !== id))
  }

  const filtered = morceaux.filter(m => {
    const matchFilter = filter === 'tous' || m.statut === filter
    const matchSearch = !search || m.titre.toLowerCase().includes(search.toLowerCase()) || (m.compositeur || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  if (loading) return <EleveLayout><div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div></EleveLayout>

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-white">Mon répertoire</h1>
            <p className="text-noir-400 text-sm mt-0.5">{morceaux.length} morceau{morceaux.length > 1 ? 'x' : ''}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-gold flex items-center gap-2 text-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
            <div key={key} className={`card text-center py-3 border ${cfg.bg}`}>
              <div className="flex justify-center mb-1">{cfg.icon}</div>
              <p className="text-white font-bold">{morceaux.filter(m => m.statut === key).length}</p>
              <p className="text-xs text-noir-400">{cfg.label}</p>
            </div>
          ))}
        </div>

        {/* Recherche + filtres */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} className="input flex-1 min-w-48" placeholder="Rechercher un morceau..." />
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{ key: 'tous', label: 'Tous' }, ...Object.entries(STATUT_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === f.key ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
            title="Aucun morceau"
            description="Ajoutez vos morceaux pour suivre votre répertoire"
            action={<button onClick={() => setShowForm(true)} className="btn-gold text-xs px-4 py-2">Ajouter un morceau</button>}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(m => {
              const cfg = STATUT_CONFIG[m.statut]
              return (
                <div key={m.id} className={`card border ${cfg.bg} transition-all`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-noir-800/50">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{m.titre}</p>
                        {m.compositeur && <p className="text-noir-400 text-xs">{m.compositeur}</p>}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {m.tonalite && <span className="text-xs bg-noir-800 text-noir-400 px-2 py-0.5 rounded-full">{m.tonalite}</span>}
                          {m.niveau && <span className="text-xs bg-noir-800 text-noir-400 px-2 py-0.5 rounded-full">{m.niveau}</span>}
                        </div>
                        {m.notes && <p className="text-noir-500 text-xs mt-1 line-clamp-1">{m.notes}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <select value={m.statut} onChange={e => updateStatut(m.id, e.target.value)}
                        className="text-xs bg-noir-800 border border-noir-700 text-noir-300 rounded-lg px-2 py-1 cursor-pointer">
                        {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <button onClick={() => deleteMorceau(m.id)} className="text-noir-700 hover:text-red-400 transition-colors text-xs text-center">Supprimer</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modale */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'480px'}}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
                <h2 className="text-white font-serif text-xl">Nouveau morceau</h2>
                <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4">
                <form onSubmit={handleCreate} id="rep-form" className="space-y-4">
                  <div><label className="label mb-1 block">Titre *</label><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Ex: Nocturne Op.9 No.2" /></div>
                  <div><label className="label mb-1 block">Compositeur</label><input value={form.compositeur} onChange={e => setForm(f => ({ ...f, compositeur: e.target.value }))} className="input w-full" placeholder="Ex: Chopin" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label mb-1 block">Tonalité</label><input value={form.tonalite} onChange={e => setForm(f => ({ ...f, tonalite: e.target.value }))} className="input w-full" placeholder="Ex: Mi bémol" /></div>
                    <div><label className="label mb-1 block">Niveau</label>
                      <select value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))} className="input w-full">
                        <option value="">Choisir...</option>
                        {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="label mb-2 block">Statut</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(STATUT_CONFIG).map(([k, v]) => (
                        <button key={k} type="button" onClick={() => setForm(f => ({ ...f, statut: k }))}
                          className={`py-2 rounded-xl border text-xs font-medium transition-all ${form.statut === k ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>
                          <span className="flex items-center justify-center gap-1">{v.icon} {v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label className="label mb-1 block">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input w-full h-16 resize-none" placeholder="Difficultés, objectifs..." /></div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" form="rep-form" disabled={saving} className="btn-gold flex-1">{saving ? 'Ajout...' : 'Ajouter'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}