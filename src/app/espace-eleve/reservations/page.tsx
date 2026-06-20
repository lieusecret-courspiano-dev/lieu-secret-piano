'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'
import { DateTime } from 'luxon'

interface Reservation {
  id: string
  slot_start: string
  slot_end: string
  type: string
  status: string
  payment_method: string
  amount: number
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:        { label: 'Confirmé',    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  pending:          { label: 'En attente',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  pending_virement: { label: 'Virement',    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  cancelled:        { label: 'Annulé',      color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
}

export default function ReservationsPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'a_venir' | 'passes'>('a_venir')

  useEffect(() => {
    fetch('/api/eleve/reservations')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setReservations(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  async function handleAnnuler(reservationId: string, slotStart: string) {
    const heuresAvant = (new Date(slotStart).getTime() - Date.now()) / 3600000
    if (heuresAvant < 15) {
      alert('Annulation impossible : le cours est dans moins de 15 heures.')
      return
    }
    if (!confirm('Confirmer l\'annulation de ce cours ?')) return
    try {
      const res = await fetch(`/api/eleve/reservations/${reservationId}`, { method: 'DELETE' })
      if (res.ok) {
        setReservations(prev => prev.map(r =>
          r.id === reservationId ? { ...r, status: 'cancelled' } : r
        ))
      } else {
        const d = await res.json()
        alert(d.error || 'Erreur lors de l\'annulation.')
      }
    } catch {
      alert('Erreur lors de l\'annulation.')
    }
  }

  const now = new Date()
  const aVenir = reservations.filter(r => new Date(r.slot_start) > now && r.status !== 'cancelled')
  const passes = reservations.filter(r => new Date(r.slot_start) <= now || r.status === 'cancelled')
  const filtered = filter === 'a_venir' ? aVenir : passes

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 space-y-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-white mb-1">Mes réservations</h1>
            <p className="text-noir-400 text-sm">{aVenir.length} à venir · {passes.length} passé{passes.length > 1 ? 's' : ''}</p>
          </div>
          <Link href="/espace-eleve/reserver" className="btn-gold text-sm flex items-center gap-2">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Réserver
          </Link>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'a_venir', label: `À venir (${aVenir.length})` },
            { key: 'passes', label: `Passés (${passes.length})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as 'a_venir' | 'passes')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f.key ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            title={filter === 'a_venir' ? 'Aucun cours à venir' : 'Aucun cours passé'}
            description={filter === 'a_venir' ? 'Réservez votre prochain cours' : ''}
            action={filter === 'a_venir' ? <Link href="/espace-eleve/reserver" className="btn-gold text-xs px-4 py-2">Réserver un cours</Link> : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
              const start = DateTime.fromISO(r.slot_start)
              const end = DateTime.fromISO(r.slot_end)
              const isPast = new Date(r.slot_start) <= now
              const heuresAvant = (new Date(r.slot_start).getTime() - Date.now()) / 3600000
              const peutAnnuler = !isPast && r.status !== 'cancelled' && heuresAvant >= 15

              return (
                <div key={r.id} className={`card transition-all ${isPast ? 'opacity-70' : 'hover:border-gold-500/20'}`}>
                  <div className="flex items-start gap-3">
                    {/* Date badge */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      isPast ? 'bg-noir-800 border border-noir-700' : 'bg-gold-500/10 border border-gold-500/30'
                    }`}>
                      <p className={`text-xs font-bold ${isPast ? 'text-noir-400' : 'text-gold-400'}`}>
                        {start.toFormat('dd')}
                      </p>
                      <p className={`text-xs ${isPast ? 'text-noir-600' : 'text-gold-500'}`}>
                        {start.setLocale('fr').toFormat('MMM')}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">
                        {start.setLocale('fr').toFormat('EEEE d MMMM yyyy')}
                      </p>
                      <p className="text-noir-400 text-xs mt-0.5">
                        {start.toFormat('HH:mm')} — {end.toFormat('HH:mm')}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {r.amount > 0 && (
                          <span className="text-xs text-noir-500">{r.amount} €</span>
                        )}
                        <span className="text-xs text-noir-600 capitalize">{r.payment_method?.replace('_', ' ')}</span>
                      </div>

                      {/* Bouton annulation */}
                      {!isPast && r.status !== 'cancelled' && (
                        <div className="mt-3 pt-3 border-t border-noir-800">
                          {peutAnnuler ? (
                            <button
                              onClick={() => handleAnnuler(r.id, r.slot_start)}
                              className="text-xs text-noir-500 hover:text-red-400 transition-colors flex items-center gap-1.5">
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Annuler ce cours
                            </button>
                          ) : (
                            <p className="text-xs text-noir-600 italic">
                              Annulation impossible (moins de 15h avant le cours)
                            </p>
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
    </EleveLayout>
  )
}