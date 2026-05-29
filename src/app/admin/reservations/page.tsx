'use client'

import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { Search, Trash2, CheckCircle, XCircle, Download } from 'lucide-react'

interface Reservation {
  id: string
  student_name: string
  student_email: string
  student_phone: string | null
  student_timezone: string
  type: string
  status: string
  payment_method: string
  amount: number
  message: string | null
  created_at: string
  slot_start?: string | null
  slot_end?: string | null
  event?: { title: string; type: string } | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmé',   color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  pending:   { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  cancelled: { label: 'Annulé',     color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filter, setFilter]             = useState<'all' | 'cours' | 'evenement'>('all')
  const [selected, setSelected]         = useState<Reservation | null>(null)

  useEffect(() => { fetchReservations() }, [])

  async function fetchReservations() {
    setLoading(true)
    const res  = await fetch('/api/reservations')
    const data = await res.json()
    setReservations(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleStatus(id: string, status: string) {
    await fetch(`/api/reservations/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    fetchReservations()
    setSelected(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette réservation ?')) return
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    fetchReservations()
    setSelected(null)
  }

  const filtered = reservations.filter(r => {
    const matchSearch = !search ||
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.type === filter || (filter === 'evenement' && ['atelier', 'evenement', 'masterclass'].includes(r.type))
    return matchSearch && matchFilter
  })

  function formatDate(iso: string, tz: string) {
    return DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz).setLocale('fr').toFormat("d MMM yyyy, HH'h'mm")
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Réservations</h1>
        <p className="text-noir-400 text-sm mt-1">{reservations.length} réservation{reservations.length > 1 ? 's' : ''} au total</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un élève…"
            className="input w-full pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'cours', 'evenement'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filter === f ? 'bg-gold-500 text-noir-950 font-medium' : 'btn-outline'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'cours' ? 'Cours' : 'Événements'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-noir-400">
          <p>Aucune réservation trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              className="card cursor-pointer hover:border-gold-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium truncate">{r.student_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_LABELS[r.status]?.color || 'text-noir-400'}`}>
                      {STATUS_LABELS[r.status]?.label || r.status}
                    </span>
                  </div>
                  <p className="text-noir-400 text-sm truncate">{r.student_email}</p>
                  <p className="text-noir-500 text-xs mt-1">
                    {r.slot_start
                      ? `Cours — ${formatDate(r.slot_start, r.student_timezone)}`
                      : r.event
                      ? `${r.event.title}`
                      : '—'
                    }
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-noir-500">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                  {r.amount > 0 && (
                    <p className="text-gold-400 text-sm font-medium mt-1">{r.amount.toFixed(2)} €</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-serif text-xl">Détail réservation</h2>
              <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white transition-colors"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>

            <div className="space-y-2 mb-6">
              {[
                { label: 'Élève',     value: selected.student_name },
                { label: 'Email',     value: selected.student_email },
                { label: 'Téléphone', value: selected.student_phone || '—' },
                { label: 'Fuseau',    value: selected.student_timezone },
                { label: 'Type',      value: selected.type },
                { label: 'Statut',    value: STATUS_LABELS[selected.status]?.label || selected.status },
                { label: 'Paiement',  value: selected.payment_method },
                { label: 'Montant',   value: selected.amount > 0 ? `${selected.amount.toFixed(2)} €` : 'Gratuit' },
                selected.slot_start ? { label: 'Creneau', value: formatDate(selected.slot_start, selected.student_timezone) } : null,
                selected.event   ? { label: 'Événement', value: selected.event.title } : null,
                selected.message ? { label: 'Message', value: selected.message } : null,
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-noir-800 pb-2">
                  <span className="text-noir-400">{item!.label}</span>
                  <span className="text-white text-right max-w-[60%]">{item!.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {selected.status !== 'confirmed' && (
                <button onClick={() => handleStatus(selected.id, 'confirmed')} className="btn-gold flex items-center gap-1 text-sm flex-1">
                  <CheckCircle size={14} /> Confirmer
                </button>
              )}
              {selected.status !== 'cancelled' && (
                <button onClick={() => handleStatus(selected.id, 'cancelled')} className="btn-outline flex items-center gap-1 text-sm flex-1">
                  <XCircle size={14} /> Annuler
                </button>
              )}
              <button onClick={() => handleDelete(selected.id)} className="btn-outline border-red-500/50 text-red-400 hover:bg-red-900/20 flex items-center gap-1 text-sm">
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}