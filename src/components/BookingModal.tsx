'use client'

import { useState } from 'react'
import { DateTime } from 'luxon'
import { formatDateLocal, formatTime } from '@/lib/utils'
import { TIMEZONES } from '@/types'
import { X, Calendar, Clock, User, Mail, Phone, MessageSquare, Globe } from 'lucide-react'

interface Creneau {
  id: string
  start_time: string
  end_time: string
  notes: string | null
}

interface Event {
  id: string
  title: string
  description: string | null
  type: string
  date_heure: string
  duration_minutes: number
  max_spots: number | null
  spots_remaining: number
  price: number
  is_free: boolean
  zoom_link: string | null
}

interface Props {
  type: 'cours' | 'event'
  creneau?: Creneau
  event?: Event
  timezone: string
  onClose: () => void
  onSuccess: () => void
}

export default function BookingModal({ type, creneau, event, timezone, onClose, onSuccess }: Props) {
  const [step, setStep]       = useState<'info' | 'confirm' | 'success'>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [tz, setTz]           = useState(timezone)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', message: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function validate() {
    if (!form.name.trim())  return 'Votre nom est requis'
    if (!form.email.trim()) return 'Votre email est requis'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Adresse email invalide'
    return ''
  }

  const startISO  = type === 'cours' ? creneau!.start_time : event!.date_heure
  const endISO    = type === 'cours'
    ? creneau!.end_time
    : DateTime.fromISO(event!.date_heure, { zone: 'utc' }).plus({ minutes: event!.duration_minutes }).toISO()!
  const dateLabel = formatDateLocal(startISO, tz)
  const timeStart = formatTime(startISO, tz)
  const timeEnd   = formatTime(endISO, tz)
  const title     = type === 'cours' ? 'Cours de piano individuel' : event!.title
  const isPaid    = type === 'event' && event && !event.is_free
  const price     = isPaid ? event!.price : 0

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    try {
      // Événement payant → redirection Stripe
      if (isPaid && event) {
        const res = await fetch('/api/stripe/checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            event_id:         event.id,
            student_name:     form.name,
            student_email:    form.email,
            student_phone:    form.phone || null,
            student_timezone: tz,
            message:          form.message || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur lors du paiement')
        window.location.href = data.url
        return
      }

      // Cours individuel ou événement gratuit → réservation directe
      const body: Record<string, unknown> = {
        student_name:     form.name,
        student_email:    form.email,
        student_phone:    form.phone || null,
        student_timezone: tz,
        message:          form.message || null,
        type:             type === 'cours' ? 'cours' : (event?.type || 'evenement'),
        payment_method:   type === 'cours' ? 'virement' : 'gratuit',
      }

      if (type === 'cours' && creneau) {
        body.slot_start = creneau.start_time
        body.slot_end   = creneau.end_time
      } else if (type === 'event' && event) {
        body.event_id = event.id
      }

      const res = await fetch('/api/reservations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la réservation')
      }

      setStep('success')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 sticky top-0 bg-noir-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 rounded overflow-hidden border border-gold-500/30">
              <img src="/piano-hero.jpg" alt="" className="w-full h-full object-cover opacity-75" />
            </div>
            <span className="font-serif text-gold-400 tracking-wider text-sm">LIEU SECRET</span>
          </div>
          <button onClick={onClose} className="text-noir-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* ÉTAPE 1 : Formulaire */}
        {step === 'info' && (
          <div className="p-5 sm:p-6">
            {/* Récap */}
            <div className="bg-noir-800 border border-gold-500/30 rounded-xl p-4 mb-5">
              <h3 className="text-white font-medium mb-2 text-sm sm:text-base">{title}</h3>
              <div className="flex items-center gap-2 text-sm text-noir-300 mb-1">
                <Calendar size={14} className="text-gold-500 shrink-0" />
                <span className="capitalize">{dateLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-noir-300">
                <Clock size={14} className="text-gold-500 shrink-0" />
                <span>{timeStart} — {timeEnd}</span>
              </div>
              {isPaid && (
                <div className="mt-2 text-gold-400 font-medium text-sm">
                  Paiement : {price.toFixed(2)} EUR (carte bancaire)
                </div>
              )}
              {type === 'event' && event?.is_free && (
                <div className="mt-2 text-green-400 text-sm">Gratuit</div>
              )}
              {type === 'event' && event?.max_spots && (
                <div className="mt-1 text-xs text-noir-400">
                  {event.spots_remaining} place{event.spots_remaining > 1 ? 's' : ''} restante{event.spots_remaining > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Fuseau */}
            <div className="mb-4">
              <label className="label flex items-center gap-1 mb-1"><Globe size={13} /> Votre fuseau horaire</label>
              <select value={tz} onChange={e => setTz(e.target.value)} className="input w-full">
                {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Nom */}
            <div className="mb-4">
              <label className="label flex items-center gap-1 mb-1"><User size={13} /> Votre nom *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Prénom Nom" className="input w-full" />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="label flex items-center gap-1 mb-1"><Mail size={13} /> Votre email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="vous@exemple.com" className="input w-full" />
            </div>

            {/* Téléphone */}
            <div className="mb-4">
              <label className="label flex items-center gap-1 mb-1"><Phone size={13} /> Téléphone (optionnel)</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+33 6 00 00 00 00" className="input w-full" />
            </div>

            {/* Message */}
            <div className="mb-5">
              <label className="label flex items-center gap-1 mb-1"><MessageSquare size={13} /> Message (optionnel)</label>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Votre niveau, vos objectifs..." rows={3} className="input w-full resize-none" />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
            )}

            <button
              onClick={() => { const e = validate(); if (e) { setError(e); return }; setError(''); setStep('confirm') }}
              className="btn-gold w-full"
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : Confirmation */}
        {step === 'confirm' && (
          <div className="p-5 sm:p-6">
            <h2 className="text-white font-serif text-xl mb-5">Confirmer la réservation</h2>

            <div className="space-y-3 mb-5">
              {[
                { label: 'Cours',     value: title },
                { label: 'Date',      value: dateLabel },
                { label: 'Horaire',   value: `${timeStart} — ${timeEnd}` },
                { label: 'Fuseau',    value: tz },
                { label: 'Nom',       value: form.name },
                { label: 'Email',     value: form.email },
                form.phone ? { label: 'Téléphone', value: form.phone } : null,
                isPaid ? { label: 'Montant', value: `${price.toFixed(2)} EUR` } : null,
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-noir-800 pb-2">
                  <span className="text-noir-400 shrink-0 w-24">{item!.label}</span>
                  <span className="text-white text-right">{item!.value}</span>
                </div>
              ))}
            </div>

            {isPaid && (
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3 mb-4 text-sm text-gold-300">
                Vous allez être redirigé vers la page de paiement sécurisée Stripe pour régler {price.toFixed(2)} EUR.
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('info')} className="btn-outline flex-1" disabled={loading}>
                Retour
              </button>
              <button onClick={handleSubmit} className="btn-gold flex-1" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                    {isPaid ? 'Redirection…' : 'Envoi…'}
                  </span>
                ) : isPaid ? 'Payer maintenant' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Succès */}
        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-white font-serif text-2xl mb-3">Réservation confirmée !</h2>
            <p className="text-noir-300 text-sm mb-2">
              Un email de confirmation avec le fichier calendrier (.ics) a été envoyé à <strong className="text-gold-400">{form.email}</strong>.
            </p>
            <p className="text-noir-400 text-xs mb-8">
              Vous pouvez ajouter ce rendez-vous dans Outlook, Google Calendar ou Apple Calendar.
            </p>
            <button onClick={() => { onSuccess(); onClose() }} className="btn-gold">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}