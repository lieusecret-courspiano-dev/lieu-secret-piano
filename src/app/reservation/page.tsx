'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DateTime } from 'luxon'
import { detectTimezone, formatTime } from '@/lib/utils'
import { TIMEZONES } from '@/types'
import BookingModal from '@/components/BookingModal'
import EventCard from '@/components/EventCard'
import ContactModal from '@/components/ContactModal'
import FeaturedEvent from '@/components/FeaturedEvent'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'

interface GeneratedSlot {
  start: string
  end: string
  available: boolean
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
  is_featured?: boolean
}

interface Settings {
  hero_title: string
  hero_subtitle: string
  contact_email: string
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  cours_access_code: string
  tab_cours_label: string
  tab_events_label: string
  espace_eleves_title: string
  espace_eleves_desc: string
  reservation_titre: string
  reservation_sous_titre: string
  reservation_no_slot: string
  reservation_select_date: string
  reservation_code_titre: string
  reservation_code_desc: string
  reservation_code_placeholder: string
  reservation_code_btn: string
  reservation_contact_link: string
}

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function ReservationContent() {
  const searchParams = useSearchParams()
  const tabParam     = searchParams.get('tab')
  const codeParam    = searchParams.get('code')

  const [timezone, setTimezone]           = useState('Europe/Paris')
  const [slots, setSlots]                 = useState<GeneratedSlot[]>([])
  const [events, setEvents]               = useState<Event[]>([])
  const [settings, setSettings]           = useState<Settings | null>(null)
  const [selectedSlot, setSelectedSlot]   = useState<GeneratedSlot | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showContact, setShowContact]     = useState(false)
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState<'cours' | 'evenements'>(
    tabParam === 'evenements' ? 'evenements' : 'cours'
  )
  const [currentMonth, setCurrentMonth]   = useState(() => DateTime.now().startOf('month'))
  const [selectedDate, setSelectedDate]   = useState<string | null>(null)
  const [codeInput, setCodeInput]         = useState('')
  const [codeError, setCodeError]         = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const [settingsReady, setSettingsReady] = useState(false)

  // Ref pour stocker le code valide (évite les re-renders)
  const validCodeRef = useRef<string>('')

  useEffect(() => {
    setTimezone(detectTimezone())
    fetchData()
  }, [])

  // Vérification du code d'accès — APRÈS chargement des settings
  useEffect(() => {
    if (!settings || !settingsReady) return

    const validCode = (settings.cours_access_code || '').trim().toLowerCase()
    validCodeRef.current = validCode

    // Si aucun code requis → accès libre
    if (!validCode) {
      setAccessGranted(true)
      return
    }

    // Vérifier le code passé en URL (?code=xxx)
    if (codeParam && codeParam.trim().toLowerCase() === validCode) {
      try { localStorage.setItem('ls_access_code', codeParam.trim()) } catch {}
      setAccessGranted(true)
      return
    }

    // Vérifier le code sauvegardé en localStorage
    try {
      const saved = localStorage.getItem('ls_access_code')
      if (saved && saved.trim().toLowerCase() === validCode) {
        setAccessGranted(true)
        return
      }
    } catch {}

    // Aucun code valide trouvé → accès refusé
    setAccessGranted(false)
  }, [settings, settingsReady, codeParam])

  // Charger les créneaux uniquement si accès accordé
  useEffect(() => {
    if (accessGranted) fetchSlots()
  }, [currentMonth, timezone, accessGranted])

  async function fetchData() {
    setLoading(true)
    try {
      const [evRes, stRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/settings'),
      ])
      const evData = await evRes.json()
      const stData = await stRes.json()
      setEvents(Array.isArray(evData) ? evData : [])
      setSettings(stData)
      setSettingsReady(true)
    } catch (e) {
      console.error(e)
      setSettingsReady(true)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSlots() {
    // Double vérification : ne jamais appeler l'API si accès non accordé
    if (!accessGranted) return

    const from = currentMonth.toFormat('yyyy-MM-dd')
    const to   = currentMonth.endOf('month').toFormat('yyyy-MM-dd')
    try {
      const res  = await fetch(`/api/availability/slots?from=${from}&to=${to}&tz=${encodeURIComponent(timezone)}`)
      const data = await res.json()
      setSlots(Array.isArray(data) ? data : [])
    } catch {
      setSlots([])
    }
  }

  // Re-fetch events
  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validCode = validCodeRef.current || (settings?.cours_access_code || '').trim().toLowerCase()

    if (!validCode || codeInput.trim().toLowerCase() === validCode) {
      try { localStorage.setItem('ls_access_code', codeInput.trim()) } catch {}
      setCodeError('')
      setAccessGranted(true)
    } else {
      setCodeError('Code incorrect. Contactez votre professeur.')
      // Effacer tout code potentiellement sauvegardé
      try { localStorage.removeItem('ls_access_code') } catch {}
    }
  }

  // Dates avec créneaux disponibles
  const datesWithSlots = new Set(
    slots.map(s => DateTime.fromISO(s.start, { zone: 'utc' }).setZone(timezone).toFormat('yyyy-MM-dd'))
  )

  function getSlotsForDate(dateStr: string): GeneratedSlot[] {
    return slots.filter(s => {
      const d = DateTime.fromISO(s.start, { zone: 'utc' }).setZone(timezone)
      return d.toFormat('yyyy-MM-dd') === dateStr
    })
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

  const calendarDays  = getCalendarDays()
  const today         = DateTime.now().setZone(timezone).startOf('day')
  const featuredEvent = events.find(e => e.is_featured) || null

  const tabCoursLabel  = settings?.tab_cours_label  || 'Cours individuels'
  const tabEventsLabel = settings?.tab_events_label || 'Ateliers & Événements'

  const slotAsCreneau = selectedSlot ? {
    id:         selectedSlot.start,
    start_time: selectedSlot.start,
    end_time:   selectedSlot.end,
    notes:      null,
  } : null

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100 transition-colors duration-200">

      {/* HEADER */}
      <header className="border-b border-noir-800 bg-noir-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-lg text-gold-400 tracking-widest">LIEU SECRET</span>
          </a>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => setShowContact(true)} className="text-sm text-noir-300 hover:text-gold-400 transition-colors">
              Contact
            </button>
          </div>
        </div>
      </header>

      {/* ÉVÉNEMENT EN VEDETTE */}
      {featuredEvent && !loading && (
        <FeaturedEvent event={featuredEvent} timezone={timezone} onReserve={() => setSelectedEvent(featuredEvent)} />
      )}

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="flex justify-center mb-5">
          <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-gold-500/30">
            <img src="/piano-hero.jpg" alt="Piano" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-noir-950/60 to-transparent" />
          </div>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-3 leading-tight">
          {settings?.hero_title || 'Réservez votre cours de piano'}
        </h1>
        <p className="text-noir-300 text-base max-w-xl mx-auto">
          {settings?.hero_subtitle || 'Choisissez un créneau et commencez votre aventure musicale'}
        </p>
        <div className="mt-5 inline-flex items-center gap-2 bg-noir-800 border border-noir-700 rounded-full px-4 py-2">
          <span className="text-xs text-noir-400">Fuseau :</span>
          <select value={timezone} onChange={e => setTimezone(e.target.value)} className="bg-transparent text-sm text-gold-400 outline-none cursor-pointer">
            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value} className="bg-noir-800 text-white">{tz.label}</option>)}
          </select>
        </div>
      </section>

      {/* TABS */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 w-fit mx-auto">
          <button onClick={() => setActiveTab('cours')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'cours' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
            {tabCoursLabel}
          </button>
          <button onClick={() => setActiveTab('evenements')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'evenements' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
            {tabEventsLabel}
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <main className="max-w-5xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>

        ) : activeTab === 'cours' ? (

          /* ── Espace élève : vérification du code ── */
          !accessGranted ? (
            <div className="max-w-sm mx-auto text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-6">
                <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-white mb-2">
                {settings?.espace_eleves_title || 'Espace élèves'}
              </h2>
              <p className="text-noir-400 text-sm mb-8 leading-relaxed">
                {settings?.espace_eleves_desc || "Les cours individuels sont réservés aux élèves inscrits. Saisissez votre code d'accès pour voir les créneaux disponibles."}
              </p>
              <form onSubmit={handleCodeSubmit} className="space-y-3">
                <input
                  type="password"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  placeholder={settings?.reservation_code_placeholder || "Votre code d'accès"}
                  className="input w-full text-center tracking-widest"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {codeError && <p className="text-red-400 text-xs">{codeError}</p>}
                <button type="submit" className="btn-gold w-full">
                  {settings?.reservation_code_btn || 'Accéder aux créneaux'}
                </button>
              </form>
              <p className="text-noir-600 text-xs mt-6">
                {settings?.reservation_contact_link || 'Pas encore élève ?'}{' '}
                <button onClick={() => setShowContact(true)} className="text-gold-500 hover:text-gold-400 underline">
                  Contactez-nous
                </button>
              </p>
            </div>

          ) : (
            /* ── Calendrier et créneaux (accès accordé) ── */
            <div className="max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">

                {/* Calendrier */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => { setCurrentMonth(m => m.minus({ months: 1 })); setSelectedDate(null) }} className="text-noir-400 hover:text-white p-1">
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-white font-medium text-sm">
                      {MONTHS_FR[currentMonth.month - 1]} {currentMonth.year}
                    </span>
                    <button onClick={() => { setCurrentMonth(m => m.plus({ months: 1 })); setSelectedDate(null) }} className="text-noir-400 hover:text-white p-1">
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 mb-2">
                    {DAYS_FR.map(d => <div key={d} className="text-center text-xs text-noir-500 font-medium py-1">{d}</div>)}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={`pad-${i}`} />
                      const dateStr    = day.toFormat('yyyy-MM-dd')
                      const hasSlots   = datesWithSlots.has(dateStr)
                      const isPast     = day.startOf('day') < today
                      const isSelected = selectedDate === dateStr
                      const isToday    = day.hasSame(today, 'day')

                      return (
                        <button key={dateStr}
                          onClick={() => { if (hasSlots && !isPast) setSelectedDate(dateStr) }}
                          disabled={!hasSlots || isPast}
                          className={[
                            'aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center relative',
                            isSelected ? 'bg-gold-500 text-noir-950' : '',
                            !isSelected && hasSlots && !isPast ? 'bg-noir-800 text-white hover:bg-gold-500/20 hover:text-gold-400 cursor-pointer' : '',
                            !hasSlots || isPast ? 'text-noir-700 cursor-not-allowed' : '',
                            isToday && !isSelected ? 'ring-1 ring-gold-500/50' : '',
                          ].join(' ')}
                        >
                          {day.day}
                          {hasSlots && !isPast && !isSelected && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-500" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-noir-600 mt-3 text-center">Point doré = créneaux disponibles</p>
                </div>

                {/* Créneaux */}
                <div>
                  {!selectedDate ? (
                    <div className="flex items-center justify-center h-full text-center py-12">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-noir-800 border border-noir-700 flex items-center justify-center mx-auto mb-4">
                          <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                        <p className="text-noir-400 text-sm">
                          {settings?.reservation_select_date || 'Sélectionnez une date pour voir les créneaux'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-4 capitalize">
                        {DateTime.fromISO(selectedDate).setLocale('fr').toFormat('EEEE d MMMM')}
                      </h3>
                      {getSlotsForDate(selectedDate).length === 0 ? (
                        <p className="text-noir-400 text-sm">
                          {settings?.reservation_no_slot || 'Aucun créneau disponible ce jour.'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {getSlotsForDate(selectedDate).map((slot, i) => (
                            <button key={i}
                              onClick={() => setSelectedSlot(slot)}
                              className="w-full group bg-noir-900 border border-noir-700 hover:border-gold-500 rounded-xl p-4 text-left transition-all hover:bg-noir-800"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-white font-medium text-lg group-hover:text-gold-400 transition-colors">
                                    {formatTime(slot.start, timezone)}
                                  </div>
                                  <div className="text-noir-400 text-xs mt-0.5">
                                    jusqu&apos;à {formatTime(slot.end, timezone)}
                                  </div>
                                </div>
                                <span className="text-xs text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Réserver →
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )

        ) : (
          /* ── Onglet Événements ── */
          <div>
            {events.length === 0 ? (
              <div className="text-center py-16 text-noir-400">
                <div className="w-12 h-12 rounded-xl bg-noir-800 border border-noir-700 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <p className="text-lg">Aucun événement à venir pour le moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {events.map(event => (
                  <EventCard key={event.id} event={event} timezone={timezone} onReserve={() => setSelectedEvent(event)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-noir-800 bg-noir-900 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="w-px h-6 bg-gold-500/40 mx-auto mb-4" />
          <p className="font-serif text-gold-400 tracking-widest text-sm mb-2">LIEU SECRET</p>
          <p className="text-noir-500 text-xs mb-4">École de Piano en Ligne</p>
          {settings?.contact_email && (
            <a href={`mailto:${settings.contact_email}`} className="text-gold-500 text-sm hover:text-gold-400 transition-colors block mb-4">
              {settings.contact_email}
            </a>
          )}
          <div className="flex justify-center gap-6 flex-wrap">
            {settings?.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="text-noir-400 hover:text-gold-400 text-sm">Instagram</a>}
            {settings?.facebook  && <a href={settings.facebook}  target="_blank" rel="noopener noreferrer" className="text-noir-400 hover:text-gold-400 text-sm">Facebook</a>}
            {settings?.youtube   && <a href={settings.youtube}   target="_blank" rel="noopener noreferrer" className="text-noir-400 hover:text-gold-400 text-sm">YouTube</a>}
            {settings?.tiktok    && <a href={settings.tiktok}    target="_blank" rel="noopener noreferrer" className="text-noir-400 hover:text-gold-400 text-sm">TikTok</a>}
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {selectedSlot && slotAsCreneau && (
        <BookingModal type="cours" creneau={slotAsCreneau} timezone={timezone}
          onClose={() => setSelectedSlot(null)}
          onSuccess={() => { setSelectedSlot(null); fetchSlots() }}
        />
      )}
      {selectedEvent && (
        <BookingModal type="event" event={selectedEvent} timezone={timezone}
          onClose={() => setSelectedEvent(null)}
          onSuccess={() => { setSelectedEvent(null) }}
        />
      )}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  )
}

export default function ReservationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReservationContent />
    </Suspense>
  )
}