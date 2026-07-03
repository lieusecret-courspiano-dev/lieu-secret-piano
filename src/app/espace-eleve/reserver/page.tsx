'use client'
import React from 'react'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { DateTime } from 'luxon'
import { formatTime } from '@/lib/utils'
import { TIMEZONES } from '@/types'
import { ChevronLeft, ChevronRight, Calendar, Clock, Check, CreditCard, Gift, Package } from 'lucide-react'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'

// ── Types pour les réservations ──
interface Reservation {
  id: string; slot_start: string; slot_end: string
  type: string; status: string; payment_method: string; amount: number; created_at: string
}
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:        { label: 'Confirmé',    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  pending:          { label: 'En attente',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  pending_virement: { label: 'Virement',    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  cancelled:        { label: 'Annulé',      color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
}

const DAYS_FR   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

interface GeneratedSlot { start: string; end: string; available: boolean }
interface Pack { id: string; code: string; pack_label: string; heures_restantes: number; heures_total: number; status: string }
interface EleveMe { id: string; prenom: string; nom: string; email: string; nb_notifs_non_lues?: number }

type PaymentMethod = 'pack' | 'cb' | 'bon_cadeau'


// ── Composant onglet Mes réservations ──────────────────────────────────────────
interface Reservation {
  id: string; slot_start: string; slot_end: string
  type: string; status: string; payment_method: string; amount: number
}
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:        { label: 'Confirmé',    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  pending:          { label: 'En attente',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  pending_virement: { label: 'Virement',    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  cancelled:        { label: 'Annulé',      color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
}

function ReservationsTab({ onReserver }: { onReserver: () => void }) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'a_venir' | 'passes'>('a_venir')

  useEffect(() => {
    fetch('/api/eleve/reservations')
      .then(r => r.ok ? r.json() : [])
      .then(d => setReservations(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleAnnuler(id: string, slotStart: string) {
    if ((new Date(slotStart).getTime() - Date.now()) / 3600000 < 15) {
      alert('Annulation impossible : le cours est dans moins de 15 heures.'); return
    }
    if (!confirm("Confirmer l'annulation ?")) return
    const res = await fetch(`/api/eleve/reservations/${id}`, { method: 'DELETE' })
    if (res.ok) setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
    else { const d = await res.json(); alert(d.error || 'Erreur') }
  }

  const now = new Date()
  const aVenir = reservations.filter(r => new Date(r.slot_start) > now && r.status !== 'cancelled')
  const passes = reservations.filter(r => new Date(r.slot_start) <= now || r.status === 'cancelled')
  const filtered = filter === 'a_venir' ? aVenir : passes

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-noir-400 text-sm">{aVenir.length} à venir · {passes.length} passé{passes.length > 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          {([{ key: 'a_venir', label: `À venir (${aVenir.length})` }, { key: 'passes', label: `Passés (${passes.length})` }] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === f.key ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-noir-400 mb-4">{filter === 'a_venir' ? 'Aucun cours à venir' : 'Aucun cours passé'}</p>
          {filter === 'a_venir' && <button onClick={onReserver} className="btn-gold text-sm">Réserver un cours</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending
            const start = DateTime.fromISO(r.slot_start)
            const end   = DateTime.fromISO(r.slot_end)
            const isPast = new Date(r.slot_start) <= now
            const heuresAvant = (new Date(r.slot_start).getTime() - Date.now()) / 3600000
            const peutAnnuler = !isPast && r.status !== 'cancelled' && heuresAvant >= 15
            return (
              <div key={r.id} className={`card transition-all ${isPast ? 'opacity-70' : 'hover:border-gold-500/20'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${isPast ? 'bg-noir-800 border border-noir-700' : 'bg-gold-500/10 border border-gold-500/30'}`}>
                    <p className={`text-xs font-bold ${isPast ? 'text-noir-400' : 'text-gold-400'}`}>{start.toFormat('dd')}</p>
                    <p className={`text-xs ${isPast ? 'text-noir-600' : 'text-gold-500'}`}>{start.setLocale('fr').toFormat('MMM')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{start.setLocale('fr').toFormat('EEEE d MMMM yyyy')}</p>
                    <p className="text-noir-400 text-xs mt-0.5">{start.toFormat('HH:mm')} — {end.toFormat('HH:mm')}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      {r.amount > 0 && <span className="text-xs text-noir-500">{r.amount} €</span>}
                    </div>
                    {!isPast && r.status !== 'cancelled' && (
                      <div className="mt-3 pt-3 border-t border-noir-800 space-y-2">
                        {heuresAvant <= 2 && heuresAvant > 0 && (
                          <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                            Votre cours commence bientôt
                          </div>
                        )}
                        {peutAnnuler ? (
                          <button onClick={() => handleAnnuler(r.id, r.slot_start)} className="text-xs text-noir-500 hover:text-red-400 transition-colors flex items-center gap-1.5">
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Annuler ce cours
                          </button>
                        ) : (
                          <p className="text-xs text-noir-600 italic">Annulation impossible (moins de 15h avant le cours)</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReserverEleveContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'reserver' | 'reservations'>('reserver')
  const touchStartX = React.useRef<number>(0)
  const touchEndX   = React.useRef<number>(0)

  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 60) { // seuil 60px
      if (diff > 0 && activeTab === 'reserver') setActiveTab('reservations')
      if (diff < 0 && activeTab === 'reservations') setActiveTab('reserver')
    }
  }
  const [me, setMe]           = useState<EleveMe | null>(null)
  const [packs, setPacks]     = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [resLoading, setResLoading] = useState(false)
  const [resFilter, setResFilter] = useState<'a_venir' | 'passes'>('a_venir')
  const [timezone, setTimezone] = useState('Europe/Paris')
  const [slots, setSlots]     = useState<GeneratedSlot[]>([])
  const [currentMonth, setCurrentMonth] = useState(() => DateTime.now().startOf('month'))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<GeneratedSlot | null>(null)
  const [tarifCours, setTarifCours] = useState(22)

  // Paiement
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pack')
  const [selectedPackId, setSelectedPackId] = useState<string>('')
  const [giftCode, setGiftCode]   = useState('')
  const [giftInfo, setGiftInfo]   = useState<{ valid: boolean; montant_restant: number; code: string } | null>(null)
  const [giftError, setGiftError] = useState('')
  const [giftLoading, setGiftLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/pack').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([meData, packData, settings]) => {
      if (!meData) { router.push('/espace-eleve/login'); return }
      setMe(meData)
      const activePacks = (packData?.packs || []).filter((p: Pack) => p.status === 'active' && p.heures_restantes > 0)
      setPacks(activePacks)
      if (activePacks.length > 0) { setSelectedPackId(activePacks[0].id); setPaymentMethod('pack') }
      else setPaymentMethod('cb')
      if (settings?.tarif_cours_1h) setTarifCours(parseFloat(settings.tarif_cours_1h) || 22)
    }).finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    fetchSlots()
  }, [currentMonth, timezone])

  async function fetchSlots() {
    const from = currentMonth.toFormat('yyyy-MM-dd')
    const to   = currentMonth.endOf('month').toFormat('yyyy-MM-dd')
    try {
      const res  = await fetch(`/api/availability/slots?from=${from}&to=${to}&tz=${encodeURIComponent(timezone)}`)
      const data = await res.json()
      setSlots(Array.isArray(data) ? data : [])
    } catch { setSlots([]) }
  }

  async function verifyGift() {
    if (!giftCode.trim()) { setGiftError('Saisissez votre code'); return }
    setGiftLoading(true); setGiftError(''); setGiftInfo(null)
    try {
      const res  = await fetch('/api/cadeau/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: giftCode.trim() }) })
      const data = await res.json()
      if (data.valid) setGiftInfo(data)
      else setGiftError(data.error || 'Code invalide')
    } catch { setGiftError('Erreur de vérification') }
    finally { setGiftLoading(false) }
  }

  async function handleConfirm() {
    if (!selectedSlot || !me) return
    setError(''); setSubmitting(true)
    try {
      if (paymentMethod === 'pack') {
        const pack = packs.find(p => p.id === selectedPackId)
        if (!pack) { setError('Sélectionnez un pack'); setSubmitting(false); return }
        const res = await fetch('/api/reservations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_name: `${me.prenom} ${me.nom}`, student_email: me.email,
            student_timezone: timezone, type: 'cours',
            payment_method: 'deja_paye', pack_code: pack.code,
            slot_start: selectedSlot.start, slot_end: selectedSlot.end,
            eleve_id: me.id,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur réservation')
        setSuccess(true)
      } else if (paymentMethod === 'cb') {
        const giftDiscount = giftInfo ? Math.min(giftInfo.montant_restant, tarifCours) : 0
        const priceFinal   = Math.max(0, tarifCours - giftDiscount)
        if (giftInfo && priceFinal === 0) {
          const res = await fetch('/api/reservations', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_name: `${me.prenom} ${me.nom}`, student_email: me.email,
              student_timezone: timezone, type: 'cours',
              payment_method: 'cadeau', gift_code: giftInfo.code,
              slot_start: selectedSlot.start, slot_end: selectedSlot.end, eleve_id: me.id,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur réservation')
          setSuccess(true)
        } else {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'cours', slot_start: selectedSlot.start, slot_end: selectedSlot.end,
              student_name: `${me.prenom} ${me.nom}`, student_email: me.email,
              student_timezone: timezone, gift_code: giftInfo?.code || null,
              amount_override: giftInfo ? priceFinal : undefined,
              eleve_id: me.id,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur paiement')
          if (data.url) { window.location.href = data.url; return }
        }
      } else if (paymentMethod === 'bon_cadeau') {
        if (!giftInfo) { setError('Vérifiez votre code bon cadeau'); setSubmitting(false); return }
        const giftDiscount = Math.min(giftInfo.montant_restant, tarifCours)
        const priceFinal   = Math.max(0, tarifCours - giftDiscount)
        if (priceFinal === 0) {
          const res = await fetch('/api/reservations', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_name: `${me.prenom} ${me.nom}`, student_email: me.email,
              student_timezone: timezone, type: 'cours',
              payment_method: 'cadeau', gift_code: giftInfo.code,
              slot_start: selectedSlot.start, slot_end: selectedSlot.end, eleve_id: me.id,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur réservation')
          setSuccess(true)
        } else {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'cours', slot_start: selectedSlot.start, slot_end: selectedSlot.end,
              student_name: `${me.prenom} ${me.nom}`, student_email: me.email,
              student_timezone: timezone, gift_code: giftInfo.code, amount_override: priceFinal, eleve_id: me.id,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur paiement')
          if (data.url) { window.location.href = data.url; return }
        }
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur inconnue') }
    finally { setSubmitting(false) }
  }

  const datesWithSlots = new Set(slots.map(s => DateTime.fromISO(s.start, { zone: 'utc' }).setZone(timezone).toFormat('yyyy-MM-dd')))
  function getSlotsForDate(dateStr: string) {
    return slots.filter(s => DateTime.fromISO(s.start, { zone: 'utc' }).setZone(timezone).toFormat('yyyy-MM-dd') === dateStr)
  }
  function getCalendarDays(): (DateTime | null)[] {
    const firstDay = currentMonth.startOf('month')
    const lastDay  = currentMonth.endOf('month')
    const startPad = firstDay.weekday - 1
    const days: (DateTime | null)[] = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = firstDay; d <= lastDay; d = d.plus({ days: 1 })) days.push(d)
    return days
  }
  const calendarDays = getCalendarDays()
  const today        = DateTime.now().setZone(timezone).startOf('day')
  const activePack   = packs.find(p => p.id === selectedPackId) || packs[0]
  const giftDiscount = giftInfo ? Math.min(giftInfo.montant_restant, tarifCours) : 0
  const priceFinal   = Math.max(0, tarifCours - giftDiscount)

  if (loading) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (success) return (
    <EleveLayout prenom={me?.prenom} nbNotifs={me?.nb_notifs_non_lues || 0}>
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="card text-center max-w-sm w-full py-12">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-400" />
          </div>
          <h2 className="font-serif text-2xl text-white mb-2">Réservation confirmée !</h2>
          <p className="text-noir-400 text-sm mb-6">Vous recevrez un email de confirmation. Vérifiez vos spams si nécessaire.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setActiveTab('reservations')} className="btn-gold w-full">Voir mes réservations</button>
            <button onClick={() => { setSuccess(false); setSelectedSlot(null); setSelectedDate(null) }} className="btn-outline w-full">Réserver un autre créneau</button>
          </div>
        </div>
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout prenom={me?.prenom} nbNotifs={me?.nb_notifs_non_lues || 0}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Onglets */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit">
          <button onClick={() => setActiveTab('reserver')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reserver' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
            Réserver
          </button>
          <button onClick={() => setActiveTab('reservations')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reservations' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
            Mes réservations
          </button>
        </div>

        {activeTab === 'reservations' ? (
          <ReservationsTab onReserver={() => setActiveTab('reserver')} />
        ) : (<>
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-white">Réserver un cours</h1>
          <p className="text-noir-400 text-sm mt-1">Bonjour {me?.prenom} — choisissez votre créneau</p>
        </div>

        {/* Fuseau horaire */}
        <div className="flex items-center gap-2 mb-6 bg-noir-800 border border-noir-700 rounded-xl px-4 py-2 w-fit">
          <span className="text-xs text-noir-400">Fuseau :</span>
          <select value={timezone} onChange={e => setTimezone(e.target.value)} className="bg-transparent text-sm text-gold-400 outline-none cursor-pointer">
            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value} className="bg-noir-800 text-white">{tz.label}</option>)}
          </select>
        </div>

        {!selectedSlot ? (
          /* ── ÉTAPE 1 : Calendrier ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => { setCurrentMonth(m => m.minus({ months: 1 })); setSelectedDate(null) }} className="text-noir-400 hover:text-white p-1"><ChevronLeft size={18} /></button>
                <span className="text-white font-medium text-sm">{MONTHS_FR[currentMonth.month - 1]} {currentMonth.year}</span>
                <button onClick={() => { setCurrentMonth(m => m.plus({ months: 1 })); setSelectedDate(null) }} className="text-noir-400 hover:text-white p-1"><ChevronRight size={18} /></button>
              </div>
              <div className="grid grid-cols-7 mb-2">{DAYS_FR.map(d => <div key={d} className="text-center text-xs text-noir-500 font-medium py-1">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} />
                  const dateStr    = day.toFormat('yyyy-MM-dd')
                  const hasSlots   = datesWithSlots.has(dateStr)
                  const isPast     = day.startOf('day') < today
                  const isSelected = selectedDate === dateStr
                  const isToday    = day.hasSame(today, 'day')
                  return (
                    <button key={dateStr} onClick={() => { if (hasSlots && !isPast) setSelectedDate(dateStr) }} disabled={!hasSlots || isPast}
                      className={['aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center relative',
                        isSelected ? 'bg-gold-500 text-noir-950' : '',
                        !isSelected && hasSlots && !isPast ? 'bg-noir-800 text-white hover:bg-gold-500/20 hover:text-gold-400 cursor-pointer' : '',
                        !hasSlots || isPast ? 'text-noir-700 cursor-not-allowed' : '',
                        isToday && !isSelected ? 'ring-1 ring-gold-500/50' : '',
                      ].join(' ')}>
                      {day.day}
                      {hasSlots && !isPast && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-500" />}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-noir-600 mt-3 text-center">Point doré = créneaux disponibles</p>
            </div>

            <div>
              {!selectedDate ? (
                <div className="flex items-center justify-center h-full text-center py-12">
                  <div>
                    <Calendar size={32} className="text-noir-600 mx-auto mb-3" />
                    <p className="text-noir-400 text-sm">Sélectionnez une date pour voir les créneaux</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-4 capitalize">
                    {DateTime.fromISO(selectedDate).setLocale('fr').toFormat('EEEE d MMMM')}
                  </h3>
                  {getSlotsForDate(selectedDate).length === 0 ? (
                    <p className="text-noir-400 text-sm">Aucun créneau disponible ce jour.</p>
                  ) : (
                    <div className="space-y-2">
                      {getSlotsForDate(selectedDate).map((slot, i) => (
                        <button key={i} onClick={() => setSelectedSlot(slot)}
                          className="w-full group bg-noir-900 border border-noir-700 hover:border-gold-500 rounded-xl p-4 text-left transition-all hover:bg-noir-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium text-lg group-hover:text-gold-400 transition-colors">{formatTime(slot.start, timezone)}</div>
                              <div className="text-noir-400 text-xs mt-0.5">jusqu&apos;à {formatTime(slot.end, timezone)}</div>
                            </div>
                            <span className="text-xs text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity">Choisir →</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── ÉTAPE 2 : Confirmation ── */
          <div className="max-w-lg w-full">
            {/* Récap créneau */}
            <div className="card border-gold-500/30 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider">Créneau sélectionné</h3>
                <button onClick={() => setSelectedSlot(null)} className="text-noir-500 hover:text-white text-xs underline">Modifier</button>
              </div>
              <div className="flex items-center gap-2 text-sm text-noir-300 mb-1">
                <Calendar size={14} className="text-gold-500 shrink-0" />
                <span className="capitalize">{DateTime.fromISO(selectedSlot.start, { zone: 'utc' }).setZone(timezone).setLocale('fr').toFormat('EEEE d MMMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-noir-300">
                <Clock size={14} className="text-gold-500 shrink-0" />
                <span>{formatTime(selectedSlot.start, timezone)} — {formatTime(selectedSlot.end, timezone)}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-noir-700">
                <span className="text-noir-400 text-xs">Tarif</span>
                <span className="text-gold-400 font-bold">{tarifCours} € / heure</span>
              </div>
            </div>

            {/* Identité (lecture seule) */}
            <div className="card mb-6">
              <h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-3">Vos informations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-noir-800 rounded-lg p-3">
                  <p className="text-noir-500 text-xs uppercase tracking-wider mb-1">Nom</p>
                  <p className="text-white text-sm font-medium">{me?.prenom} {me?.nom}</p>
                </div>
                <div className="bg-noir-800 rounded-lg p-3">
                  <p className="text-noir-500 text-xs uppercase tracking-wider mb-1">Email</p>
                  <p className="text-white text-sm font-medium truncate">{me?.email}</p>
                </div>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="card mb-6">
              <h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-4">Mode de paiement</h3>

              <div className="space-y-3">
                {/* Pack actif */}
                {packs.length > 0 && (
                  <button onClick={() => setPaymentMethod('pack')}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'pack' ? 'border-gold-500 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === 'pack' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`}>
                      {paymentMethod === 'pack' && <Check size={10} className="text-noir-950" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">Mon pack de cours</p>
                      {packs.length === 1 ? (
                        <p className="text-gold-400 text-xs mt-0.5">{packs[0].pack_label} — <strong>{packs[0].heures_restantes}h</strong> restantes</p>
                      ) : (
                        <div className="mt-2">
                          <select value={selectedPackId} onChange={e => setSelectedPackId(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="input py-1.5 text-xs w-full">
                            {packs.map(p => <option key={p.id} value={p.id}>{p.pack_label} — {p.heures_restantes}h restantes ({p.code})</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <Package size={18} className="text-gold-400 shrink-0 mt-0.5" />
                  </button>
                )}

                {/* Carte bancaire */}
                <button onClick={() => setPaymentMethod('cb')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'cb' ? 'border-gold-500 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'cb' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`}>
                    {paymentMethod === 'cb' && <Check size={10} className="text-noir-950" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Carte bancaire</p>
                    <p className="text-noir-400 text-xs mt-0.5">Paiement sécurisé via Stripe — {tarifCours} €</p>
                  </div>
                  <CreditCard size={18} className="text-noir-400 shrink-0" />
                </button>

                {/* Bon cadeau */}
                <button onClick={() => setPaymentMethod('bon_cadeau')}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${paymentMethod === 'bon_cadeau' ? 'border-gold-500 bg-gold-500/10' : 'border-noir-700 hover:border-noir-600'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === 'bon_cadeau' ? 'border-gold-500 bg-gold-500' : 'border-noir-600'}`}>
                    {paymentMethod === 'bon_cadeau' && <Check size={10} className="text-noir-950" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Bon cadeau</p>
                    <p className="text-noir-400 text-xs mt-0.5">Saisissez votre code LS-XXXX</p>
                    {paymentMethod === 'bon_cadeau' && (
                      <div className="mt-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <input value={giftCode} onChange={e => setGiftCode(e.target.value.toUpperCase())}
                            placeholder="LS-XXXX-XXXX" className="input flex-1 text-sm py-2" />
                          <button onClick={verifyGift} disabled={giftLoading} className="btn-gold px-4 py-2 text-sm">
                            {giftLoading ? '...' : 'Vérifier'}
                          </button>
                        </div>
                        {giftError && <p className="text-red-400 text-xs mt-1">{giftError}</p>}
                        {giftInfo && (
                          <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                            <p className="text-green-400 text-xs font-medium">Bon cadeau valide — {giftInfo.montant_restant} € disponibles</p>
                            {priceFinal > 0 && <p className="text-noir-400 text-xs mt-0.5">Complément CB : {priceFinal} €</p>}
                            {priceFinal === 0 && <p className="text-green-400 text-xs mt-0.5">Cours entièrement couvert !</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Gift size={18} className="text-noir-400 shrink-0 mt-0.5" />
                </button>
              </div>

              {/* CB avec bon cadeau optionnel */}
              {paymentMethod === 'cb' && (
                <div className="mt-4 pt-4 border-t border-noir-800">
                  <p className="text-noir-500 text-xs mb-2">Avez-vous un bon cadeau à utiliser en déduction ?</p>
                  <div className="flex gap-2">
                    <input value={giftCode} onChange={e => setGiftCode(e.target.value.toUpperCase())}
                      placeholder="LS-XXXX-XXXX (optionnel)" className="input flex-1 text-sm py-2" />
                    <button onClick={verifyGift} disabled={giftLoading} className="btn-outline px-4 py-2 text-sm">
                      {giftLoading ? '...' : 'Appliquer'}
                    </button>
                  </div>
                  {giftError && <p className="text-red-400 text-xs mt-1">{giftError}</p>}
                  {giftInfo && (
                    <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                      <p className="text-green-400 text-xs font-medium">Réduction : -{giftDiscount} €</p>
                      <p className="text-white text-xs font-bold mt-0.5">Total à payer : {priceFinal} €</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            <div className="flex gap-3">
              <button onClick={() => setSelectedSlot(null)} className="btn-outline flex-1">Retour</button>
              <button onClick={handleConfirm} disabled={submitting} className="btn-gold flex-1">
                {submitting ? 'Confirmation...' : paymentMethod === 'cb' && priceFinal > 0 ? `Payer ${priceFinal} €` : 'Confirmer la réservation'}
              </button>
            </div>
            <p className="text-noir-600 text-xs text-center mt-3">Vérifiez vos spams si vous ne recevez pas l&apos;email de confirmation.</p>
          </div>
        )}
        </>)}
      </div>
    </EleveLayout>
  )
}

export default function ReserverElevePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ReserverEleveContent />
    </Suspense>
  )
}
