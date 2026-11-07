'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download, Send, CheckCircle, Clock, XCircle, Pencil, Save } from 'lucide-react'

interface Ligne {
  id: string
  position: number
  designation: string
  description: string | null
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
  montant_ht: number
  montant_tva: number
  montant_ttc: number
}

interface Facture {
  id: string
  numero: string
  annee: number
  source: string
  source_id: string | null
  client_nom: string
  client_email: string | null
  client_telephone: string | null
  client_adresse: string | null
  date_facture: string
  date_echeance: string | null
  date_paiement: string | null
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  moyen_paiement: string | null
  statut_paiement: string
  statut: string
  notes: string | null
  pdf_url: string | null
  comptabilite_factures_lignes: Ligne[]
}

const SOURCE_LABELS: Record<string, string> = {
  pack: 'Pack d\'heures', cours: 'Cours individuel', evenement: 'Événement',
  cadeau: 'Bon cadeau', support: 'Support pédagogique', ressource: 'Ressource premium',
  location: 'Location matériel', manuel: 'Saisie manuelle', import: 'Import Odoo',
}

const PAIEMENT_LABELS: Record<string, string> = {
  stripe: 'Carte bancaire (Stripe)', paypal: 'PayPal', virement: 'Virement bancaire',
  especes: 'Espèces', cheque: 'Chèque', autre: 'Autre',
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [facture, setFacture] = useState<Facture | null>(null)
  const [loading, setLoading] = useState(true)
  const [editStatut, setEditStatut] = useState('')
  const [editPaiement, setEditPaiement] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/comptabilite/factures/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) { router.push('/admin/comptabilite/factures'); return }
        setFacture(d)
        setEditStatut(d.statut_paiement)
        setEditPaiement(d.moyen_paiement || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, router])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/admin/comptabilite/factures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut_paiement: editStatut, moyen_paiement: editPaiement }),
      credentials: 'include',
    })
    setFacture(prev => prev ? { ...prev, statut_paiement: editStatut, moyen_paiement: editPaiement } : prev)
    setSaving(false)
  }

  async function handleAnnuler() {
    if (!confirm('Annuler cette facture ? Cette action est irréversible.')) return
    await fetch('/api/admin/comptabilite/factures', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      credentials: 'include',
    })
    router.push('/admin/comptabilite/factures')
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!facture) return null

  const lignes = (facture.comptabilite_factures_lignes || [])
    .sort((a, b) => a.position - b.position)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <Link href="/admin/comptabilite/factures"
            className="text-noir-500 hover:text-gold-400 transition-colors text-sm inline-flex items-center gap-1 mb-2">
            <ChevronLeft size={14} /> Retour aux factures
          </Link>
          <h1 className="text-2xl font-serif text-white">{facture.numero}</h1>
          <p className="text-noir-400 text-sm mt-1">
            {SOURCE_LABELS[facture.source] || facture.source} · {fDate(facture.date_facture)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/admin/comptabilite/factures/${id}/pdf`} target="_blank" rel="noopener noreferrer"
            className="btn-outline text-sm flex items-center gap-2 px-3 py-2">
            <Download size={14} /> PDF
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Aperçu facture */}
        <div className="lg:col-span-2 space-y-5">

          {/* En-tête facture */}
          <div className="card bg-noir-900/50">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-gold-400 font-bold text-lg tracking-widest">LIEU SECRET</div>
                <div className="text-noir-400 text-xs mt-1">Claudine Yombo — Auto-entrepreneur</div>
                <div className="text-noir-500 text-xs">SIRET : 98246654200015</div>
                <div className="text-noir-500 text-xs">106F rue de la Richelandière — 42100 Saint-Étienne</div>
                <div className="text-noir-500 text-xs">+33 6 95 34 65 98</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-xl">{facture.numero}</div>
                <div className="text-noir-400 text-sm mt-1">Date : {fDate(facture.date_facture)}</div>
                {facture.date_echeance && (
                  <div className="text-noir-500 text-xs">Échéance : {fDate(facture.date_echeance)}</div>
                )}
              </div>
            </div>

            {/* Client */}
            <div className="bg-noir-800 rounded-xl p-4 mb-6">
              <div className="text-noir-500 text-xs uppercase tracking-wider mb-2">Facturé à</div>
              <div className="text-white font-semibold">{facture.client_nom}</div>
              {facture.client_email && <div className="text-noir-400 text-sm">{facture.client_email}</div>}
              {facture.client_telephone && <div className="text-noir-400 text-sm">{facture.client_telephone}</div>}
              {facture.client_adresse && <div className="text-noir-400 text-sm">{facture.client_adresse}</div>}
            </div>

            {/* Lignes */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-noir-700">
                    <th className="text-left py-2 text-noir-500 text-xs uppercase font-medium">Désignation</th>
                    <th className="text-right py-2 text-noir-500 text-xs uppercase font-medium w-16">Qté</th>
                    <th className="text-right py-2 text-noir-500 text-xs uppercase font-medium w-24">P.U. HT</th>
                    <th className="text-right py-2 text-noir-500 text-xs uppercase font-medium w-24">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map(l => (
                    <tr key={l.id} className="border-b border-noir-800">
                      <td className="py-3">
                        <div className="text-white font-medium">{l.designation}</div>
                        {l.description && <div className="text-noir-500 text-xs mt-0.5">{l.description}</div>}
                      </td>
                      <td className="py-3 text-right text-noir-300">{l.quantite} {l.unite}</td>
                      <td className="py-3 text-right text-noir-300">{fmt(l.prix_unitaire)}</td>
                      <td className="py-3 text-right text-white font-medium">{fmt(l.montant_ht)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-noir-400">Total HT</span>
                  <span className="text-white">{fmt(facture.montant_ht)}</span>
                </div>
                {facture.taux_tva > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-noir-400">TVA ({facture.taux_tva}%)</span>
                    <span className="text-white">{fmt(facture.montant_tva)}</span>
                  </div>
                )}
                {facture.taux_tva === 0 && (
                  <div className="text-noir-600 text-xs">TVA non applicable — Art. 293 B du CGI</div>
                )}
                <div className="flex justify-between font-bold border-t border-noir-700 pt-2">
                  <span className="text-white">Total TTC</span>
                  <span className="text-gold-400 text-lg">{fmt(facture.montant_ttc)}</span>
                </div>
                {facture.moyen_paiement && (
                  <div className="text-noir-500 text-xs">
                    Règlement : {PAIEMENT_LABELS[facture.moyen_paiement] || facture.moyen_paiement}
                  </div>
                )}
              </div>
            </div>

            {facture.notes && (
              <div className="mt-4 pt-4 border-t border-noir-800">
                <p className="text-noir-400 text-xs">{facture.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-5">
          {/* Statut */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4">Statut du paiement</h2>
            <div className="space-y-2 mb-4">
              {[
                { v: 'paye', l: 'Payée', icon: <CheckCircle size={14} />, color: 'text-green-400 border-green-500/30 bg-green-500/10' },
                { v: 'en_attente', l: 'En attente', icon: <Clock size={14} />, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
                { v: 'partiel', l: 'Partiel', icon: <Clock size={14} />, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
                { v: 'annule', l: 'Annulée', icon: <XCircle size={14} />, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
              ].map(s => (
                <button key={s.v} onClick={() => setEditStatut(s.v)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    editStatut === s.v ? s.color : 'border-noir-700 text-noir-400 hover:text-white'
                  }`}>
                  {s.icon} {s.l}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="label mb-1.5 block text-xs">Moyen de paiement</label>
              <select value={editPaiement} onChange={e => setEditPaiement(e.target.value)} className="input w-full text-sm">
                <option value="">Non spécifié</option>
                {Object.entries(PAIEMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="btn-gold w-full py-2.5 flex items-center justify-center gap-2 text-sm">
              <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {/* Infos */}
          <div className="card text-xs space-y-2 text-noir-500">
            <div className="flex justify-between">
              <span>Numéro</span>
              <span className="text-white font-mono">{facture.numero}</span>
            </div>
            <div className="flex justify-between">
              <span>Source</span>
              <span className="text-noir-300">{SOURCE_LABELS[facture.source] || facture.source}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span className="text-noir-300">{fDate(facture.date_facture)}</span>
            </div>
            {facture.source_id && (
              <div className="flex justify-between">
                <span>Réf. source</span>
                <span className="font-mono text-noir-600 truncate max-w-24">{facture.source_id.slice(0, 8)}...</span>
              </div>
            )}
          </div>

          {/* Danger */}
          {facture.statut !== 'annulee' && (
            <div className="card border-red-500/20">
              <h3 className="text-white font-semibold mb-3 text-sm">Zone dangereuse</h3>
              <button onClick={handleAnnuler}
                className="w-full py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                Annuler cette facture
              </button>
              <p className="text-noir-600 text-xs mt-2">La facture sera marquée comme annulée (non supprimée).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}