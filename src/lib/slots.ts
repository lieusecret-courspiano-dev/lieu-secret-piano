import { DateTime } from 'luxon'
import { supabase, supabaseAdmin } from './supabase'

export interface BookingSettings {
  slot_duration_min:  number
  buffer_min:         number
  min_notice_hours:   number
  max_days_ahead:     number
  slot_increment_min: number
  timezone:           string
}

export interface AvailabilityRule {
  id:          string
  day_of_week: number
  start_time:  string
  end_time:    string
  is_active:   boolean
}

export interface AvailabilityException {
  id:             string
  exception_date: string
  type:           'closed' | 'open'
  start_time:     string | null
  end_time:       string | null
  reason:         string | null
}

export interface GeneratedSlot {
  start: string // ISO UTC
  end:   string // ISO UTC
  available: boolean
}

const DEFAULT_SETTINGS: BookingSettings = {
  slot_duration_min:  60,
  buffer_min:         15,
  min_notice_hours:   10,
  max_days_ahead:     60,
  slot_increment_min: 60,
  timezone:           'Europe/Paris',
}

// Récupérer les paramètres de réservation
export async function getBookingSettings(): Promise<BookingSettings> {
  const { data } = await supabaseAdmin.from('booking_settings').select('*').eq('id', 1).single()
  if (!data) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...data }
}

// Récupérer les règles de disponibilité
export async function getAvailabilityRules(): Promise<AvailabilityRule[]> {
  const { data } = await supabaseAdmin.from('availability_rules').select('*').eq('is_active', true).order('day_of_week')
  return data || []
}

// Récupérer les exceptions pour une période
export async function getExceptions(from: string, to: string): Promise<AvailabilityException[]> {
  const { data } = await supabaseAdmin
    .from('availability_exceptions')
    .select('*')
    .gte('exception_date', from)
    .lte('exception_date', to)
  return (data || []) as AvailabilityException[]
}

// Récupérer les réservations existantes pour une période
export async function getExistingReservations(from: string, to: string) {
  const { data } = await supabaseAdmin
    .from('creneaux')
    .select('start_time, end_time, is_available')
    .gte('start_time', from)
    .lte('start_time', to)
  return data || []
}

// Générer les créneaux disponibles pour une période
export async function generateAvailableSlots(
  fromDate: string, // YYYY-MM-DD
  toDate: string,   // YYYY-MM-DD
  userTimezone: string
): Promise<GeneratedSlot[]> {
  const settings   = await getBookingSettings()
  const rules      = await getAvailabilityRules()
  const tz         = settings.timezone

  const now        = DateTime.now().setZone(tz)
  const minNotice  = now.plus({ hours: settings.min_notice_hours })
  const maxDate    = now.plus({ days: settings.max_days_ahead })

  const startDate  = DateTime.fromISO(fromDate, { zone: tz }).startOf('day')
  const endDate    = DateTime.fromISO(toDate,   { zone: tz }).endOf('day')

  // Limiter à la fenêtre autorisée
  const effectiveEnd = endDate < maxDate ? endDate : maxDate

  // Récupérer exceptions et réservations existantes
  const exceptions = await getExceptions(fromDate, toDate)
  const existing   = await getExistingReservations(
    startDate.toUTC().toISO()!,
    effectiveEnd.toUTC().toISO()!
  )

  const slots: GeneratedSlot[] = []

  // Itérer sur chaque jour
  let current = startDate
  while (current <= effectiveEnd) {
    const dateStr    = current.toFormat('yyyy-MM-dd')
    const dayOfWeek  = current.weekday % 7 // Luxon: 1=Lun, 7=Dim -> 0=Dim, 1=Lun...
    const luxonDay   = current.weekday     // 1=Lun, 7=Dim

    // Vérifier les exceptions
    const exception = exceptions.find(e => e.exception_date === dateStr)

    if (exception?.type === 'closed') {
      current = current.plus({ days: 1 })
      continue
    }

    // Déterminer les plages horaires du jour
    let dayRanges: { start: string; end: string }[] = []

    if (exception?.type === 'open' && exception.start_time && exception.end_time) {
      // Exception d'ouverture spéciale
      dayRanges = [{ start: exception.start_time, end: exception.end_time }]
    } else {
      // Règles récurrentes (Luxon weekday: 1=Lun=1, 7=Dim=0)
      const dayNum = luxonDay === 7 ? 0 : luxonDay
      dayRanges = rules
        .filter(r => r.day_of_week === dayNum)
        .map(r => ({ start: r.start_time, end: r.end_time }))
    }

    // Générer les créneaux pour chaque plage
    for (const range of dayRanges) {
      const [sh, sm] = range.start.split(':').map(Number)
      const [eh, em] = range.end.split(':').map(Number)

      let slotStart = current.set({ hour: sh, minute: sm, second: 0, millisecond: 0 })
      const rangeEnd = current.set({ hour: eh, minute: em, second: 0, millisecond: 0 })

      while (slotStart.plus({ minutes: settings.slot_duration_min }) <= rangeEnd) {
        const slotEnd = slotStart.plus({ minutes: settings.slot_duration_min })

        // Vérifier le préavis minimum
        if (slotStart > minNotice) {
          const startISO = slotStart.toUTC().toISO()!
          const endISO   = slotEnd.toUTC().toISO()!

          // Vérifier les conflits avec les réservations existantes
          const hasConflict = existing.some(e => {
            const eStart = DateTime.fromISO(e.start_time, { zone: 'utc' })
            const eEnd   = DateTime.fromISO(e.end_time,   { zone: 'utc' })
            const sStart = slotStart.toUTC()
            const sEnd   = slotEnd.toUTC().plus({ minutes: settings.buffer_min })
            return sStart < eEnd && sEnd > eStart
          })

          if (!hasConflict) {
            slots.push({ start: startISO, end: endISO, available: true })
          }
        }

        // Avancer d'un incrément (durée + buffer)
        slotStart = slotStart.plus({ minutes: settings.slot_duration_min + settings.buffer_min })
      }
    }

    current = current.plus({ days: 1 })
  }

  return slots
}