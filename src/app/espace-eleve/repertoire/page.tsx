'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Plus, Pencil, Trash2, ExternalLink, Music } from 'lucide-react'

interface Morceau {
  id: string; titre: string; compositeur: string | null; statut: string
  notes: string | null; lien_url: string | null; created_at: string
}

const STATUTS = [
  { value: 'souhaite',  label: 'À apprendre',  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',   dot: 'bg-blue-400' },
  { value: 'en_cours', label: 'En cours',      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  { value: 'maitrise', label: 'Maîtrisé',      color: 'text-green-400 bg-green-500/10 border-green-500/20',  dot: 'bg-green-400' },
]

const EMPTY = { titre: '', compositeur: '', statut: 'en_cours', notes: '', lien_url: '' }

export default function RepertoirePage() {
  const router = useRouter()
  const [morceaux, setMorceaux] = useState<Morceau[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Morceau | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [filterStatut, setFilterStatut] = useState('tous')

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/repertoire').then(r => r.json()),
    ]).then(([me, data]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setMorceaux(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [router])

  function openCreate() { setForm({ ...EMPTY }); setEditTarget(null); setShowForm(true) }
  function openEdit(m: Morceau) {
    setForm({ titre: m.titre, compositeur: m.compositeur || '', statut: m.statut, notes: m.notes || '', lien_url: m.lien_url || '' })
    setEditTarget(m); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { titre: form.titre, compositeur: form.compositeur || null, statut: form.statut, notes: form.notes || null, lien_url: form.lien_url || null }
    if (editTarget) {
      const res = await fetch('/api/eleve/repertoire', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editTarget.id, ...payload }) })
      if (res.ok) { const updated = await res.json(); setMorceaux(prev => prev.map(m => m.id === editTarget.id ? updated : m)) }
    } else {
      const res = await fetch('/api/eleve/repertoire', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const created = await res.json(); setMorceaux(prev => [created, ...prev]) }
    }
    setShowForm(false); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce morceau ?')) return
    await fetch('/api/eleve/repertoire', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setMorceaux(prev => prev.filter(m => m.id !== id))
  }

  async function changeStatut(m: Morceau, statut: string) {
    const res = await fetch('/api/eleve/repertoire', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, statut }) })
    if (res.ok) { const updated = await res.json(); setMorceaux(prev => prev.map(x => x.id === m.id ? updated : x)) }
  }

  const filtered = filterStatut === 'tous' ? morceaux : morceaux.filter(m => m.statut === filterStatut)
  const stats = { souhaite: morceaux.filter(m => m.statut === 'souhaite').length, en_cours: morceaux.filter(m => m.statut === 'en_cours').length, maitrise: morceaux.filter(m => m.statut === 'maitrise').length }

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">

        {/* Titre */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Mon Répertoire</h1>
            <p className="text-noir-400 text-sm">Gérez les morceaux que vous apprenez ou souhaitez apprendre</p>
          </div>
          <button onClick={openCreate} className="btn-gold flex items-center gap-2">
            <Plus size={16} /> Ajouter un morceau
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {STATUTS.map(s => (
            <div key={s.value} className="card text-center py-3 cursor-pointer hover:border-gold-500/30 transition-all" onClick={() => setFilterStatut(filterStatut === s.value ? 'tous' : s.value)}>
              <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{stats[s.value as keyof typeof stats]}</p>
              <p className="text-xs text-noir-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1 mb-6 w-fit flex-wrap">
          <button onClick={() => setFilterStatut('tous')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatut === 'tous' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
            Tous ({morceaux.length})
          </button>
          {STATUTS.map(s => (
            <button key={s.value} onClick={() => setFilterStatut(s.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatut === s.value ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Music size={40} className="text-noir-600 mx-auto mb-4" />
            <p className="text-noir-400 text-lg font-medium">
              {filterStatut === 'tous' ? 'Votre répertoire est vide' : `Aucun morceau "${STATUTS.find(s => s.value === filterStatut)?.label}"`}
            </p>
            <p className="text-noir-600 text-sm mt-1">Ajoutez les morceaux que vous travaillez ou souhaitez apprendre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map(m => {
              const statut = STATUTS.find(s => s.value === m.statut) || STATUTS[1]
              return (
                <div key={m.id} className="card hover:border-gold-500/30 transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statut.dot}`} />
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm leading-tight truncate">{m.titre}</h3>
                        {m.compositeur && <p className="text-noir-500 text-xs mt-0.5 truncate">{m.compositeur}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(m)} className="text-noir-500 hover:text-gold-400 p-1 rounded transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(m.id)} className="text-noir-500 hover:text-red-400 p-1 rounded transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>

                  {/* Sélecteur de statut */}
                  <div className="flex gap-1 mb-3">
                    {STATUTS.map(s => (
                      <button key={s.value} onClick={() => changeStatut(m, s.value)}
                        className={`flex-1 text-[10px] py-1 rounded-lg border transition-all font-medium ${m.statut === s.value ? s.color : 'text-noir-600 border-noir-700 hover:border-noir-600'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {m.notes && <p className="text-noir-400 text-xs mb-2 line-clamp-2 leading-relaxed">{m.notes}</p>}

                  {m.lien_url && (
                    <a href={m.lien_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors mt-2">
                      <ExternalLink size={11} /> Voir la partition / vidéo
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Modale ajout/modification */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'440px'}}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
                <h2 className="text-white font-serif text-xl">{editTarget ? 'Modifier' : 'Ajouter un morceau'}</h2>
                <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4">
                <form onSubmit={handleSubmit} id="rep-form" className="space-y-4">
                  <div><label className="label mb-1 block">Titre du morceau *</label><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Ex: Clair de Lune" /></div>
                  <div><label className="label mb-1 block">Compositeur</label><input value={form.compositeur} onChange={e => setForm(f => ({ ...f, compositeur: e.target.value }))} className="input w-full" placeholder="Ex: Claude Debussy" /></div>
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
                  <div><label className="label mb-1 block">Notes personnelles</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input w-full h-16 resize-none" placeholder="Difficultés, objectifs, remarques..." /></div>
                  <div><label className="label mb-1 block">Lien (YouTube, partition...)</label><input type="url" value={form.lien_url} onChange={e => setForm(f => ({ ...f, lien_url: e.target.value }))} className="input w-full" placeholder="https://..." /></div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" form="rep-form" disabled={saving} className="btn-gold flex-1">{saving ? 'Enregistrement...' : editTarget ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}