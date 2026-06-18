'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Plus, Trash2, BookOpen } from 'lucide-react'

interface EntreeJournal {
  id: string; date_pratique: string; duree_min: number; contenu: string | null; humeur: string; created_at: string
}

const HUMEURS = [
  { value: 'difficile', label: 'Difficile', icon: <svg width="20" height="20" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { value: 'bien',      label: 'Bien',      icon: <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { value: 'excellent', label: 'Excellent', icon: <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 3 4 3 4-3 4-3"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, color: 'text-gold-400 bg-gold-500/10 border-gold-500/20' },
]

export default function JournalPage() {
  const router = useRouter()
  const [entrees, setEntrees] = useState<EntreeJournal[]>([])
  const [prenom, setPrenom] = useState('')
  const [streak, setStreak] = useState(0)
  const [totalHeures, setTotalHeures] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date_pratique: new Date().toISOString().split('T')[0], duree_min: 30, contenu: '', humeur: 'bien' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/journal').then(r => r.json()),
      fetch('/api/eleve/streak').then(r => r.json()),
    ]).then(([me, data, streakData]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setEntrees(Array.isArray(data) ? data : [])
      setStreak(streakData?.streak_semaines || 0)
      setTotalHeures(streakData?.total_heures_pratique || 0)
    }).finally(() => setLoading(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/eleve/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      const created = await res.json()
      setEntrees(prev => [created, ...prev])
      setTotalHeures(prev => prev + Math.floor(form.duree_min / 60))
      setShowForm(false)
      setForm({ date_pratique: new Date().toISOString().split('T')[0], duree_min: 30, contenu: '', humeur: 'bien' })
      // Recharger le streak
      fetch('/api/eleve/streak').then(r => r.json()).then(d => { setStreak(d.streak_semaines || 0); setTotalHeures(d.total_heures_pratique || 0) })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette entrée ?')) return
    await fetch('/api/eleve/journal', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setEntrees(prev => prev.filter(e => e.id !== id))
  }

  // Grouper par mois
  const grouped: Record<string, EntreeJournal[]> = {}
  for (const e of entrees) {
    const key = new Date(e.date_pratique).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  }

  const totalMinCeMois = entrees.filter(e => {
    const d = new Date(e.date_pratique)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, e) => s + e.duree_min, 0)

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Journal de pratique</h1>
            <p className="text-noir-400 text-sm">Notez vos sessions de pratique quotidiennes</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-gold flex items-center gap-2"><Plus size={16} /> Ajouter une session</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="card text-center py-3 border-orange-500/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <svg width="16" height="16" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <p className="text-2xl font-bold text-orange-400">{streak}</p>
            </div>
            <p className="text-xs text-noir-400">Semaines consécutives</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-gold-400">{totalHeures}h</p>
            <p className="text-xs text-noir-400 mt-0.5">Total pratiqué</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-blue-400">{Math.floor(totalMinCeMois / 60)}h{totalMinCeMois % 60 > 0 ? `${totalMinCeMois % 60}m` : ''}</p>
            <p className="text-xs text-noir-400 mt-0.5">Ce mois-ci</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-purple-400">{entrees.length}</p>
            <p className="text-xs text-noir-400 mt-0.5">Sessions</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : entrees.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="text-noir-600 mx-auto mb-4" />
            <p className="text-white font-semibold text-lg mb-2">Aucune session enregistrée</p>
            <p className="text-noir-400 text-sm max-w-sm mx-auto mb-6">Notez vos sessions de pratique pour suivre votre régularité et vos progrès.</p>
            <button onClick={() => setShowForm(true)} className="btn-gold px-8">Ajouter ma première session</button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([month, items]) => {
              const totalMin = items.reduce((s, e) => s + e.duree_min, 0)
              return (
                <div key={month}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                    <h2 className="text-gold-400 text-sm font-bold uppercase tracking-widest capitalize">{month}</h2>
                    <div className="flex-1 h-px bg-noir-800" />
                    <span className="text-xs text-noir-600">{Math.floor(totalMin / 60)}h{totalMin % 60 > 0 ? `${totalMin % 60}m` : ''} · {items.length} sessions</span>
                  </div>
                  <div className="space-y-2 ml-4">
                    {items.map(e => {
                      const humeur = HUMEURS.find(h => h.value === e.humeur) || HUMEURS[1]
                      return (
                        <div key={e.id} className="card hover:border-gold-500/30 transition-all group">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xl shrink-0">{humeur.icon}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-white font-semibold text-sm capitalize">
                                    {new Date(e.date_pratique).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })}
                                  </p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${humeur.color}`}>{humeur.label}</span>
                                  <span className="text-xs text-gold-400 font-bold">
                                    {e.duree_min >= 60 ? `${Math.floor(e.duree_min / 60)}h${e.duree_min % 60 > 0 ? `${e.duree_min % 60}m` : ''}` : `${e.duree_min}min`}
                                  </span>
                                </div>
                                {e.contenu && <p className="text-noir-400 text-xs mt-1 leading-relaxed">{e.contenu}</p>}
                              </div>
                            </div>
                            <button onClick={() => handleDelete(e.id)} className="text-noir-600 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modale ajout */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'440px'}}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
                <h2 className="text-white font-serif text-xl">Nouvelle session</h2>
                <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4">
                <form onSubmit={handleSubmit} id="journal-form" className="space-y-4">
                  <div><label className="label mb-1 block">Date *</label><input type="date" value={form.date_pratique} onChange={e => setForm(f => ({ ...f, date_pratique: e.target.value }))} className="input w-full" required /></div>
                  <div>
                    <label className="label mb-2 block">Durée : {form.duree_min >= 60 ? `${Math.floor(form.duree_min / 60)}h${form.duree_min % 60 > 0 ? `${form.duree_min % 60}m` : ''}` : `${form.duree_min} min`}</label>
                    <input type="range" min="5" max="180" step="5" value={form.duree_min} onChange={e => setForm(f => ({ ...f, duree_min: parseInt(e.target.value) }))} className="w-full" />
                    <div className="flex justify-between text-xs text-noir-600 mt-1"><span>5 min</span><span>3h</span></div>
                  </div>
                  <div>
                    <label className="label mb-2 block">Comment ça s'est passé ?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {HUMEURS.map(h => (
                        <button key={h.value} type="button" onClick={() => setForm(f => ({ ...f, humeur: h.value }))}
                          className={`py-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${form.humeur === h.value ? h.color : 'text-noir-500 border-noir-700 hover:border-noir-600'}`}>
                          <span>{h.icon}</span>
                          <span className="text-xs">{h.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label className="label mb-1 block">Ce que j'ai travaillé</label><textarea value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} className="input w-full h-20 resize-none" placeholder="Gammes, morceau, exercices..." /></div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" form="journal-form" disabled={saving} className="btn-gold flex-1">{saving ? 'Enregistrement...' : 'Ajouter'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}