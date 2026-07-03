'use client'
import SubNav from '@/components/eleve/SubNav'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'

interface Objectif {
  id: string
  titre: string
  description: string | null
  echeance: string | null
  statut: 'en_cours' | 'atteint' | 'abandonne'
  created_at: string
}

const STATUT_CONFIG = {
  en_cours:  { label: 'En cours',  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   dot: 'bg-blue-400' },
  atteint:   { label: 'Atteint',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  dot: 'bg-green-400' },
  abandonne: { label: 'Abandonné', color: 'text-noir-500',   bg: 'bg-noir-800/50 border-noir-700',       dot: 'bg-noir-600' },
}

function daysLeft(echeance: string): { text: string; urgent: boolean } {
  const diff = Math.ceil((new Date(echeance).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { text: `${Math.abs(diff)}j de retard`, urgent: true }
  if (diff === 0) return { text: "Aujourd'hui !", urgent: true }
  if (diff <= 3) return { text: `${diff}j restants`, urgent: true }
  return { text: `${diff}j restants`, urgent: false }
}

export default function ObjectifsPage() {
  const router = useRouter()
  const [objectifs, setObjectifs] = useState<Objectif[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'tous' | 'en_cours' | 'atteint'>('tous')
  const [form, setForm] = useState({ titre: '', description: '', echeance: '' })

  useEffect(() => {
    fetch('/api/eleve/objectifs')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setObjectifs(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titre.trim()) return
    setSaving(true)
    const res = await fetch('/api/eleve/objectifs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titre: form.titre, description: form.description || null, echeance: form.echeance || null, statut: 'en_cours' }),
    })
    const data = await res.json()
    if (res.ok) {
      setObjectifs(prev => [data, ...prev])
      setForm({ titre: '', description: '', echeance: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function updateStatut(id: string, statut: string) {
    const res = await fetch('/api/eleve/objectifs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut }),
    })
    if (res.ok) {
      setObjectifs(prev => prev.map(o => o.id === id ? { ...o, statut: statut as any } : o))
    }
  }

  async function deleteObjectif(id: string) {
    if (!confirm('Supprimer cet objectif ?')) return
    await fetch('/api/eleve/objectifs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setObjectifs(prev => prev.filter(o => o.id !== id))
  }

  const filtered = objectifs.filter(o => filter === 'tous' || o.statut === filter)
  const enCours = objectifs.filter(o => o.statut === 'en_cours').length
  const atteints = objectifs.filter(o => o.statut === 'atteint').length

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-28" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-white">Mes objectifs</h1>
        <SubNav items={[{href:'/espace-eleve/progression',label:'Progression'},{href:'/espace-eleve/objectifs',label:'Objectifs'},{href:'/espace-eleve/badges',label:'Badges'},{href:'/espace-eleve/historique',label:'Parcours'}]} />
            <p className="text-noir-400 text-sm mt-0.5">{enCours} en cours · {atteints} atteints</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="btn-gold flex items-center gap-2 text-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvel objectif
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: objectifs.length, color: '#f59e0b' },
            { label: 'En cours', value: enCours, color: '#60a5fa' },
            { label: 'Atteints', value: atteints, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-noir-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'tous', label: 'Tous' },
            { key: 'en_cours', label: 'En cours' },
            { key: 'atteint', label: 'Atteints' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f.key
                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                  : 'border-noir-700 text-noir-400 hover:border-noir-600'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>}
            title="Aucun objectif"
            description="Définissez vos objectifs musicaux pour rester motivé"
            action={<button onClick={() => setShowForm(true)} className="btn-gold text-xs px-4 py-2">Créer un objectif</button>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(o => {
              const cfg = STATUT_CONFIG[o.statut]
              const dl = o.echeance ? daysLeft(o.echeance) : null

              return (
                <div key={o.id} className={`card border ${cfg.bg} transition-all`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${o.statut === 'abandonne' ? 'text-noir-500 line-through' : 'text-white'}`}>
                          {o.titre}
                        </p>
                        {o.description && (
                          <p className="text-noir-500 text-xs mt-0.5">{o.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {o.echeance && dl && (
                            <span className={`text-xs ${dl.urgent ? 'text-red-400' : 'text-noir-500'}`}>
                              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {dl.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {o.statut === 'en_cours' && (
                        <button onClick={() => updateStatut(o.id, 'atteint')}
                          title="Marquer comme atteint"
                          className="text-noir-500 hover:text-green-400 p-1.5 rounded-lg transition-colors">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                      )}
                      {o.statut === 'atteint' && (
                        <button onClick={() => updateStatut(o.id, 'en_cours')}
                          title="Remettre en cours"
                          className="text-noir-500 hover:text-blue-400 p-1.5 rounded-lg transition-colors">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                        </button>
                      )}
                      <button onClick={() => deleteObjectif(o.id)}
                        className="text-noir-500 hover:text-red-400 p-1.5 rounded-lg transition-colors">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modale création */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[90vh] flex flex-col" style={{maxWidth:'480px'}}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
                <h2 className="text-white font-serif text-xl">Nouvel objectif</h2>
                <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
                <div>
                  <label className="label mb-1 block">Objectif *</label>
                  <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                    className="input w-full" required placeholder="Ex: Maîtriser les accords de 7e" />
                </div>
                <div>
                  <label className="label mb-1 block">Description (optionnel)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input w-full h-16 resize-none" placeholder="Détails de l'objectif..." />
                </div>
                <div>
                  <label className="label mb-1 block">Échéance (optionnel)</label>
                  <input type="date" value={form.echeance} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))}
                    className="input w-full" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                  <button type="submit" disabled={saving} className="btn-gold flex-1">
                    {saving ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}