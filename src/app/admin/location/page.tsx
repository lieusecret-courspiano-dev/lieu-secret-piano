'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Eye, CheckCircle, Clock, Truck, XCircle, AlertTriangle, FileText } from 'lucide-react'

interface Reservation {
  id: string
  article_nom: string
  locataire_nom: string
  locataire_email: string
  locataire_telephone: string | null
  date_debut: string
  date_fin: string
  duree_type: string
  nb_jours: number | null
  mode_remise: string
  montant_total: number
  est_acompte: boolean
  montant_acompte: number | null
  moyen_paiement: string | null
  paiement_statut: string
  contrat_signe: boolean
  statut: string
  created_at: string
}

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'validee', label: 'Validée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'annulee', label: 'Annulée' },
  { value: 'litige', label: 'Litige' },
]

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    en_attente: { label: 'En attente',  className: 'text-amber-400 border-amber-500/30 bg-amber-500/10',  icon: <Clock size={11} /> },
    validee:    { label: 'Validée',     className: 'text-blue-400 border-blue-500/30 bg-blue-500/10',     icon: <CheckCircle size={11} /> },
    en_cours:   { label: 'En cours',    className: 'text-green-400 border-green-500/30 bg-green-500/10',  icon: <Truck size={11} /> },
    terminee:   { label: 'Terminée',    className: 'text-noir-400 border-noir-700 bg-noir-800',           icon: <CheckCircle size={11} /> },
    annulee:    { label: 'Annulée',     className: 'text-red-400 border-red-500/30 bg-red-500/10',        icon: <XCircle size={11} /> },
    litige:     { label: 'Litige',      className: 'text-orange-400 border-orange-500/30 bg-orange-500/10', icon: <AlertTriangle size={11} /> },
  }
  const s = map[statut] || { label: statut, className: 'text-noir-400 border-noir-700', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${s.className}`}>
      {s.icon} {s.label}
    </span>
  )
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function dureeLabel(type: string, nb: number | null) {
  const map: Record<string, string> = {
    jours: `${nb ?? '?'} jour${(nb ?? 0) > 1 ? 's' : ''}`,
    weekend: 'Week-end',
    semaine: 'Semaine',
    mois: 'Mois',
    libre: `${nb ?? '?'} jour${(nb ?? 0) > 1 ? 's' : ''} (libre)`,
  }
  return map[type] || type
}

export default function AdminLocationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { loadReservations() }, [])

  async function loadReservations() {
    setLoading(true)
    const data = await fetch('/api/admin/location').then(r => r.json()).catch(() => [])
    setReservations(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const filtered = reservations.filter(r => {
    const matchStatut = !filtreStatut || r.statut === filtreStatut
    const q = search.toLowerCase()
    const matchSearch = !q || r.locataire_nom.toLowerCase().includes(q)
      || r.locataire_email.toLowerCase().includes(q)
      || r.article_nom.toLowerCase().includes(q)
    return matchStatut && matchSearch
  })

  // Compteurs par statut
  const counts = reservations.reduce((acc, r) => {
    acc[r.statut] = (acc[r.statut] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Réservations de location</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez les demandes de location de matériel musical</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/location/catalogue" className="btn-outline text-sm flex items-center gap-2">
            <Package size={14} /> Catalogue
          </Link>
          <Link href="/admin/location/livraison" className="btn-outline text-sm flex items-center gap-2">
            <Truck size={14} /> Zones livraison
          </Link>
        </div>
      </div>

      {/* Compteurs rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'En attente',  key: 'en_attente', color: 'text-amber-400' },
          { label: 'Validées',    key: 'validee',    color: 'text-blue-400'  },
          { label: 'En cours',    key: 'en_cours',   color: 'text-green-400' },
          { label: 'Total',       key: '',           color: 'text-gold-400'  },
        ].map(s => (
          <div key={s.key} className="card text-center cursor-pointer hover:border-gold-500/30 transition-colors"
            onClick={() => setFiltreStatut(s.key)}>
            <div className={`text-2xl font-bold ${s.color} mb-1`}>
              {s.key ? (counts[s.key] || 0) : reservations.length}
            </div>
            <div className="text-noir-500 text-xs uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input flex-1 text-sm"
            placeholder="Rechercher par nom, email ou article..."
          />
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} className="input sm:w-48 text-sm">
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={40} className="text-noir-700 mx-auto mb-4" />
          <p className="text-noir-400 text-lg mb-2">
            {reservations.length === 0 ? 'Aucune réservation pour le moment' : 'Aucun résultat'}
          </p>
          {reservations.length === 0 && (
            <p className="text-noir-600 text-sm">Les demandes de location apparaîtront ici.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="card flex items-start justify-between gap-4 flex-wrap hover:border-noir-700 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatutBadge statut={r.statut} />
                  {r.contrat_signe && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border text-green-400 border-green-500/30 bg-green-500/10">
                      <FileText size={11} /> Contrat signé
                    </span>
                  )}
                  {!r.contrat_signe && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border text-noir-500 border-noir-700">
                      <FileText size={11} /> Contrat en attente
                    </span>
                  )}
                  <span className="text-xs text-noir-600">{fDate(r.created_at)}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <div>
                    <span className="text-noir-500 text-xs">Article : </span>
                    <span className="text-white text-sm font-medium">{r.article_nom}</span>
                  </div>
                  <div>
                    <span className="text-noir-500 text-xs">Locataire : </span>
                    <span className="text-white text-sm">{r.locataire_nom}</span>
                  </div>
                  <div>
                    <span className="text-noir-500 text-xs">Email : </span>
                    <span className="text-noir-300 text-sm">{r.locataire_email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs">
                  <span className="text-noir-500">
                    Période : <span className="text-noir-300">{fDate(r.date_debut)} → {fDate(r.date_fin)}</span>
                    {' '}(<span className="text-gold-400">{dureeLabel(r.duree_type, r.nb_jours)}</span>)
                  </span>
                  <span className="text-noir-500">
                    Remise : <span className="text-noir-300">{r.mode_remise === 'livraison' ? '🚗 Livraison' : '📍 Retrait'}</span>
                  </span>
                  <span className="text-noir-500">
                    Paiement : <span className={`font-medium ${
                      r.paiement_statut === 'complet' ? 'text-green-400'
                      : r.paiement_statut === 'partiel' ? 'text-amber-400'
                      : 'text-red-400'
                    }`}>
                      {r.paiement_statut === 'complet' ? 'Complet' : r.paiement_statut === 'partiel' ? 'Acompte reçu' : 'En attente'}
                    </span>
                    {' — '}
                    <span className="text-white font-semibold">{fmt(r.montant_total)}</span>
                    {r.est_acompte && r.montant_acompte && (
                      <span className="text-noir-500"> (acompte : {fmt(r.montant_acompte)})</span>
                    )}
                  </span>
                </div>
              </div>

              <Link href={`/admin/location/${r.id}`}
                className="btn-outline text-xs flex items-center gap-1.5 shrink-0 py-1.5 px-3">
                <Eye size={13} /> Voir
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}