'use client'
import { useState, useEffect } from 'react'
import { Search, Users, TrendingUp, Star, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: string
  nom: string
  email: string
  telephone: string | null
  est_eleve: boolean
  eleve_id: string | null
  is_active: boolean
  nb_factures: number
  ca_total: number
  derniere_facture: string | null
  sources: string[]
  created_at: string
}

interface Stats {
  total_clients: number
  total_eleves: number
  ca_total: number
  nb_factures: number
}

const SOURCE_LABELS: Record<string, string> = {
  pack: 'Pack', cours: 'Cours', evenement: 'Événement',
  cadeau: 'Cadeau', support: 'Support', ressource: 'Ressource',
  location: 'Location', manuel: 'Manuel', import: 'Import',
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<'tous' | 'eleves' | 'autres'>('tous')

  useEffect(() => {
    const timer = setTimeout(() => loadClients(), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/comptabilite/clients?${params}`, { credentials: 'include' })
    const data = await res.json()
    setClients(data.clients || [])
    setStats(data.stats || null)
    setLoading(false)
  }

  const filtered = clients.filter(c => {
    if (filtre === 'eleves') return c.est_eleve
    if (filtre === 'autres') return !c.est_eleve
    return true
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Clients</h1>
        <p className="text-noir-400 text-sm mt-1">
          Liste consolidée depuis les espaces élèves et les factures
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total clients', value: stats.total_clients, color: 'text-white', icon: <Users size={16} className="text-gold-400" /> },
            { label: 'Élèves inscrits', value: stats.total_eleves, color: 'text-blue-400', icon: <UserCheck size={16} className="text-blue-400" /> },
            { label: 'CA total', value: fmt(stats.ca_total), color: 'text-gold-400', icon: <TrendingUp size={16} className="text-gold-400" /> },
            { label: 'Nb factures', value: stats.nb_factures, color: 'text-green-400', icon: <Star size={16} className="text-green-400" /> },
          ].map((s, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-noir-500 text-xs uppercase tracking-wider">{s.label}</span>
                {s.icon}
              </div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input w-full pl-9 text-sm" placeholder="Rechercher par nom ou email..." />
          </div>
          <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1">
            {[
              { v: 'tous' as const, l: 'Tous' },
              { v: 'eleves' as const, l: 'Élèves' },
              { v: 'autres' as const, l: 'Autres' },
            ].map(f => (
              <button key={f.v} onClick={() => setFiltre(f.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filtre === f.v ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={40} className="text-noir-700 mx-auto mb-4" />
          <p className="text-noir-400">Aucun client trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="card flex items-center justify-between gap-4 flex-wrap hover:border-noir-700 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                  c.est_eleve ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-noir-800 border border-noir-700 text-noir-400'
                }`}>
                  {c.nom.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-white font-medium text-sm">{c.nom}</span>
                    {c.est_eleve && (
                      <span className="text-xs px-2 py-0.5 rounded-full border text-blue-400 border-blue-500/30 bg-blue-500/10">
                        Élève {c.is_active ? '✓' : ''}
                      </span>
                    )}
                    {c.sources.length > 0 && c.sources.slice(0, 3).map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-noir-800 text-noir-500">
                        {SOURCE_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                  <p className="text-noir-400 text-xs">{c.email}</p>
                  {c.telephone && <p className="text-noir-600 text-xs">{c.telephone}</p>}
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-gold-400 font-bold">{fmt(c.ca_total)}</p>
                  <p className="text-noir-600 text-xs">{c.nb_factures} facture{c.nb_factures > 1 ? 's' : ''}</p>
                </div>
                {c.derniere_facture && (
                  <div className="text-center hidden sm:block">
                    <p className="text-noir-300 text-xs">Dernière facture</p>
                    <p className="text-noir-400 text-xs">{fDate(c.derniere_facture)}</p>
                  </div>
                )}
                <div className="flex gap-1">
                  {c.eleve_id && (
                    <Link href={`/admin/eleves/${c.eleve_id}`}
                      className="text-xs px-2 py-1 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors">
                      Fiche élève
                    </Link>
                  )}
                  <Link href={`/admin/comptabilite/factures?search=${encodeURIComponent(c.email)}`}
                    className="text-xs px-2 py-1 rounded-lg border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors">
                    Factures
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}