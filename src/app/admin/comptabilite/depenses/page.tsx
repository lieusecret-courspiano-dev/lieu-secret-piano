'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Trash2, Pencil, Upload, TrendingDown } from 'lucide-react'

interface Depense {
  id: string
  date_depense: string
  categorie: string
  designation: string
  fournisseur: string | null
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  moyen_paiement: string | null
  numero_piece: string | null
  justificatif_url: string | null
  notes: string | null
}

const CATEGORIES = [
  { value: 'logiciel',        label: 'Logiciel / Abonnement',  color: 'text-blue-400' },
  { value: 'materiel',        label: 'Matériel / Équipement',  color: 'text-purple-400' },
  { value: 'formation',       label: 'Formation',              color: 'text-gold-400' },
  { value: 'marketing',       label: 'Marketing / Pub',        color: 'text-pink-400' },
  { value: 'frais_bancaires', label: 'Frais bancaires',        color: 'text-red-400' },
  { value: 'assurance',       label: 'Assurance',              color: 'text-orange-400' },
  { value: 'telephone',       label: 'Téléphone / Internet',   color: 'text-cyan-400' },
  { value: 'deplacement',     label: 'Déplacement',            color: 'text-teal-400' },
  { value: 'fournitures',     label: 'Fournitures',            color: 'text-green-400' },
  { value: 'cotisations',     label: 'Cotisations / Urssaf',   color: 'text-amber-400' },
  { value: 'autre',           label: 'Autre',                  color: 'text-noir-400' },
]

const PAIEMENT = ['virement', 'carte', 'especes', 'cheque', 'prelevement']

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EMPTY_FORM = {
  date_depense: new Date().toISOString().split('T')[0],
  categorie: 'logiciel', designation: '', fournisseur: '',
  montant_ttc: '', taux_tva: '0', moyen_paiement: 'virement',
  numero_piece: '', notes: '',
}

export default function DepensesPage() {
  const currentYear = new Date().getFullYear()
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [annee, setAnnee] = useState(currentYear)
  const [categorie, setCategorie] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Depense | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [uploadingJustif, setUploadingJustif] = useState(false)
  const [justifUrl, setJustifUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { loadDepenses() }, [annee, categorie])

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => loadDepenses(), 400)
  }, [search])

  async function loadDepenses() {
    setLoading(true)
    const params = new URLSearchParams({ annee: annee.toString() })
    if (categorie) params.set('categorie', categorie)
    if (search)    params.set('search', search)
    const res = await fetch(`/api/admin/comptabilite/depenses?${params}`, { credentials: 'include' })
    const data = await res.json()
    setDepenses(data.depenses || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  function openNew() {
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
    setJustifUrl('')
    setShowForm(true)
  }

  function openEdit(d: Depense) {
    setEditItem(d)
    setForm({
      date_depense:   d.date_depense,
      categorie:      d.categorie,
      designation:    d.designation,
      fournisseur:    d.fournisseur || '',
      montant_ttc:    d.montant_ttc.toString(),
      taux_tva:       d.taux_tva.toString(),
      moyen_paiement: d.moyen_paiement || 'virement',
      numero_piece:   d.numero_piece || '',
      notes:          d.notes || '',
    })
    setJustifUrl(d.justificatif_url || '')
    setShowForm(true)
  }

  async function uploadJustificatif(file: File) {
    setUploadingJustif(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'depenses')
      const res = await fetch('/api/admin/location/upload', { method: 'POST', body: fd, credentials: 'include' })
      const data = await res.json()
      if (data.url) setJustifUrl(data.url)
    } catch { alert("Erreur lors de l'upload") }
    setUploadingJustif(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, justificatif_url: justifUrl || null }
      const method = editItem ? 'PATCH' : 'POST'
      const body   = editItem ? { id: editItem.id, ...payload } : payload
      const res = await fetch('/api/admin/comptabilite/depenses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      await loadDepenses()
      setShowForm(false)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return
    await fetch('/api/admin/comptabilite/depenses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      credentials: 'include',
    })
    setDepenses(prev => prev.filter(d => d.id !== id))
  }

  // Totaux
  const totalTTC  = depenses.reduce((s, d) => s + (d.montant_ttc || 0), 0)
  const totalHT   = depenses.reduce((s, d) => s + (d.montant_ht || 0), 0)
  const totalTVA  = depenses.reduce((s, d) => s + (d.montant_tva || 0), 0)

  // Par catégorie
  const parCategorie = CATEGORIES.map(c => ({
    ...c,
    total: depenses.filter(d => d.categorie === c.value).reduce((s, d) => s + (d.montant_ttc || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  // Montant TTC calculé en temps réel
  const montantTTC = parseFloat(form.montant_ttc) || 0
  const tauxTVA    = parseFloat(form.taux_tva) || 0
  const montantTVA = tauxTVA > 0 ? Math.round(montantTTC * (tauxTVA / (100 + tauxTVA)) * 100) / 100 : 0
  const montantHT  = Math.round((montantTTC - montantTVA) * 100) / 100

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Dépenses & Charges</h1>
          <p className="text-noir-400 text-sm mt-1">
            {total} dépense{total > 1 ? 's' : ''} — Total TTC : {fmt(totalTTC)}
            {totalTVA > 0 && ` (TVA déductible : ${fmt(totalTVA)})`}
          </p>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Nouvelle dépense
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total TTC', value: fmt(totalTTC), color: 'text-red-400' },
          { label: 'Total HT', value: fmt(totalHT), color: 'text-amber-400' },
          { label: 'TVA déductible', value: fmt(totalTVA), color: 'text-blue-400' },
          { label: 'Nb dépenses', value: total.toString(), color: 'text-noir-300' },
        ].map((k, i) => (
          <div key={i} className="card">
            <div className={`text-xl font-bold ${k.color} mb-1`}>{k.value}</div>
            <div className="text-noir-500 text-xs uppercase tracking-wider">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Répartition par catégorie */}
      {parCategorie.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-white font-medium mb-4 text-sm">Répartition par catégorie</h2>
          <div className="space-y-2">
            {parCategorie.map(c => (
              <div key={c.value}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={c.color}>{c.label}</span>
                  <span className="text-white">{fmt(c.total)}</span>
                </div>
                <div className="w-full bg-noir-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-red-500/70"
                    style={{ width: `${Math.round((c.total / totalTTC) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSave} className="card mb-6 space-y-4">
          <h2 className="text-white font-semibold">{editItem ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Date *</label>
              <input type="date" value={form.date_depense} onChange={e => setForm(f => ({ ...f, date_depense: e.target.value }))}
                className="input w-full" required />
            </div>
            <div>
              <label className="label mb-1.5 block">Catégorie *</label>
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="input w-full">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Désignation *</label>
              <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                className="input w-full" placeholder="Ex : Abonnement Zoom Pro" required />
            </div>
            <div>
              <label className="label mb-1.5 block">Fournisseur</label>
              <input value={form.fournisseur} onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))}
                className="input w-full" placeholder="Ex : Zoom Video Communications" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label mb-1.5 block">Montant TTC (€) *</label>
              <input type="number" step="0.01" min="0" value={form.montant_ttc}
                onChange={e => setForm(f => ({ ...f, montant_ttc: e.target.value }))}
                className="input w-full" placeholder="0.00" required />
            </div>
            <div>
              <label className="label mb-1.5 block">Taux TVA (%)</label>
              <select value={form.taux_tva} onChange={e => setForm(f => ({ ...f, taux_tva: e.target.value }))} className="input w-full">
                <option value="0">0% (sans TVA)</option>
                <option value="5.5">5,5%</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
              </select>
            </div>
            <div>
              <label className="label mb-1.5 block">Moyen de paiement</label>
              <select value={form.moyen_paiement} onChange={e => setForm(f => ({ ...f, moyen_paiement: e.target.value }))} className="input w-full">
                {PAIEMENT.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Calcul automatique */}
          {montantTTC > 0 && (
            <div className="bg-noir-800 rounded-xl p-3 text-xs text-noir-400 flex gap-4">
              <span>HT : <span className="text-white">{fmt(montantHT)}</span></span>
              <span>TVA : <span className="text-white">{fmt(montantTVA)}</span></span>
              <span>TTC : <span className="text-gold-400 font-semibold">{fmt(montantTTC)}</span></span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">N° pièce / facture fournisseur</label>
              <input value={form.numero_piece} onChange={e => setForm(f => ({ ...f, numero_piece: e.target.value }))}
                className="input w-full" placeholder="Ex : FACT-2026-1234" />
            </div>
            <div>
              <label className="label mb-1.5 block">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input w-full" placeholder="Notes internes..." />
            </div>
          </div>

          {/* Justificatif */}
          <div>
            <label className="label mb-2 block">Justificatif (facture fournisseur)</label>
            {justifUrl ? (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <span className="text-green-400 text-sm flex-1 truncate">✓ Justificatif uploadé</span>
                <a href={justifUrl} target="_blank" rel="noopener noreferrer"
                  className="text-gold-400 text-xs hover:text-gold-300">Voir</a>
                <button type="button" onClick={() => setJustifUrl('')} className="text-noir-500 hover:text-red-400">✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                disabled={uploadingJustif}
                className="w-full border-2 border-dashed border-noir-700 hover:border-gold-500/50 rounded-xl p-4 flex items-center justify-center gap-2 text-noir-500 hover:text-gold-400 transition-colors text-sm">
                {uploadingJustif ? (
                  <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Upload size={16} /> Uploader le justificatif (PDF ou image)</>
                )}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => { if (e.target.files?.[0]) uploadJustificatif(e.target.files[0]) }} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            <button type="submit" disabled={saving} className="btn-gold">
              {saving ? 'Enregistrement...' : editItem ? 'Modifier' : 'Ajouter la dépense'}
            </button>
          </div>
        </form>
      )}

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input w-full pl-9 text-sm" placeholder="Rechercher..." />
          </div>
          <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1">
            {[currentYear, currentYear - 1, currentYear - 2].filter(a => a >= 2024).map(a => (
              <button key={a} onClick={() => setAnnee(a)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${annee === a ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                {a}
              </button>
            ))}
          </div>
          <select value={categorie} onChange={e => setCategorie(e.target.value)} className="input text-sm w-48">
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : depenses.length === 0 ? (
        <div className="card text-center py-16">
          <TrendingDown size={40} className="text-noir-700 mx-auto mb-4" />
          <p className="text-noir-400 text-lg mb-2">Aucune dépense enregistrée</p>
          <button onClick={openNew} className="btn-gold mt-2">Ajouter la première dépense</button>
        </div>
      ) : (
        <div className="space-y-2">
          {depenses.map(d => {
            const cat = CATEGORIES.find(c => c.value === d.categorie)
            return (
              <div key={d.id} className="card flex items-center justify-between gap-4 flex-wrap hover:border-noir-700 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <TrendingDown size={16} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-white font-medium text-sm">{d.designation}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-noir-800 border border-noir-700 ${cat?.color || 'text-noir-400'}`}>
                        {cat?.label || d.categorie}
                      </span>
                    </div>
                    <p className="text-noir-500 text-xs">
                      {fDate(d.date_depense)}
                      {d.fournisseur && ` · ${d.fournisseur}`}
                      {d.numero_piece && ` · Réf: ${d.numero_piece}`}
                      {d.moyen_paiement && ` · ${d.moyen_paiement}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-red-400 font-bold">{fmt(d.montant_ttc)}</p>
                    {d.montant_tva > 0 && (
                      <p className="text-noir-500 text-xs">HT : {fmt(d.montant_ht)} · TVA : {fmt(d.montant_tva)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {d.justificatif_url && (
                      <a href={d.justificatif_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-noir-600 hover:text-gold-400 transition-colors" title="Voir justificatif">
                        📎
                      </a>
                    )}
                    <button onClick={() => openEdit(d)}
                      className="p-1.5 text-noir-600 hover:text-gold-400 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(d.id)}
                      className="p-1.5 text-noir-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}