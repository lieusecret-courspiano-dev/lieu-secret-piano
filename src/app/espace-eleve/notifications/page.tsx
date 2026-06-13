'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'

interface Notif { id: string; type: string; titre: string; message: string | null; lu: boolean; lien: string | null; created_at: string }

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()), fetch('/api/eleve/notifications').then(r => r.json())]).then(([me, n]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom); setNotifs(Array.isArray(n) ? n : [])
    }).finally(() => setLoading(false))
  }, [router])

  async function markRead(id: string) {
    await fetch('/api/eleve/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  if (loading) return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <EleveLayout prenom={prenom} nbNotifs={notifs.filter(n => !n.lu).length}>
      <div className="p-6 md:p-8">
        <h1 className="font-serif text-2xl text-white mb-6">Notifications</h1>
        {notifs.length === 0 ? <div className="card text-center py-12"><p className="text-noir-400">Aucune notification pour le moment.</p></div> : (
          <div className="space-y-3">{notifs.map(n => (<div key={n.id} onClick={() => !n.lu && markRead(n.id)} className={`card cursor-pointer transition-all ${!n.lu ? 'border-gold-500/30 bg-gold-500/5' : 'opacity-70'}`}><div className="flex items-start gap-3"><div className="flex-1"><div className="flex items-center justify-between"><p className={`font-medium text-sm ${!n.lu ? 'text-white' : 'text-noir-300'}`}>{n.titre}</p>{!n.lu && <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />}</div>{n.message && <p className="text-noir-400 text-xs mt-1">{n.message}</p>}<div className="flex items-center justify-between mt-2"><p className="text-noir-600 text-xs">{new Date(n.created_at).toLocaleDateString('fr-FR')}</p>{n.lien && <Link href={n.lien} className="text-gold-400 text-xs hover:text-gold-300">Voir →</Link>}</div></div></div></div>))}</div>
        )}
      </div>
    </EleveLayout>
  )
}
