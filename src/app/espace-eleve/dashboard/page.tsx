'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'
import { DateTime } from 'luxon'

interface DashboardData {
  id: string; prenom: string; nom: string; email: string
  prochain_cours: { slot_start: string; slot_end: string } | null
  pack_actif: { pack_label: string; heures_restantes: number; heures_total: number; code: string } | null
  nb_certificats: number; nb_cours_total: number; cours_passes: number; nb_notifs_non_lues: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [nbMedias, setNbMedias] = useState(0)
  const [nbRessources, setNbRessources] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/eleve/me').then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() }).then(d => { if (d) setData(d) }).finally(() => setLoading(false))
    fetch('/api/partitions').then(r => r.json()).then(d => setNbMedias(Array.isArray(d) ? d.length : 0)).catch(() => {})
    fetch('/api/eleve/ressources').then(r => r.json()).then(d => setNbRessources(Array.isArray(d) ? d.length : 0)).catch(() => {})
  }, [router])

  if (loading) return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!data) return null

  const tz = 'Europe/Paris'
  const prochainCours = data.prochain_cours ? DateTime.fromISO(data.prochain_cours.slot_start, { zone: 'utc' }).setZone(tz) : null
  const packPct = data.pack_actif ? Math.round((data.pack_actif.heures_restantes / data.pack_actif.heures_total) * 100) : 0

  return (
    <EleveLayout prenom={data.prenom} nbNotifs={data.nb_notifs_non_lues} nbMedias={nbMedias} nbRessources={nbRessources}>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-white mb-1">Bonjour, {data.prenom} !</h1>
          <p className="text-noir-400">Bienvenue dans votre espace élève Lieu Secret</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="card border-gold-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            <div className="flex items-start justify-between mb-3">
              <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span className="text-xs text-noir-500 uppercase tracking-wider">Prochain cours</span>
            </div>
            {prochainCours ? (<><p className="text-white font-medium capitalize">{prochainCours.setLocale('fr').toFormat('EEEE d MMMM')}</p><p className="text-gold-400 text-lg font-bold">{prochainCours.toFormat('HH:mm')}</p><Link href="/espace-eleve/reservations" className="text-xs text-noir-400 hover:text-gold-400 mt-2 inline-block">Voir mes réservations →</Link></>) : (<><p className="text-noir-400 text-sm">Aucun cours à venir</p><Link href="/espace-eleve/reserver" className="btn-gold text-xs px-3 py-1.5 mt-3 inline-block">Réserver un cours</Link></>)}
          </div>
          <div className="card border-gold-500/20">
            <div className="flex items-start justify-between mb-3">
              <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <span className="text-xs text-noir-500 uppercase tracking-wider">Mon pack</span>
            </div>
            {data.pack_actif ? (<><p className="text-white font-medium">{data.pack_actif.pack_label}</p><div className="flex items-end gap-1 mt-1"><span className="text-3xl font-bold text-gold-400">{data.pack_actif.heures_restantes}</span><span className="text-noir-400 text-sm mb-1">h restantes</span></div><div className="w-full bg-noir-800 rounded-full h-2 mt-2"><div className="h-2 rounded-full bg-gold-500 transition-all" style={{ width: `${packPct}%` }} /></div><Link href="/espace-eleve/pack" className="text-xs text-noir-400 hover:text-gold-400 mt-2 inline-block">Voir mon pack →</Link></>) : (<><p className="text-noir-400 text-sm">Aucun pack actif</p><Link href="/espace-eleve/acheter-pack" className="btn-gold text-xs px-3 py-1.5 mt-3 inline-block">Acheter un pack</Link></>)}
          </div>
          <div className="card border-gold-500/20">
            <div className="flex items-start justify-between mb-3">
              <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <span className="text-xs text-noir-500 uppercase tracking-wider">Statistiques</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-noir-400 text-sm">Cours suivis</span><span className="text-white font-bold">{data.cours_passes}</span></div>
              <div className="flex justify-between items-center"><span className="text-noir-400 text-sm">Temps de formation</span><span className="text-white font-bold">{data.cours_passes}h</span></div>
              <div className="flex justify-between items-center"><span className="text-noir-400 text-sm">Certificats</span><span className="text-gold-400 font-bold">{data.nb_certificats}</span></div>
            </div>
          </div>
        </div>
        <h2 className="font-serif text-xl text-white mb-4">Accès rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/espace-eleve/progression', icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, label: 'Ma progression' },
            { href: '/espace-eleve/ressources',  icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, label: 'Mes ressources' },
            { href: '/espace-eleve/notes',       icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: 'Notes de cours' },
            { href: '/espace-eleve/certificats', icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>, label: 'Certificats' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="card hover:border-gold-500/40 transition-all text-center py-4 cursor-pointer">
              <div className="text-gold-400 mb-2 flex justify-center">{item.icon}</div>
              <p className="text-sm text-noir-300">{item.label}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 card border-dashed border-gold-500/20 text-center py-6">
          <p className="text-noir-400 text-sm mb-3">Prêt pour votre prochain cours ?</p>
          <Link href="/espace-eleve/reserver" className="btn-gold px-8">Réserver un cours</Link>
        </div>
        <div className="mt-6 text-center">
          <button onClick={async () => { if (!confirm('Supprimer définitivement votre compte ?')) return; await fetch('/api/eleve/delete-account', { method: 'DELETE' }); router.push('/espace-eleve/login') }} className="text-xs text-noir-600 hover:text-red-400 transition-colors">Supprimer mon compte</button>
        </div>
      </div>
    </EleveLayout>
  )
}
