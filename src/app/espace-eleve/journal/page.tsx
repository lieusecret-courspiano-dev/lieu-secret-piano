'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'

interface JournalEntry {
  id: string
  date_pratique: string
  duree_minutes: number
  humeur: string | null
  notes: string | null
  morceaux: string | null
  created_at: string
}

const HUMEURS = [
  { key: 'excellent', label: 'Excellent', emoji: '', icon: <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
  { key: 'bien',      label: 'Bien',      emoji: '', icon: <svg width="18" height="18" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
  { key: 'moyen',     label: 'Moyen',     emoji: '', icon: <svg width="18" height="18" fill="none" stroke="#a0a0c0" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
  { key: 'difficile', label: 'Difficile', emoji: '', icon: <svg width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
]

const DUREES = [15, 30, 45, 60, 90, 120]

export default function JournalPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date_pratique: new Date().toISOString().split('T')[0],
    duree_minutes: 30,
    humeur: 'bien',
    notes: '',
    morceaux: '',
  })

  useEffect(() => {
    fetch('/api/eleve/journal')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setEntries(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/eleve/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setEntries(prev => [data, ...prev])
        setShowForm(false)
        setForm({ date_pratique: new Date().toISOString().split('T')[0], duree_minutes: 30, humeur: 'bien', notes: '', morceaux: '' })
      } else {
        alert(data.error || 'Erreur lors de l'enregistrement')
      }
    } catch {
      alert('Erreur réseau, veuillez réessayer')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Supprimer cette entrée ?')) return
    await fetch('/api/eleve/journal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // Stats
  const totalMinutes = entries.reduce((s, e) => s + e.duree_minutes, 0)
  const totalHeures = Math.floor(totalMinutes / 60)
  const streak = (() => {
    if (entries.length === 0) return 0
    const dates = Array.from(new Set(entries.map(e => e.date_pratique))).sort().reverse()
    let s = 1
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i-1]).getTime() - new Date(dates[i]).getTime()) / 86400000
      if (diff === 1) s++; else break
    }
    return s
  })()

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-white">Journal de pratique</h1>
            <p className="text-noir-400 text-sm mt-0.5">{entries.length} séance{entries.length > 1 ? 's' : ''} enregistrée{entries.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-gold flex items-center gap-2 text-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter une séance
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-white">{totalHeures}h</p>
            <p className="text-xs text-noir-400">Total pratiqué</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-white">{entries.length}</p>
            <p className="text-xs text-noir-400">Séances</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-white">{streak}</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <svg width="12" height="12" fill="none" stroke="#fb923c" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <p className="text-xs text-noir-400">Jours consécutifs</p>
          </div>
        </div>

        {/* Liste */}
        {entries.length === 0 ? (
          <EmptyState
            icon={<svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
            title="Aucune séance enregistrée"
            description="Commencez à suivre votre pratique quotidienne"
            action={<button onClick={() => setShowForm(true)} className="btn-gold text-xs px-4 py-2">Ajouter une séance</button>}
          />
        ) : (
          <div className="space-y-3">
            {entries.map(entry => {
              const humeur = HUMEURS.find(h => h.key === entry.humeur)
              const heures = Math.floor(entry.duree_minutes / 60)
              const mins = entry.duree_minutes % 60
              const dureeStr = heures > 0 ? `${heures}h${mins > 0 ? mins : ''}` : `${mins}min`

              return (
                <div key={entry.id} className="card hover:border-gold-500/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        {humeur?.icon || <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium text-sm">
                            {new Date(entry.date_pratique).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <span className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full">
                            {dureeStr}
                          </span>
                          {humeur && (
                            <span className="text-xs text-noir-500">{humeur.label}</span>
                          )}
                        </div>
                        {entry.morceaux && (
                          <p className="text-noir-400 text-xs mt-1 flex items-center gap-1">
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                          {entry.morceaux}
                        </p>
                        )}
                        {entry.notes && (
                          <p className="text-noir-500 text-xs mt-1 line-clamp-2">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)}
                      className="text-noir-700 hover:text-red-400 p-1.5 rounded-lg transition-colors shrink-0">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                    </button>
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
                <h2 className="text-white font-serif text-xl">Nouvelle séance</h2>
                <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4">
                <form onSubmit={handleCreate} id="journal-form" className="space-y-4">
                  <div>
                    <label className="label mb-1 block">Date</label>
                    <input type="date" value={form.date_pratique}
                      onChange={e => setForm(f => ({ ...f, date_pratique: e.target.value }))}
                      className="input w-full" />
                  </div>
                  <div>
                    <label className="label mb-2 block">Durée</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DUREES.map(d => (
                        <button key={d} type="button" onClick={() => setForm(f => ({ ...f, duree_minutes: d }))}
                          className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                            form.duree_minutes === d
                              ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                              : 'border-noir-700 text-noir-400 hover:border-noir-600'
                          }`}>
                          {d >= 60 ? `${Math.floor(d/60)}h${d%60 > 0 ? d%60 : ''}` : `${d}min`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label mb-2 block">Humeur</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {HUMEURS.map(h => (
                        <button key={h.key} type="button" onClick={() => setForm(f => ({ ...f, humeur: h.key }))}
                          className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs transition-all ${
                            form.humeur === h.key
                              ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                              : 'border-noir-700 text-noir-400 hover:border-noir-600'
                          }`}>
                          <span className="flex items-center justify-center">{h.icon}</span>
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label mb-1 block">Morceaux travaillés</label>
                    <input value={form.morceaux} onChange={e => setForm(f => ({ ...f, morceaux: e.target.value }))}
                      className="input w-full" placeholder="Ex: Nocturne Op.9, Gammes de Do..." />
                  </div>
                  <div>
                    <label className="label mb-1 block">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      className="input w-full h-20 resize-none" placeholder="Ce que j'ai appris, difficultés..." />
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" form="journal-form" disabled={saving} className="btn-gold flex-1">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}