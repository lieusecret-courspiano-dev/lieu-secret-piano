'use client'

import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { formatDateLocal, formatTime } from '@/lib/utils'
import { TIMEZONES } from '@/types'
import { X, Calendar, Clock, User, Mail, Phone, MessageSquare, Globe, Gift, Check, CreditCard, CheckCircle } from 'lucide-react'

interface Creneau { id: string; start_time: string; end_time: string; notes: string | null }
interface Event { id: string; title: string; description: string | null; type: string; date_heure: string; duration_minutes: number; max_spots: number | null; spots_remaining: number; price: number; is_free: boolean; zoom_link: string | null }
interface Props { type: 'cours' | 'event'; creneau?: Creneau; event?: Event; timezone: string; onClose: () => void; onSuccess: () => void }
interface GiftCardInfo { valid: boolean; montant: number; montant_restant: number; destinataire: string; code: string }
interface PackInfo { valid: boolean; code: string; pack_label: string; heures_total: number; heures_restantes: number; acheteur_nom: string }

type PaymentMethod = 'cb' | 'paypal' | 'deja_paye' | 'bon_cadeau'

export default function BookingModal({ type, creneau, event, timezone, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'info' | 'success'>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tz, setTz] = useState(timezone)
  const [tarifCours, setTarifCours] = useState(22)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cb')

  // Déjà payé — code PK
  const [pkCode, setPkCode] = useState('')
  const [pkInfo, setPkInfo] = useState<PackInfo | null>(null)
  const [pkError, setPkError] = useState('')
  const [pkLoading, setPkLoading] = useState(false)
  const [pkVerified, setPkVerified] = useState(false)

  // Bon cadeau — code LS
  const [giftCode, setGiftCode] = useState('')
  const [giftInfo, setGiftInfo] = useState<GiftCardInfo | null>(null)
  const [giftError, setGiftError] = useState('')
  const [giftLoading, setGiftLoading] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.tarif_cours_1h) setTarifCours(parseFloat(d.tarif_cours_1h) || 22)
    }).catch(() => {})
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function validate(): string {
    if (!form.name.trim()) return 'Votre nom est requis'
    if (!form.email.trim()) return 'Votre email est requis'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Adresse email invalide'
    if (type === 'cours') {
      if (paymentMethod === 'deja_paye' && !pkVerified) return 'Veuillez vérifier votre code pack PK'
      if (paymentMethod === 'bon_cadeau' && !giftInfo) return 'Veuillez vérifier votre code bon cadeau'
    }
    return ''
  }

  async function verifyPK() {
    const code = pkCode.trim().toUpperCase()
    if (!code) { setPkError('Saisissez votre code pack'); return }
    if (!code.startsWith('PK')) { setPkError('Le code doit commencer par "PK"'); return }
    setPkLoading(true); setPkError(''); setPkInfo(null); setPkVerified(false)
    try {
      const res = await fetch('/api/pack/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      const data = await res.json()
      if (data.valid) { setPkInfo(data); setPkVerified(true) }
      else { setPkError(data.error || 'Code invalide ou pack épuisé') }
    } catch { setPkError('Erreur de vérification') }
    finally { setPkLoading(false) }
  }

  async function verifyGift() {
    if (!giftCode.trim()) { setGiftError('Saisissez votre code'); return }
    setGiftLoading(true); setGiftError(''); setGiftInfo(null)
    try {
      const res = await fetch('/api/cadeau/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: giftCode.trim() }) })
      const data = await res.json()
      if (data.valid) { setGiftInfo(data) }
      else { setGiftError(data.error || 'Code invalide') }
    } catch { setGiftError('Erreur de vérification') }
    finally { setGiftLoading(false) }
  }

  function changePaymentMethod(m: PaymentMethod) {
    setPaymentMethod(m); setPkCode(''); setPkInfo(null); setPkError(''); setPkVerified(false)
    setGiftCode(''); setGiftInfo(null); setGiftError(''); setError('')
  }

  const startISO = type === 'cours' ? creneau!.start_time : event!.date_heure
  const endISO = type === 'cours' ? creneau!.end_time : DateTime.fromISO(event!.date_heure, { zone: 'utc' }).plus({ minutes: event!.duration_minutes }).toISO()!
  const dateLabel = formatDateLocal(startISO, tz)
  const timeStart = formatTime(startISO, tz)
  const timeEnd = formatTime(endISO, tz)
  const title = type === 'cours' ? 'Cours de piano individuel' : event!.title
  const eventPrice = type === 'event' && event && !event.is_free ? event.price : 0
  const giftDiscount = giftInfo ? Math.min(giftInfo.montant_restant, type === 'cours' ? tarifCours : eventPrice) : 0
  const priceFinal = Math.max(0, (type === 'cours' ? tarifCours : eventPrice) - giftDiscount)
  const isFreeWithGift = giftInfo && priceFinal === 0

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError(''); setLoading(true)
    try {
      // CB Stripe
      if (type === 'cours' && paymentMethod === 'cb') {
        const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'cours', slot_start: creneau!.start_time, slot_end: creneau!.end_time, student_name: form.name, student_email: form.email, student_phone: form.phone || null, student_timezone: tz, message: form.message || null, gift_code: giftInfo?.code || null }) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur paiement')
        if (data.url) { window.location.href = data.url; return }
      }
      // PayPal
      if (type === 'cours' && paymentMethod === 'paypal') {
        const giftDiscount = giftInfo ? Math.min(giftInfo.montant_restant, tarifCours) : 0
        const priceFinalPP = Math.max(0, tarifCours - giftDiscount)
        if (priceFinalPP <= 0) { setError('Montant nul — utilisez la réservation directe'); return }
        const res = await fetch('/api/paypal/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'cours', slot_start: creneau!.start_time, slot_end: creneau!.end_time, student_name: form.name, student_email: form.email, student_phone: form.phone || null, student_timezone: tz, message: form.message || null, gift_code: giftInfo?.code || null, amount_override: giftInfo ? priceFinalPP : undefined }) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur PayPal')
        if (data.approveUrl) { window.location.href = data.approveUrl; return }
      }
      // Déjà payé (code PK)
      if (type === 'cours' && paymentMethod === 'deja_paye') {
        const res = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_name: form.name, student_email: form.email, student_phone: form.phone || null, student_timezone: tz, message: form.message || null, type: 'cours', payment_method: 'deja_paye', pack_code: pkCode.trim().toUpperCase(), slot_start: creneau!.start_time, slot_end: creneau!.end_time }) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur réservation')
        setStep('success'); return
      }
      // Bon cadeau
      if (type === 'cours' && paymentMethod === 'bon_cadeau') {
        if (isFreeWithGift) {
          const res = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_name: form.name, student_email: form.email, student_phone: form.phone || null, student_timezone: tz, message: form.message || null, type: 'cours', payment_method: 'cadeau', gift_code: giftInfo!.code, slot_start: creneau!.start_time, slot_end: creneau!.end_time }) })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur réservation')
          setStep('success'); return
        } else {
          // Complément CB
          const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'cours', slot_start: creneau!.start_time, slot_end: creneau!.end_time, student_name: form.name, student_email: form.email, student_phone: form.phone || null, student_timezone: tz, message: form.message || null, gift_code: giftInfo!.code, amount_override: priceFinal }) })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur paiement')
          if (data.url) { window.location.href = data.url; return }
        }
      }
      // Événement
      if (type === 'event' && event) {
        if (!event.is_free && !isFreeWithGift) {
          const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'event', event_id: event.id, student_name: form.name, student_email: form.email, student_phone: form.phone || null, student_timezone: tz, message: form.message || null, gift_code: giftInfo?.code || null }) })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur paiement')
          if (data.url) { window.location.href = data.url; return }
        } else {
          const res = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_name: form.name, student_email: form.email, student_phone: form.phone || null, student_timezone: tz, message: form.message || null, type: event.type, payment_method: isFreeWithGift ? 'cadeau' : 'gratuit', gift_code: giftInfo?.code || null, event_id: event.id }) })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur réservation')
          setStep('success'); return
        }
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur inconnue') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 sticky top-0 bg-noir-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 rounded overflow-hidden border border-gold-500/30"><img src="/piano-hero.jpg" alt="" className="w-full h-full object-cover opacity-75" /></div>
            <span className="font-serif text-gold-400 tracking-wider text-sm">LIEU SECRET</span>
          </div>
          <button onClick={onClose} className="text-noir-400 hover:text-white transition-colors p-1"><X size={20} /></button>
        </div>

        {step === 'info' && (
          <div className="p-5 sm:p-6">
            {/* Récap */}
            <div className="bg-noir-800 border border-gold-500/30 rounded-xl p-4 mb-5">
              <h3 className="text-white font-medium mb-2 text-sm">{title}</h3>
              <div className="flex items-center gap-2 text-sm text-noir-300 mb-1"><Calendar size={14} className="text-gold-500 shrink-0" /><span className="capitalize">{dateLabel}</span></div>
              <div className="flex items-center gap-2 text-sm text-noir-300 mb-2"><Clock size={14} className="text-gold-500 shrink-0" /><span>{timeStart} — {timeEnd}</span></div>
              {type === 'cours' && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-noir-700">
                  <span className="text-noir-400 text-xs">Tarif</span>
                  <span className="text-gold-400 font-bold text-sm">{tarifCours} € / heure</span>
                </div>
              )}
              {type === 'event' && event && !event.is_free && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-noir-700">
                  <span className="text-noir-400 text-xs">Tarif</span>
                  {giftDiscount > 0 ? <span><span className="line-through text-noir-500 mr-2 text-xs">{eventPrice.toFixed(2)} €</span><span className="text-gold-400 font-bold text-sm">{isFreeWithGift ? 'Gratuit ✓' : `${priceFinal.toFixed(2)} €`}</span></span> : <span className="text-gold-400 font-bold text-sm">{eventPrice.toFixed(2)} €</span>}
                </div>
              )}
              {type === 'event' && event?.is_free && <div className="mt-2 pt-2 border-t border-noir-700"><span className="text-green-400 text-sm font-medium">Gratuit</span></div>}
            </div>

            {/* Fuseau */}
            <div className="mb-4"><label className="label flex items-center gap-1 mb-1"><Globe size={13} /> Votre fuseau horaire</label><select value={tz} onChange={e => setTz(e.target.value)} className="input w-full">{TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            {/* Nom */}
            <div className="mb-4"><label className="label flex items-center gap-1 mb-1"><User size={13} /> Votre nom *</label><input name="name" value={form.name} onChange={handleChange} placeholder="Prénom Nom" className="input w-full" /></div>
            {/* Email */}
            <div className="mb-4"><label className="label flex items-center gap-1 mb-1"><Mail size={13} /> Votre email *</label><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="vous@exemple.com" className="input w-full" /></div>
            {/* Téléphone */}
            <div className="mb-4"><label className="label flex items-center gap-1 mb-1"><Phone size={13} /> Téléphone (optionnel)</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+33 6 00 00 00 00" className="input w-full" /></div>
            {/* Message */}
            <div className="mb-5"><label className="label flex items-center gap-1 mb-1"><MessageSquare size={13} /> Message (optionnel)</label><textarea name="message" value={form.message} onChange={handleChange} placeholder="Niveau, objectifs, questions..." className="input w-full h-20 resize-none" /></div>

            {/* Modes de paiement cours — 3 options */}
            {type === 'cours' && (
              <div className="mb-5">
                <label className="label mb-3 block">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => changePaymentMethod('cb')} className={'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ' + (paymentMethod === 'cb' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                    <CreditCard size={18} /><span>Carte bancaire</span><span className="opacity-75 font-normal">{tarifCours} €</span>
                  </button>
                  <button type="button" onClick={() => changePaymentMethod('paypal')} className={'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ' + (paymentMethod === 'paypal' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>
                    <span>PayPal</span><span className="opacity-75 font-normal">{tarifCours} €</span>
                  </button>
                  <button type="button" onClick={() => changePaymentMethod('deja_paye')} className={'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ' + (paymentMethod === 'deja_paye' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                    <CheckCircle size={18} /><span>Déjà payé</span><span className="opacity-75 font-normal">Code PK</span>
                  </button>
                  <button type="button" onClick={() => changePaymentMethod('bon_cadeau')} className={'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ' + (paymentMethod === 'bon_cadeau' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                    <Gift size={18} /><span>Bon cadeau</span><span className="opacity-75 font-normal">Code LS</span>
                  </button>
                </div>

                {/* Déjà payé */}
                {paymentMethod === 'deja_paye' && (
                  <div className="mt-4 bg-noir-800/50 border border-noir-700 rounded-xl p-4">
                    <p className="text-noir-300 text-xs mb-3">Saisissez votre code pack (commence par <strong className="text-gold-400">PK</strong>).</p>
                    <label className="label mb-1 block">Code Pack *</label>
                    <div className="flex gap-2">
                      <input value={pkCode} onChange={e => { setPkCode(e.target.value.toUpperCase()); setPkVerified(false); setPkInfo(null); setPkError('') }} placeholder="PK-XXXX-XXXX" className="input flex-1 font-mono tracking-widest text-center" maxLength={12} />
                      <button type="button" onClick={verifyPK} disabled={pkLoading || !pkCode.trim()} className="btn-gold px-4 text-sm disabled:opacity-50">{pkLoading ? <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin inline-block" /> : 'Vérifier'}</button>
                    </div>
                    {pkError && <p className="text-red-400 text-xs mt-2">{pkError}</p>}
                    {pkVerified && pkInfo && <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3"><p className="text-green-400 text-xs font-medium flex items-center gap-1"><Check size={12} /> Code valide — {pkInfo.pack_label}</p><p className="text-noir-400 text-xs mt-1">{pkInfo.heures_restantes}h restantes</p></div>}
                  </div>
                )}

                {/* Bon cadeau */}
                {paymentMethod === 'bon_cadeau' && (
                  <div className="mt-4 bg-noir-800/50 border border-noir-700 rounded-xl p-4">
                    <p className="text-noir-300 text-xs mb-3">Saisissez votre code bon cadeau (commence par <strong className="text-gold-400">LS</strong>).{giftInfo && giftDiscount < tarifCours && <span className="text-yellow-400"> Couvre {giftDiscount} € — reste {priceFinal} € par carte.</span>}</p>
                    <label className="label mb-1 block">Code bon cadeau *</label>
                    <div className="flex gap-2">
                      <input value={giftCode} onChange={e => { setGiftCode(e.target.value.toUpperCase()); setGiftInfo(null); setGiftError('') }} placeholder="LS-XXXX-XXXX" className="input flex-1 font-mono tracking-widest text-center" />
                      <button type="button" onClick={verifyGift} disabled={giftLoading || !giftCode.trim()} className="btn-gold px-4 text-sm disabled:opacity-50">{giftLoading ? <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin inline-block" /> : 'Vérifier'}</button>
                    </div>
                    {giftError && <p className="text-red-400 text-xs mt-2">{giftError}</p>}
                    {giftInfo && <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3"><p className="text-green-400 text-xs font-medium flex items-center gap-1"><Check size={12} /> Bon cadeau valide — {giftInfo.montant_restant} € disponibles</p>{isFreeWithGift ? <p className="text-green-400 text-xs mt-1">Cours entièrement couvert !</p> : <p className="text-yellow-400 text-xs mt-1">Déduction : {giftDiscount} € — Reste : {priceFinal} € par carte</p>}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Bon cadeau événements */}
            {type === 'event' && event && !event.is_free && (
              <div className="mb-5">
                <label className="label flex items-center gap-1 mb-2"><Gift size={13} /> Bon cadeau (optionnel)</label>
                {!giftInfo ? <div className="flex gap-2"><input value={giftCode} onChange={e => { setGiftCode(e.target.value.toUpperCase()); setGiftError('') }} placeholder="LS-XXXX-XXXX" className="input flex-1 font-mono tracking-widest text-center text-sm" /><button type="button" onClick={verifyGift} disabled={giftLoading || !giftCode.trim()} className="btn-outline text-sm px-3 disabled:opacity-50">{giftLoading ? '...' : 'Appliquer'}</button></div> : <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-3"><p className="text-green-400 text-xs flex items-center gap-1"><Check size={12} /> {giftInfo.code} — {giftDiscount} € appliqués</p><button onClick={() => { setGiftInfo(null); setGiftCode('') }} className="text-noir-500 hover:text-red-400 text-xs">Retirer</button></div>}
                {giftError && <p className="text-red-400 text-xs mt-1">{giftError}</p>}
              </div>
            )}

            {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3"><p className="text-red-400 text-sm">{error}</p></div>}

            <button onClick={handleSubmit} disabled={loading} className="btn-gold w-full disabled:opacity-50">
              {loading ? <span className="w-5 h-5 border-2 border-noir-900 border-t-transparent rounded-full animate-spin inline-block" /> : type === 'cours' && paymentMethod === 'cb' ? `Payer ${tarifCours} € par carte` : type === 'cours' && paymentMethod === 'deja_paye' ? 'Confirmer la réservation' : type === 'cours' && paymentMethod === 'bon_cadeau' && isFreeWithGift ? 'Réserver avec mon bon cadeau' : type === 'cours' && paymentMethod === 'bon_cadeau' && giftInfo ? `Payer ${priceFinal} € (après déduction)` : type === 'cours' && paymentMethod === 'bon_cadeau' ? "Vérifiez votre bon cadeau d'abord" : type === 'event' && event && !event.is_free && !isFreeWithGift ? `Payer ${priceFinal.toFixed(2)} €` : 'Confirmer la réservation'}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-4"><svg width="24" height="24" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <h2 className="font-serif text-2xl text-white mb-3">Réservation confirmée !</h2>
            <p className="text-noir-300 text-sm mb-2">Un email de confirmation a été envoyé à <strong className="text-gold-400">{form.email}</strong>.</p>
            {giftInfo && <p className="text-green-400 text-xs mb-2">Votre bon cadeau {giftInfo.code} a été appliqué.</p>}
            {pkVerified && pkInfo && <p className="text-green-400 text-xs mb-2">1h débitée de votre pack {pkInfo.pack_label}.</p>}
            <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg p-3 mb-4 text-left"><p className="text-gold-400 text-xs font-medium mb-1">Vous ne voyez pas l&apos;email ?</p><p className="text-noir-400 text-xs">Vérifiez votre dossier <strong className="text-white">Spam</strong> ou <strong className="text-white">Courrier indésirable</strong>.</p></div>
            <button onClick={() => { onSuccess(); onClose() }} className="btn-gold w-full">Fermer</button>
          </div>
        )}
      </div>
    </div>
  )
}
