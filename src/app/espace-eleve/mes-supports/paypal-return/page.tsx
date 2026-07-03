'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

function PaypalReturnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const payerId = searchParams.get('PayerID')

    if (!token) {
      setStatus('error')
      setMessage('Paramètres de paiement manquants.')
      return
    }

    // Capturer le paiement PayPal
    fetch('/api/supports/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, payerId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success')
          setMessage('Votre accès au support a été activé !')
          setTimeout(() => router.push('/espace-eleve/mes-supports'), 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Erreur lors de la confirmation du paiement.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Erreur réseau. Contactez le support.')
      })
  }, [])

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center py-12">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Confirmation du paiement en cours...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-white mb-2">Paiement confirmé !</h2>
            <p className="text-noir-400 text-sm mb-6">{message}</p>
            <p className="text-noir-500 text-xs">Redirection automatique dans 3 secondes...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-white mb-2">Erreur de paiement</h2>
            <p className="text-noir-400 text-sm mb-6">{message}</p>
            <button onClick={() => router.push('/espace-eleve/mes-supports')} className="btn-gold">
              Retour à mes supports
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaypalReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaypalReturnContent />
    </Suspense>
  )
}