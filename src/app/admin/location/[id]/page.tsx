'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, FileText, User, Calendar, Package,
  Truck, CreditCard, Shield, CheckCircle, XCircle,
  Clock, AlertTriangle, ExternalLink, ClipboardList, Plus, Trash2
} from 'lucide-react'

interface Reservation {
  id: string
  article_id: string | null
  article_nom: string
  article_valeur: number | null
  locataire_nom: string
  locataire_email: string
  locataire_telephone: string | null
  locataire_adresse: string | null
  locataire_ville: string | null
  locataire_code_postal: string | null
  date_debut: string
  date_fin: string
  duree_type: string
  nb_jours: number | null
  mode_remise: string
  adresse_livraison: string | null
  frais_livraison: number
  montant_location: number
  montant_acompte: number | null
  montant_total: number
  est_acompte: boolean
  caution_montant: number
  caution_type: string | null
  caution_reference: string | null
  caution_restituee: boolean
  moyen_paiement: string | null
  paiement_statut: string
  contrat_genere: boolean
  contrat_url: string | null
  contrat_signe: boolean
  contrat_signe_le: string | null
  signature_nom: string | null
  statut: string
  note_client: string | null
  note_admin: string | null
  date_remise_effective: string | null
  date_retour_effective: string | null
  penalites_retard: number
  nb_jours_retard: number
  created_at: string
}

interface EtatLieux {
  id: string
  type: 'remise' | 'retour'
  elements: { nom: string; etat_remise: string; etat_retour: string; observations: string }[]
  observations: string | null
  signe_loueur: boolean
  signe_locataire: boolean
  signature_locataire: string | null
  date_signature: string | null
}

interface Document {
  id: string
  type: string
  nom_fichier: string | null
  fichier_url: string
  taille_octets: number | null
  valide: boolean | null
  note_admin: string | null
  created_at: string
}

const STATUTS = [
  { value: 'en_attente', label: 'En attente',  color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'validee',    label: 'Validée',     color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { value: 'en_cours',  label: 'En cours',    color: 'text-green-400 border-green-500/30 bg-green-500/10' },
  { value: 'terminee',  label: 'Terminée',    color: 'text-noir-400 border-noir-700 bg-noir-800' },
  { value: 'annulee',   label: 'Annulée',     color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { value: 'litige',    label: 'Litige',      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
]

const PAIEMENT_STATUTS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'partiel',    label: 'Acompte reçu' },
  { value: 'complet',    label: 'Complet' },
  { value: 'rembourse',  label: 'Remboursé' },
]

function f(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fDateTime(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminLocationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [resa, setResa] = useState<Reservation | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [etatsLieux, setEtatsLieux] = useState<EtatLieux[]>([])
  const [showEtatLieux, setShowEtatLieux] = useState(false)
  const [typeEtat, setTypeEtat] = useState<'remise' | 'retour'>('remise')
  const [elementsEtat, setElementsEtat] = useState([
    { nom: 'Instrument', etat_remise: '', etat_retour: '', observations: '' },
    { nom: 'Housse', etat_remise: '', etat_retour: '', observations: '' },
    { nom: 'Pédale', etat_remise: '', etat_retour: '', observations: '' },
    { nom: 'Alimentation', etat_remise: '', etat_retour: '', observations: '' },
    { nom: 'Câble', etat_remise: '', etat_retour: '', observations: '' },
  ])
  const [obsEtat, setObsEtat] = useState('')
  const [savingEtat, setSavingEtat] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteAdmin, setNoteAdmin] = useState('')
  const [msgSujet, setMsgSujet] = useState('')
  const [msgTexte, setMsgTexte] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [msgSent, setMsgSent] = useState(false)
  const [statut, setStatut] = useState('')
  const [paiementStatut, setPaiementStatut] = useState('')
  const [dateRemise, setDateRemise] = useState('')
  const [dateRetour, setDateRetour] = useState('')
  const [cautionRestituee, setCautionRestituee] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/location/${id}`).then(r => r.json()),
      fetch(`/api/admin/location/${id}/documents`).then(r => r.json()),
      fetch(`/api/admin/location/${id}/etat-lieux`).then(r => r.json()).catch(() => []),
    ]).then(([r, d, el]) => {
      if (r?.error) { router.push('/admin/location'); return }
      setResa(r)
      setNoteAdmin(r.note_admin || '')
      setStatut(r.statut)
      setPaiementStatut(r.paiement_statut)
      setDateRemise(r.date_remise_effective ? r.date_remise_effective.split('T')[0] : '')
      setDateRetour(r.date_retour_effective ? r.date_retour_effective.split('T')[0] : '')
      setCautionRestituee(r.caution_restituee || false)
      setDocs(Array.isArray(d) ? d : [])
      setEtatsLieux(Array.isArray(el) ? el : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id, router])

  async function saveEtatLieux() {
    setSavingEtat(true)
    try {
      const res = await fetch(`/api/admin/location/${id}/etat-lieux`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeEtat, elements: elementsEtat, observations: obsEtat }),
      })
      const data = await res.json()
      if (res.ok) {
        setEtatsLieux(prev => {
          const filtered = prev.filter(e => e.type !== typeEtat)
          return [...filtered, data]
        })
        setShowEtatLieux(false)
      }
    } catch { alert("Erreur lors de la sauvegarde de l'état des lieux") }
    setSavingEtat(false)
  }

  async function handleSendMessage() {
    if (!msgSujet.trim() || !msgTexte.trim()) return
    setSendingMsg(true)
    try {
      await fetch(`/api/admin/location/${id}/message`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujet: msgSujet, message: msgTexte }),
      })
      setMsgSent(true)
      setMsgSujet('')
      setMsgTexte('')
      setTimeout(() => setMsgSent(false), 4000)
    } catch { alert("Erreur lors de l'envoi") }
    setSendingMsg(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/admin/location', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        statut,
        paiement_statut: paiementStatut,
        note_admin: noteAdmin,
        date_remise_effective: dateRemise ? new Date(dateRemise).toISOString() : null,
        date_retour_effective: dateRetour ? new Date(dateRetour).toISOString() : null,
        caution_restituee: cautionRestituee,
      }),
    })
    setSaving(false)
    setResa(prev => prev ? { ...prev, statut, paiement_statut: paiementStatut, note_admin: noteAdmin } : prev)
  }

  async function validerDoc(docId: string, valide: boolean) {
    await fetch(`/api/admin/location/${id}/documents`, { credentials: 'include',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId, valide }),
    })
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, valide } : d))
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!resa) return (
    <div className="p-8 text-center text-noir-400">Réservation introuvable.</div>
  )

  const statutInfo = STATUTS.find(s => s.value === resa.statut)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <Link href="/admin/location" className="text-noir-500 hover:text-gold-400 transition-colors text-sm inline-flex items-center gap-1 mb-2">
            <ChevronLeft size={14} /> Retour aux réservations
          </Link>
          <h1 className="text-2xl font-serif text-white">Location — {resa.article_nom}</h1>
          <p className="text-noir-400 text-sm mt-1">
            Demande reçue le {fDateTime(resa.created_at)}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium ${statutInfo?.color}`}>
          {resa.statut === 'en_attente' && <Clock size={13} />}
          {resa.statut === 'validee' && <CheckCircle size={13} />}
          {resa.statut === 'en_cours' && <Truck size={13} />}
          {resa.statut === 'terminee' && <CheckCircle size={13} />}
          {resa.statut === 'annulee' && <XCircle size={13} />}
          {resa.statut === 'litige' && <AlertTriangle size={13} />}
          {statutInfo?.label || resa.statut}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">

          {/* Locataire */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-gold-400" />
              <h2 className="text-white font-semibold">Locataire</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Nom', value: resa.locataire_nom },
                { label: 'Email', value: resa.locataire_email, href: `mailto:${resa.locataire_email}` },
                { label: 'Téléphone', value: resa.locataire_telephone || '—', href: resa.locataire_telephone ? `tel:${resa.locataire_telephone}` : undefined },
                { label: 'Adresse', value: [resa.locataire_adresse, resa.locataire_ville].filter(Boolean).join(', ') || '—' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-noir-500 text-xs mb-0.5">{item.label}</div>
                  {item.href ? (
                    <a href={item.href} className="text-gold-400 hover:text-gold-300 transition-colors">{item.value}</a>
                  ) : (
                    <div className="text-white">{item.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Article & Période */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-gold-400" />
              <h2 className="text-white font-semibold">Article & Période</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Article', value: resa.article_nom },
                { label: 'Durée', value: `${resa.nb_jours || '?'} jour(s) — ${resa.duree_type}` },
                { label: 'Date de début', value: fDate(resa.date_debut) },
                { label: 'Date de fin', value: fDate(resa.date_fin) },
                { label: 'Mode de remise', value: resa.mode_remise === 'livraison' ? '🚗 Livraison' : '📍 Retrait' },
                { label: 'Adresse livraison', value: resa.adresse_livraison || '—' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-noir-500 text-xs mb-0.5">{item.label}</div>
                  <div className="text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Finances */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-gold-400" />
              <h2 className="text-white font-semibold">Finances</h2>
            </div>
            <div className="space-y-2 text-sm mb-4">
              {[
                { label: 'Montant location', value: f(resa.montant_location) },
                { label: 'Frais livraison', value: f(resa.frais_livraison) },
                { label: 'Montant total', value: f(resa.montant_total), bold: true },
                { label: 'Acompte (50%)', value: resa.est_acompte && resa.montant_acompte ? f(resa.montant_acompte) : '—' },
                { label: 'Moyen de paiement', value: resa.moyen_paiement || '—' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-noir-800">
                  <span className="text-noir-400">{item.label}</span>
                  <span className={item.bold ? 'text-gold-400 font-bold' : 'text-white'}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Caution */}
            <div className="bg-noir-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} className="text-gold-400" />
                <span className="text-white text-sm font-medium">Caution</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-noir-500 text-xs mb-0.5">Montant</div>
                  <div className="text-white font-semibold">{f(resa.caution_montant)}</div>
                </div>
                <div>
                  <div className="text-noir-500 text-xs mb-0.5">Type</div>
                  <div className="text-white">{resa.caution_type || '—'}</div>
                </div>
                <div>
                  <div className="text-noir-500 text-xs mb-0.5">Référence</div>
                  <div className="text-white">{resa.caution_reference || '—'}</div>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={cautionRestituee}
                  onChange={e => setCautionRestituee(e.target.checked)}
                  className="w-4 h-4 accent-amber-500" />
                <span className="text-sm text-noir-300">Caution restituée</span>
              </label>
            </div>
          </div>

          {/* Contrat */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-gold-400" />
              <h2 className="text-white font-semibold">Contrat</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-noir-500 text-xs mb-0.5">Statut signature</div>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                  resa.contrat_signe
                    ? 'text-green-400 border-green-500/30 bg-green-500/10'
                    : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                }`}>
                  {resa.contrat_signe ? '✓ Signé' : '⏳ En attente'}
                </span>
              </div>
              {resa.contrat_signe_le && (
                <div>
                  <div className="text-noir-500 text-xs mb-0.5">Signé le</div>
                  <div className="text-white">{fDateTime(resa.contrat_signe_le)}</div>
                </div>
              )}
              {resa.signature_nom && (
                <div>
                  <div className="text-noir-500 text-xs mb-0.5">Signature</div>
                  <div className="text-white italic">"{resa.signature_nom}"</div>
                </div>
              )}
            </div>

            {/* Bouton téléchargement contrat */}
            {resa.contrat_url ? (
              <a href={resa.contrat_url} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 btn-gold text-sm py-2 px-4 w-fit">
                <FileText size={14} /> Télécharger le contrat PDF
              </a>
            ) : (
              <p className="mt-3 text-noir-600 text-xs">
                {resa.contrat_genere ? 'Contrat généré — URL non disponible' : 'Contrat non encore généré'}
              </p>
            )}
          </div>

          {/* Documents */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-gold-400" />
              <h2 className="text-white font-semibold">Documents ({docs.length})</h2>
            </div>
            {docs.length === 0 ? (
              <p className="text-noir-500 text-sm">Aucun document uploadé.</p>
            ) : (
              <div className="space-y-3">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 bg-noir-800 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          doc.type === 'identite' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                          : doc.type === 'domicile' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10'
                          : 'text-noir-400 border-noir-700'
                        }`}>
                          {doc.type === 'identite' ? 'Pièce d\'identité'
                           : doc.type === 'domicile' ? 'Justificatif domicile'
                           : 'Autre'}
                        </span>
                        {doc.valide === true && <span className="text-xs text-green-400">✓ Validé</span>}
                        {doc.valide === false && <span className="text-xs text-red-400">✗ Refusé</span>}
                        {doc.valide === null && <span className="text-xs text-amber-400">⏳ À vérifier</span>}
                      </div>
                      <p className="text-noir-300 text-xs truncate">{doc.nom_fichier || 'Document'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={doc.fichier_url} target="_blank" rel="noopener noreferrer"
                        className="text-gold-400 hover:text-gold-300 p-1.5 rounded transition-colors" title="Voir le document">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => validerDoc(doc.id, true)}
                        className={`p-1.5 rounded transition-colors ${doc.valide === true ? 'text-green-400' : 'text-noir-600 hover:text-green-400'}`}
                        title="Valider">
                        <CheckCircle size={14} />
                      </button>
                      <button onClick={() => validerDoc(doc.id, false)}
                        className={`p-1.5 rounded transition-colors ${doc.valide === false ? 'text-red-400' : 'text-noir-600 hover:text-red-400'}`}
                        title="Refuser">
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* État des lieux */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-gold-400" />
                <h2 className="text-white font-semibold">État des lieux</h2>
              </div>
              <button onClick={() => setShowEtatLieux(!showEtatLieux)}
                className="btn-outline text-xs flex items-center gap-1 py-1.5 px-3">
                <Plus size={12} /> Nouveau
              </button>
            </div>

            {/* États des lieux existants */}
            {etatsLieux.length > 0 ? (
              <div className="space-y-3 mb-4">
                {etatsLieux.map(el => (
                  <div key={el.id} className="bg-noir-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        el.type === 'remise'
                          ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                          : 'text-green-400 border-green-500/30 bg-green-500/10'
                      }`}>
                        {el.type === 'remise' ? 'État à la remise' : 'État au retour'}
                      </span>
                      <div className="flex gap-2 text-xs">
                        {el.signe_loueur && <span className="text-green-400">✓ Loueur</span>}
                        {el.signe_locataire && <span className="text-green-400">✓ Locataire</span>}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-noir-500">
                            <th className="text-left py-1 pr-3">Élément</th>
                            <th className="text-left py-1 pr-3">État remise</th>
                            <th className="text-left py-1 pr-3">État retour</th>
                            <th className="text-left py-1">Observations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(el.elements || []).map((elem, i) => (
                            <tr key={i} className="border-t border-noir-700">
                              <td className="py-1.5 pr-3 text-white font-medium">{elem.nom}</td>
                              <td className="py-1.5 pr-3 text-noir-300">{elem.etat_remise || '—'}</td>
                              <td className="py-1.5 pr-3 text-noir-300">{elem.etat_retour || '—'}</td>
                              <td className="py-1.5 text-noir-400">{elem.observations || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {el.observations && (
                      <p className="text-noir-400 text-xs mt-2 italic">Obs. générales : {el.observations}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-noir-500 text-sm mb-4">Aucun état des lieux enregistré.</p>
            )}

            {/* Formulaire nouvel état des lieux */}
            {showEtatLieux && (
              <div className="bg-noir-800 rounded-xl p-4 space-y-4">
                <div className="flex gap-2">
                  {(['remise', 'retour'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setTypeEtat(t)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                        typeEtat === t ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'
                      }`}>
                      {t === 'remise' ? 'À la remise' : 'Au retour'}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-noir-500">
                        <th className="text-left py-1 pr-2 w-24">Élément</th>
                        <th className="text-left py-1 pr-2">État remise</th>
                        <th className="text-left py-1 pr-2">État retour</th>
                        <th className="text-left py-1">Observations</th>
                        <th className="w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {elementsEtat.map((elem, i) => (
                        <tr key={i} className="border-t border-noir-700">
                          <td className="py-1.5 pr-2">
                            <input value={elem.nom}
                              onChange={e => setElementsEtat(prev => prev.map((el, j) => j === i ? { ...el, nom: e.target.value } : el))}
                              className="input w-full text-xs py-1" />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input value={elem.etat_remise}
                              onChange={e => setElementsEtat(prev => prev.map((el, j) => j === i ? { ...el, etat_remise: e.target.value } : el))}
                              className="input w-full text-xs py-1" placeholder="Bon état..." />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input value={elem.etat_retour}
                              onChange={e => setElementsEtat(prev => prev.map((el, j) => j === i ? { ...el, etat_retour: e.target.value } : el))}
                              className="input w-full text-xs py-1" placeholder="Bon état..." />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input value={elem.observations}
                              onChange={e => setElementsEtat(prev => prev.map((el, j) => j === i ? { ...el, observations: e.target.value } : el))}
                              className="input w-full text-xs py-1" placeholder="RAS..." />
                          </td>
                          <td className="py-1.5">
                            <button onClick={() => setElementsEtat(prev => prev.filter((_, j) => j !== i))}
                              className="text-noir-600 hover:text-red-400 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={() => setElementsEtat(prev => [...prev, { nom: '', etat_remise: '', etat_retour: '', observations: '' }])}
                  className="text-gold-400 hover:text-gold-300 text-xs flex items-center gap-1 transition-colors">
                  <Plus size={12} /> Ajouter un élément
                </button>

                <div>
                  <label className="label mb-1.5 block text-xs">Observations générales</label>
                  <textarea value={obsEtat} onChange={e => setObsEtat(e.target.value)}
                    className="input w-full h-16 resize-none text-xs" placeholder="Observations générales..." />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowEtatLieux(false)} className="btn-outline text-xs py-2 flex-1">Annuler</button>
                  <button onClick={saveEtatLieux} disabled={savingEtat} className="btn-gold text-xs py-2 flex-1">
                    {savingEtat ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Note client */}
          {resa.note_client && (
            <div className="card">
              <h2 className="text-white font-semibold mb-3">Message du client</h2>
              <p className="text-noir-300 text-sm leading-relaxed italic">"{resa.note_client}"</p>
            </div>
          )}
        </div>

        {/* Colonne actions */}
        <div className="space-y-5">
          {/* Changer statut */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4">Statut de la réservation</h2>
            <div className="space-y-2 mb-4">
              {STATUTS.map(s => (
                <button key={s.value} onClick={() => setStatut(s.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    statut === s.value ? s.color : 'border-noir-700 text-noir-400 hover:text-white'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>

            <h2 className="text-white font-semibold mb-3">Statut du paiement</h2>
            <div className="space-y-2 mb-4">
              {PAIEMENT_STATUTS.map(s => (
                <button key={s.value} onClick={() => setPaiementStatut(s.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    paiementStatut === s.value
                      ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                      : 'border-noir-700 text-noir-400 hover:text-white'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates effectives */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4">Dates effectives</h2>
            <div className="space-y-3">
              <div>
                <label className="label mb-1.5 block text-xs">Date de remise effective</label>
                <input type="date" value={dateRemise} onChange={e => setDateRemise(e.target.value)}
                  className="input w-full text-sm" />
              </div>
              <div>
                <label className="label mb-1.5 block text-xs">Date de retour effective</label>
                <input type="date" value={dateRetour} onChange={e => setDateRetour(e.target.value)}
                  className="input w-full text-sm" />
              </div>
            </div>
          </div>

          {/* Note admin */}
          <div className="card">
            <h2 className="text-white font-semibold mb-3">Note interne</h2>
            <textarea value={noteAdmin} onChange={e => setNoteAdmin(e.target.value)}
              className="input w-full h-28 resize-none text-sm"
              placeholder="Notes internes (non visibles par le client)..." />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-gold w-full py-3">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

          {/* Messagerie admin → client */}
          <div className="card">
            <h2 className="text-white font-semibold mb-3">Écrire au client</h2>
            {msgSent && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-3 text-green-400 text-sm">
                Message envoyé avec succès !
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="label mb-1.5 block text-xs">Sujet *</label>
                <input value={msgSujet} onChange={e => setMsgSujet(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="Ex : Confirmation de votre réservation" />
              </div>
              <div>
                <label className="label mb-1.5 block text-xs">Message *</label>
                <textarea value={msgTexte} onChange={e => setMsgTexte(e.target.value)}
                  className="input w-full h-28 resize-none text-sm"
                  placeholder="Votre message au client..." />
              </div>
              <button onClick={handleSendMessage} disabled={sendingMsg || !msgSujet || !msgTexte}
                className="btn-gold w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {sendingMsg ? 'Envoi...' : 'Envoyer le message'}
              </button>
              <p className="text-noir-600 text-xs">
                L'email sera envoyé à {resa?.locataire_email}
              </p>
            </div>
          </div>

          {/* Infos rapides */}
          <div className="card text-xs space-y-2 text-noir-500">
            <div className="flex justify-between">
              <span>ID réservation</span>
              <span className="font-mono text-noir-400">{resa.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Créée le</span>
              <span className="text-noir-400">{fDateTime(resa.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}