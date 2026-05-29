import { validateAdminSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Calendar, Users, Star, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { DateTime } from 'luxon'

async function getStats() {
  const [crRes, resRes, evRes, msgRes] = await Promise.all([
    supabaseAdmin.from('creneaux').select('id', { count: 'exact' }).eq('is_available', true),
    supabaseAdmin.from('reservations').select('id', { count: 'exact' }),
    supabaseAdmin.from('events').select('id', { count: 'exact' }).eq('is_active', true),
    supabaseAdmin.from('messages').select('id', { count: 'exact' }).eq('is_read', false),
  ])
  return {
    creneaux:     crRes.count  ?? 0,
    reservations: resRes.count ?? 0,
    events:       evRes.count  ?? 0,
    unreadMsgs:   msgRes.count ?? 0,
  }
}

async function getRecentReservations() {
  const { data } = await supabaseAdmin
    .from('reservations')
    .select('id, student_name, student_email, type, status, created_at, creneau:creneaux(start_time), event:events(title)')
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
}

async function getUpcomingCreneaux() {
  const { data } = await supabaseAdmin
    .from('creneaux')
    .select('*')
    .eq('is_available', true)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(8)
  return data || []
}

async function getUpcomingEvents() {
  const { data } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('is_active', true)
    .gte('date_heure', new Date().toISOString())
    .order('date_heure', { ascending: true })
    .limit(4)
  return data || []
}

export default async function AdminDashboard() {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) redirect('/admin/login')

  const [stats, recent, creneaux, events] = await Promise.all([
    getStats(),
    getRecentReservations(),
    getUpcomingCreneaux(),
    getUpcomingEvents(),
  ])

  const STAT_CARDS = [
    { label: 'Creneaux disponibles', value: stats.creneaux,     icon: Calendar,      href: '/admin/creneaux',     color: 'text-blue-400' },
    { label: 'Reservations totales', value: stats.reservations, icon: Users,         href: '/admin/reservations', color: 'text-green-400' },
    { label: 'Evenements actifs',    value: stats.events,       icon: Star,          href: '/admin/evenements',   color: 'text-gold-400' },
    { label: 'Messages non lus',     value: stats.unreadMsgs,   icon: MessageSquare, href: '/admin/messages',     color: 'text-red-400' },
  ]

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-white">Tableau de bord</h1>
        <p className="text-noir-400 text-sm mt-1">Bienvenue dans votre espace administrateur</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={href} href={href} className="card hover:border-gold-500/50 transition-colors group">
            <Icon size={20} className={`${color} mb-3`} />
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-noir-400 group-hover:text-noir-300 transition-colors">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">

        {/* Creneaux a venir */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium">Creneaux disponibles</h2>
            <Link href="/admin/creneaux" className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
              Gerer →
            </Link>
          </div>
          {creneaux.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-noir-500 text-sm mb-3">Aucun creneau disponible</p>
              <Link href="/admin/creneaux" className="btn-gold text-xs px-4 py-2">
                Ajouter des creneaux
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {creneaux.map((c: {id: string; start_time: string; end_time: string; notes: string | null}) => {
                const start = DateTime.fromISO(c.start_time, { zone: 'utc' }).setZone('Europe/Paris')
                const end   = DateTime.fromISO(c.end_time,   { zone: 'utc' }).setZone('Europe/Paris')
                return (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-noir-800 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {start.setLocale('fr').toFormat("EEE d MMM")}
                      </p>
                      {c.notes && <p className="text-noir-500 text-xs">{c.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-gold-400 text-sm font-medium">
                        {start.toFormat("HH'h'mm")}
                      </span>
                      <p className="text-noir-500 text-xs">
                        {end.toFormat("HH'h'mm")}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Evenements a venir */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium">Evenements a venir</h2>
            <Link href="/admin/evenements" className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
              Gerer →
            </Link>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-noir-500 text-sm mb-3">Aucun evenement programme</p>
              <Link href="/admin/evenements" className="btn-gold text-xs px-4 py-2">
                Creer un evenement
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((ev: {id: string; title: string; date_heure: string; is_free: boolean; price: number; spots_remaining: number; max_spots: number | null}) => {
                const date = DateTime.fromISO(ev.date_heure, { zone: 'utc' }).setZone('Europe/Paris')
                return (
                  <div key={ev.id} className="flex items-center justify-between py-2 border-b border-noir-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{ev.title}</p>
                      <p className="text-noir-400 text-xs">
                        {date.setLocale('fr').toFormat("EEE d MMM 'a' HH'h'mm")}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ev.is_free
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gold-500/10 text-gold-400'
                      }`}>
                        {ev.is_free ? 'Gratuit' : `${ev.price.toFixed(2)} EUR`}
                      </span>
                      {ev.max_spots !== null && (
                        <p className="text-noir-500 text-xs mt-1">
                          {ev.spots_remaining}/{ev.max_spots} places
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reservations recentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">Reservations recentes</h2>
          <Link href="/admin/reservations" className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
            Voir tout →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-noir-500 text-sm text-center py-6">Aucune reservation pour le moment</p>
        ) : (
          <div className="space-y-3">
            {recent.map((r: {id: string; student_name: string; student_email: string; type: string; status: string; created_at: string}) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-noir-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{r.student_name}</p>
                  <p className="text-noir-400 text-xs">{r.student_email}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'confirmed'
                      ? 'bg-green-500/10 text-green-400'
                      : r.status === 'cancelled'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {r.status === 'confirmed' ? 'Confirme' : r.status === 'cancelled' ? 'Annule' : 'En attente'}
                  </span>
                  <p className="text-noir-500 text-xs mt-1">
                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}