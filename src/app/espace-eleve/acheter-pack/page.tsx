'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Check, CreditCard, Building2 } from 'lucide-react'

interface PackOption { label: string; heures: number; montant: number; desc?: string }
interface EleveMe { id: string; prenom: string; nom: string; email: string; nb_notifs_non_lues?: number }

// Fallback si les paramètres admin ne sont pas encore chargés
const PACK_DEFAULT: PackOption[] = [
  { label: 'Pack 5h',  heures: 5,  montant: 100, desc: '20 € / heure' },
  { label: 'Pack 8h',  heures: 8,  montant: 165, desc: '20,6 € / heure' },
  { label: 'Pack 12h', heures: 12, montant: 250, desc: '20,8 € / heure' },
]

type PaymentMethod = 'stripe' | 'paypal' | 'virement'

export default function AcheterPackElevePage() {
  const router = useRouter()
  const [me, setMe]               = useState<EleveMe | null>(null)
  const [loading, setLoading]     = useState(true)
  const [packOptions, setPackOptions] = useState<PackOption[]>(PACK_DEFAULT)
  const [selectedPack, setSelectedPack] = useState<PackOption | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [pending, setPending]     = useState(false)
  const [virement, setVirement]   = useState({ iban: '', nom: 'Lieu Secret', info: '' })

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([meData, settings]) => {
      if (!meData) { router.push('/espace-eleve/login'); return }
      setMe(meData)
      function parseH(label: string): number { const m = label.match(/(\d+)\s*h/i); return m ? parseInt(m[1]) : 5 }
      const loaded: PackOption[] = []
      for (let i = 1; i <= 10; i++) {
        const lbl  = settings[`tarif_pack_label${i}`]
        const prix = settings[`tarif_pack_prix${i}`]
        const desc = settings[`tarif_pack_desc${i}`]
        if (lbl && prix && parseFloat(prix) > 0) {
          const h = parseH(lbl)
          loaded.push({ label: lbl, heures: h, montant: parseFloat(prix), desc: desc || `${Math.round(parseFloat(prix)/h*10)/10} € / heure` })
        }
      }
      if (loaded.length > 0) { setPackOptions(loaded); setSelectedPack(loaded[0]) }
      else setSelectedPack(PACK_DEFAULT[0])
      setVirement({ iban: settings.virement_iban || '', nom: settings.virement_nom || 'Lieu Secret', info: settings.virement_info || '' })
    }).finally(() => setLoading(false))
  }, [router])

  async function handleBuy() {
    if (!selectedPack || !me) return
    setError(''); setSubmitting(true)
    try {
      if (paymentMethod === 'stripe') {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'pack', pack_label: selectedPack.label, heures: selectedPack.heures, montant: selectedPack.montant, acheteur_nom: `${me.prenom} ${me.nom}`, acheteur_email: me.email, eleve_id: me.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur paiement Stripe')
        if (data.url) { window.location.href = data.url; return }
        throw new Error('URL Stripe manquante')
      } else if (paymentMethod === 'paypal') {
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'pack', pack_label: selectedPack.label, heures: selectedPack.heures, montant: selectedPack.montant, acheteur_nom: `${me.prenom} ${me.nom}`, acheteur_email: me.email, eleve_id: me.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur PayPal')
        if (data.approveUrl) { window.location.href = data.approveUrl; return }
        throw new Error('URL PayPal manquante')
      } else {
        // Virement — utilise PUT /api/pack/checkout
        const res = await fetch('/api/pack/checkout', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pack_label: selectedPack.label,
            heures: selectedPack.heures,
            montant: selectedPack.montant,
            acheteur_nom: `${me.prenom} ${me.nom}`,
            acheteur_email: me.email,
            eleve_id: me.id,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur virement')
        setPending(true)
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur inconnue') }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (pending) return (
    <EleveLayout prenom={me?.prenom} nbNotifs={me?.nb_notifs_non_lues || 0}>
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="card text-center max-w-md w-full py-12">
          <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} className="text-gold-400" />
          </div>
          <h2 className="font-serif text-2xl text-white mb-2">Demande enregistrée</h2>
          <p className="text-noir-400 text-sm mb-6">Effectuez votre virement et votre pack sera activé dès réception du paiement.</p>
          {virement.iban && (
            <div className="bg-noir-800 border border-gold-500/30 rounded-xl p-4 text-left mb-6">
              <p className="text-gold-400 text-xs uppercase tracking-wider mb-2">Coordonnées bancaires</p>
              <p className="text-white text-sm font-medium">{virement.nom}</p>
              <p className="text-gold-400 font-mono text-sm mt-1">{virement.iban}</p>
              {virement.info && <p className="text-noir-400 text-xs mt-1">{virement.info}</p>}
              <p className="text-white text-sm font-bold mt-2">Montant : {selectedPack?.montant} €</p>
            </div>
          )}
          <p className="text-noir-500 text-xs mb-6">Un email de confirmation a été envoyé à {me?.email}. Vérifiez vos spams.</p>
          <button onClick={() => router.push('/espace-eleve/pack')} className="btn-gold w-full">Voir mon pack</button>
        </div>
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout prenom={me?.prenom} nbNotifs={me?.nb_notifs_non_lues || 0}>
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-white">Acheter un pack de cours</h1>
          <p className="text-noir-400 text-sm mt-1">Choisissez votre formule et économisez sur vos cours</p>
        </div>

        {/* Grille des packs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {packOptions.map((pack, i) => {
            const isSelected = selectedPack?.label === pack.label
            const isPopular  = i === 1
            return (
              <button key={pack.label} onClick={() => setSelectedPack(pack)}
                className={`card text-left transition-all relative ${isSelected ? 'border-gold-500 bg-gold-500/5' : 'hover:border-noir-600'}`}>
                {isPopular && (
                  <span className="absolute -top-2.5 left-4 bg-gold-500 text-noir-950 text-xs font-bold px-3 py-0.5 rounded-full">Populaire</span>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-serif text-xl">{pack.label}</h3>
                    <p className="text-noir-400 text-xs mt-0.5">{pack.heures} heures de cours</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`}>
                    {isSelected && <Check size={12} className="text-noir-950" />}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gold-400">{pack.montant} €</span>
                </div>
                {pack.desc && <p className="text-noir-500 text-xs mt-1">{pack.desc}</p>}
              </button>
            )
          })}
        </div>

        {selectedPack && (
          <div className="max-w-md">
            {/* Récap */}
            <div className="card border-gold-500/30 mb-6">
              <h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-3">{selectedPack.label} sélectionné</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-noir-800 rounded-lg p-3">
                  <p className="text-gold-400 font-bold text-xl">{selectedPack.heures}h</p>
                  <p className="text-noir-500 text-xs mt-0.5">Heures</p>
                </div>
                <div className="bg-noir-800 rounded-lg p-3">
                  <p className="text-gold-400 font-bold text-xl">{selectedPack.montant} €</p>
                  <p className="text-noir-500 text-xs mt-0.5">Montant</p>
                </div>
                <div className="bg-noir-800 rounded-lg p-3">
                  <p className="text-gold-400 font-bold text-xl">{Math.round(selectedPack.montant / selectedPack.heures)} €</p>
                  <p className="text-noir-500 text-xs mt-0.5">/ heure</p>
                </div>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="card mb-6">
              <h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-4">Mode de paiement</h3>
              <div className="space-y-3">
                <button onClick={() => setPaymentMethod('stripe')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'stripe' ? 'border-gold-500 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'stripe' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`}>
                    {paymentMethod === 'stripe' && <Check size={10} className="text-noir-950" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Carte bancaire</p>
                    <p className="text-noir-400 text-xs mt-0.5">Paiement immédiat — pack activé instantanément avec code PK</p>
                  </div>
                  <CreditCard size={18} className="text-noir-400 shrink-0" />
                </button>

                <button onClick={() => setPaymentMethod('paypal')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'paypal' ? 'border-gold-500 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'paypal' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`}>
                    {paymentMethod === 'paypal' && <Check size={10} className="text-noir-950" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">PayPal</p>
                    <p className="text-noir-400 text-xs mt-0.5">Paiement immédiat — pack activé instantanément avec code PK</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>
                </button>

                <button onClick={() => setPaymentMethod('virement')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'virement' ? 'border-gold-500 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'virement' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`}>
                    {paymentMethod === 'virement' && <Check size={10} className="text-noir-950" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Virement bancaire</p>
                    <p className="text-noir-400 text-xs mt-0.5">Pack activé après réception du virement — code PK envoyé par email</p>
                  </div>
                  <Building2 size={18} className="text-noir-400 shrink-0" />
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
            )}

            <button onClick={handleBuy} disabled={submitting} className="btn-gold w-full text-base py-3">
              {submitting ? 'Traitement en cours...' : paymentMethod === 'stripe' ? `Payer ${selectedPack.montant} € par carte` : paymentMethod === 'paypal' ? `Payer ${selectedPack.montant} € via PayPal` : 'Demander par virement bancaire'}
            </button>
            <p className="text-noir-600 text-xs text-center mt-3">Vérifiez vos spams si vous ne recevez pas l&apos;email de confirmation.</p>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
