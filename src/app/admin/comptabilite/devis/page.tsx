'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Download, Eye, FileText, CheckCircle, Clock, XCircle, Send, ArrowRight } from 'lucide-react'

interface Devis {
  id: string
  numero: string
  annee: number
  client_nom: string
  client_email: string | null
  date_devis: string
  date_validite: string | null
  montant_ttc: number
  statut: string
  objet: string | null
  facture_id: string | null
}

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  brouillon:  { label: 'Brouillon',  color: 'text-noir-400 border-noir-700 bg-noir-800',              icon: <FileText size={11} /> },
  envoye:     { label: 'Envoyé',     color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',        icon: <Send size={11} /> },
  accepte:    { label: 'Accepté',    color: 'text-green-400 border-green-500/30 bg-green-500/10',     icon: <CheckCircle size={11} /> },
  refuse:     { label: 'Refusé',     color: 'text-red-400 border-red-500/30 bg-red-500/10',           icon: <XCircle size={11} /> },
  expire:     { label: 'Expiré',     color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',     icon: <Clock size={11} /> },
  facture:    { label: 'Facturé',    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',  icon: <CheckCircle size={11} /> },
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EMPTY_FORM = {
  client_nom: '', client_email: '', client_telephone: '', client_adresse: '',
  date_devis: new Date().toISOString().split('T')[0],
  date_validite: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0] })(),
  objet: '', notes: '',
  conditions: "Devis valable 30 jours à compter de sa date d'émission. Prix fermes et non révisables.",
}

export default function DevisPage() {
  const currentYear = new Date().getFullYear()
  const [devisList, setDevisList] = useState<Devis[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [annee, setAnnee] = useState(currentYear)
  const [statut, setStatut] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [lignes, setLignes] = useState([
    { designation: '', description: '', quantite: '1', unite: 'forfait', prix_unitaire: '', taux_tva: '0' }
  ])
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)

  useEffect(() => { loadDevis() }, [annee, statut])

  async function loadDevis() {
    setLoading(true)
    const params = new URLSearchParams({ annee: annee.toString() })
    if (statut) params.set('statut', statut)
    const res = await fetch(`/api/admin/comptabilite/devis?${params}`, { credentials: 'include' })
    const data = await res.json()
    setDevisList(data.devis || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
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
      const res = await fetch('/api/admin/comptabilite/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      await loadDevis()
      setShowForm(false)
      setForm({ ...EMPTY_FORM })
      setLignes([{ designation: '', description: '', quantite: '1', unite: 'forfait', prix_unitaire: '', taux_tva: '0' }])
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
    setSaving(false)
  }

  async function handleChangeStatut(id: string, newStatut: string) {
    await fetch('/api/admin/comptabilite/devis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut: newStatut }),
      credentials: 'include',
    })
    setDevisList(prev => prev.map(d => d.id === id ? { ...d, statut: newStatut } : d))
  }

  async function handleConvertir(id: string) {
    if (!confirm('Convertir ce devis en facture ?')) return
    setConverting(id)
    try {
      const res = await fetch(`/api/admin/comptabilite/devis/${id}/convertir`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`Facture ${data.numero} créée avec succès !`)
      await loadDevis()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
    setConverting(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce devis ?')) return
    await fetch('/api/admin/comptabilite/devis', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      credentials: 'include',
    })
    setDevisList(prev => prev.filter(d => d.id !== id))
  }

  // Calcul total devis affiché
  const totalMontant = devisList.reduce((s, d) => s + (d.montant_ttc || 0), 0)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Devis</h1>
          <p className="text-noir-400 text-sm mt-1">{total} devis — Total : {fmt(totalMontant)}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Nouveau devis
        </button>
      </div>

      {/* Formulaire nouveau devis */}
      {showForm && (
        <form onSubmit={handleSave} className="card mb-6 space-y-4">
          <h2 className="text-white font-semibold">Nouveau devis</h2>

          {/* Objet */}
          <div>
            <label className="label mb-1.5 block">Objet du devis</label>
            <input value={form.objet} onChange={e => setForm(f => ({ ...f, objet: e.target.value }))}
              className="input w-full" placeholder="Ex : Location clavier Yamaha MODX6+ — 2 semaines" />
          </div>

          {/* Client */}
          <div className="grid sm:grid-cols-2 gap-4">
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
            <div>
              <label className="label mb-1.5 block">Adresse</label>
              <input value={form.client_adresse} onChange={e => setForm(f => ({ ...f, client_adresse: e.target.value }))}
                className="input w-full" placeholder="Adresse complète" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Date du devis</label>
              <input type="date" value={form.date_devis} onChange={e => setForm(f => ({ ...f, date_devis: e.target.value }))}
                className="input w-full" />
            </div>
            <div>
              <label className="label mb-1.5 block">Date de validité</label>
              <input type="date" value={form.date_validite} onChange={e => setForm(f => ({ ...f, date_validite: e.target.value }))}
                className="input w-full" />
            </div>
          </div>

          {/* Lignes */}
          <div>
            <label className="label mb-2 block">Lignes du devis *</label>
            <div className="space-y-2">
              {lignes.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <input value={l.designation} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, designation: e.target.value } : x))}
                      className="input w-full text-sm" placeholder="Désignation *" />
                  </div>
                  <div className="col-span-3">
                    <input value={l.description} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                      className="input w-full text-sm" placeholder="Description" />
                  </div>
                  <div className="col-span-1">
                    <input type="number" step="0.01" value={l.quantite} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, quantite: e.target.value } : x))}
                      className="input w-full text-sm" placeholder="Qté" />
                  </div>
                  <div className="col-span-1">
                    <select value={l.unite} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, unite: e.target.value } : x))}
                      className="input w-full text-sm">
                      {['forfait','unité','heure','jour','semaine','mois'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" step="0.01" value={l.prix_unitaire} onChange={e => setLignes(prev => prev.map((x, j) => j === i ? { ...x, prix_unitaire: e.target.value } : x))}
                      className="input w-full text-sm" placeholder="Prix HT (€)" />
                  </div>
                  <div className="col-span-1 flex items-center">
                    <button type="button" onClick={() => setLignes(prev => prev.filter((_, j) => j !== i))}
                      className="text-noir-600 hover:text-red-400 transition-colors p-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setLignes(prev => [...prev, { designation: '', description: '', quantite: '1', unite: 'forfait', prix_unitaire: '', taux_tva: '0' }])}
              className="mt-2 text-gold-400 hover:text-gold-300 text-sm transition-colors">
              + Ajouter une ligne
            </button>
          </div>

          {/* Notes et conditions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input w-full h-20 resize-none text-sm" placeholder="Notes visibles sur le devis..." />
            </div>
            <div>
              <label className="label mb-1.5 block">Conditions</label>
              <textarea value={form.conditions} onChange={e => setForm(f => ({ ...f, conditions: e.target.value }))}
                className="input w-full h-20 resize-none text-sm" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            <button type="submit" disabled={saving} className="btn-gold">
              {saving ? 'Création...' : 'Créer le devis'}
            </button>
          </div>
        </form>
      )}

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1">
            {[currentYear, currentYear - 1, currentYear - 2].filter(a => a >= 2024).map(a => (
              <button key={a} onClick={() => setAnnee(a)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${annee === a ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                {a}
              </button>
            ))}
          </div>
          <select value={statut} onChange={e => setStatut(e.target.value)} className="input text-sm w-40">
            <option value="">Tous statuts</option>
            {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : devisList.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="text-noir-700 mx-auto mb-4" />
          <p className="text-noir-400 text-lg mb-2">Aucun devis</p>
          <button onClick={() => setShowForm(true)} className="btn-gold mt-2">Créer le premier devis</button>
        </div>
      ) : (
        <div className="space-y-3">
          {devisList.map(d => {
            const sc = STATUT_CONFIG[d.statut] || STATUT_CONFIG.brouillon
            const isExpired = d.date_validite && new Date(d.date_validite) < new Date() && d.statut === 'envoye'
            return (
              <div key={d.id} className="card flex items-start justify-between gap-4 flex-wrap hover:border-noir-700 transition-colors">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-white font-semibold text-sm">{d.numero}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                      {isExpired && (
                        <span className="text-xs px-2 py-0.5 rounded-full border text-amber-400 border-amber-500/30 bg-amber-500/10">
                          Expiré
                        </span>
                      )}
                    </div>
                    <p className="text-noir-300 text-sm">{d.client_nom}</p>
                    {d.objet && <p className="text-noir-500 text-xs truncate">{d.objet}</p>}
                    <p className="text-noir-600 text-xs mt-0.5">
                      {fDate(d.date_devis)}
                      {d.date_validite && ` · Valable jusqu'au ${fDate(d.date_validite)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-white font-bold">{fmt(d.montant_ttc)}</p>
                  </div>

                  {/* Actions statut */}
                  <div className="flex items-center gap-1">
                    {d.statut === 'brouillon' && (
                      <button onClick={() => handleChangeStatut(d.id, 'envoye')}
                        className="text-xs px-2 py-1 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Marquer comme envoyé">
                        <Send size={12} />
                      </button>
                    )}
                    {d.statut === 'envoye' && (
                      <>
                        <button onClick={() => handleChangeStatut(d.id, 'accepte')}
                          className="text-xs px-2 py-1 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors"
                          title="Accepté">
                          <CheckCircle size={12} />
                        </button>
                        <button onClick={() => handleChangeStatut(d.id, 'refuse')}
                          className="text-xs px-2 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Refusé">
                          <XCircle size={12} />
                        </button>
                      </>
                    )}
                    {d.statut === 'accepte' && !d.facture_id && (
                      <button onClick={() => handleConvertir(d.id)}
                        disabled={converting === d.id}
                        className="text-xs px-2 py-1 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-1"
                        title="Convertir en facture">
                        {converting === d.id ? '...' : <><ArrowRight size={12} /> Facturer</>}
                      </button>
                    )}
                    {d.facture_id && (
                      <Link href={`/admin/comptabilite/factures/${d.facture_id}`}
                        className="text-xs px-2 py-1 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors">
                        Voir facture
                      </Link>
                    )}
                    <a href={`/api/admin/comptabilite/devis/${d.id}/pdf`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-noir-600 hover:text-blue-400 transition-colors" title="PDF">
                      <Download size={14} />
                    </a>
                    {d.statut === 'brouillon' && (
                      <button onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-noir-600 hover:text-red-400 transition-colors" title="Supprimer">
                        ✕
                      </button>
                    )}
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