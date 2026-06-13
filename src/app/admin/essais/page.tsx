'use client'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface Essai { id: string; nom: string; email: string; phone: string | null; niveau: string; message: string | null; timezone: string; status: string; notes: string | null; created_at: string }
const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', contacted: 'bg-blue-500/10 text-blue-400 border-blue-500/20', scheduled: 'bg-green-500/10 text-green-400 border-green-500/20', done: 'bg-noir-500/10 text-noir-400 border-noir-500/20', cancelled: 'bg-red-500/10 text-red-400 border-red-500/20' }
const STATUS_LABELS: Record<string, string> = { pending: 'En attente', contacted: 'Contacté', scheduled: 'Planifié', done: 'Effectué', cancelled: 'Annulé' }
const NIVEAUX: Record<string, string> = { debutant: 'Débutant', elementaire: 'Élémentaire', intermediaire: 'Intermédiaire', avance: 'Avancé' }

export default function AdminEssais() {
  const [essais, setEssais] = useState<Essai[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Essai | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = () => fetch('/api/admin/essais').then(r => r.json()).then(d => { setEssais(Array.isArray(d) ? d : []); setLoading(false) })
  useEffect(() => { reload() }, [])

  async function updateStatus(id: string, status: string) {
    setSaving(true)
    await fetch('/api/admin/essais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, notes }) })
    await reload(); setSaving(false); setSelected(null)
  }
  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette demande ?')) return
    await fetch(`/api/admin/essais?id=${id}`, { method: 'DELETE' })
    setEssais(e => e.filter(x => x.id !== id)); setSelected(null)
  }

  const filtered = essais.filter(e => !search || e.nom.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="mb-6"><h1 className="text-2xl font-serif text-white">Cours d&apos;essai gratuits</h1><p className="text-noir-400 text-sm mt-1">{essais.filter(e => e.status === 'pending').length} en attente</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <div key={k} className="card text-center py-3"><div className="text-xl font-bold text-gold-400 mb-1">{essais.filter(e => e.status === k).length}</div><div className="text-xs text-noir-500">{v}</div></div>
        ))}
      </div>
      <div className="relative mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input w-full pl-9 max-w-sm" /></div>
      {loading ? <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead><tr className="border-b border-noir-800">{['Nom','Email','Niveau','Statut','Date',''].map(h => <th key={h} className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">{h}</th>)}</tr></thead>
            <tbody>{filtered.map(e => (
              <tr key={e.id} onClick={() => { setSelected(e); setNotes(e.notes || '') }} className="border-b border-noir-800/50 hover:bg-noir-800/30 cursor-pointer transition-colors">
                <td className="py-3 px-4 text-white font-medium">{e.nom}</td>
                <td className="py-3 px-4 text-noir-400 text-sm">{e.email}</td>
                <td className="py-3 px-4 text-noir-300 text-sm">{NIVEAUX[e.niveau] || e.niveau}</td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[e.status] || ''}`}>{STATUS_LABELS[e.status] || e.status}</span></td>
                <td className="py-3 px-4 text-noir-500 text-xs">{new Date(e.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="py-3 px-4"><button onClick={ev => { ev.stopPropagation(); handleDelete(e.id) }} className="text-noir-600 hover:text-red-400 transition-colors"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800">
              <h2 className="text-white font-serif text-xl">{selected.nom}</h2>
              <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white p-1"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-noir-500 text-xs uppercase">Email</p><p className="text-white">{selected.email}</p></div>
                {selected.phone && <div><p className="text-noir-500 text-xs uppercase">Téléphone</p><p className="text-white">{selected.phone}</p></div>}
                <div><p className="text-noir-500 text-xs uppercase">Niveau</p><p className="text-white">{NIVEAUX[selected.niveau] || selected.niveau}</p></div>
                <div><p className="text-noir-500 text-xs uppercase">Fuseau</p><p className="text-white">{selected.timezone}</p></div>
              </div>
              {selected.message && <div><p className="text-noir-500 text-xs uppercase mb-1">Message</p><p className="text-noir-300 text-sm bg-noir-800 rounded-lg p-3">{selected.message}</p></div>}
              <div><label className="label mb-1 block">Notes internes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input w-full resize-none" placeholder="Notes sur ce contact..." /></div>
              <div><label className="label mb-2 block">Changer le statut</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => updateStatus(selected.id, k)} disabled={saving}
                      className={`py-2 rounded-lg border text-xs font-medium transition-all ${selected.status === k ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-400 hover:border-gold-500'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
