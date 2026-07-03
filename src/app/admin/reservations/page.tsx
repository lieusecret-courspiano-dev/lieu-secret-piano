'use client'
import { usePathname } from 'next/navigation'

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
  confirmed:         { label: 'Confirmé',              color: 'bg-green-500/10 text-green-400 border-green-500/20'   },
  pending:           { label: 'En attente',             color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  pending_virement:  { label: 'Attente virement',       color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'      },
  cancelled:         { label: 'Annulé',                 color: 'bg-red-500/10 text-red-400 border-red-500/20'         },
}

export default function AdminReservations() {
  const pathname = usePathname()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filter, setFilter]             = useState<'all' | 'cours' | 'evenement' | 'virement'>('all')
  const [periode, setPeriode]           = useState<'a_venir' | 'passees' | 'toutes'>('a_venir')
  const [filterDate, setFilterDate]     = useState('')
  const [filterNom, setFilterNom]       = useState('')
  const [selected, setSelected]         = useState<Reservation | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [packOptions, setPackOptions] = useState<{label: string; heures: number; montant: number}[]>([{label:'Pack 5h',heures:5,montant:100},{label:'Pack 8h',heures:8,montant:165},{label:'Pack 12h',heures:12,montant:250}])
  const [confirmType, setConfirmType] = useState<'1h' | 'pack'>('1h')
  const [confirmPackMontant, setConfirmPackMontant] = useState(100)
  const [confirmPackLabel, setConfirmPackLabel] = useState('Pack 5h')
  const [confirmPackHeures, setConfirmPackHeures] = useState(5)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then((d: Record<string, string>) => {
      function parseH(label: string): number { const m = label.match(/(\d+)\s*h/i); return m ? parseInt(m[1]) : 5 }
      const loaded: {label: string; heures: number; montant: number}[] = []
      for (let i = 1; i <= 10; i++) {
        const lbl = d[`tarif_pack_label${i}`]; const prix = d[`tarif_pack_prix${i}`]
        if (lbl && prix && parseFloat(prix) > 0) loaded.push({ label: lbl, heures: parseH(lbl), montant: parseFloat(prix) })
      }
      if (loaded.length > 0) { setPackOptions(loaded); setConfirmPackLabel(loaded[0].label); setConfirmPackHeures(loaded[0].heures); setConfirmPackMontant(loaded[0].montant) }
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchReservations() }, [])

  async function fetchReservations() {
    setLoading(true)
    const res  = await fetch('/api/reservations')
    const data = await res.json()
    setReservations(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleConfirmVirement(id: string) {
    setConfirmLoading(true)
    try {
      const res = await fetch('/api/admin/reservations/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: id }),
      })
      if (res.ok) { fetchReservations(); setSelected(null) }
      else { const d = await res.json(); alert(d.error || 'Erreur') }
    } catch { alert('Erreur réseau') }
    finally { setConfirmLoading(false) }
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

  const now = new Date()
  const filtered = reservations.filter(r => {
    // Utiliser slot_start ou date_heure de l'événement
    const dateRef = r.slot_start || (r.event as any)?.date_heure || null
    const slotDate = dateRef ? new Date(dateRef) : null
    // Filtre période
    const matchPeriode =
      periode === 'toutes' ? true :
      periode === 'a_venir' ? (slotDate ? slotDate > now : r.status !== 'cancelled') :
      periode === 'passees' ? (slotDate ? slotDate <= now : r.status === 'cancelled') : true
    // Filtre recherche (nom ou email)
    const matchSearch = !search ||
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_email.toLowerCase().includes(search.toLowerCase())
    // Filtre nom spécifique
    const matchNom = !filterNom ||
      r.student_name.toLowerCase().includes(filterNom.toLowerCase()) ||
      r.student_email.toLowerCase().includes(filterNom.toLowerCase())
    // Filtre date
    const matchDate = !filterDate || (slotDate && slotDate.toISOString().startsWith(filterDate))
    const matchFilter = filter === 'all' || r.type === filter || (filter === 'evenement' && ['atelier', 'evenement', 'masterclass'].includes(r.type))
    return matchPeriode && matchSearch && matchNom && matchDate && matchFilter
  })

  function formatDate(iso: string, tz: string) {
    return DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz).setLocale('fr').toFormat("d MMM yyyy, HH'h'mm")
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Réservations</h1>
        <p className="text-noir-400 text-sm mt-1">{reservations.length} réservation{reservations.length > 1 ? 's' : ''} au total</p>
      </div>
        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
          <a href="/admin/reservations" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/reservations' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Réservations</a>
        <a href="/admin/essais" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/essais' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Cours d'essai</a>
        </div>

      {/* Filtres période */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        {([
          { key: 'a_venir', label: 'À venir' },
          { key: 'passees', label: 'Passées' },
          { key: 'toutes',  label: 'Toutes' },
        ] as const).map(p => (
          <button key={p.key} onClick={() => setPeriode(p.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${periode === p.key ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="input text-xs py-1.5 px-3 w-36" title="Filtrer par date" />
          <input value={filterNom} onChange={e => setFilterNom(e.target.value)}
            placeholder="Filtrer par nom..." className="input text-xs py-1.5 px-3 w-40" />
        </div>
      </div>

      {/* Filtres type */}
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
                    {(() => {
                      const dr = r.slot_start || (r.event as any)?.date_heure
                      return dr && new Date(dr) <= new Date() ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-noir-700 text-noir-600 bg-noir-800/30">
                          Archivée
                        </span>
                      ) : null
                    })()}
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
              {selected.status === 'pending_virement' && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="btn-gold flex items-center gap-1 text-sm w-full mb-2"
                >
                  Confirmer le paiement reçu
                </button>
              )}
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

      {/* Modale confirmation virement avec choix pack/1h */}
      {showConfirmModal && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-serif text-xl">Confirmer le paiement</h2>
              <button onClick={() => setShowConfirmModal(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="text-noir-400 text-sm mb-4">
              Réservation de <strong className="text-white">{selected.student_name}</strong>
            </p>

            <div className="mb-4">
              <label className="label mb-2 block">Type de paiement reçu</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmType('1h')}
                  className={'py-2.5 rounded-xl border text-sm font-medium transition-all ' + (confirmType === '1h' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                  1 cours (22 €)
                </button>
                <button type="button" onClick={() => setConfirmType('pack')}
                  className={'py-2.5 rounded-xl border text-sm font-medium transition-all ' + (confirmType === 'pack' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                  Pack de cours
                </button>
              </div>
            </div>

            {confirmType === 'pack' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="label mb-1 block">Formule du pack</label>
                  <select className="input w-full" onChange={e => {
                    const opt = packOptions.find(p => p.label === e.target.value)
                    if (opt) { setConfirmPackLabel(opt.label); setConfirmPackHeures(opt.heures); setConfirmPackMontant(opt.montant) }
                  }}>
                    {packOptions.map(p => (
                      <option key={p.label} value={p.label}>{p.label} — {p.montant} €</option>
                    ))}
                  </select>
                </div>
                <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3 text-sm">
                  <div className="flex justify-between"><span className="text-noir-400">Pack</span><span className="text-white">{confirmPackLabel}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-noir-400">Heures</span><span className="text-white">{confirmPackHeures}h</span></div>
                  <div className="flex justify-between mt-1"><span className="text-noir-400">Montant</span><span className="text-gold-400 font-bold">{confirmPackMontant} €</span></div>
                </div>
                <p className="text-noir-500 text-xs">Un code PK-XXXX-XXXX sera généré et envoyé automatiquement à l&apos;élève.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="btn-outline flex-1">Annuler</button>
              <button
                onClick={async () => {
                  setConfirmLoading(true)
                  try {
                    const res = await fetch('/api/admin/reservations/confirm', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        reservation_id: selected.id,
                        confirm_type: confirmType,
                        pack_label: confirmType === 'pack' ? confirmPackLabel : null,
                        pack_heures: confirmType === 'pack' ? confirmPackHeures : null,
                        pack_montant: confirmType === 'pack' ? confirmPackMontant : null,
                      }),
                    })
                    if (res.ok) { fetchReservations(); setSelected(null); setShowConfirmModal(false) }
                    else { const d = await res.json(); alert(d.error || 'Erreur') }
                  } catch { alert('Erreur réseau') }
                  finally { setConfirmLoading(false) }
                }}
                className="btn-gold flex-1"
                disabled={confirmLoading}
              >
                {confirmLoading ? 'Confirmation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}