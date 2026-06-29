'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Users, Clock, CheckCircle } from 'lucide-react'

interface Travail {
  id: string
  titre: string
  description: string | null
  consignes: string | null
  ressource_url: string | null
  echeance: string | null
  created_at: string
  travaux_eleves: {
    id: string; eleve_id: string; termine: boolean; termine_at: string | null
    eleves: { prenom: string; nom: string; email: string } | null
  }[]
}
interface Eleve { id: string; prenom: string; nom: string; email: string }

const EMPTY_FORM = { titre: '', description: '', consignes: '', ressource_url: '', echeance: '', eleve_ids: [] as string[] }

export default function AdminTravauxPage() {
  const [travaux, setTravaux] = useState<Travail[]>([])
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Travail | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [tw, elv] = await Promise.all([
      fetch('/api/admin/travaux').then(r => r.json()),
      fetch('/api/admin/eleves').then(r => r.json()),
    ])
    setTravaux(Array.isArray(tw) ? tw : [])
    setEleves(Array.isArray(elv) ? elv : [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setEditTarget(null)
    setShowForm(true)
  }

  function openEdit(t: Travail) {
    setForm({
      titre: t.titre,
      description: t.description || '',
      consignes: t.consignes || '',
      ressource_url: t.ressource_url || '',
      echeance: t.echeance || '',
      eleve_ids: t.travaux_eleves.map(te => te.eleve_id),
    })
    setEditTarget(t)
    setShowForm(true)
  }

  function toggleEleve(id: string) {
    setForm(f => ({
      ...f,
      eleve_ids: f.eleve_ids.includes(id) ? f.eleve_ids.filter(e => e !== id) : [...f.eleve_ids, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titre.trim()) return
    setSaving(true)

    const payload = {
      titre: form.titre,
      description: form.description || null,
      consignes: form.consignes || null,
      ressource_url: form.ressource_url || null,
      echeance: form.echeance || null,
      eleve_ids: form.eleve_ids,
    }

    if (editTarget) {
      await fetch('/api/admin/travaux', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id, ...payload }),
      })
    } else {
      await fetch('/api/admin/travaux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    await loadData()
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce travail ?')) return
    await fetch('/api/admin/travaux', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setTravaux(prev => prev.filter(t => t.id !== id))
  }

  const totalAssignations = travaux.reduce((s, t) => s + t.travaux_eleves.length, 0)
  const totalTermines = travaux.reduce((s, t) => s + t.travaux_eleves.filter(te => te.termine).length, 0)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Travaux à faire</h1>
          <p className="text-noir-400 text-sm mt-1">Assignez des exercices à vos élèves</p>
        </div>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Créer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-gold-400">{travaux.length}</p>
          <p className="text-xs text-noir-400 mt-0.5">Travaux créés</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-blue-400">{totalAssignations}</p>
          <p className="text-xs text-noir-400 mt-0.5">Assignations</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-green-400">{totalTermines}</p>
          <p className="text-xs text-noir-400 mt-0.5">Terminés</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : travaux.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-noir-400 text-lg">Aucun travail créé</p>
          <p className="text-noir-600 text-sm mt-1">Cliquez sur "Créer" pour assigner un exercice à vos élèves.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {travaux.map(t => {
            const nbTermines = t.travaux_eleves.filter(te => te.termine).length
            const nbTotal = t.travaux_eleves.length
            const isExpanded = expanded === t.id
            const isLate = t.echeance && new Date(t.echeance) < new Date()

            return (
              <div key={t.id} className="card hover:border-gold-500/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold text-base">{t.titre}</h3>
                      {t.echeance && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${isLate ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-noir-400 border-noir-700'}`}>
                          {isLate ? 'Expiré' : new Date(t.echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                    {t.description && <p className="text-noir-400 text-sm mt-1 line-clamp-2">{t.description}</p>}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-noir-500">
                        <Users size={12} /> {nbTotal} élève{nbTotal > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle size={12} /> {nbTermines}/{nbTotal} terminés
                      </span>
                      {t.echeance && (
                        <span className="flex items-center gap-1 text-xs text-noir-500">
                          <Clock size={12} /> {new Date(t.echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setExpanded(isExpanded ? null : t.id)}
                      className="text-noir-500 hover:text-gold-400 p-1.5 rounded-lg hover:bg-noir-800 transition-colors" title="Voir les élèves">
                      <Users size={14} />
                    </button>
                    <button onClick={() => openEdit(t)}
                      className="text-noir-500 hover:text-gold-400 p-1.5 rounded-lg hover:bg-noir-800 transition-colors" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className="text-noir-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-noir-800 transition-colors" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Barre de progression */}
                {nbTotal > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-noir-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${Math.round((nbTermines / nbTotal) * 100)}%` }} />
                    </div>
                  </div>
                )}

                {/* Liste des élèves */}
                {isExpanded && t.travaux_eleves.length > 0 && (
                  <div className="mt-3 border-t border-noir-800 pt-3 space-y-1.5">
                    {t.travaux_eleves.map(te => (
                      <div key={te.id} className="flex items-center justify-between text-sm">
                        <span className="text-noir-300">{te.eleves?.prenom} {te.eleves?.nom}</span>
                        <span className={`flex items-center gap-1 text-xs ${te.termine ? 'text-green-400' : 'text-noir-500'}`}>
                          {te.termine ? <><CheckCircle size={12} /> Terminé</> : 'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modale création/modification */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'480px'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">{editTarget ? 'Modifier le travail' : 'Créer un travail'}</h2>
              <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSubmit} id="travail-form" className="space-y-4">
                <div>
                  <label className="label mb-1 block">Titre *</label>
                  <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Ex: Gamme de Do majeur" />
                </div>
                <div>
                  <label className="label mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input w-full h-16 resize-none" placeholder="Brève description du travail..." />
                </div>
                <div>
                  <label className="label mb-1 block">Consignes détaillées</label>
                  <textarea value={form.consignes} onChange={e => setForm(f => ({ ...f, consignes: e.target.value }))} className="input w-full h-24 resize-none" placeholder="Instructions précises pour l'élève..." />
                </div>
                <div>
                  <label className="label mb-1 block">Lien ressource (optionnel)</label>
                  <input value={form.ressource_url} onChange={e => setForm(f => ({ ...f, ressource_url: e.target.value }))} className="input w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="label mb-1 block">Échéance (optionnel)</label>
                  <input type="date" value={form.echeance} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="label mb-2 block">Assigner aux élèves</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {eleves.map(e => (
                      <label key={e.id} className="flex items-center gap-3 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-noir-800/50 transition-colors">
                        <input type="checkbox" checked={form.eleve_ids.includes(e.id)} onChange={() => toggleEleve(e.id)} className="w-4 h-4 accent-gold-500" />
                        <span className="text-sm text-noir-300">{e.prenom} {e.nom}</span>
                        <span className="text-xs text-noir-600 ml-auto">{e.email}</span>
                      </label>
                    ))}
                    {eleves.length === 0 && <p className="text-noir-500 text-sm">Aucun élève trouvé</p>}
                  </div>
                  {form.eleve_ids.length > 0 && (
                    <p className="text-xs text-gold-400 mt-2">{form.eleve_ids.length} élève{form.eleve_ids.length > 1 ? 's' : ''} sélectionné{form.eleve_ids.length > 1 ? 's' : ''}</p>
                  )}
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
              <button type="submit" form="travail-form" disabled={saving} className="btn-gold flex-1">
                {saving ? 'Enregistrement...' : editTarget ? 'Enregistrer' : 'Créer et envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}