'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('reservation_id')
  const sessionId     = searchParams.get('session_id')
  const paypal        = searchParams.get('paypal')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!reservationId) { setStatus('error'); return }

    // Mettre à jour le statut de paiement
    fetch('/api/admin/location', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reservationId,
        paiement_statut: 'complet',
        statut: 'validee',
      }),
    }).then(() => setStatus('success')).catch(() => setStatus('success'))
    // On affiche succès même si la mise à jour échoue (webhook Stripe le fera)
  }, [reservationId])

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg">
        <div className="w-24 h-24 rounded-3xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-8">
          <svg width="44" height="44" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Paiement confirmé</span>
        <h1 className="font-serif text-4xl text-white mt-3 mb-4">Réservation confirmée !</h1>
        <p className="text-noir-300 text-base leading-relaxed mb-6">
          Votre paiement a bien été reçu et votre réservation est confirmée.
          Un email de confirmation avec votre contrat de location vous a été envoyé.
        </p>

        <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5 mb-8 text-left">
          <p className="text-white font-semibold mb-3">Prochaines étapes</p>
          <ul className="space-y-2">
            {[
              'Vérifiez votre boîte email (et le dossier Spam)',
              'Votre contrat de location est joint à l\'email de confirmation',
              'Nous vous contacterons pour organiser la remise du matériel',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-noir-300">
                <span className="text-gold-500 font-bold shrink-0">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/location" className="btn-gold px-8 py-3">
            Retour au catalogue
          </Link>
          <Link href="/contact" className="border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white px-8 py-3 rounded-2xl transition-all text-sm">
            Nous contacter
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function LocationConfirmationPage() {
  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ConfirmationContent />
      </Suspense>
      <PublicFooter />
    </div>
  )
}