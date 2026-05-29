'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

function ConfirmationContent() {
  const params    = useSearchParams()
  const sessionId = params.get('session_id')
  const type      = params.get('type') || 'cours'
  const nameParam = params.get('name') || ''
  const emailParam = params.get('email') || ''

  const [status, setStatus]   = useState<'loading' | 'done' | 'error'>('loading')
  const [studentName, setStudentName]   = useState(nameParam)
  const [studentEmail, setStudentEmail] = useState(emailParam)
  const [eventTitle, setEventTitle]     = useState('')

  useEffect(() => {
    // Si paiement Stripe — appeler le fallback pour créer la réservation et envoyer les emails
    if (sessionId && type === 'event') {
      fetch(`/api/stripe/confirm?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            if (data.student_name)  setStudentName(data.student_name)
            if (data.student_email) setStudentEmail(data.student_email)
            if (data.event_title)   setEventTitle(data.event_title)
          }
          setStatus('done')
        })
        .catch(() => setStatus('done')) // Afficher quand même la confirmation
    } else {
      setStatus('done')
    }
  }, [sessionId, type])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-noir-400 text-sm">Confirmation de votre paiement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="w-20 h-14 rounded-xl overflow-hidden border border-gold-500/30 mx-auto mb-6">
          <img src="/piano-hero.jpg" alt="Piano" className="w-full h-full object-cover opacity-80" />
        </div>

        {/* Icone succes */}
        <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
          <svg width="26" height="26" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <div className="w-px h-5 bg-gold-500/40 mx-auto mb-4" />

        <h1 className="font-serif text-3xl text-white mb-4">
          {type === 'event' ? 'Inscription confirmee !' : 'Reservation confirmee !'}
        </h1>

        {studentName && (
          <p className="text-noir-300 mb-2">
            Bonjour <strong className="text-gold-400">{studentName}</strong>,
          </p>
        )}

        {eventTitle && (
          <p className="text-gold-400 font-medium mb-3">{eventTitle}</p>
        )}

        <p className="text-noir-400 text-sm mb-6 leading-relaxed">
          {type === 'event'
            ? 'Votre paiement a ete accepte et votre inscription est confirmee.'
            : 'Votre reservation a bien ete enregistree.'
          }
          {studentEmail && (
            <> Un email de confirmation avec le fichier calendrier (.ics) a ete envoye a <strong className="text-gold-400">{studentEmail}</strong>.</>
          )}
        </p>

        <div className="bg-noir-900 border border-noir-700 rounded-xl p-4 mb-8 text-left">
          <h3 className="text-gold-400 text-sm font-medium mb-3">Ajouter a votre agenda</h3>
          <p className="text-noir-400 text-xs leading-relaxed">
            Ouvrez l'email de confirmation et cliquez sur le fichier <strong className="text-white">.ics</strong> joint pour ajouter automatiquement ce rendez-vous dans :
          </p>
          <ul className="mt-2 space-y-1 text-xs text-noir-400">
            <li>— <strong className="text-white">Outlook</strong> — double-cliquez sur le fichier .ics</li>
            <li>— <strong className="text-white">Google Calendar</strong> — importez le fichier .ics</li>
            <li>— <strong className="text-white">Apple Calendar</strong> — double-cliquez sur le fichier .ics</li>
          </ul>
        </div>

        <Link href="/" className="btn-gold inline-block">
          Retour a l'accueil
        </Link>
      </div>
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