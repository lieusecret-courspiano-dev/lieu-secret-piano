'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'

interface Notif {
  id: string
  type: string
  titre: string
  message: string | null
  lien: string | null
  lu: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  badge:      { icon: '🏅', color: 'text-gold-400',   bg: 'bg-gold-500/10 border-gold-500/20' },
  certificat: { icon: '🎓', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  media:      { icon: '🎙️', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  message:    { icon: '💬', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  travail:    { icon: '📋', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  info:       { icon: 'ℹ️', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'toutes' | 'non_lues'>('toutes')

  useEffect(() => {
    fetch('/api/eleve/notifications')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setNotifs(d.sort((a: Notif, b: Notif) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  async function markAsRead(id: string) {
    await fetch('/api/eleve/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
    window.dispatchEvent(new CustomEvent('notif-count-update', {
      detail: { count: notifs.filter(n => !n.lu && n.id !== id).length }
    }))
  }

  async function markAllAsRead() {
    await fetch('/api/eleve/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
    window.dispatchEvent(new CustomEvent('notif-count-update', { detail: { count: 0 } }))
  }

  async function deleteNotif(id: string) {
    await fetch('/api/eleve/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const nonLues = notifs.filter(n => !n.lu).length
  const filtered = filter === 'non_lues' ? notifs.filter(n => !n.lu) : notifs

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-3">
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} className="h-20" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-white">Notifications</h1>
            {nonLues > 0 && (
              <p className="text-noir-400 text-sm mt-0.5">{nonLues} non lue{nonLues > 1 ? 's' : ''}</p>
            )}
          </div>
          {nonLues > 0 && (
            <button onClick={markAllAsRead}
              className="text-xs text-gold-400 hover:text-gold-300 border border-gold-500/30 px-3 py-1.5 rounded-lg transition-colors">
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'toutes', label: `Toutes (${notifs.length})` },
            { key: 'non_lues', label: `Non lues (${nonLues})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f.key
                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                  : 'border-noir-700 text-noir-400 hover:border-noir-600'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
            title={filter === 'non_lues' ? 'Tout est lu !' : 'Aucune notification'}
            description={filter === 'non_lues' ? 'Vous êtes à jour.' : 'Vos notifications apparaîtront ici.'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
              return (
                <div key={n.id}
                  className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                    n.lu ? 'bg-noir-900/50 border-noir-800' : `${cfg.bg} border`
                  }`}>
                  {/* Indicateur non lu */}
                  {!n.lu && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gold-400" />
                  )}

                  {/* Icône */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    n.lu ? 'bg-noir-800' : cfg.bg
                  }`}>
                    {cfg.icon}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-sm font-medium ${n.lu ? 'text-noir-300' : 'text-white'}`}>{n.titre}</p>
                    {n.message && (
                      <p className="text-noir-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-noir-600 text-xs">{timeAgo(n.created_at)}</span>
                      {!n.lu && (
                        <button onClick={() => markAsRead(n.id)}
                          className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                          Marquer comme lu
                        </button>
                      )}
                      {n.lien && (
                        <a href={n.lien} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          Voir →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Supprimer */}
                  <button onClick={() => deleteNotif(n.id)}
                    className="absolute top-3 right-3 text-noir-700 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}