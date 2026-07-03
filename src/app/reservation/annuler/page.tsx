'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AnnulationContent() {
  const searchParams = useSearchParams()
  const token        = searchParams.get('token')
  const id           = searchParams.get('id')

  const [status, setStatus]   = useState<'loading' | 'confirm' | 'success' | 'error' | 'already'>('loading')
  const [reservation, setReservation] = useState<{
    student_name: string
    type: string
    creneau?: { start_time: string }
    event?: { title: string }
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id || !token) { setStatus('error'); return }

    fetch(`/api/reservations/cancel?id=${id}&token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus('error'); return }
        if (data.status === 'cancelled') { setStatus('already'); return }
        setReservation(data)
        setStatus('confirm')
      })
      .catch(() => setStatus('error'))
  }, [id, token])

  async function handleCancel() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reservations/cancel`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-11 rounded-xl overflow-hidden border border-gold-500/30 mx-auto mb-4">
            <img src="/piano-hero.jpg" alt="Piano" className="w-full h-full object-cover opacity-75" />
          </div>
          <div className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</div>
        </div>

        <div className="bg-noir-900 border border-noir-700 rounded-2xl p-8 shadow-2xl">

          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-noir-400 text-sm">Verification en cours...</p>
            </div>
          )}

          {status === 'confirm' && reservation && (
            <div>
              <h1 className="font-serif text-2xl text-white mb-2 text-center">Annuler la reservation</h1>
              <p className="text-noir-400 text-sm text-center mb-6">Etes-vous sur de vouloir annuler ?</p>

              <div className="bg-noir-800 border border-noir-700 rounded-xl p-4 mb-6">
                <p className="text-white font-medium mb-1">{reservation.student_name}</p>
                <p className="text-noir-400 text-sm">
                  {reservation.event?.title || 'Cours de piano individuel'}
                </p>
              </div>

              <div className="flex gap-3">
                <a href="/" className="btn-outline flex-1 text-center">
                  Garder
                </a>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Annulation...
                    </span>
                  ) : 'Confirmer l\'annulation'}
                </button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="font-serif text-xl text-white mb-3">Reservation annulee</h2>
              <p className="text-noir-400 text-sm mb-6">
                Votre reservation a bien ete annulee. Le creneau est de nouveau disponible.
              </p>
              <a href="/" className="btn-gold">
                Retour au site
              </a>
            </div>
          )}

          {status === 'already' && (
            <div className="text-center py-4">
              <p className="text-noir-400 text-sm mb-4">Cette reservation a deja ete annulee.</p>
              <a href="/" className="btn-gold">Retour au site</a>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <p className="text-red-400 text-sm mb-4">
                Lien invalide ou expire. Contactez-nous si vous avez besoin d'aide.
              </p>
              <a href="/" className="btn-gold">Retour au site</a>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AnnulationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AnnulationContent />
    </Suspense>
  )
}