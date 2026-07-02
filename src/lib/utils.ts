import { DateTime } from 'luxon'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Formatage des dates ───────────────────────────────────────

export function formatDateLocal(isoString: string, timezone: string, format = "EEEE d MMMM yyyy 'à' HH'h'mm"): string {
  return DateTime.fromISO(isoString, { zone: 'utc' })
    .setZone(timezone)
    .setLocale('fr')
    .toFormat(format)
}

export function formatDateShort(isoString: string, timezone: string): string {
  return formatDateLocal(isoString, timezone, "d MMM yyyy, HH'h'mm")
}

export function formatTime(isoString: string, timezone: string): string {
  return DateTime.fromISO(isoString, { zone: 'utc' })
    .setZone(timezone)
    .toFormat("HH'h'mm")
}

export function formatDayLabel(isoString: string, timezone: string): string {
  return DateTime.fromISO(isoString, { zone: 'utc' })
    .setZone(timezone)
    .setLocale('fr')
    .toFormat('EEEE d MMMM')
}

// ── Détection du fuseau horaire ───────────────────────────────

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
  } catch {
    return 'Europe/Paris'
  }
}

// ── Groupement des créneaux par jour ──────────────────────────

type CreneauBase = { id: string; start_time: string; end_time: string; notes?: string | null }

export function groupCreneauxByDay(creneaux: CreneauBase[], timezone: string) {
  const groups: Record<string, CreneauBase[]> = {}

  for (const c of creneaux) {
    const dayKey = DateTime.fromISO(c.start_time, { zone: 'utc' })
      .setZone(timezone)
      .toFormat('yyyy-MM-dd')
    if (!groups[dayKey]) groups[dayKey] = []
    groups[dayKey].push(c)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, slots]) => ({
      day,
      label: DateTime.fromISO(day).setLocale('fr').toFormat('EEEE d MMMM'),
      slots,
    }))
}

// ── Validation email ──────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── Formatage prix ────────────────────────────────────────────

export function formatPrice(amount: number): string {
  if (amount === 0) return 'Gratuit'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}



export function generateToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}