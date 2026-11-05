'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import { Package, Upload, X, ChevronLeft, AlertCircle } from 'lucide-react'

interface Article {
  id: string
  nom: string
  slug: string
  photos: string[]
  prix_jour: number | null
  prix_weekend: number | null
  prix_semaine: number | null
  prix_mois: number | null
  caution: number
  accessoires_inclus: string | null
  disponible: boolean
  stock: number
}

interface Zone {
  id: string
  nom: string
  distance_min: number
  distance_max: number | null
  tarif: number | null
  sur_devis: boolean
}

type DureeType = 'jours' | 'weekend' | 'semaine' | 'mois' | 'libre'
type ModeRemise = 'retrait' | 'livraison'
type MoyenPaiement = 'stripe' | 'paypal' | 'virement'

function f(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

function nbJours(debut: string, fin: string): number {
  if (!debut || !fin) return 0
  const d1 = new Date(debut), d2 = new Date(fin)
  return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

function calculMontant(article: Article, dureeType: DureeType, dateDebut: string, dateFin: string): number {
  const nb = nbJours(dateDebut, dateFin)
  switch (dureeType) {
    case 'jours':   return (article.prix_jour || 0) * nb
    case 'weekend': return article.prix_weekend || 0
    case 'semaine': return article.prix_semaine || 0
    case 'mois':    return article.prix_mois || 0
    case 'libre':   return (article.prix_jour || 0) * nb
    default:        return 0
  }
}

export default function LocationReserverPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  const [article, setArticle] = useState<Article | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: infos, 2: docs, 3: contrat, 4: paiement

  // Formulaire
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [ville, setVille] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [dureeType, setDureeType] = useState<DureeType>('semaine')
  const [modeRemise, setModeRemise] = useState<ModeRemise>('retrait')
  const [adresseLivraison, setAdresseLivraison] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>('stripe')
  const [noteClient, setNoteClient] = useState('')
  const [cautionType, setCautionType] = useState('cheque')

  // Documents
  const [docIdentite, setDocIdentite] = useState<File | null>(null)
  const [docDomicile, setDocDomicile] = useState<File | null>(null)
  const [docsAutres, setDocsAutres] = useState<File[]>([])
  const fileIdentiteRef = useRef<HTMLInputElement>(null)
  const fileDomicileRef = useRef<HTMLInputElement>(null)
  const fileAutresRef = useRef<HTMLInputElement>(null)

  // Contrat
  const [contratLu, setContratLu] = useState(false)
  const [signatureNom, setSignatureNom] = useState('')

  // Soumission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [reservationId, setReservationId] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      fetch(`/api/location/${slug}`).then(r => r.json()),
      fetch('/api/location/zones').then(r => r.json()),
    ]).then(([art, z]) => {
      if (art?.error) { router.push('/location'); return }
      setArticle(art)
      setZones(Array.isArray(z) ? z : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug, router])

  // Calculs automatiques
  const nb = nbJours(dateDebut, dateFin)
  const montantLocation = article ? calculMontant(article, dureeType, dateDebut, dateFin) : 0
  const zoneSelectionnee = zones.find(z => z.id === zoneId)
  const fraisLivraison = modeRemise === 'livraison' && zoneSelectionnee && !zoneSelectionnee.sur_devis
    ? (zoneSelectionnee.tarif || 0) : 0
  const montantTotal = montantLocation + fraisLivraison
  const estAcompte = nb >= 15
  const montantAcompte = estAcompte ? montantTotal * 0.5 : null
  const montantDu = estAcompte ? montantAcompte! : montantTotal

  // Durées disponibles
  const durees = [
    { key: 'jours' as DureeType, label: 'Jours', available: !!article?.prix_jour },
    { key: 'weekend' as DureeType, label: 'Week-end', available: !!article?.prix_weekend },
    { key: 'semaine' as DureeType, label: 'Semaine', available: !!article?.prix_semaine },
    { key: 'mois' as DureeType, label: 'Mois', available: !!article?.prix_mois },
    { key: 'libre' as DureeType, label: 'Durée libre', available: !!article?.prix_jour },
  ].filter(d => d.available)

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      // 1. Créer la réservation
      const resResa = await fetch('/api/location/reserver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: article!.id,
          article_nom: article!.nom,
          article_valeur: null,
          locataire_nom: nom,
          locataire_email: email,
          locataire_telephone: telephone || null,
          locataire_adresse: adresse || null,
          locataire_ville: ville || null,
          locataire_code_postal: codePostal || null,
          date_debut: dateDebut,
          date_fin: dateFin,
          duree_type: dureeType,
          nb_jours: nb,
          mode_remise: modeRemise,
          adresse_livraison: modeRemise === 'livraison' ? adresseLivraison : null,
          zone_livraison_id: modeRemise === 'livraison' && zoneId ? zoneId : null,
          frais_livraison: fraisLivraison,
          montant_location: montantLocation,
          montant_acompte: montantAcompte,
          montant_total: montantTotal,
          est_acompte: estAcompte,
          caution_montant: article!.caution,
          caution_type: cautionType,
          moyen_paiement: moyenPaiement,
          contrat_signe: contratLu && !!signatureNom,
          contrat_signe_le: contratLu ? new Date().toISOString() : null,
          signature_nom: signatureNom || null,
          note_client: noteClient || null,
        }),
      })
      const resa = await resResa.json()
      if (!resResa.ok) throw new Error(resa.error || 'Erreur lors de la réservation')
      const id = resa.id
      setReservationId(id)

      // 2. Upload des documents
      const uploadDoc = async (file: File, type: string) => {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('reservation_id', id)
        fd.append('type', type)
        await fetch('/api/location/upload-docs', { method: 'POST', body: fd })
      }
      if (docIdentite) await uploadDoc(docIdentite, 'identite')
      if (docDomicile) await uploadDoc(docDomicile, 'domicile')
      for (const f of docsAutres) await uploadDoc(f, 'autre')

      // 3. Redirection selon moyen de paiement
      if (moyenPaiement === 'stripe') {
        const resStripe = await fetch('/api/location/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_id: id, montant: montantDu }),
        })
        const stripe = await resStripe.json()
        if (stripe.url) { window.location.href = stripe.url; return }
        throw new Error(stripe.error || 'Erreur Stripe')
      }

      if (moyenPaiement === 'paypal') {
        const resPaypal = await fetch('/api/location/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_id: id, montant: montantDu }),
        })
        const paypal = await resPaypal.json()
        if (paypal.url) { window.location.href = paypal.url; return }
        throw new Error(paypal.error || 'Erreur PayPal')
      }

      // Virement → confirmation directe
      setSuccess(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue. Veuillez réessayer.')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!article) return null

  if (success) return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <svg width="36" height="36" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="font-serif text-4xl text-white mb-4">Demande envoyée !</h1>
          <p className="text-noir-300 text-lg mb-2 max-w-md">
            Votre demande de location a bien été reçue. Vous allez recevoir un email de confirmation.
          </p>
          {moyenPaiement === 'virement' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4 mb-6 max-w-md text-left">
              <p className="text-amber-300 text-sm font-semibold mb-1">Paiement par virement</p>
              <p className="text-amber-400/80 text-sm">
                Les coordonnées bancaires vous seront communiquées par email. Votre réservation sera confirmée
                dès réception du virement.
              </p>
            </div>
          )}
          <Link href="/location" className="btn-gold px-8 py-3 inline-block mt-4">
            Retour au catalogue
          </Link>
        </motion.div>
      </div>
      <PublicFooter />
    </div>
  )

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      <div className="pt-28 pb-24 px-4">
        <div className="max-w-4xl mx-auto">

          {/* En-tête */}
          <div className="mb-8">
            <Link href={`/location/${slug}`} className="text-noir-500 hover:text-gold-400 transition-colors text-sm inline-flex items-center gap-1 mb-4">
              <ChevronLeft size={14} /> Retour à l'article
            </Link>
            <h1 className="font-serif text-3xl text-white">Réserver — <span className="text-gold-400">{article.nom}</span></h1>
          </div>

          {/* Indicateur d'étapes */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { n: 1, label: 'Informations' },
              { n: 2, label: 'Documents' },
              { n: 3, label: 'Contrat' },
              { n: 4, label: 'Paiement' },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-2 ${step >= s.n ? 'text-gold-400' : 'text-noir-600'}`}>
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.n ? 'bg-gold-500 border-gold-500 text-noir-950'
                    : step === s.n ? 'border-gold-500 text-gold-400'
                    : 'border-noir-700 text-noir-600'
                  }`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className={`w-8 h-px ${step > s.n ? 'bg-gold-500' : 'bg-noir-800'}`} />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-2 space-y-5">

              {/* ÉTAPE 1 — Informations */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  {/* Identité */}
                  <div className="card">
                    <h2 className="text-white font-semibold mb-4">Vos coordonnées</h2>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label mb-1.5 block">Nom complet *</label>
                          <input value={nom} onChange={e => setNom(e.target.value)}
                            className="input w-full" placeholder="Prénom Nom" required />
                        </div>
                        <div>
                          <label className="label mb-1.5 block">Email *</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className="input w-full" placeholder="vous@exemple.com" required />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label mb-1.5 block">Téléphone</label>
                          <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                            className="input w-full" placeholder="06 00 00 00 00" />
                        </div>
                        <div>
                          <label className="label mb-1.5 block">Code postal</label>
                          <input value={codePostal} onChange={e => setCodePostal(e.target.value)}
                            className="input w-full" placeholder="42000" />
                        </div>
                      </div>
                      <div>
                        <label className="label mb-1.5 block">Adresse complète</label>
                        <input value={adresse} onChange={e => setAdresse(e.target.value)}
                          className="input w-full" placeholder="Numéro et nom de rue" />
                      </div>
                      <div>
                        <label className="label mb-1.5 block">Ville</label>
                        <input value={ville} onChange={e => setVille(e.target.value)}
                          className="input w-full" placeholder="Saint-Étienne" />
                      </div>
                    </div>
                  </div>

                  {/* Période */}
                  <div className="card">
                    <h2 className="text-white font-semibold mb-4">Période de location</h2>
                    <div className="space-y-4">
                      {/* Type de durée */}
                      <div>
                        <label className="label mb-2 block">Type de durée *</label>
                        <div className="flex flex-wrap gap-2">
                          {durees.map(d => (
                            <button key={d.key} type="button" onClick={() => setDureeType(d.key)}
                              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                dureeType === d.key
                                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                                  : 'border-noir-700 text-noir-400 hover:text-white'
                              }`}>
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label mb-1.5 block">Date de début *</label>
                          <input type="date" value={dateDebut} min={today}
                            onChange={e => { setDateDebut(e.target.value); if (dateFin < e.target.value) setDateFin(e.target.value) }}
                            className="input w-full" required />
                        </div>
                        <div>
                          <label className="label mb-1.5 block">Date de fin *</label>
                          <input type="date" value={dateFin} min={dateDebut || today}
                            onChange={e => setDateFin(e.target.value)}
                            className="input w-full" required />
                        </div>
                      </div>
                      {dateDebut && dateFin && (
                        <div className="bg-noir-800 rounded-xl p-3 text-sm text-noir-300">
                          Durée : <span className="text-white font-medium">{nb} jour{nb > 1 ? 's' : ''}</span>
                          {estAcompte && (
                            <span className="ml-2 text-amber-400 text-xs">
                              (≥ 15 jours → acompte de 50% requis)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mode de remise */}
                  <div className="card">
                    <h2 className="text-white font-semibold mb-4">Mode de remise</h2>
                    <div className="flex gap-3 mb-4">
                      {[
                        { v: 'retrait' as ModeRemise, l: '📍 Retrait à Saint-Étienne', sub: 'Gratuit' },
                        { v: 'livraison' as ModeRemise, l: '🚗 Livraison à domicile', sub: 'Selon zone' },
                      ].map(x => (
                        <button key={x.v} type="button" onClick={() => setModeRemise(x.v)}
                          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left ${
                            modeRemise === x.v
                              ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                              : 'border-noir-700 text-noir-400 hover:text-white'
                          }`}>
                          <div>{x.l}</div>
                          <div className="text-xs mt-0.5 opacity-70">{x.sub}</div>
                        </button>
                      ))}
                    </div>

                    {modeRemise === 'livraison' && (
                      <div className="space-y-3">
                        <div>
                          <label className="label mb-1.5 block">Adresse de livraison *</label>
                          <input value={adresseLivraison} onChange={e => setAdresseLivraison(e.target.value)}
                            className="input w-full" placeholder="Adresse complète de livraison" />
                        </div>
                        <div>
                          <label className="label mb-1.5 block">Zone de livraison *</label>
                          <select value={zoneId} onChange={e => setZoneId(e.target.value)} className="input w-full">
                            <option value="">Sélectionnez votre zone...</option>
                            {zones.map(z => (
                              <option key={z.id} value={z.id}>
                                {z.nom} — {z.sur_devis ? 'Sur devis' : z.tarif === 0 ? 'Gratuit' : f(z.tarif!)}
                              </option>
                            ))}
                          </select>
                        </div>
                        {zoneSelectionnee?.sur_devis && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300">
                            Les frais de livraison pour cette zone seront calculés sur devis et communiqués par email.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Caution */}
                  <div className="card">
                    <h2 className="text-white font-semibold mb-1">Caution</h2>
                    <p className="text-noir-500 text-xs mb-4">
                      Montant : <span className="text-gold-400 font-semibold">{f(article.caution)}</span>
                      {' '}— restituée dans les 5 jours ouvrés après retour du matériel en bon état.
                    </p>
                    <div>
                      <label className="label mb-2 block">Mode de caution *</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { v: 'cheque', l: 'Chèque (remis à la livraison)' },
                          { v: 'virement', l: 'Virement bancaire' },
                          { v: 'especes', l: 'Espèces' },
                          { v: 'stripe_hold', l: 'Empreinte carte (Stripe)' },
                        ].map(x => (
                          <button key={x.v} type="button" onClick={() => setCautionType(x.v)}
                            className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                              cautionType === x.v
                                ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                                : 'border-noir-700 text-noir-400 hover:text-white'
                            }`}>
                            {x.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="card">
                    <h2 className="text-white font-semibold mb-3">Message (optionnel)</h2>
                    <textarea value={noteClient} onChange={e => setNoteClient(e.target.value)}
                      className="input w-full h-24 resize-none"
                      placeholder="Questions, précisions sur votre projet musical, horaires préférés pour la remise..." />
                  </div>

                  <button
                    onClick={() => {
                      if (!nom || !email || !dateDebut || !dateFin) {
                        setError('Veuillez remplir tous les champs obligatoires.')
                        return
                      }
                      if (modeRemise === 'livraison' && !adresseLivraison) {
                        setError('Veuillez saisir votre adresse de livraison.')
                        return
                      }
                      setError('')
                      setStep(2)
                    }}
                    className="btn-gold w-full py-3">
                    Continuer →
                  </button>
                </motion.div>
              )}

              {/* ÉTAPE 2 — Documents */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="card">
                    <h2 className="text-white font-semibold mb-2">Documents d'identité</h2>
                    <p className="text-noir-400 text-sm mb-5">
                      Pour sécuriser la location, nous avons besoin de vos documents d'identité.
                      Vos fichiers sont stockés de manière sécurisée et utilisés uniquement dans le cadre de ce contrat.
                    </p>

                    {/* CNI / Passeport — obligatoire */}
                    <div className="mb-5">
                      <label className="label mb-2 block">
                        Pièce d'identité <span className="text-red-400">*</span>
                        <span className="text-noir-500 font-normal ml-1">(CNI ou Passeport)</span>
                      </label>
                      {docIdentite ? (
                        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                          <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          <span className="text-green-400 text-sm flex-1 truncate">{docIdentite.name}</span>
                          <button onClick={() => setDocIdentite(null)} className="text-noir-500 hover:text-red-400">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => fileIdentiteRef.current?.click()}
                          className="w-full border-2 border-dashed border-noir-700 hover:border-gold-500/50 rounded-xl p-6 flex flex-col items-center gap-2 text-noir-500 hover:text-gold-400 transition-colors">
                          <Upload size={24} />
                          <span className="text-sm">Cliquez pour uploader votre pièce d'identité</span>
                          <span className="text-xs">JPG, PNG ou PDF — max 10 Mo</span>
                        </button>
                      )}
                      <input ref={fileIdentiteRef} type="file" accept="image/*,.pdf" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) setDocIdentite(e.target.files[0]) }} />
                    </div>

                    {/* Justificatif de domicile — obligatoire */}
                    <div className="mb-5">
                      <label className="label mb-2 block">
                        Justificatif de domicile <span className="text-red-400">*</span>
                        <span className="text-noir-500 font-normal ml-1">(facture, quittance de loyer...)</span>
                      </label>
                      {docDomicile ? (
                        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                          <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          <span className="text-green-400 text-sm flex-1 truncate">{docDomicile.name}</span>
                          <button onClick={() => setDocDomicile(null)} className="text-noir-500 hover:text-red-400">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => fileDomicileRef.current?.click()}
                          className="w-full border-2 border-dashed border-noir-700 hover:border-gold-500/50 rounded-xl p-6 flex flex-col items-center gap-2 text-noir-500 hover:text-gold-400 transition-colors">
                          <Upload size={24} />
                          <span className="text-sm">Cliquez pour uploader votre justificatif de domicile</span>
                          <span className="text-xs">JPG, PNG ou PDF — max 10 Mo</span>
                        </button>
                      )}
                      <input ref={fileDomicileRef} type="file" accept="image/*,.pdf" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) setDocDomicile(e.target.files[0]) }} />
                    </div>

                    {/* Autres documents — optionnel */}
                    <div>
                      <label className="label mb-2 block">
                        Autres documents
                        <span className="text-noir-500 font-normal ml-1">(optionnel)</span>
                      </label>
                      {docsAutres.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {docsAutres.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 bg-noir-800 border border-noir-700 rounded-xl p-3">
                              <span className="text-noir-300 text-sm flex-1 truncate">{f.name}</span>
                              <button onClick={() => setDocsAutres(prev => prev.filter((_, j) => j !== i))}
                                className="text-noir-500 hover:text-red-400">
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => fileAutresRef.current?.click()}
                        className="w-full border border-dashed border-noir-800 hover:border-noir-600 rounded-xl p-4 flex items-center justify-center gap-2 text-noir-600 hover:text-noir-400 transition-colors text-sm">
                        <Upload size={16} /> Ajouter un document
                      </button>
                      <input ref={fileAutresRef} type="file" accept="image/*,.pdf" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) setDocsAutres(prev => [...prev, e.target.files![0]]) }} />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="btn-outline flex-1 py-3">← Retour</button>
                    <button
                      onClick={() => {
                        if (!docIdentite || !docDomicile) {
                          setError('Veuillez fournir votre pièce d\'identité et votre justificatif de domicile.')
                          return
                        }
                        setError('')
                        setStep(3)
                      }}
                      className="btn-gold flex-1 py-3">
                      Continuer →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ÉTAPE 3 — Contrat */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="card">
                    <h2 className="text-white font-semibold mb-4">Contrat de location</h2>

                    {/* Aperçu du contrat */}
                    <div className="bg-noir-800 border border-noir-700 rounded-xl p-5 mb-5 text-sm text-noir-300 leading-relaxed max-h-80 overflow-y-auto space-y-3">
                      <p className="text-white font-semibold text-center text-base">CONTRAT PROFESSIONNEL DE LOCATION DE MATÉRIEL MUSICAL</p>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">1. Identification des parties</p>
                        <p><strong className="text-white">Loueur :</strong> Claudine Yombo — EI (SIRET 98246654200015)</p>
                        <p><strong className="text-white">Adresse du loueur :</strong> 106F rue de la Richelandière — 42100 Saint-Étienne</p>
                        <p><strong className="text-white">Locataire :</strong> {nom}</p>
                        <p><strong className="text-white">Email :</strong> {email}</p>
                        {telephone && <p><strong className="text-white">Téléphone :</strong> {telephone}</p>}
                        {adresse && <p><strong className="text-white">Adresse :</strong> {adresse}, {codePostal} {ville}</p>}
                      </div>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">2. Matériel loué</p>
                        <p><strong className="text-white">Matériel :</strong> {article.nom}</p>
                        {article.accessoires_inclus && <p><strong className="text-white">Accessoires remis :</strong> {article.accessoires_inclus}</p>}
                        <p><strong className="text-white">Date de remise :</strong> {dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : '—'}</p>
                        <p><strong className="text-white">Date de retour prévue :</strong> {dateFin ? new Date(dateFin).toLocaleDateString('fr-FR') : '—'}</p>
                      </div>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">3. Conditions financières</p>
                        <p><strong className="text-white">Montant de la location :</strong> {f(montantLocation)}</p>
                        {fraisLivraison > 0 && <p><strong className="text-white">Frais de livraison :</strong> {f(fraisLivraison)}</p>}
                        <p><strong className="text-white">Montant total :</strong> {f(montantTotal)}</p>
                        {estAcompte && <p><strong className="text-white">Acompte dû à la réservation (50%) :</strong> {f(montantAcompte!)}</p>}
                        <p><strong className="text-white">Mode de paiement :</strong> {moyenPaiement === 'stripe' ? 'Carte bancaire (Stripe)' : moyenPaiement === 'paypal' ? 'PayPal' : 'Virement bancaire'}</p>
                      </div>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">4. Caution</p>
                        <p><strong className="text-white">Montant :</strong> {f(article.caution)}</p>
                        <p><strong className="text-white">Type :</strong> {cautionType === 'cheque' ? 'Chèque non encaissé' : cautionType === 'virement' ? 'Virement' : cautionType === 'especes' ? 'Espèces' : 'Empreinte carte (Stripe)'}</p>
                        <p>La caution peut être retenue totalement ou partiellement en cas de dommage, perte, vol ou non-restitution. Elle est restituée dans les 5 jours ouvrés après retour du matériel en bon état.</p>
                      </div>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">5. Obligations du locataire</p>
                        <p>Le locataire est responsable du matériel dès sa remise jusqu'à sa restitution. Il s'interdit de le prêter, sous-louer, démonter ou modifier. Il doit protéger le matériel contre les chocs, liquides, humidité et mauvais usage.</p>
                      </div>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">6. Vol, perte et détérioration</p>
                        <p>En cas de vol, perte ou détérioration, le locataire prend en charge le coût réel de réparation ou de remplacement. En cas de vol, un dépôt de plainte doit être transmis sous 48 heures.</p>
                      </div>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">7. Restitution et retard</p>
                        <p>Pénalité de retard : 10 € par jour commencé. Au-delà de 10 jours, une mise en demeure puis toute procédure judiciaire utile pourra être engagée.</p>
                      </div>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">8. Données personnelles</p>
                        <p>Le locataire autorise la conservation des documents d'identification nécessaires à la gestion du contrat et d'éventuels litiges.</p>
                      </div>

                      <div>
                        <p className="text-gold-400 font-medium mb-1">9. Litiges</p>
                        <p>Le contrat est soumis au droit français. Les tribunaux du ressort de Saint-Étienne sont compétents sauf disposition légale contraire.</p>
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="space-y-4">
                      <div>
                        <label className="label mb-1.5 block">
                          Signature — Saisissez votre nom complet *
                        </label>
                        <input value={signatureNom} onChange={e => setSignatureNom(e.target.value)}
                          className="input w-full" placeholder="Prénom Nom (valeur de signature)" />
                        <p className="text-noir-600 text-xs mt-1">
                          En saisissant votre nom, vous apposez votre signature électronique sur ce contrat.
                        </p>
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={contratLu} onChange={e => setContratLu(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-amber-500" />
                        <span className="text-noir-300 text-sm leading-relaxed">
                          J'ai lu et j'accepte les conditions du contrat de location ci-dessus.
                          Je reconnais avoir pris connaissance de mes obligations en tant que locataire.
                          <span className="text-red-400"> *</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="btn-outline flex-1 py-3">← Retour</button>
                    <button
                      onClick={() => {
                        if (!contratLu || !signatureNom.trim()) {
                          setError('Veuillez lire le contrat, saisir votre nom et cocher la case d\'acceptation.')
                          return
                        }
                        setError('')
                        setStep(4)
                      }}
                      className="btn-gold flex-1 py-3">
                      Continuer →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ÉTAPE 4 — Paiement */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="card">
                    <h2 className="text-white font-semibold mb-4">Moyen de paiement</h2>
                    <div className="space-y-3">
                      {[
                        {
                          v: 'stripe' as MoyenPaiement,
                          l: 'Carte bancaire',
                          sub: 'Paiement sécurisé via Stripe',
                          icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
                        },
                        {
                          v: 'paypal' as MoyenPaiement,
                          l: 'PayPal',
                          sub: 'Paiement via votre compte PayPal',
                          icon: <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.825l-1.43 9.083h3.44l.943-5.985h2.19c4.56 0 7.353-2.498 8.254-7.893z"/></svg>,
                        },
                        {
                          v: 'virement' as MoyenPaiement,
                          l: 'Virement bancaire',
                          sub: 'Coordonnées bancaires envoyées par email',
                          icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
                        },
                      ].map(x => (
                        <button key={x.v} type="button" onClick={() => setMoyenPaiement(x.v)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                            moyenPaiement === x.v
                              ? 'bg-gold-500/10 border-gold-500/30'
                              : 'border-noir-700 hover:border-noir-600'
                          }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            moyenPaiement === x.v ? 'bg-gold-500/20 text-gold-400' : 'bg-noir-800 text-noir-400'
                          }`}>
                            {x.icon}
                          </div>
                          <div>
                            <div className={`font-medium text-sm ${moyenPaiement === x.v ? 'text-gold-400' : 'text-white'}`}>{x.l}</div>
                            <div className="text-noir-500 text-xs">{x.sub}</div>
                          </div>
                          {moyenPaiement === x.v && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
                              <svg width="10" height="10" fill="none" stroke="#1a1a2e" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)} className="btn-outline flex-1 py-3">← Retour</button>
                    <button onClick={handleSubmit} disabled={submitting} className="btn-gold flex-1 py-3">
                      {submitting ? 'Traitement en cours...' : moyenPaiement === 'virement' ? 'Confirmer la réservation' : 'Procéder au paiement →'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Erreur globale */}
              {error && step !== 4 && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h3 className="text-white font-semibold mb-4">Récapitulatif</h3>

                {/* Article */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-noir-800">
                  <div className="w-14 h-14 rounded-xl bg-noir-800 overflow-hidden shrink-0">
                    {article.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.photos[0]} alt={article.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-noir-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{article.nom}</p>
                    <p className="text-noir-500 text-xs capitalize">{article.categorie}</p>
                  </div>
                </div>

                {/* Détails */}
                <div className="space-y-2 text-sm mb-4">
                  {dateDebut && dateFin && (
                    <div className="flex justify-between">
                      <span className="text-noir-400">Période</span>
                      <span className="text-white text-right text-xs">
                        {new Date(dateDebut).toLocaleDateString('fr-FR')} →<br/>
                        {new Date(dateFin).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {nb > 0 && (
                    <div className="flex justify-between">
                      <span className="text-noir-400">Durée</span>
                      <span className="text-white">{nb} jour{nb > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-noir-400">Remise</span>
                    <span className="text-white">{modeRemise === 'livraison' ? 'Livraison' : 'Retrait'}</span>
                  </div>
                  {montantLocation > 0 && (
                    <div className="flex justify-between">
                      <span className="text-noir-400">Location</span>
                      <span className="text-white">{f(montantLocation)}</span>
                    </div>
                  )}
                  {fraisLivraison > 0 && (
                    <div className="flex justify-between">
                      <span className="text-noir-400">Livraison</span>
                      <span className="text-white">{f(fraisLivraison)}</span>
                    </div>
                  )}
                </div>

                {montantTotal > 0 && (
                  <div className="border-t border-noir-800 pt-3 space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-gold-400 text-lg">{f(montantTotal)}</span>
                    </div>
                    {estAcompte && montantAcompte && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-400">Acompte (50%)</span>
                          <span className="text-amber-400 font-semibold">{f(montantAcompte)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-noir-500">
                          <span>Solde à la remise</span>
                          <span>{f(montantTotal - montantAcompte)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-noir-500">Caution</span>
                      <span className="text-noir-400">{f(article.caution)}</span>
                    </div>
                  </div>
                )}

                <p className="text-noir-600 text-xs mt-4 leading-relaxed">
                  La caution n'est pas incluse dans le montant à payer en ligne.
                  Elle sera remise séparément selon le mode choisi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}