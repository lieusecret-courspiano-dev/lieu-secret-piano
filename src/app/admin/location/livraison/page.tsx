'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Truck, Save } from 'lucide-react'

interface Zone {
  id: string
  nom: string
  distance_min: number
  distance_max: number | null
  tarif: number | null
  sur_devis: boolean
  actif: boolean
  position: number
}

const EMPTY_FORM = {
  nom: '', distance_min: '0', distance_max: '', tarif: '', sur_devis: false, actif: true, position: '0',
}

export default function AdminLocationLivraisonPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadZones() }, [])

  async function loadZones() {
    setLoading(true)
    const data = await fetch('/api/admin/location/livraison').then(r => r.json()).catch(() => [])
    setZones(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openEdit(z: Zone) {
    setEditId(z.id)
    setShowNew(false)
    setForm({
      nom: z.nom,
      distance_min: z.distance_min.toString(),
      distance_max: z.distance_max?.toString() || '',
      tarif: z.tarif?.toString() || '',
      sur_devis: z.sur_devis,
      actif: z.actif,
      position: z.position.toString(),
    })
  }

  function openNew() {
    setEditId(null)
    setShowNew(true)
    setForm({ ...EMPTY_FORM, position: zones.length.toString() })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        nom: form.nom,
        distance_min: parseInt(form.distance_min) || 0,
        distance_max: form.distance_max ? parseInt(form.distance_max) : null,
        tarif: form.sur_devis ? null : (form.tarif ? parseFloat(form.tarif) : null),
        sur_devis: form.sur_devis,
        actif: form.actif,
        position: parseInt(form.position) || 0,
      }
      if (editId) {
        await fetch('/api/admin/location/livraison', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload }),
        })
      } else {
        await fetch('/api/admin/location/livraison', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      await loadZones()
      setEditId(null)
      setShowNew(false)
    } catch { alert('Erreur lors de la sauvegarde') }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette zone ?')) return
    await fetch('/api/admin/location/livraison', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    setZones(prev => prev.filter(z => z.id !== id))
  }

  async function toggleActif(z: Zone) {
    await fetch('/api/admin/location/livraison', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: z.id, actif: !z.actif }),
    })
    setZones(prev => prev.map(x => x.id === z.id ? { ...x, actif: !x.actif } : x))
  }

  function fTarif(z: Zone) {
    if (z.sur_devis) return 'Sur devis'
    if (z.tarif === null) return 'À définir'
    if (z.tarif === 0) return 'Gratuit'
    return z.tarif.toFixed(2).replace('.', ',') + ' €'
  }

  const ZoneForm = () => (
    <form onSubmit={handleSave} className="card border-gold-500/20 space-y-4">
      <h3 className="text-white font-semibold">{editId ? 'Modifier la zone' : 'Nouvelle zone'}</h3>
      <div>
        <label className="label mb-1.5 block">Nom de la zone *</label>
        <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          className="input w-full" placeholder="Ex : Proche banlieue (15–30 km)" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label mb-1.5 block">Distance min (km)</label>
          <input type="number" min="0" value={form.distance_min}
            onChange={e => setForm(f => ({ ...f, distance_min: e.target.value }))}
            className="input w-full" placeholder="0" />
        </div>
        <div>
          <label className="label mb-1.5 block">Distance max (km) — vide = illimité</label>
          <input type="number" min="0" value={form.distance_max}
            onChange={e => setForm(f => ({ ...f, distance_max: e.target.value }))}
            className="input w-full" placeholder="30" />
        </div>
      </div>
      <div>
        <label className="label mb-2 block">Type de tarif</label>
        <div className="flex gap-2 mb-3">
          {[{ v: false, l: 'Tarif fixe' }, { v: true, l: 'Sur devis' }].map(x => (
            <button key={String(x.v)} type="button"
              onClick={() => setForm(f => ({ ...f, sur_devis: x.v }))}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                form.sur_devis === x.v
                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                  : 'border-noir-700 text-noir-400'
              }`}>
              {x.l}
            </button>
          ))}
        </div>
        {!form.sur_devis && (
          <div>
            <label className="label mb-1.5 block">Tarif (€) — 0 = gratuit</label>
            <input type="number" step="0.01" min="0" value={form.tarif}
              onChange={e => setForm(f => ({ ...f, tarif: e.target.value }))}
              className="input w-full" placeholder="10.00" />
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label mb-2 block">Statut</label>
          <div className="flex gap-2">
            {[{ v: true, l: 'Active' }, { v: false, l: 'Inactive' }].map(x => (
              <button key={String(x.v)} type="button"
                onClick={() => setForm(f => ({ ...f, actif: x.v }))}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                  form.actif === x.v
                    ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                    : 'border-noir-700 text-noir-400'
                }`}>
                {x.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label mb-1.5 block">Position d'affichage</label>
          <input type="number" min="0" value={form.position}
            onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
            className="input w-full" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => { setEditId(null); setShowNew(false) }} className="btn-outline text-sm">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="btn-gold flex items-center gap-2 text-sm">
          <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Zones de livraison</h1>
          <p className="text-noir-400 text-sm mt-1">
            Définissez vos tarifs de livraison selon la distance depuis Saint-Étienne
          </p>
        </div>
        {!showNew && !editId && (
          <button onClick={openNew} className="btn-gold flex items-center gap-2">
            <Plus size={16} /> Nouvelle zone
          </button>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Truck size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm font-medium">Comment ça fonctionne</p>
          <p className="text-blue-400/70 text-xs mt-1 leading-relaxed">
            Lors d'une demande de livraison, le client saisit son adresse. Les frais sont calculés
            automatiquement selon la distance entre Saint-Étienne et son adresse.
            Les zones inactives ne sont pas proposées aux clients.
          </p>
        </div>
      </div>

      {/* Formulaire nouvelle zone */}
      {showNew && <div className="mb-6 max-w-2xl"><ZoneForm /></div>}

      {/* Liste des zones */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {zones.sort((a, b) => a.position - b.position).map(z => (
            <div key={z.id}>
              {editId === z.id ? (
                <ZoneForm />
              ) : (
                <div className={`card flex items-center justify-between gap-4 flex-wrap ${!z.actif ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                      <Truck size={16} className="text-gold-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-medium text-sm">{z.nom}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          z.actif ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-noir-500 border-noir-700'
                        }`}>
                          {z.actif ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-noir-400 text-xs mt-0.5">
                        {z.distance_min} km → {z.distance_max ? `${z.distance_max} km` : 'illimité'}
                        {' · '}
                        <span className={z.sur_devis ? 'text-amber-400' : z.tarif === 0 ? 'text-green-400' : 'text-white'}>
                          {fTarif(z)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActif(z)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        z.actif ? 'text-green-400 border-green-500/20 hover:border-red-500/20 hover:text-red-400'
                          : 'text-noir-500 border-noir-700 hover:text-green-400 hover:border-green-500/20'
                      }`}>
                      {z.actif ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onClick={() => openEdit(z)} className="text-noir-600 hover:text-gold-400 p-1.5 rounded transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(z.id)} className="text-noir-600 hover:text-red-400 p-1.5 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}