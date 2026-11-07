'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Plus, Search, Download, Eye, FileText,
  CheckCircle, Clock, XCircle, Filter
} from 'lucide-react'

interface Facture {
  id: string
  numero: string
  annee: number
  source: string
  client_nom: string
  client_email: string | null
  date_facture: string
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  moyen_paiement: string | null
  statut_paiement: string
  statut: string
  pdf_url: string | null
}

const SOURCE_LABELS: Record<string, string> = {
  pack: 'Pack', cours: 'Cours', evenement: 'Événement',
  cadeau: 'Bon cadeau', support: 'Support', ressource: 'Ressource',
  location: 'Location', manuel: 'Manuel', import: 'Import',
}

const SOURCE_COLORS: Record<string, string> = {
  pack: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  cours: 'text-gold-400 bg-gold-500/10 border-gold-500/30',
  evenement: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  cadeau: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  support: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  ressource: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  location: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
  manuel: 'text-noir-400 bg-noir-800 border-noir-700',
  import: 'text-noir-400 bg-noir-800 border-noir-700',
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function FacturesPage() {
  const currentYear = new Date().getFullYear()
  const [factures, setFactures] = useState<Facture[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [annee, setAnnee] = useState(currentYear)
  const [statut, setStatut] = useState('')
  const [source, setSource] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Formulaire nouvelle facture manuelle
  const [form, setForm] = useState({
    client_nom: '', client_email: '', client_telephone: '',
    date_facture: new Date().toISOString().split('T')[0],
    moyen_paiement: 'virement', statut_paiement: 'paye', notes: '',
  })
  const [lignes, setLignes] = useState([
    { designation: '', description: '', quantite: '1', unite: 'unité', prix_unitaire: '', taux_tva: '0' }
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadFactures()
  }, [annee, statut, source])

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => loadFactures(), 400)
  }, [search])

  async function loadFactures() {
    setLoading(true)
    const params = new URLSearchParams({ annee: annee.toString() })
    if (statut) params.set('statut', statut)
    if (source) params.set('source', source)
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/comptabilite/factures?${params}`, { credentials: 'include' })
    const data = await res.json()
    setFactures(data.factures || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  async function handleSaveFacture(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        lignes: lignes.map(l => ({
          designation:   l.designation,
          description:   l.description || null,
          quantite:      parseFloat(l.quantite) || 1,
          unite:         l.unite,
          prix_unitaire: parseFloat(l.prix_unitaire) || 0,
          taux_tva:      parseFloat(l.taux_tva) || 0,
        })).filter(l => l.designation && l.prix_unitaire > 0),
      }
      const res = await fetch('/api/admin/comptabilite/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      await loadFactures()
      setShowForm(false)
      setLignes([{ designation: '', description: '', quantite: '1', unite: 'unité', prix_unitaire: '', taux_tva: '0' }])
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
    setSaving(false)
  }

  const totalCA = factures.reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const totalPayees = factures.filter(f => f.statut_paiement === 'paye').reduce((s, f) => s + (f.montant_ttc || 0), 0)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Factures</h1>
          <p className="text-noir-400 text-sm mt-1">{total} facture{total > 1 ? 's' : ''} — CA : {fmt(totalCA)} (encaissé : {fmt(totalPayees)})</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/comptabilite/import"
            className="btn-outline text-sm flex items-center gap-2 px-3 py-2">
            <Download size={14} /> Importer
          </Link>
          <button onClick={() => setShowForm(!showForm)} className="btn-gold flex items-center gap-2">
            <Plus size={16} /> Nouvelle facture
          </button>
        </div>
      </div>

      {/* Formulaire nouvelle facture */}
      {showForm && (
        <form onSubmit={handleSaveFacture} className="card mb-6 space-y-4">
          <h2 className="text-white font-semibold">Nouvelle facture manuelle</h2>

          {/* Client */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label mb-1.5 block">Client *</label>
              <input value={form.client_nom} onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))}
                className="input w-full" placeholder="Nom du client" required />
            </div>
            <div>
              <label className="label mb-1.5 block">Email</label>
              <input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                className="input w-full" placeholder="email@exemple.com" />
            </div>
            <div>
              <label className="label mb-1.5 block">Téléphone</label>
              <input value={form.client_telephone} onChange={e => setForm(f => ({ ...f, client_telephone: e.target.value }))}
                className="input w-full" placeholder="06 00 00 00 00" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label mb-1.5 block">Date</label>
              <input type="date" value={form.date_facture} onChange={e => setForm(f => ({ ...f, date_facture: e.target.value }))}
                className="input w-full" />
            </div>
            <div>
              <label className="label mb-1.5 block">Moyen de paiement</label>
              <select value={form.moyen_paiement} onChange={e => setForm(f => ({ ...f, moyen_paiement: e.target.value }))} className="input w-full">
                {[['stripe','Carte (Stripe)'],['paypal','PayPal'],['virement','Virement'],['especes','Espèces'],['cheque','Chèque'],['autre','Autre']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5 block">Statut paiement</label>
              <select value={form.statut_paiement} onChange={e => setForm(f => ({ ...f, statut_paiement: e.target.value }))} className="input w-full">
                <option value="paye">Payée</option>
                <option value="en_attente">En attente</option>
                <option value="partiel">Partiel</option>
              </select>
            </div>
          </div>

          {/* Lignes */}
          <div>
            <label className="label mb-2 block">Lignes de facture *</label>
            <div className="space-y-2">
              {lignes.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <input value={l.designation} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, designation: e.target.value } : x))}
                      className="input w-full text-sm" placeholder="Désignation *" />
                  </div>
                  <div className="col-span-3">
                    <input value={l.description} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                      className="input w-full text-sm" placeholder="Description (optionnel)" />
                  </div>
                  <div className="col-span-1">
                    <input type="number" step="0.01" value={l.quantite} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, quantite: e.target.value } : x))}
                      className="input w-full text-sm" placeholder="Qté" />
                  </div>
                  <div className="col-span-1">
                    <select value={l.unite} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, unite: e.target.value } : x))}
                      className="input w-full text-sm">
                      {['unité','heure','forfait','mois','jour'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" step="0.01" value={l.prix_unitaire} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, prix_unitaire: e.target.value } : x))}
                      className="input w-full text-sm" placeholder="Prix HT (€)" />
                  </div>
                  <div className="col-span-1 flex items-center gap-1">
                    <button type="button" onClick={() => setLignes(prev => prev.filter((_, j) => j !== i))}
                      className="text-noir-600 hover:text-red-400 transition-colors p-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setLignes(prev => [...prev, { designation: '', description: '', quantite: '1', unite: 'unité', prix_unitaire: '', taux_tva: '0' }])}
              className="mt-2 text-gold-400 hover:text-gold-300 text-sm transition-colors">
              + Ajouter une ligne
            </button>
          </div>

          <div>
            <label className="label mb-1.5 block">Notes (optionnel)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input w-full h-16 resize-none text-sm" placeholder="Notes visibles sur la facture..." />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            <button type="submit" disabled={saving} className="btn-gold">
              {saving ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      )}

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          {/* Recherche */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input w-full pl-9 text-sm" placeholder="Rechercher numéro, client..." />
          </div>

          {/* Année */}
          <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1">
            {[currentYear, currentYear - 1, currentYear - 2].filter(a => a >= 2024).map(a => (
              <button key={a} onClick={() => setAnnee(a)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${annee === a ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                {a}
              </button>
            ))}
          </div>

          {/* Statut */}
          <select value={statut} onChange={e => setStatut(e.target.value)} className="input text-sm w-40">
            <option value="">Tous statuts</option>
            <option value="paye">Payées</option>
            <option value="en_attente">En attente</option>
            <option value="partiel">Partiel</option>
            <option value="annule">Annulées</option>
          </select>

          {/* Source */}
          <select value={source} onChange={e => setSource(e.target.value)} className="input text-sm w-40">
            <option value="">Toutes sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : factures.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="text-noir-700 mx-auto mb-4" />
          <p className="text-noir-400 text-lg mb-2">Aucune facture</p>
          <p className="text-noir-600 text-sm">Les factures apparaîtront ici automatiquement lors des paiements.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {factures.map(f => (
            <div key={f.id} className="card flex items-center justify-between gap-4 flex-wrap hover:border-noir-700 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-white font-semibold text-sm">{f.numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${SOURCE_COLORS[f.source] || 'text-noir-400 bg-noir-800 border-noir-700'}`}>
                      {SOURCE_LABELS[f.source] || f.source}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      f.statut_paiement === 'paye' ? 'text-green-400 border-green-500/30 bg-green-500/10'
                      : f.statut_paiement === 'en_attente' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      : 'text-red-400 border-red-500/30 bg-red-500/10'
                    }`}>
                      {f.statut_paiement === 'paye' ? <><CheckCircle size={10} /> Payée</>
                       : f.statut_paiement === 'en_attente' ? <><Clock size={10} /> En attente</>
                       : <><XCircle size={10} /> {f.statut_paiement}</>}
                    </span>
                  </div>
                  <p className="text-noir-300 text-sm truncate">{f.client_nom}</p>
                  <p className="text-noir-600 text-xs">{fDate(f.date_facture)}{f.client_email ? ` · ${f.client_email}` : ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-white font-bold">{fmt(f.montant_ttc)}</p>
                  {f.montant_tva > 0 && <p className="text-noir-500 text-xs">HT : {fmt(f.montant_ht)}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/comptabilite/factures/${f.id}`}
                    className="p-1.5 text-noir-600 hover:text-gold-400 transition-colors" title="Voir">
                    <Eye size={14} />
                  </Link>
                  <a href={`/api/admin/comptabilite/factures/${f.id}/pdf`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-noir-600 hover:text-blue-400 transition-colors" title="Télécharger PDF">
                    <Download size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}