'use client'
import { useState, useEffect } from 'react'
import { FileText, Download, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface LigneFacture {
  designation: string
  quantite: number
  unite: string
  prix_unitaire: number
  montant_ttc: number
}

interface Facture {
  id: string
  numero: string
  date_facture: string
  montant_ttc: number
  montant_ht: number
  source: string
  statut_paiement: string
  moyen_paiement: string | null
  pdf_url: string | null
  comptabilite_factures_lignes: LigneFacture[]
}

const SOURCE_LABELS: Record<string, string> = {
  pack: 'Pack de cours', cours: 'Cours individuel', evenement: 'Événement',
  cadeau: 'Bon cadeau', support: 'Support pédagogique', ressource: 'Ressource premium',
  location: 'Location matériel', manuel: 'Facture', import: 'Facture',
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function MesFacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/eleve/mes-factures')
      .then(r => r.json())
      .then(d => { setFactures(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalDepense = factures.reduce((s, f) => s + (f.montant_ttc || 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Mes factures</h1>
        <p className="text-noir-400 text-sm mt-1">
          {factures.length} facture{factures.length > 1 ? 's' : ''} — Total : {fmt(totalDepense)}
        </p>
      </div>

      {factures.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="text-noir-700 mx-auto mb-4" />
          <p className="text-noir-400 text-lg mb-2">Aucune facture</p>
          <p className="text-noir-600 text-sm">
            Vos factures apparaîtront ici après chaque achat (pack, événement, bon cadeau, etc.)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {factures.map(f => (
            <div key={f.id} className="card hover:border-noir-700 transition-colors">
              {/* En-tête facture */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={16} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-white font-semibold text-sm">{f.numero}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-noir-800 border border-noir-700 text-noir-400">
                        {SOURCE_LABELS[f.source] || f.source}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        f.statut_paiement === 'paye'
                          ? 'text-green-400 border-green-500/30 bg-green-500/10'
                          : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      }`}>
                        {f.statut_paiement === 'paye'
                          ? <><CheckCircle size={10} /> Payée</>
                          : <><Clock size={10} /> En attente</>}
                      </span>
                    </div>
                    <p className="text-noir-500 text-xs">{fDate(f.date_facture)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-white font-bold">{fmt(f.montant_ttc)}</p>
                    <p className="text-noir-600 text-xs">TVA non applicable</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {f.pdf_url && (
                      <a href={f.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-noir-600 hover:text-gold-400 transition-colors" title="Télécharger PDF">
                        <Download size={14} />
                      </a>
                    )}
                    <a href={`/api/admin/comptabilite/factures/${f.id}/pdf`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-noir-600 hover:text-blue-400 transition-colors" title="Générer PDF">
                      <Download size={14} />
                    </a>
                    <button onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                      className="p-1.5 text-noir-600 hover:text-white transition-colors">
                      {expanded === f.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Détail lignes */}
              {expanded === f.id && f.comptabilite_factures_lignes?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-noir-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-noir-500 text-xs">
                        <th className="text-left pb-2">Désignation</th>
                        <th className="text-right pb-2 w-16">Qté</th>
                        <th className="text-right pb-2 w-24">P.U.</th>
                        <th className="text-right pb-2 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.comptabilite_factures_lignes.map((l, i) => (
                        <tr key={i} className="border-t border-noir-800">
                          <td className="py-2 text-white">{l.designation}</td>
                          <td className="py-2 text-right text-noir-400">{l.quantite} {l.unite}</td>
                          <td className="py-2 text-right text-noir-400">{fmt(l.prix_unitaire)}</td>
                          <td className="py-2 text-right text-white font-medium">{fmt(l.montant_ttc)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-noir-700">
                        <td colSpan={3} className="pt-2 text-noir-400 text-xs">TVA non applicable — Art. 293 B du CGI</td>
                        <td className="pt-2 text-right text-gold-400 font-bold">{fmt(f.montant_ttc)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {f.moyen_paiement && (
                    <p className="text-noir-600 text-xs mt-2">
                      Règlement : {f.moyen_paiement === 'stripe' ? 'Carte bancaire' : f.moyen_paiement === 'paypal' ? 'PayPal' : f.moyen_paiement}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mention légale */}
      {factures.length > 0 && (
        <p className="text-noir-700 text-xs text-center mt-6">
          Lieu Secret — Claudine Yombo — SIRET 98246654200015 — TVA non applicable Art. 293 B du CGI
        </p>
      )}
    </div>
  )
}