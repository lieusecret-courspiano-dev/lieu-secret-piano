// ── Types de base ──────────────────────────────────────────────
export type EventType        = 'cours' | 'atelier' | 'evenement'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentMethod    = 'gratuit' | 'virement' | 'stripe'

// ── Créneau horaire ────────────────────────────────────────────
export interface Creneau {
  id:           string
  start_time:   string   // ISO UTC
  end_time:     string   // ISO UTC
  is_available: boolean
  notes:        string | null
  created_at:   string
}

// ── Événement / Atelier / Cours collectif ──────────────────────
export interface Event {
  id:               string
  title:            string
  description:      string | null
  type:             EventType
  date_heure:       string   // ISO UTC
  duration_minutes: number
  max_spots:        number | null
  spots_remaining:  number
  price:            number
  is_free:          boolean
  is_active:        boolean
  zoom_link:        string | null
  created_at:       string
}

// ── Réservation ────────────────────────────────────────────────
export interface Reservation {
  id:               string
  creneau_id:       string | null
  event_id:         string | null
  student_name:     string
  student_email:    string
  student_phone:    string | null
  student_timezone: string
  message:          string | null
  type:             EventType
  status:           ReservationStatus
  payment_method:   PaymentMethod
  amount:           number
  stripe_session_id: string | null
  created_at:       string
  // relations
  creneau?: Creneau
  event?:   Event
}

// ── Message de contact ─────────────────────────────────────────
export interface Message {
  id:         string
  name:       string
  email:      string
  subject:    string | null
  message:    string
  is_read:    boolean
  created_at: string
}

// ── Paramètres du site ─────────────────────────────────────────
export interface SiteSettings {
  site_title:       string
  site_description: string
  contact_email:    string
  phone:            string
  instagram:        string
  facebook:         string
  youtube:          string
  tiktok:           string
  virement_iban:    string
  virement_nom:     string
  virement_info:    string
  hero_title:       string
  hero_title2:      string
  hero_subtitle:    string
  zoom_cours:       string
  zoom_atelier:     string
  zoom_masterclass: string
  zoom_evenement:   string
  stripe_public_key:  string
  cours_access_code:   string
  tab_cours_label:     string
  tab_events_label:    string
  espace_eleves_title:  string
  espace_eleves_desc:   string
  reservation_titre:           string
  reservation_no_slot:         string
  reservation_select_date:     string
  reservation_code_placeholder: string
  reservation_code_btn:        string
  reservation_contact_link:    string
  apropos_titre:        string
  apropos_texte1:       string
  apropos_texte2:       string
  apropos_point1:       string
  apropos_point2:       string
  apropos_point3:       string
  apropos_point4:       string
  offres_titre:         string
  offres_sous_titre:    string
  cta_titre:            string
  cta_sous_titre:       string
  stats_label1:         string
  stats_label2:         string
  stats_label3:         string
  stats_label4:         string
  hero_btn1:            string
  hero_btn2:            string
  steps_titre:          string
  steps_label:          string
  offre1_titre:         string
  offre1_sous:          string
  offre1_desc:          string
  offre1_btn:           string
  offre1_f1:            string
  offre1_f2:            string
  offre1_f3:            string
  offre1_f4:            string
  offre2_titre:         string
  offre2_sous:          string
  offre2_desc:          string
  offre2_btn:           string
  offre2_f1:            string
  offre2_f2:            string
  offre2_f3:            string
  offre2_f4:            string
  offre3_titre:         string
  offre3_sous:          string
  offre3_desc:          string
  offre3_btn:           string
  offre3_f1:            string
  offre3_f2:            string
  offre3_f3:            string
  offre3_f4:            string
}

// ── Fuseaux horaires ───────────────────────────────────────────
export const TIMEZONES = [
  { value: 'Europe/Paris',      label: '🇫🇷 France (Paris)' },
  { value: 'Europe/London',     label: '🇬🇧 Royaume-Uni (Londres)' },
  { value: 'Europe/Brussels',   label: '🇧🇪 Belgique (Bruxelles)' },
  { value: 'Europe/Zurich',     label: '🇨🇭 Suisse (Zurich)' },
  { value: 'Africa/Abidjan',    label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'Africa/Dakar',      label: '🇸🇳 Sénégal (Dakar)' },
  { value: 'Africa/Douala',     label: '🇨🇲 Cameroun (Douala)' },
  { value: 'Africa/Kinshasa',   label: '🇨🇩 RDC (Kinshasa)' },
  { value: 'America/Montreal',  label: '🇨🇦 Canada (Montréal)' },
  { value: 'America/Toronto',   label: '🇨🇦 Canada (Toronto)' },
  { value: 'America/New_York',  label: '🇺🇸 USA (New York)' },
  { value: 'America/Chicago',   label: '🇺🇸 USA (Chicago)' },
  { value: 'America/Los_Angeles', label: '🇺🇸 USA (Los Angeles)' },
  { value: 'America/Martinique', label: '🇲🇶 Martinique' },
  { value: 'America/Guadeloupe', label: '🇬🇵 Guadeloupe' },
  { value: 'Indian/Reunion',    label: '🇷🇪 La Réunion' },
  { value: 'Indian/Mauritius',  label: '🇲🇺 Maurice' },
  { value: 'Asia/Tokyo',        label: '🇯🇵 Japon (Tokyo)' },
  { value: 'Australia/Sydney',  label: '🇦🇺 Australie (Sydney)' },
  { value: 'UTC',               label: '🌍 UTC' },
]