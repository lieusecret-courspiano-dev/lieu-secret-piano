'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

function ConfirmationContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return }

    // Attendre quelques secondes que le webhook traite le paiement
    const checkAccess = async (attempt = 0) => {
      try {
        const res = await fetch(`/api/ressources-premium/confirmation?session_id=${sessionId}`)
        const data = await res.json()

        if (data.token) {
          setToken(data.token)
          setStatus('success')
        } else if (attempt < 5) {
          // Réessayer après 2 secondes (le webhook peut prendre un moment)
          setTimeout(() => checkAccess(attempt + 1), 2000)
        } else {
          // Après 5 tentatives, afficher "en cours de traitement"
          setStatus('pending')
        }
      } catch {
        setStatus('error')
      }
    }

    // Attendre 1 seconde avant la première vérification
    setTimeout(() => checkAccess(), 1000)
  }, [sessionId])

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <div className="pt-32 pb-24 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center">
          {status === 'loading' && (
            <div className="card py-12">
              <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="font-serif text-2xl text-white mb-2">Traitement en cours...</h2>
              <p className="text-noir-400 text-sm">Confirmation de votre paiement</p>
            </div>
          )}

          {status === 'success' && token && (
            <div className="card py-10">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="font-serif text-2xl text-white mb-3">Paiement confirmé !</h2>
              <p className="text-noir-400 text-sm mb-6">
                Votre accès est maintenant disponible. Un email de confirmation vous a été envoyé.
              </p>
              <Link href={`/ressources-premium/acces/${token}`} className="btn-gold w-full text-center block mb-3">
                Accéder à ma ressource
              </Link>
              <Link href="/ressources-premium" className="text-noir-500 hover:text-gold-400 text-sm transition-colors">
                Voir d'autres ressources
              </Link>
            </div>
          )}

          {status === 'pending' && (
            <div className="card py-10">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-white mb-3">Paiement reçu</h2>
              <p className="text-noir-400 text-sm mb-6">
                Votre paiement a bien été reçu. Vous recevrez un email avec votre lien d'accès dans quelques instants.
              </p>
              <Link href="/ressources-premium" className="btn-gold w-full text-center block">
                Retour aux ressources
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="card py-10">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-white mb-3">Une erreur est survenue</h2>
              <p className="text-noir-400 text-sm mb-6">
                Si votre paiement a été effectué, vous recevrez votre accès par email. Contactez-nous si le problème persiste.
              </p>
              <Link href="/contact" className="btn-gold w-full text-center block">
                Nous contacter
              </Link>
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}