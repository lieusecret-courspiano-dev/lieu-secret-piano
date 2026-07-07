'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { FileText, CreditCard, Building2, Wallet, CheckCircle, ArrowLeft } from 'lucide-react'

interface Support {
  id: string; titre: string; description: string | null
  type: string; prix: number; nb_pages: number | null; apercu_url: string | null
}
interface Settings {
  virement_iban: string; virement_nom: string; virement_info: string
  stripe_public_key: string; contact_email: string
}

function AcheterSupportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supportId = searchParams.get('id')

  const [support, setSupport] = useState<Support | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [eleve, setEleve] = useState<{ id: string; prenom: string; nom: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'virement' | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supportId) { router.push('/espace-eleve/mes-supports'); return }
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch(`/api/supports?id=${supportId}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([me, sup, st]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setEleve(me)
      setSupport(Array.isArray(sup) ? sup[0] : sup)
      setSettings(st)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [supportId])

  async function handleStripe() {
    if (!support || !eleve) return
    setProcessing(true); setError('')
    try {
      const res = await fetch('/api/supports/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ support_id: support.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Erreur Stripe')
    } catch { setError('Erreur réseau') }
    setProcessing(false)
  }

  async function handlePaypal() {
    if (!support || !eleve) return
    setProcessing(true); setError('')
    try {
      const res = await fetch('/api/supports/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ support_id: support.id }),
      })
      const data = await res.json()
      if (data.approveUrl) window.location.href = data.approveUrl
      else setError(data.error || 'Erreur PayPal')
    } catch { setError('Erreur réseau') }
    setProcessing(false)
  }

  async function handleVirement() {
    if (!support || !eleve) return
    setProcessing(true); setError('')
    try {
      const res = await fetch('/api/eleve/supports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ support_id: support.id, payment_method: 'virement' }),
      })
      const data = await res.json()
      if (res.ok) setSuccess(true)
      else setError(data.error || 'Erreur lors de la demande')
    } catch { setError('Erreur réseau') }
    setProcessing(false)
  }

  

  if (loading) return (
    <EleveLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </EleveLayout>
  )

  if (success) return (
    <EleveLayout>
      <div className="p-6 max-w-lg mx-auto">
        <div className="card text-center py-10">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-white mb-2">Demande enregistrée !</h2>
          <p className="text-noir-400 text-sm mb-2">
            Votre demande d'achat pour <strong className="text-white">{support?.titre}</strong> a été enregistrée.
          </p>
          <p className="text-noir-400 text-sm mb-6">
            Effectuez votre virement bancaire avec les coordonnées ci-dessous. Votre accès sera activé dès réception du paiement.
          </p>
          {settings?.virement_iban && (
            <div className="bg-noir-800 rounded-xl p-4 text-left mb-6">
              <p className="text-xs text-noir-500 uppercase tracking-wider mb-2">Coordonnées bancaires</p>
              <p className="text-white text-sm font-medium">{settings.virement_nom}</p>
              <p className="text-gold-400 text-sm font-mono mt-1">{settings.virement_iban}</p>
              <p className="text-noir-400 text-xs mt-2">Référence : {eleve?.prenom} {eleve?.nom} — {support?.titre}</p>
            </div>
          )}
          <p className="text-noir-500 text-xs mb-6">Pensez à vérifier vos spams pour l'email de confirmation.</p>
          <button onClick={() => router.push('/espace-eleve/mes-supports')} className="btn-gold w-full">
            Retour à mes supports
          </button>
        </div>
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 max-w-lg mx-auto pb-24 md:pb-4 md:pb-8">
        {/* Retour */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-noir-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Retour
        </button>

        <h1 className="font-serif text-2xl text-white mb-6">Acheter un support</h1>

        {/* Récapitulatif support */}
        {support && (
          <div className="card mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-gold-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{support.titre}</p>
                {support.description && <p className="text-noir-400 text-xs mt-1">{support.description}</p>}
                {support.nb_pages && <p className="text-noir-500 text-xs mt-0.5">{support.nb_pages} pages</p>}
              </div>
              <p className="text-gold-400 font-bold text-lg shrink-0">{support.prix} €</p>
            </div>
          </div>
        )}

        {/* Choix du moyen de paiement */}
        <p className="text-white font-medium text-sm mb-3">Choisissez votre moyen de paiement</p>

        <div className="space-y-3 mb-6">
          {/* Carte bancaire */}
          <button
            onClick={() => setPaymentMethod('stripe')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'stripe' ? 'border-gold-500/40 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Carte bancaire</p>
              <p className="text-noir-500 text-xs">Paiement sécurisé via Stripe — accès immédiat</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${paymentMethod === 'stripe' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`} />
          </button>

          {/* PayPal */}
          <button
            onClick={() => setPaymentMethod('paypal')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'paypal' ? 'border-gold-500/40 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-blue-300" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">PayPal</p>
              <p className="text-noir-500 text-xs">Paiement via votre compte PayPal — accès immédiat</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${paymentMethod === 'paypal' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`} />
          </button>

          {/* Virement */}
          <button
            onClick={() => setPaymentMethod('virement')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'virement' ? 'border-gold-500/40 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Virement bancaire</p>
              <p className="text-noir-500 text-xs">Accès activé après confirmation du paiement</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${paymentMethod === 'virement' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`} />
          </button>
        </div>

        {/* Détails virement */}
        {paymentMethod === 'virement' && settings?.virement_iban && (
          <div className="card mb-6 border-green-500/20 bg-green-500/5">
            <p className="text-xs text-noir-500 uppercase tracking-wider mb-2">Coordonnées bancaires</p>
            <p className="text-white text-sm font-medium">{settings.virement_nom}</p>
            <p className="text-gold-400 text-sm font-mono mt-1">{settings.virement_iban}</p>
            <p className="text-noir-400 text-xs mt-2">Référence : {eleve?.prenom} {eleve?.nom} — {support?.titre}</p>
            <p className="text-noir-500 text-xs mt-2 italic">{settings.virement_info}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Bouton confirmer */}
        <button
          disabled={!paymentMethod || processing}
          onClick={() => {
            if (paymentMethod === 'stripe') handleStripe()
            else if (paymentMethod === 'paypal') handlePaypal()
            else if (paymentMethod === 'virement') handleVirement()
          }}
          className="btn-gold w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {processing ? 'Traitement...' : paymentMethod === 'virement' ? 'Confirmer ma demande' : paymentMethod ? 'Procéder au paiement' : 'Sélectionnez un moyen de paiement'}
        </button>

        <p className="text-noir-600 text-xs text-center mt-3">
          Paiement sécurisé — Vos données sont protégées
        </p>
      </div>
    </EleveLayout>
  )
}

export default function AcheterSupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AcheterSupportContent />
    </Suspense>
  )
}