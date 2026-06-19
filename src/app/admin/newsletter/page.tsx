'use client'
import { useState, useEffect } from 'react'
import { Trash2, Download, Mail, UserCheck, UserX } from 'lucide-react'

interface Subscriber {
  id: string; email: string; source: string; actif: boolean; created_at: string
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'tous' | 'actifs' | 'inactifs'>('actifs')
  const [search, setSearch] = useState('')

  useEffect(() => { loadSubscribers() }, [])

  async function loadSubscribers() {
    setLoading(true)
    const data = await fetch('/api/newsletter').then(r => r.json()).catch(() => [])
    setSubscribers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function toggleActif(sub: Subscriber) {
    await fetch('/api/newsletter', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, actif: !sub.actif }),
    })
    setSubscribers(prev => prev.map(s => s.id === sub.id ? { ...s, actif: !s.actif } : s))
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet abonné définitivement ?')) return
    await fetch('/api/newsletter', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSubscribers(prev => prev.filter(s => s.id !== id))
  }

  function exportCSV() {
    const rows = filtered.map(s => `${s.email},${s.source},${s.actif ? 'actif' : 'inactif'},${new Date(s.created_at).toLocaleDateString('fr-FR')}`)
    const csv = ['Email,Source,Statut,Date inscription', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `newsletter-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const filtered = subscribers
    .filter(s => filter === 'tous' ? true : filter === 'actifs' ? s.actif : !s.actif)
    .filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase()))

  const nbActifs = subscribers.filter(s => s.actif).length
  const nbInactifs = subscribers.filter(s => !s.actif).length

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Newsletter</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez vos abonnés à la newsletter</p>
        </div>
        <button onClick={exportCSV} className="btn-outline flex items-center gap-2 text-sm">
          <Download size={15} /> Exporter CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', val: subscribers.length, color: 'text-white' },
          { label: 'Actifs', val: nbActifs, color: 'text-green-400' },
          { label: 'Désabonnés', val: nbInactifs, color: 'text-noir-500' },
        ].map((s, i) => (
          <div key={i} className="card text-center py-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-noir-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres + recherche */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1">
          {[{ key: 'actifs', label: `Actifs (${nbActifs})` }, { key: 'inactifs', label: `Désabonnés (${nbInactifs})` }, { key: 'tous', label: 'Tous' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as 'tous' | 'actifs' | 'inactifs')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.key ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un email..." className="input flex-1 max-w-xs" />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Mail size={32} className="text-noir-700 mx-auto mb-3" />
          <p className="text-noir-400">Aucun abonné trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(sub => (
            <div key={sub.id} className="card flex items-center justify-between gap-3 flex-wrap py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${sub.actif ? 'bg-green-400' : 'bg-noir-600'}`} />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{sub.email}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-noir-500 text-xs capitalize">{sub.source}</span>
                    <span className="text-noir-700 text-xs">·</span>
                    <span className="text-noir-500 text-xs">{new Date(sub.created_at).toLocaleDateString('fr-FR')}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${sub.actif ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-noir-600 border-noir-700'}`}>
                      {sub.actif ? 'Actif' : 'Désabonné'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActif(sub)}
                  className={`p-1.5 rounded transition-colors ${sub.actif ? 'text-green-400 hover:text-noir-400' : 'text-noir-600 hover:text-green-400'}`}
                  title={sub.actif ? 'Désactiver' : 'Réactiver'}>
                  {sub.actif ? <UserCheck size={15} /> : <UserX size={15} />}
                </button>
                <button onClick={() => handleDelete(sub.id)}
                  className="text-noir-600 hover:text-red-400 p-1.5 rounded transition-colors" title="Supprimer">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}