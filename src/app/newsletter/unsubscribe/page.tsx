'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeContent() {
  const params = useSearchParams()
  const success = params.get('success') === '1'
  const error = params.get('error') === '1'
  const email = params.get('email') || ''

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card border-noir-700 py-12">
          {success ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 className="font-serif text-2xl text-white mb-3">Désabonnement confirmé</h1>
              <p className="text-noir-400 text-sm mb-2">
                L'adresse <span className="text-white font-medium">{email}</span> a bien été retirée de notre newsletter.
              </p>
              <p className="text-noir-500 text-xs mb-8">Vous ne recevrez plus nos emails. Vous pouvez vous réinscrire à tout moment.</p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h1 className="font-serif text-2xl text-white mb-3">Une erreur est survenue</h1>
              <p className="text-noir-400 text-sm mb-8">Impossible de traiter votre demande. Contactez-nous directement.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-noir-800 border border-noir-700 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" fill="none" stroke="#707070" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h1 className="font-serif text-2xl text-white mb-3">Désabonnement</h1>
              <p className="text-noir-400 text-sm mb-8">Lien invalide. Utilisez le lien de désabonnement reçu dans votre email.</p>
            </>
          )}
          <div className="flex flex-col gap-3">
            <Link href="/" className="btn-gold text-sm">Retour à l'accueil</Link>
            {success && (
              <Link href="/blog" className="btn-outline text-sm">Voir le blog</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}