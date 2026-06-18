'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Plus, Pencil, Trash2, Target, CheckCircle, Clock } from 'lucide-react'

interface Objectif {
  id: string; titre: string; description: string | null; date_cible: string | null
  statut: string; progres: number; created_at: string
}

const STATUTS = [
  { value: 'en_cours', label: 'En cours',  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { value: 'atteint',  label: 'Atteint',   color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  { value: 'abandonne',label: 'Abandonné', color: 'text-noir-500 bg-noir-800 border-noir-700' },
]

const EMPTY = { titre: '', description: '', date_cible: '', statut: 'en_cours', progres: 0 }

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: `${Math.abs(diff)}j de retard`, color: 'text-red-400' }
  if (diff === 0) return { label: "Aujourd'hui !", color: 'text-orange-400' }
  if (diff <= 7) return { label: `Dans ${diff}j`, color: 'text-orange-400' }
  return { label: `Dans ${diff}j`, color: 'text-noir-400' }
}

export default function ObjectifsPage() {
  const router = useRouter()
  const [objectifs, setObjectifs] = useState<Objectif[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Objectif | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/objectifs').then(r => r.json()),
    ]).then(([me, data]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setObjectifs(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [router])

  function openCreate() { setForm({ ...EMPTY }); setEditTarget(null); setShowForm(true) }
  function openEdit(o: Objectif) {
    setForm({ titre: o.titre, description: o.description || '', date_cible: o.date_cible || '', statut: o.statut, progres: o.progres })
    setEditTarget(o); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { titre: form.titre, description: form.description || null, date_cible: form.date_cible || null, statut: form.statut, progres: form.progres }
    if (editTarget) {
      const res = await fetch('/api/eleve/objectifs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editTarget.id, ...payload }) })
      if (res.ok) { const u = await res.json(); setObjectifs(prev => prev.map(o => o.id === editTarget.id ? u : o)) }
    } else {
      const res = await fetch('/api/eleve/objectifs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const c = await res.json(); setObjectifs(prev => [c, ...prev]) }
    }
    setShowForm(false); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet objectif ?')) return
    await fetch('/api/eleve/objectifs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setObjectifs(prev => prev.filter(o => o.id !== id))
  }

  async function updateProgres(o: Objectif, progres: number) {
    const newStatut = progres >= 100 ? 'atteint' : o.statut === 'atteint' ? 'en_cours' : o.statut
    const res = await fetch('/api/eleve/objectifs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: o.id, progres, statut: newStatut }) })
    if (res.ok) { const u = await res.json(); setObjectifs(prev => prev.map(x => x.id === o.id ? u : x)) }
  }

  const enCours = objectifs.filter(o => o.statut === 'en_cours')
  const atteints = objectifs.filter(o => o.statut === 'atteint')

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-xl md:text-3xl text-white mb-1 animate-fade-in-up">Mes objectifs</h1>
            <p className="text-noir-400 text-sm">Définissez vos objectifs musicaux et suivez votre progression</p>
          </div>
          <button onClick={openCreate} className="btn-gold flex items-center gap-2"><Plus size={16} /> Nouvel objectif</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="card text-center py-3"><p className="text-2xl font-bold text-blue-400">{enCours.length}</p><p className="text-xs text-noir-400 mt-0.5">En cours</p></div>
          <div className="card text-center py-3"><p className="text-2xl font-bold text-green-400">{atteints.length}</p><p className="text-xs text-noir-400 mt-0.5">Atteints</p></div>
          <div className="card text-center py-3"><p className="text-2xl font-bold text-gold-400">{objectifs.length}</p><p className="text-xs text-noir-400 mt-0.5">Total</p></div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : objectifs.length === 0 ? (
          <div className="card text-center py-16">
            <Target size={40} className="text-noir-600 mx-auto mb-4" />
            <p className="text-white font-semibold text-lg mb-2">Aucun objectif défini</p>
            <p className="text-noir-400 text-sm max-w-sm mx-auto mb-6">Définissez un objectif musical pour rester motivé et suivre votre progression.</p>
            <button onClick={openCreate} className="btn-gold px-8">Créer mon premier objectif</button>
          </div>
        ) : (
          <div className="space-y-4">
            {objectifs.map(o => {
              const statut = STATUTS.find(s => s.value === o.statut) || STATUTS[0]
              const dl = daysLeft(o.date_cible)
              return (
                <div key={o.id} className={`card transition-all ${o.statut === 'atteint' ? 'border-green-500/20 bg-green-500/3' : 'hover:border-gold-500/30'}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${statut.color}`}>
                        {o.statut === 'atteint' ? <CheckCircle size={16} /> : <Target size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm ${o.statut === 'atteint' ? 'text-green-400' : 'text-white'}`}>{o.titre}</p>
                        {o.date_cible && dl && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${dl.color}`}>
                            <Clock size={10} /> {dl.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(o)} className="text-noir-500 hover:text-gold-400 p-1 rounded transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(o.id)} className="text-noir-500 hover:text-red-400 p-1 rounded transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>

                  {o.description && <p className="text-noir-400 text-xs mb-3 leading-relaxed">{o.description}</p>}

                  {/* Barre de progression interactive */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-noir-500">Progression</span>
                      <span className={`text-sm font-bold ${o.progres >= 100 ? 'text-green-400' : 'text-gold-400'}`}>{o.progres}%</span>
                    </div>
                    <div className="w-full bg-noir-800 rounded-full h-3 cursor-pointer overflow-hidden"
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                        updateProgres(o, Math.min(100, Math.max(0, pct)))
                      }}>
                      <div className={`h-3 rounded-full transition-all duration-300 ${o.progres >= 100 ? 'bg-green-500' : 'bg-gold-500'}`} style={{ width: `${o.progres}%` }} />
                    </div>
                    <div className="flex gap-1">
                      {[0, 25, 50, 75, 100].map(p => (
                        <button key={p} onClick={() => updateProgres(o, p)}
                          className={`flex-1 text-[10px] py-1 rounded transition-all ${o.progres === p ? 'bg-gold-500 text-noir-950 font-bold' : 'text-noir-600 hover:text-noir-300'}`}>
                          {p}%
                        </button>
                      ))}
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
            <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'440px'}}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
                <h2 className="text-white font-serif text-xl">{editTarget ? 'Modifier' : 'Nouvel objectif'}</h2>
                <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4">
                <form onSubmit={handleSubmit} id="obj-form" className="space-y-4">
                  <div><label className="label mb-1 block">Objectif *</label><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Ex: Jouer Amazing Grace en entier" /></div>
                  <div><label className="label mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input w-full h-16 resize-none" placeholder="Détails, contexte..." /></div>
                  <div><label className="label mb-1 block">Date cible</label><input type="date" value={form.date_cible} onChange={e => setForm(f => ({ ...f, date_cible: e.target.value }))} className="input w-full" /></div>
                  <div>
                    <label className="label mb-2 block">Statut</label>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUTS.map(s => (
                        <button key={s.value} type="button" onClick={() => setForm(f => ({ ...f, statut: s.value }))}
                          className={`py-2 rounded-xl border text-xs font-medium transition-all ${form.statut === s.value ? s.color : 'text-noir-500 border-noir-700 hover:border-noir-600'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label mb-2 block">Progression : {form.progres}%</label>
                    <input type="range" min="0" max="100" value={form.progres} onChange={e => setForm(f => ({ ...f, progres: parseInt(e.target.value) }))} className="w-full" />
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" form="obj-form" disabled={saving} className="btn-gold flex-1">{saving ? 'Enregistrement...' : editTarget ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}