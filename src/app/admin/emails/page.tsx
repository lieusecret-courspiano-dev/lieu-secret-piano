'use client'
import { useState, useEffect } from 'react'
import { Search, Mail, Clock, Star } from 'lucide-react'
interface EmailLog { id: string; key: string; type: string; reservation_id: string | null; created_at: string; reservation?: { student_name: string; student_email: string; slot_start: string | null } }
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  reminder_48h: { label: 'Rappel 48h', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  reminder_1h: { label: 'Rappel 1h', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  review_request: { label: "Demande d'avis", color: 'text-gold-400 bg-gold-500/10 border-gold-500/20' },
  review_submitted: { label: 'Avis soumis', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
}
export default function AdminEmails() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  useEffect(() => { fetch('/api/admin/emails').then(r => r.json()).then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false)) }, [])
  const filtered = logs.filter(l => { const ms = !search || l.reservation?.student_name?.toLowerCase().includes(search.toLowerCase()) || l.reservation?.student_email?.toLowerCase().includes(search.toLowerCase()); const mf = filter === 'all' || l.type === filter; return ms && mf })
  const stats = { reminder_48h: logs.filter(l => l.type === 'reminder_48h').length, reminder_1h: logs.filter(l => l.type === 'reminder_1h').length, review_request: logs.filter(l => l.type === 'review_request').length, review_submitted: logs.filter(l => l.type === 'review_submitted').length }
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-6"><h1 className="text-2xl font-serif text-white">Emails envoyés</h1><p className="text-noir-400 text-sm mt-1">Historique des rappels et demandes d&apos;avis automatiques</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[{ label: 'Rappels 48h', value: stats.reminder_48h, color: 'text-blue-400' }, { label: 'Rappels 1h', value: stats.reminder_1h, color: 'text-orange-400' }, { label: "Demandes d'avis", value: stats.review_request, color: 'text-gold-400' }, { label: 'Avis reçus', value: stats.review_submitted, color: 'text-green-400' }].map((s, i) => <div key={i} className="card text-center"><div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div><div className="text-xs text-noir-500 uppercase tracking-wider">{s.label}</div></div>)}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..." className="input w-full pl-9" /></div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-full sm:w-48"><option value="all">Tous les types</option><option value="reminder_48h">Rappels 48h</option><option value="reminder_1h">Rappels 1h</option><option value="review_request">Demandes d&apos;avis</option><option value="review_submitted">Avis soumis</option></select>
      </div>
      {loading ? <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : filtered.length === 0 ? <div className="card text-center py-12"><Mail size={32} className="text-noir-600 mx-auto mb-3" /><p className="text-noir-400">Aucun email envoyé pour le moment</p></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead><tr className="border-b border-noir-800">{['Type','Élève','Email','Cours','Envoyé le'].map(h => <th key={h} className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">{h}</th>)}</tr></thead>
            <tbody>{filtered.map(l => { const ti = TYPE_LABELS[l.type]; return (
              <tr key={l.id} className="border-b border-noir-800/50 hover:bg-noir-800/20 transition-colors">
                <td className="py-3 px-4"><span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${ti?.color || 'text-noir-400 bg-noir-800 border-noir-700'}`}>{l.type.includes('reminder') ? <Clock size={10} /> : <Star size={10} />}{ti?.label || l.type}</span></td>
                <td className="py-3 px-4 text-white text-sm">{l.reservation?.student_name || '—'}</td>
                <td className="py-3 px-4 text-noir-400 text-sm">{l.reservation?.student_email || '—'}</td>
                <td className="py-3 px-4 text-noir-500 text-xs">{l.reservation?.slot_start ? new Date(l.reservation.slot_start).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                <td className="py-3 px-4 text-noir-500 text-xs">{new Date(l.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
              </tr>
            )})}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
