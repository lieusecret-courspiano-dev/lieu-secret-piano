// ── Générateur de fichiers .ics (RFC 5545) ────────────────────
import { DateTime } from 'luxon'

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function toICSDate(isoString: string): string {
  return DateTime.fromISO(isoString, { zone: 'utc' })
    .toFormat("yyyyMMdd'T'HHmmss'Z'")
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@lieusecret-courspiano.fr`
}

export interface ICSEvent {
  title:       string
  description: string
  startISO:    string   // UTC ISO string
  endISO:      string   // UTC ISO string
  location?:   string
  url?:        string
}

export function generateICS(event: ICSEvent): string {
  const now = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'")

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lieu Secret//Piano Reservation//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDate(event.startISO)}`,
    `DTEND:${toICSDate(event.endISO)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    event.location ? `LOCATION:${escapeICS(event.location)}` : '',
    event.url      ? `URL:${event.url}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Rappel : ${escapeICS(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.join('\r\n')
}

// ── Helpers spécialisés ───────────────────────────────────────

export function generateCoursICS(params: {
  studentName: string
  startISO:    string
  endISO:      string
  zoomLink?:   string
}): string {
  return generateICS({
    title:       'Cours de piano — Lieu Secret',
    description: `Bonjour ${params.studentName},\n\nVotre cours de piano est confirmé.\n\nLieu Secret — École de Piano en Ligne\nlieusecret-courspiano@outlook.fr`,
    startISO:    params.startISO,
    endISO:      params.endISO,
    location:    params.zoomLink || 'En ligne (lien envoyé par email)',
    url:         params.zoomLink,
  })
}

export function generateEventICS(params: {
  studentName: string
  eventTitle:  string
  startISO:    string
  endISO:      string
  zoomLink?:   string
}): string {
  return generateICS({
    title:       `${params.eventTitle} — Lieu Secret`,
    description: `Bonjour ${params.studentName},\n\nVotre inscription à "${params.eventTitle}" est confirmée.\n\nLieu Secret — École de Piano en Ligne\nlieusecret-courspiano@outlook.fr`,
    startISO:    params.startISO,
    endISO:      params.endISO,
    location:    params.zoomLink || 'En ligne (lien envoyé par email)',
    url:         params.zoomLink,
  })
}