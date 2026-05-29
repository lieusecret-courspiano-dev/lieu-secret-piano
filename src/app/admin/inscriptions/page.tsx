'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react'

interface Inscription {
  id: string
  prenom: string
  nom: string
  email: string
  telephone: string | null
  adresse: string | null
  ville: string | null
  pays: string | null
  niveau: string
  annees_pratique: string | null
  rythme: string | null
  frequence: string | null
  objectifs: string | null
  message: string | null
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente',  color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  confirme:   { label: 'Confirme',    color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  refuse:     { label: 'Refuse',      color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function AdminInscriptions() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<Inscription | null>(null)

  useEffect(() => { fetchInscriptions() }, [])

  async function fetchInscriptions() {
    setLoading(true)
    const res  = await fetch('/api/admin/inscriptions')
    const data = await res.json()
    setInscriptions(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleStatus(id: string, status: string) {
    await fetch(`/api/admin/inscriptions/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    fetchInscriptions()
    setSelected(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette inscription ?')) return
    await fetch(`/api/admin/inscriptions/${id}`, { method: 'DELETE' })
    fetchInscriptions()
    setSelected(null)
  }

  const filtered = inscriptions.filter(i =>
    !search ||
    (i.prenom + ' ' + i.nom).toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Inscriptions</h1>
        <p className="text-noir-400 text-sm mt-1">{inscriptions.length} demande{inscriptions.length > 1 ? 's' : ''} au total</p>
      </div>

      {/* Recherche */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un eleve..."
          className="input w-full pl-9 max-w-sm"
        />
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-noir-400">
          <p>Aucune inscription pour le moment</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-noir-800">
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Eleve</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Email</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Niveau</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Ville</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Disponibilites</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Statut</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Date</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr
                  key={i.id}
                  onClick={() => setSelected(i)}
                  className="border-b border-noir-800/50 hover:bg-noir-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="text-white font-medium text-sm">{i.prenom} {i.nom}</p>
                    {i.telephone && <p className="text-noir-500 text-xs">{i.telephone}</p>}
                  </td>
                  <td className="py-3 px-4 text-noir-300 text-sm">{i.email}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded-full px-2 py-0.5">
                      {i.niveau.split(' ')[0]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-noir-400 text-sm">{i.ville || '—'}</td>
                  <td className="py-3 px-4 text-noir-400 text-xs max-w-[150px] truncate">{i.rythme || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_LABELS[i.status]?.color || 'text-noir-400'}`}>
                      {STATUS_LABELS[i.status]?.label || i.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-noir-500 text-xs">
                    {new Date(i.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(i.id) }}
                      className="text-noir-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-serif text-xl">{selected.prenom} {selected.nom}</h2>
              <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {[
                { label: 'Email',        value: selected.email },
                { label: 'Telephone',    value: selected.telephone || '—' },
                { label: 'Adresse',      value: [selected.adresse, selected.ville, selected.pays].filter(Boolean).join(', ') || '—' },
                { label: 'Niveau',       value: selected.niveau },
                { label: 'Pratique',     value: selected.annees_pratique || '—' },
                { label: 'Disponibilites', value: selected.rythme || '—' },
                { label: 'Frequence',    value: selected.frequence || '—' },
                { label: 'Objectifs',    value: selected.objectifs || '—' },
                { label: 'Message',      value: selected.message || '—' },
                { label: 'Statut',       value: STATUS_LABELS[selected.status]?.label || selected.status },
                { label: 'Date',         value: new Date(selected.created_at).toLocaleDateString('fr-FR') },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-noir-800 pb-2">
                  <span className="text-noir-400 shrink-0 w-28">{item.label}</span>
                  <span className="text-white text-right">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {selected.status !== 'confirme' && (
                <button onClick={() => handleStatus(selected.id, 'confirme')} className="btn-gold flex items-center gap-1 text-sm flex-1">
                  <CheckCircle size={14} /> Confirmer
                </button>
              )}
              {selected.status !== 'en_attente' && (
                <button onClick={() => handleStatus(selected.id, 'en_attente')} className="btn-outline flex items-center gap-1 text-sm flex-1">
                  <Clock size={14} /> En attente
                </button>
              )}
              {selected.status !== 'refuse' && (
                <button onClick={() => handleStatus(selected.id, 'refuse')} className="btn-outline flex items-center gap-1 text-sm">
                  <XCircle size={14} /> Refuser
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