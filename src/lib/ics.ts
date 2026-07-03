// ── Générateur de fichiers .ics (RFC 5545) ────────────────────────────────
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

export function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@lieusecret-courspiano.fr`
}

export interface ICSEvent {
  title:       string
  description: string
  startISO:    string
  endISO:      string
  location?:   string
  url?:        string
  uid?:        string  // Si fourni, réutilisé (pour annulation avec même UID)
}

// Retourne { ics, uid } — stocker uid dans reservations.ics_uid pour l'annulation
export function generateICS(event: ICSEvent): { ics: string; uid: string } {
  const now = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'")
  const uid = event.uid || generateUID()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lieu Secret//Piano Reservation//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
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

  return { ics: lines.join('\r\n'), uid }
}

// ── ICS d'annulation (METHOD:CANCEL) ──────────────────────────────────────
// Envoyer ce fichier supprime l'événement du calendrier du destinataire
export function generateCancelICS(params: {
  studentName: string
  startISO:    string
  endISO:      string
  uid?:        string  // Doit correspondre à l'UID du ICS de confirmation
}): string {
  const now = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'")
  const uid = params.uid || generateUID()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lieu Secret//Piano Reservation//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:CANCEL',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDate(params.startISO)}`,
    `DTEND:${toICSDate(params.endISO)}`,
    `SUMMARY:${escapeICS('ANNULÉ — Cours de piano — Lieu Secret')}`,
    `DESCRIPTION:${escapeICS(`Bonjour ${params.studentName},\n\nVotre cours de piano du ${DateTime.fromISO(params.startISO, { zone: 'utc' }).setLocale('fr').toFormat("EEEE d MMMM yyyy 'à' HH'h'mm")} a été annulé.\n\nLieu Secret — École de Piano en Ligne\nlieusecret-courspiano@outlook.fr`)}`,
    'STATUS:CANCELLED',
    'SEQUENCE:1',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

// ── Helpers spécialisés ───────────────────────────────────────────────────

// Retourne { ics, uid } — stocker uid dans reservations.ics_uid
export function generateCoursICS(params: {
  studentName: string
  startISO:    string
  endISO:      string
  zoomLink?:   string
  uid?:        string
}): { ics: string; uid: string } {
  return generateICS({
    title:       'Cours de piano — Lieu Secret',
    description: `Bonjour ${params.studentName},\n\nVotre cours de piano est confirmé.\n\nLieu Secret — École de Piano en Ligne\nlieusecret-courspiano@outlook.fr`,
    startISO:    params.startISO,
    endISO:      params.endISO,
    location:    params.zoomLink || 'En ligne (lien envoyé par email)',
    url:         params.zoomLink,
    uid:         params.uid,
  })
}

export function generateEventICS(params: {
  studentName: string
  eventTitle:  string
  startISO:    string
  endISO:      string
  zoomLink?:   string
  uid?:        string
}): { ics: string; uid: string } {
  return generateICS({
    title:       `${params.eventTitle} — Lieu Secret`,
    description: `Bonjour ${params.studentName},\n\nVotre inscription à "${params.eventTitle}" est confirmée.\n\nLieu Secret — École de Piano en Ligne\nlieusecret-courspiano@outlook.fr`,
    startISO:    params.startISO,
    endISO:      params.endISO,
    location:    params.zoomLink || 'En ligne (lien envoyé par email)',
    url:         params.zoomLink,
    uid:         params.uid,
  })
}