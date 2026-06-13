'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'
import { DateTime } from 'luxon'

interface Reservation { id: string; slot_start: string; slot_end: string; type: string; status: string; payment_method: string; amount: number; created_at: string }

export default function ReservationsPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()), fetch('/api/eleve/reservations').then(r => r.json())]).then(([me, resa]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom); setReservations(Array.isArray(resa) ? resa : [])
    }).finally(() => setLoading(false))
  }, [router])

  const tz = 'Europe/Paris', now = DateTime.now()
  const aVenir = reservations.filter(r => DateTime.fromISO(r.slot_start, { zone: 'utc' }) > now && r.status === 'confirmed')
  const passes = reservations.filter(r => DateTime.fromISO(r.slot_start, { zone: 'utc' }) <= now || r.status !== 'confirmed')
  const SC: Record<string, string> = { confirmed: 'text-green-400 bg-green-500/10 border-green-500/20', pending_virement: 'text-blue-400 bg-blue-500/10 border-blue-500/20', cancelled: 'text-red-400 bg-red-500/10 border-red-500/20' }
  const SL: Record<string, string> = { confirmed: 'Confirmé', pending_virement: 'En attente', cancelled: 'Annulé' }

  if (loading) return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>

  async function handleCancel(reservationId: string) {
    if (!confirm('Annuler ce cours ?\nSi vous avez utilisé un code pack, votre heure sera remise automatiquement.')) return
    try {
      const { generateCancelToken } = await import('@/lib/cancel')
      const token = generateCancelToken(reservationId)
      const res = await fetch('/api/reservations/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reservationId, token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      fetch('/api/eleve/reservations').then(r => r.json()).then(d => setReservations(Array.isArray(d) ? d : []))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erreur annulation') }
  }

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6"><h1 className="font-serif text-2xl text-white">Mes Réservations</h1><Link href="/espace-eleve/reserver" className="btn-gold text-sm px-4 py-2">Réserver un cours</Link></div>
        <h2 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-3">Cours à venir ({aVenir.length})</h2>
        {aVenir.length === 0 ? <div className="card text-center py-8 mb-6"><p className="text-noir-400 text-sm mb-3">Aucun cours à venir</p><Link href="/espace-eleve/reserver" className="btn-gold text-sm px-6">Réserver maintenant</Link></div> : (
          <div className="space-y-3 mb-6">{aVenir.map(r => { const s = DateTime.fromISO(r.slot_start, { zone: 'utc' }).setZone(tz), e = DateTime.fromISO(r.slot_end, { zone: 'utc' }).setZone(tz); return (<div key={r.id} className="card border-gold-500/20 flex items-center justify-between"><div><p className="text-white font-medium capitalize">{s.setLocale('fr').toFormat('EEEE d MMMM yyyy')}</p><p className="text-gold-400 text-sm">{s.toFormat('HH:mm')} — {e.toFormat('HH:mm')}</p></div><span className={`text-xs px-2 py-1 rounded-full border ${SC[r.status] || 'text-noir-400'}`}>{SL[r.status] || r.status}</span></div>) })}</div>
        )}
        <h2 className="text-noir-400 text-sm font-medium uppercase tracking-wider mb-3">Cours passés ({passes.length})</h2>
        <div className="space-y-2">{passes.map(r => { const s = DateTime.fromISO(r.slot_start, { zone: 'utc' }).setZone(tz), e = DateTime.fromISO(r.slot_end, { zone: 'utc' }).setZone(tz); return (<div key={r.id} className="card bg-noir-900/50 flex items-center justify-between opacity-75"><div><p className="text-noir-300 text-sm capitalize">{s.setLocale('fr').toFormat('EEEE d MMMM yyyy')}</p><p className="text-noir-500 text-xs">{s.toFormat('HH:mm')} — {e.toFormat('HH:mm')}</p></div><span className="text-xs text-noir-500">Effectué</span></div>) })}</div>
      </div>
    </EleveLayout>
  )
}
