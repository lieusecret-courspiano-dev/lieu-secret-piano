'use client'

import { DateTime } from 'luxon'
import { formatDateLocal, formatTime } from '@/lib/utils'
import { Calendar, Clock, Users } from 'lucide-react'

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
  event: Event
  timezone: string
  onReserve: () => void
}

export default function FeaturedEvent({ event, timezone, onReserve }: Props) {
  const endISO = DateTime.fromISO(event.date_heure, { zone: 'utc' })
    .plus({ minutes: event.duration_minutes })
    .toISO()!

  const dateLabel = formatDateLocal(event.date_heure, timezone)
  const timeStart = formatTime(event.date_heure, timezone)
  const timeEnd   = formatTime(endISO, timezone)
  const isFull    = event.max_spots !== null && event.spots_remaining <= 0
  const spotsLeft = event.spots_remaining

  const typeLabel: Record<string, string> = {
    cours:       'Cours collectif',
    atelier:     'Atelier',
    evenement:   'Evenement',
    masterclass: 'Masterclass',
  }

  return (
    <div className="relative overflow-hidden border-y border-gold-500/20 bg-noir-900/60">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-20 bg-gold-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">

          {/* Badge */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 border border-gold-500/30 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-gold-400 text-xs font-medium tracking-wider uppercase">En ce moment</span>
            </div>
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs text-gold-500/60 uppercase tracking-widest">
                {typeLabel[event.type] || 'Evenement'}
              </span>
              {event.is_free ? (
                <span className="text-xs border border-green-500/30 text-green-400 rounded-full px-2 py-0.5">Gratuit</span>
              ) : (
                <span className="text-xs border border-gold-500/30 text-gold-400 rounded-full px-2 py-0.5">
                  {event.price.toFixed(2)} EUR
                </span>
              )}
              {isFull && (
                <span className="text-xs border border-red-500/30 text-red-400 rounded-full px-2 py-0.5">Complet</span>
              )}
            </div>

            <h2 className="text-white font-serif text-xl leading-tight mb-2 truncate">{event.title}</h2>

            {event.description && (
              <p className="text-noir-400 text-sm line-clamp-1 mb-2">{event.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-noir-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={11} className="text-gold-500" />
                <span className="capitalize">{dateLabel}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={11} className="text-gold-500" />
                {timeStart} — {timeEnd}
              </span>
              {event.max_spots !== null && (
                <span className="flex items-center gap-1.5">
                  <Users size={11} className="text-gold-500" />
                  {isFull ? 'Complet' : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} restante${spotsLeft > 1 ? 's' : ''}`}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={onReserve}
              disabled={isFull}
              className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isFull
                  ? 'bg-noir-700 text-noir-500 cursor-not-allowed'
                  : 'bg-gold-500 hover:bg-gold-400 text-noir-950'
              }`}
            >
              {isFull
                ? 'Complet'
                : event.is_free
                  ? "S'inscrire gratuitement"
                  : `S'inscrire — ${event.price.toFixed(2)} EUR`
              }
            </button>
            {!isFull && event.max_spots !== null && spotsLeft <= 3 && (
              <p className="text-center text-xs text-red-400 mt-1.5">
                Plus que {spotsLeft} place{spotsLeft > 1 ? 's' : ''} !
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}