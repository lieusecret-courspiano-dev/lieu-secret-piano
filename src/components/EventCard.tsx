'use client'

import { DateTime } from 'luxon'
import { formatDateLocal, formatTime } from '@/lib/utils'
import { Calendar, Clock, Users, MapPin } from 'lucide-react'

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

export default function EventCard({ event, timezone, onReserve }: Props) {
  const endISO = DateTime.fromISO(event.date_heure, { zone: 'utc' })
    .plus({ minutes: event.duration_minutes })
    .toISO()!

  const dateLabel  = formatDateLocal(event.date_heure, timezone)
  const timeStart  = formatTime(event.date_heure, timezone)
  const timeEnd    = formatTime(endISO, timezone)
  const isFull     = event.max_spots !== null && event.spots_remaining <= 0
  const spotsLeft  = event.spots_remaining
  const spotsTotal = event.max_spots

  const typeLabel: Record<string, string> = {
    cours:       'Cours collectif',
    atelier:     'Atelier',
    evenement:   'Evenement',
    masterclass: 'Masterclass',
  }

  const spotsPercent = spotsTotal
    ? Math.round(((spotsTotal - spotsLeft) / spotsTotal) * 100)
    : 0

  return (
    <div className={`card flex flex-col h-full transition-all duration-200 hover:border-gold-500/30 ${isFull ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-xs border border-gold-500/20 text-gold-500/70 rounded-full px-2 py-0.5">
              {typeLabel[event.type] || event.type}
            </span>
            {event.is_free ? (
              <span className="text-xs border border-green-500/20 text-green-400 rounded-full px-2 py-0.5">Gratuit</span>
            ) : (
              <span className="text-xs border border-gold-500/20 text-gold-400 rounded-full px-2 py-0.5">
                {event.price.toFixed(2)} EUR
              </span>
            )}
            {isFull && (
              <span className="text-xs border border-red-500/20 text-red-400 rounded-full px-2 py-0.5">Complet</span>
            )}
          </div>
          <h3 className="text-white font-serif text-lg leading-tight">{event.title}</h3>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-noir-400 text-sm leading-relaxed mb-4 line-clamp-2">{event.description}</p>
      )}

      {/* Infos */}
      <div className="space-y-2 mb-4 flex-1">
        <div className="flex items-center gap-2 text-xs text-noir-400">
          <Calendar size={12} className="text-gold-500 shrink-0" />
          <span className="capitalize">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-noir-400">
          <Clock size={12} className="text-gold-500 shrink-0" />
          <span>{timeStart} — {timeEnd} ({event.duration_minutes} min)</span>
        </div>
        {event.zoom_link && (
          <div className="flex items-center gap-2 text-xs text-noir-400">
            <MapPin size={12} className="text-gold-500 shrink-0" />
            <span>En ligne (lien envoye par email)</span>
          </div>
        )}
      </div>

      {/* Places restantes */}
      {spotsTotal !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-noir-500 mb-1.5">
            <span>{isFull ? 'Complet' : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} restante${spotsLeft > 1 ? 's' : ''}`}</span>
            <span>{spotsTotal} places au total</span>
          </div>
          <div className="h-1 bg-noir-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                spotsPercent >= 90 ? 'bg-red-500' : spotsPercent >= 60 ? 'bg-gold-500' : 'bg-green-500'
              }`}
              style={{ width: `${spotsPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onReserve}
        disabled={isFull}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
          isFull
            ? 'bg-noir-800 text-noir-600 cursor-not-allowed'
            : event.is_free
              ? 'bg-gold-500 hover:bg-gold-400 text-noir-950'
              : 'bg-gold-500 hover:bg-gold-400 text-noir-950'
        }`}
      >
        {isFull
          ? 'Complet'
          : event.is_free
            ? 'Reserver'
            : `Reserver — ${event.price.toFixed(2)} EUR`
        }
      </button>
    </div>
  )
}