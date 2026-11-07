'use client'
import { useState, useEffect } from 'react'
import { Download, FileText, TrendingUp, TrendingDown, Euro, AlertCircle, CheckCircle, Printer } from 'lucide-react'

interface Bilan {
  annee: number
  entreprise: {
    nom: string
    siret: string
    adresse: string
    email: string
    telephone: string
  }
  revenus: {
    ca_total: number
    ca_ht: number
    ca_encaisse: number
    tva_collectee: number
    nb_factures: number
  }
  charges: {
    total_ttc: number
    total_ht: number
    tva_deductible: number
    nb_depenses: number
  }
  resultat: {
    benefice_net: number
    tva_nette: number
  }
  seuil_ae: {
    seuil: number
    ca_encaisse: number
    pourcentage: number
    reste: number
  }
  trimestres: {
    trimestre: number
    label: string
    ca: number
    depenses: number
    tva: number
  }[]
  par_source: Record<string, { nb: number; montant: number }>
  par_categorie: Record<string, number>
}

const SOURCE_LABELS: Record<string, string> = {
  pack: 'Packs d\'heures', cours: 'Cours individuels', evenement: 'Événements',
  cadeau: 'Bons cadeaux', support: 'Supports péda.', ressource: 'Ressources premium',
  location: 'Location matériel', manuel: 'Saisie manuelle', import: 'Import Odoo',
}

const CAT_LABELS: Record<string, string> = {
  logiciel: 'Logiciel / Abonnement', materiel: 'Matériel', formation: 'Formation',
  marketing: 'Marketing', frais_bancaires: 'Frais bancaires', assurance: 'Assurance',
  telephone: 'Téléphone / Internet', deplacement: 'Déplacement', fournitures: 'Fournitures',
  cotisations: 'Cotisations / URSSAF', autre: 'Autre',
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

export default function ExportPage() {
  const currentYear = new Date().getFullYear()
  const [annee, setAnnee] = useState(currentYear)
  const [bilan, setBilan] = useState<Bilan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/comptabilite/export?annee=${annee}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setBilan(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [annee])

  function telecharger(format: string, label: string) {
    const url = `/api/admin/comptabilite/export?annee=${annee}&format=${format}`
    const a = document.createElement('a')
    a.href = url
    a.download = label
    a.click()
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!bilan) return <div className="p-8 text-center text-noir-400">Erreur de chargement</div>

  const { revenus, charges, resultat, seuil_ae, trimestres } = bilan

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Export comptable</h1>
          <p className="text-noir-400 text-sm mt-1">Bilan annuel et exports pour votre comptable</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1">
            {[currentYear, currentYear - 1, currentYear - 2].filter(a => a >= 2024).map(a => (
              <button key={a} onClick={() => setAnnee(a)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${annee === a ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                {a}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()}
            className="btn-outline text-sm flex items-center gap-2 px-3 py-2">
            <Printer size={14} /> Imprimer
          </button>
        </div>
      </div>

      {/* Boutons d'export */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Journal des ventes',
            sub: `${revenus.nb_factures} factures — CSV`,
            icon: <TrendingUp size={18} className="text-gold-400" />,
            action: () => telecharger('csv', `journal-ventes-${annee}.csv`),
            color: 'border-gold-500/20 hover:border-gold-500/40',
          },
          {
            label: 'Journal des achats',
            sub: `${charges.nb_depenses} dépenses — CSV`,
            icon: <TrendingDown size={18} className="text-red-400" />,
            action: () => telecharger('csv-depenses', `journal-achats-${annee}.csv`),
            color: 'border-red-500/20 hover:border-red-500/40',
          },
          {
            label: 'Bilan complet',
            sub: 'Toutes les données — JSON',
            icon: <FileText size={18} className="text-blue-400" />,
            action: () => telecharger('json', `bilan-${annee}.json`),
            color: 'border-blue-500/20 hover:border-blue-500/40',
          },
          {
            label: 'Imprimer le bilan',
            sub: 'Version imprimable',
            icon: <Printer size={18} className="text-green-400" />,
            action: () => window.print(),
            color: 'border-green-500/20 hover:border-green-500/40',
          },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action}
            className={`card text-left hover:bg-noir-800 transition-all ${btn.color}`}>
            <div className="flex items-center gap-3 mb-2">
              {btn.icon}
              <Download size={14} className="text-noir-500" />
            </div>
            <div className="text-white font-medium text-sm">{btn.label}</div>
            <div className="text-noir-500 text-xs mt-0.5">{btn.sub}</div>
          </button>
        ))}
      </div>

      {/* Bilan annuel */}
      <div className="card mb-6 border-gold-500/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-serif text-xl">Bilan {annee}</h2>
            <p className="text-noir-400 text-sm">{bilan.entreprise.nom} — SIRET {bilan.entreprise.siret}</p>
          </div>
          <div className={`text-sm px-3 py-1.5 rounded-full border font-medium ${
            seuil_ae.pourcentage >= 100 ? 'text-red-400 border-red-500/30 bg-red-500/10'
            : seuil_ae.pourcentage >= 80 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
            : 'text-green-400 border-green-500/30 bg-green-500/10'
          }`}>
            {seuil_ae.pourcentage}% du seuil AE
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Revenus */}
          <div className="bg-noir-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-gold-400" />
              <h3 className="text-white font-semibold text-sm">Revenus</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-noir-400">CA total TTC</span>
                <span className="text-gold-400 font-bold">{fmt(revenus.ca_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-400">CA encaissé</span>
                <span className="text-white">{fmt(revenus.ca_encaisse)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-400">CA HT</span>
                <span className="text-white">{fmt(revenus.ca_ht)}</span>
              </div>
              <div className="flex justify-between border-t border-noir-700 pt-2">
                <span className="text-noir-400">TVA collectée</span>
                <span className="text-blue-400">{fmt(revenus.tva_collectee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-500 text-xs">Nb factures</span>
                <span className="text-noir-400 text-xs">{revenus.nb_factures}</span>
              </div>
            </div>
          </div>

          {/* Charges */}
          <div className="bg-noir-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={16} className="text-red-400" />
              <h3 className="text-white font-semibold text-sm">Charges</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-noir-400">Total TTC</span>
                <span className="text-red-400 font-bold">{fmt(charges.total_ttc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-400">Total HT</span>
                <span className="text-white">{fmt(charges.total_ht)}</span>
              </div>
              <div className="flex justify-between border-t border-noir-700 pt-2">
                <span className="text-noir-400">TVA déductible</span>
                <span className="text-blue-400">{fmt(charges.tva_deductible)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-500 text-xs">Nb dépenses</span>
                <span className="text-noir-400 text-xs">{charges.nb_depenses}</span>
              </div>
            </div>
          </div>

          {/* Résultat */}
          <div className="bg-noir-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Euro size={16} className="text-green-400" />
              <h3 className="text-white font-semibold text-sm">Résultat</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-noir-400">Bénéfice net</span>
                <span className={`font-bold ${resultat.benefice_net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmt(resultat.benefice_net)}
                </span>
              </div>
              <div className="flex justify-between border-t border-noir-700 pt-2">
                <span className="text-noir-400">TVA nette à reverser</span>
                <span className="text-amber-400">{fmt(resultat.tva_nette)}</span>
              </div>
            </div>

            {/* Seuil AE */}
            <div className="mt-4 pt-4 border-t border-noir-700">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-noir-400">Seuil auto-entrepreneur</span>
                <span className={seuil_ae.pourcentage >= 80 ? 'text-amber-400' : 'text-green-400'}>
                  {seuil_ae.pourcentage}%
                </span>
              </div>
              <div className="w-full bg-noir-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${
                  seuil_ae.pourcentage >= 100 ? 'bg-red-500'
                  : seuil_ae.pourcentage >= 80 ? 'bg-amber-500'
                  : 'bg-green-500'
                }`} style={{ width: `${Math.min(seuil_ae.pourcentage, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1 text-noir-600">
                <span>{fmt(seuil_ae.ca_encaisse)}</span>
                <span>/ {fmt(seuil_ae.seuil)}</span>
              </div>
              {seuil_ae.reste > 0 && (
                <p className="text-xs text-noir-500 mt-1">Reste : {fmt(seuil_ae.reste)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tableau trimestriel */}
        <div>
          <h3 className="text-white font-semibold mb-3 text-sm">Récapitulatif trimestriel</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-noir-700">
                  <th className="text-left py-2 text-noir-500 font-medium">Trimestre</th>
                  <th className="text-right py-2 text-noir-500 font-medium">CA encaissé</th>
                  <th className="text-right py-2 text-noir-500 font-medium">Charges</th>
                  <th className="text-right py-2 text-noir-500 font-medium">TVA collectée</th>
                  <th className="text-right py-2 text-noir-500 font-medium">Résultat</th>
                </tr>
              </thead>
              <tbody>
                {trimestres.map(t => (
                  <tr key={t.trimestre} className="border-b border-noir-800 hover:bg-noir-800/30 transition-colors">
                    <td className="py-3 text-white font-medium">{t.label}</td>
                    <td className="py-3 text-right text-gold-400">{fmt(t.ca)}</td>
                    <td className="py-3 text-right text-red-400">{fmt(t.depenses)}</td>
                    <td className="py-3 text-right text-blue-400">{fmt(t.tva)}</td>
                    <td className={`py-3 text-right font-semibold ${(t.ca - t.depenses) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmt(t.ca - t.depenses)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gold-500/30 bg-noir-800/50">
                  <td className="py-3 text-white font-bold">TOTAL {annee}</td>
                  <td className="py-3 text-right text-gold-400 font-bold">{fmt(revenus.ca_encaisse)}</td>
                  <td className="py-3 text-right text-red-400 font-bold">{fmt(charges.total_ttc)}</td>
                  <td className="py-3 text-right text-blue-400 font-bold">{fmt(revenus.tva_collectee)}</td>
                  <td className={`py-3 text-right font-bold ${resultat.benefice_net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmt(resultat.benefice_net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Répartition revenus par source */}
      {Object.keys(bilan.par_source).length > 0 && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="text-white font-semibold mb-4 text-sm">Revenus par activité</h3>
            <div className="space-y-2">
              {Object.entries(bilan.par_source)
                .sort(([, a], [, b]) => b.montant - a.montant)
                .map(([src, data]) => (
                  <div key={src}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-noir-300">{SOURCE_LABELS[src] || src}</span>
                      <span className="text-white">{fmt(data.montant)} ({data.nb} fact.)</span>
                    </div>
                    <div className="w-full bg-noir-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-gold-500/70"
                        style={{ width: `${Math.round((data.montant / revenus.ca_total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-white font-semibold mb-4 text-sm">Charges par catégorie</h3>
            {Object.keys(bilan.par_categorie).length === 0 ? (
              <p className="text-noir-500 text-sm">Aucune dépense enregistrée</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(bilan.par_categorie)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, montant]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-noir-300">{CAT_LABELS[cat] || cat}</span>
                        <span className="text-white">{fmt(montant)}</span>
                      </div>
                      <div className="w-full bg-noir-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-red-500/70"
                          style={{ width: `${Math.round((montant / charges.total_ttc) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Déclaration URSSAF */}
      <div className="card border-amber-500/20">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold">Aide à la déclaration URSSAF</h3>
            <p className="text-noir-400 text-xs mt-0.5">
              Auto-entrepreneur — Déclaration trimestrielle du chiffre d'affaires encaissé
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trimestres.map(t => (
            <div key={t.trimestre} className="bg-noir-800 rounded-xl p-4">
              <div className="text-noir-400 text-xs mb-1">{t.label}</div>
              <div className="text-white font-bold text-lg">{fmt(t.ca)}</div>
              <div className="text-noir-500 text-xs mt-1">CA à déclarer</div>
              {t.ca > 0 && (
                <div className="mt-2 pt-2 border-t border-noir-700">
                  <div className="text-xs text-noir-500">Cotisations estimées</div>
                  <div className="text-amber-400 text-sm font-medium">
                    {fmt(t.ca * 0.231)} {/* Taux 23.1% prestations de services */}
                  </div>
                  <div className="text-noir-600 text-xs">≈ 23,1% (services)</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-400/80 text-xs leading-relaxed">
              <strong className="text-amber-300">Rappel :</strong> En tant qu'auto-entrepreneur prestataire de services,
              déclarez votre CA encaissé chaque trimestre sur autoentrepreneur.urssaf.fr.
              Taux de cotisations : 23,1% du CA HT encaissé (2026).
              TVA non applicable tant que vous n'avez pas dépassé le seuil de {fmt(seuil_ae.seuil)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}