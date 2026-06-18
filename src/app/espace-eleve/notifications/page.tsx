'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import Link from 'next/link'

interface Notif {
  id: string; type: string; titre: string; message: string | null
  lu: boolean; lien: string | null; created_at: string
}

const TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  note_cours:  { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    icon: <svg width="16" height="16" fill="none" stroke="#fbbf24" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  certificat:  { color: 'text-gold-400 bg-gold-500/10 border-gold-500/20',
    icon: <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  ressource:   { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    icon: <svg width="16" height="16" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  pack:        { color: 'text-green-400 bg-green-500/10 border-green-500/20',
    icon: <svg width="16" height="16" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  travail:     { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    icon: <svg width="16" height="16" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  default:     { color: 'text-noir-400 bg-noir-800 border-noir-700',
    icon: <svg width="16" height="16" fill="none" stroke="#a0a0c0" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'toutes' | 'non_lues'>('non_lues')

  function dispatchNotifUpdate(newCount: number) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notif-count-update', { detail: { count: newCount } }))
    }
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/notifications').then(r => r.json()),
    ]).then(([me, n]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      const notifsList = Array.isArray(n) ? n : []
      setNotifs(notifsList)
      // Les notifications sont marquées comme lues seulement quand l'utilisateur clique dessus
    }).finally(() => setLoading(false))
  }, [router])

  // Dispatcher un événement pour mettre à jour le badge dans EleveNav


  async function markRead(id: string) {
    await fetch('/api/eleve/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, lu: true } : n)
      dispatchNotifUpdate(updated.filter(n => !n.lu).length)
      return updated
    })
  }

  async function markAllRead() {
    const unread = notifs.filter(n => !n.lu)
    await Promise.all(unread.map(n =>
      fetch('/api/eleve/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      })
    ))
    setNotifs(prev => {
      const updated = prev.map(n => ({ ...n, lu: true }))
      dispatchNotifUpdate(0)
      return updated
    })
  }

  async function deleteNotif(id: string) {
    await fetch('/api/eleve/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => {
      const updated = prev.filter(n => n.id !== id)
      dispatchNotifUpdate(updated.filter(n => !n.lu).length)
      return updated
    })
  }

  const nbNonLues = notifs.filter(n => !n.lu).length
  const filtered = filter === 'non_lues' ? notifs.filter(n => !n.lu) : notifs

  return (
    <EleveLayout prenom={prenom} nbNotifs={nbNonLues}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">

        {/* Titre + actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Notifications</h1>
            <p className="text-noir-400 text-sm">
              {nbNonLues > 0 ? `${nbNonLues} non lue${nbNonLues > 1 ? 's' : ''}` : 'Tout est à jour'}
            </p>
          </div>
          {nbNonLues > 0 && (
            <button onClick={markAllRead} className="btn-outline text-sm flex items-center gap-2 px-4 py-2">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1 mb-6 w-fit">
          {([['non_lues', `Non lues${nbNonLues > 0 ? ` (${nbNonLues})` : ''}`], ['toutes', 'Toutes']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === val ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <svg width="40" height="40" fill="none" stroke="#505080" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-4">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p className="text-noir-400 text-lg font-medium">
              {filter === 'non_lues' ? 'Aucune notification non lue' : 'Aucune notification'}
            </p>
            {filter === 'non_lues' && notifs.length > 0 && (
              <button onClick={() => setFilter('toutes')} className="text-gold-400 text-sm mt-2 hover:text-gold-300 transition-colors">
                Voir toutes les notifications →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => {
              const tc = TYPE_ICONS[n.type] || TYPE_ICONS.default
              return (
                <div key={n.id}
                  onClick={() => { if (!n.lu) markRead(n.id) }}
                  className={`card transition-all group cursor-pointer ${!n.lu ? 'border-gold-500/20 bg-gold-500/3' : 'opacity-75 hover:opacity-100'}`}>
                  <div className="flex items-start gap-3">
                    {/* Icône type */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${tc.color}`}>
                      {tc.icon}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold text-sm leading-tight ${!n.lu ? 'text-white' : 'text-noir-300'}`}>
                          {n.titre}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!n.lu && <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
                          {/* Bouton marquer comme lu */}
                          {!n.lu && (
                            <button onClick={() => markRead(n.id)}
                              title="Marquer comme lu"
                              className="text-noir-600 hover:text-gold-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100">
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                          )}
                          {/* Bouton supprimer */}
                          <button onClick={() => deleteNotif(n.id)}
                            title="Supprimer"
                            className="text-noir-600 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100">
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {n.message && (
                        <p className="text-noir-400 text-xs mt-1 leading-relaxed">{n.message}</p>
                      )}

                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        <p className="text-noir-600 text-xs">
                          {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-3">
                          {!n.lu && (
                            <button onClick={() => markRead(n.id)}
                              className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                              Marquer comme lu
                            </button>
                          )}
                          {n.lien && (
                            <Link href={n.lien}
                              onClick={() => { if (!n.lu) markRead(n.id) }}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                              Voir →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}