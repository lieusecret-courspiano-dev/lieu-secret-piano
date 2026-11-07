'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Info } from 'lucide-react'

interface ImportHistorique {
  id: string
  source: string
  nom_fichier: string
  nb_lignes: number
  nb_importees: number
  nb_erreurs: number
  statut: string
  created_at: string
}

interface ResultatImport {
  success: boolean
  nb_importees: number
  nb_erreurs: number
  erreurs: { ligne: number; erreur: string }[]
}

export default function ImportPage() {
  const [source, setSource] = useState<'odoo' | 'csv'>('odoo')
  const [fichier, setFichier] = useState<File | null>(null)
  const [apercu, setApercu] = useState<Record<string, string>[]>([])
  const [colonnes, setColonnes] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [resultat, setResultat] = useState<ResultatImport | null>(null)
  const [historique, setHistorique] = useState<ImportHistorique[]>([])
  const [step, setStep] = useState<'upload' | 'apercu' | 'resultat'>('upload')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadHistorique() }, [])

  async function loadHistorique() {
    const res = await fetch('/api/admin/comptabilite/import', { credentials: 'include' })
    const data = await res.json()
    setHistorique(Array.isArray(data) ? data : [])
  }

  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    // Détecter le séparateur (virgule, point-virgule, tabulation)
    const firstLine = lines[0]
    const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ','

    const headers = firstLine.split(sep).map(h => h.trim().replace(/^"|"$/g, ''))

    return lines.slice(1).map(line => {
      // Gérer les champs entre guillemets
      const values: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQuotes = !inQuotes
        } else if (line[i] === sep && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += line[i]
        }
      }
      values.push(current.trim())

      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = values[i] || '' })
      return obj
    }).filter(row => Object.values(row).some(v => v.trim()))
  }

  async function handleFileChange(file: File) {
    setFichier(file)
    setResultat(null)

    const text = await file.text()
    let rows: Record<string, string>[] = []

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      rows = parseCSV(text)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Pour Excel, on demande à l'utilisateur de l'exporter en CSV
      alert('Pour les fichiers Excel, veuillez l\'exporter en CSV depuis Excel (Fichier → Enregistrer sous → CSV UTF-8) puis l\'importer ici.')
      return
    }

    if (rows.length > 0) {
      setColonnes(Object.keys(rows[0]))
      setApercu(rows.slice(0, 5))
      setStep('apercu')
    }
  }

  async function handleImport() {
    if (!fichier || apercu.length === 0) return
    setImporting(true)

    try {
      const text = await fichier.text()
      const lignes = parseCSV(text)

      const res = await fetch('/api/admin/comptabilite/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lignes,
          source,
          nom_fichier: fichier.name,
        }),
        credentials: 'include',
      })

      const data = await res.json()
      setResultat(data)
      setStep('resultat')
      await loadHistorique()
    } catch (e) {
      alert('Erreur lors de l\'import')
    }
    setImporting(false)
  }

  function reset() {
    setFichier(null)
    setApercu([])
    setColonnes([])
    setResultat(null)
    setStep('upload')
    if (fileRef.current) fileRef.current.value = ''
  }

  function fDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Import de factures</h1>
        <p className="text-noir-400 text-sm mt-1">Importez vos factures depuis Odoo ou un fichier CSV</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Étape 1 — Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Info Odoo */}
              <div className="card border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-300 font-semibold text-sm mb-2">Comment exporter depuis Odoo</p>
                    <ol className="text-blue-400/80 text-xs space-y-1 leading-relaxed">
                      <li>1. Dans Odoo → <strong>Comptabilité → Clients → Factures</strong></li>
                      <li>2. Sélectionnez toutes les factures à exporter</li>
                      <li>3. Cliquez sur <strong>Action → Exporter</strong></li>
                      <li>4. Choisissez le format <strong>CSV</strong></li>
                      <li>5. Sélectionnez les colonnes : Numéro, Date, Client, Montant HT, TVA, Total TTC, État</li>
                      <li>6. Téléchargez et importez ici</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Source */}
              <div className="card">
                <h2 className="text-white font-semibold mb-4">Source du fichier</h2>
                <div className="flex gap-3">
                  {[
                    { v: 'odoo' as const, l: 'Export Odoo', sub: 'Format CSV Odoo standard' },
                    { v: 'csv' as const, l: 'CSV générique', sub: 'Tout autre fichier CSV' },
                  ].map(x => (
                    <button key={x.v} type="button" onClick={() => setSource(x.v)}
                      className={`flex-1 py-3 px-4 rounded-xl border text-left transition-all ${
                        source === x.v ? 'bg-gold-500/10 border-gold-500/30' : 'border-noir-700 hover:border-noir-600'
                      }`}>
                      <div className={`font-medium text-sm ${source === x.v ? 'text-gold-400' : 'text-white'}`}>{x.l}</div>
                      <div className="text-noir-500 text-xs">{x.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload */}
              <div className="card">
                <h2 className="text-white font-semibold mb-4">Fichier CSV</h2>
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-noir-700 hover:border-gold-500/50 rounded-2xl p-10 flex flex-col items-center gap-3 text-noir-500 hover:text-gold-400 transition-colors">
                  <Upload size={32} />
                  <div className="text-center">
                    <p className="font-medium">Cliquez pour sélectionner votre fichier</p>
                    <p className="text-xs mt-1">Format CSV (séparateur ; ou ,) — UTF-8 recommandé</p>
                  </div>
                </button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]) }} />
              </div>

              {/* Template CSV */}
              <div className="card">
                <h2 className="text-white font-semibold mb-3">Modèle CSV</h2>
                <p className="text-noir-400 text-sm mb-3">
                  Si vous n'utilisez pas Odoo, voici le format CSV attendu :
                </p>
                <div className="bg-noir-800 rounded-xl p-4 font-mono text-xs text-noir-300 overflow-x-auto">
                  <p className="text-gold-400">Numéro;Date;Client;Email client;Montant HT;TVA;Montant TTC;État</p>
                  <p>FAC-2024-001;01/01/2024;Jean Dupont;jean@email.com;100.00;0.00;100.00;Payé</p>
                  <p>FAC-2024-002;15/01/2024;Marie Martin;marie@email.com;200.00;0.00;200.00;Payé</p>
                </div>
                <button
                  onClick={() => {
                    const csv = 'Numéro;Date;Client;Email client;Montant HT;TVA;Montant TTC;État\nFAC-2024-001;01/01/2024;Jean Dupont;jean@email.com;100.00;0.00;100.00;Payé'
                    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = 'modele-import.csv'; a.click()
                  }}
                  className="mt-3 text-gold-400 hover:text-gold-300 text-sm flex items-center gap-1 transition-colors">
                  <Download size={14} /> Télécharger le modèle CSV
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 — Aperçu */}
          {step === 'apercu' && (
            <div className="space-y-5">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">Aperçu du fichier</h2>
                  <div className="flex gap-2">
                    <button onClick={reset} className="btn-outline text-sm">← Changer de fichier</button>
                    <button onClick={handleImport} disabled={importing} className="btn-gold text-sm">
                      {importing ? 'Import en cours...' : `Importer ${apercu.length > 0 ? 'toutes les lignes' : ''}`}
                    </button>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <p className="text-green-400 text-sm">
                    <strong>{fichier?.name}</strong> — {colonnes.length} colonnes détectées
                  </p>
                </div>

                {/* Colonnes détectées */}
                <div className="mb-4">
                  <p className="text-noir-500 text-xs mb-2">Colonnes détectées :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {colonnes.map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 bg-noir-800 border border-noir-700 rounded-full text-noir-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Aperçu des 5 premières lignes */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-noir-700">
                        {colonnes.slice(0, 6).map(c => (
                          <th key={c} className="text-left py-2 pr-3 text-noir-500 font-medium">{c}</th>
                        ))}
                        {colonnes.length > 6 && <th className="text-noir-600">+{colonnes.length - 6}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {apercu.map((row, i) => (
                        <tr key={i} className="border-b border-noir-800">
                          {colonnes.slice(0, 6).map(c => (
                            <td key={c} className="py-2 pr-3 text-noir-300 max-w-32 truncate">{row[c] || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-noir-600 text-xs mt-2">Aperçu des 5 premières lignes</p>
              </div>

              {/* Avertissement */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300 font-semibold text-sm">Avant d'importer</p>
                  <ul className="text-amber-400/80 text-xs mt-1 space-y-0.5">
                    <li>• Les factures déjà importées (même numéro Odoo) seront ignorées</li>
                    <li>• Les factures importées auront le statut "Payée" par défaut</li>
                    <li>• Vous pourrez modifier chaque facture après import</li>
                    <li>• L'opération est irréversible (suppression manuelle si nécessaire)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 — Résultat */}
          {step === 'resultat' && resultat && (
            <div className="space-y-5">
              <div className="card">
                <h2 className="text-white font-semibold mb-4">Résultat de l'import</h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">{resultat.nb_importees}</div>
                    <div className="text-green-300 text-sm">Factures importées</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center border ${
                    resultat.nb_erreurs > 0
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-noir-800 border-noir-700'
                  }`}>
                    <div className={`text-3xl font-bold mb-1 ${resultat.nb_erreurs > 0 ? 'text-red-400' : 'text-noir-500'}`}>
                      {resultat.nb_erreurs}
                    </div>
                    <div className={`text-sm ${resultat.nb_erreurs > 0 ? 'text-red-300' : 'text-noir-500'}`}>
                      Erreurs / Ignorées
                    </div>
                  </div>
                </div>

                {resultat.nb_importees > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <p className="text-green-400 text-sm">
                      {resultat.nb_importees} facture{resultat.nb_importees > 1 ? 's' : ''} importée{resultat.nb_importees > 1 ? 's' : ''} avec succès !
                    </p>
                  </div>
                )}

                {resultat.erreurs.length > 0 && (
                  <div>
                    <p className="text-noir-400 text-sm mb-2">Détail des erreurs :</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {resultat.erreurs.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs bg-red-500/5 border border-red-500/10 rounded-lg p-2">
                          <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                          <span className="text-red-300">Ligne {e.ligne} : {e.erreur}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={reset} className="btn-outline flex-1">Nouvel import</button>
                  <a href="/admin/comptabilite/factures" className="btn-gold flex-1 text-center">
                    Voir les factures →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historique des imports */}
        <div>
          <div className="card">
            <h2 className="text-white font-semibold mb-4">Historique des imports</h2>
            {historique.length === 0 ? (
              <p className="text-noir-500 text-sm">Aucun import effectué</p>
            ) : (
              <div className="space-y-3">
                {historique.map(h => (
                  <div key={h.id} className="bg-noir-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium truncate">{h.nom_fichier}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        h.statut === 'termine' ? 'text-green-400 border-green-500/30 bg-green-500/10'
                        : h.statut === 'erreur' ? 'text-red-400 border-red-500/30 bg-red-500/10'
                        : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      }`}>
                        {h.statut}
                      </span>
                    </div>
                    <p className="text-noir-500 text-xs">
                      {fDate(h.created_at)} · {h.nb_importees}/{h.nb_lignes} importées
                      {h.nb_erreurs > 0 && ` · ${h.nb_erreurs} erreur${h.nb_erreurs > 1 ? 's' : ''}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}