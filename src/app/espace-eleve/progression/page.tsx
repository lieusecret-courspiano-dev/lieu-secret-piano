'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

interface ProgData { categories: Record<string, { competence: string; validee: boolean; validee_at: string | null }[]>; total: number; validees: number; pourcentage: number }

export default function ProgressionPage() {
  const router = useRouter()
  const [data, setData] = useState<ProgData | null>(null)
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()), fetch('/api/eleve/progression').then(r => r.json())]).then(([me, prog]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom); setData(prog)
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
  const barColor = (data?.pourcentage || 0) > 66 ? '#22c55e' : (data?.pourcentage || 0) > 33 ? '#f59e0b' : '#ef4444'

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-6 md:p-8">
        <h1 className="font-serif text-2xl text-white mb-6 animate-fade-in-up">Ma Progression</h1>
        <div className="card border-gold-500/20 mb-6">
          <div className="flex justify-between items-center mb-3"><div><p className="text-white font-medium">Progression globale</p><p className="text-noir-400 text-sm">{data?.validees || 0} / {data?.total || 0} compétences validées</p></div><span className="text-3xl font-bold" style={{ color: barColor }}>{data?.pourcentage || 0}%</span></div>
          <div className="w-full bg-noir-800 rounded-full h-4 overflow-hidden"><div className="h-4 rounded-full transition-all duration-500" style={{ width: `${data?.pourcentage || 0}%`, backgroundColor: barColor }} /></div>
        </div>
        {data && Object.entries(data.categories).map(([categorie, competences]) => {
          const validees = competences.filter(c => c.validee).length
          const pct = Math.round((validees / competences.length) * 100)
          return (
            <div key={categorie} className="card mb-4">
              <div className="flex items-center justify-between mb-3"><h3 className="text-gold-400 font-medium">{categorie}</h3><span className="text-xs text-noir-400">{validees}/{competences.length}</span></div>
              <div className="w-full bg-noir-800 rounded-full h-1.5 mb-3"><div className="h-1.5 rounded-full bg-gold-500" style={{ width: `${pct}%` }} /></div>
              <div className="space-y-2">{competences.map(comp => (<div key={comp.competence} className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${comp.validee ? 'bg-green-500 border-green-500' : 'border-noir-600'}`}>{comp.validee && <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}</div><span className={`text-sm ${comp.validee ? 'text-white' : 'text-noir-400'}`}>{comp.competence}</span>{comp.validee && comp.validee_at && <span className="text-xs text-noir-600 ml-auto">{new Date(comp.validee_at).toLocaleDateString('fr-FR')}</span>}</div>))}</div>
            </div>
          )
        })}
        {(!data || Object.keys(data.categories).length === 0) && <div className="card text-center py-12"><p className="text-noir-400">Votre progression sera mise à jour par votre professeur après chaque cours.</p></div>}
      </div>
    </EleveLayout>
  )
}
