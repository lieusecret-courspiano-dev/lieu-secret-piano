'use client'
import SubNav from '@/components/eleve/SubNav'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { ProgressBar } from '@/components/eleve/ProgressBar'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'

interface ProgStats {
  total: number
  validees: number
  pourcentage: number
  statsParCategorie: Record<string, { total: number; validees: number; pourcentage: number; certificat: boolean }>
  categories: Record<string, { competence: string; validee: boolean; validee_at: string | null }[]>
}

const CAT_COLORS: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  'Fondamentaux': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', bar: '#3b82f6' },
  'Compréhension et autonomie': { bg: 'bg-gold-500/10', border: 'border-gold-500/20', text: 'text-gold-400', bar: '#f59e0b' },
  'Expression et maîtrise': { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', bar: '#22c55e' },
}
const DEFAULT_COLOR = { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', bar: '#a78bfa' }

export default function ProgressionPage() {
  const router = useRouter()
  const [prog, setProg] = useState<ProgStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/eleve/progression')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (d) setProg(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-32" />)}
      </div>
    </EleveLayout>
  )

  if (!prog) return null

  const categories = Object.entries(prog.statsParCategorie)

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <h1 className="text-2xl font-serif text-white">Progression & Badges</h1>
        <SubNav items={[{href:'/espace-eleve/progression',label:'Progression'},{href:'/espace-eleve/objectifs',label:'Objectifs'},{href:'/espace-eleve/badges',label:'Badges'},{href:'/espace-eleve/historique',label:'Parcours'}]} />
          <div className="flex gap-2">
            <a href="/espace-eleve/objectifs" className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
              Objectifs
            </a>
            <a href="/espace-eleve/badges" className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
              Badges
            </a>
            <a href="/espace-eleve/historique" className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/></svg>
              Parcours
            </a>
          </div>
        </div>
          <p className="text-noir-400 text-sm">{prog.validees} / {prog.total} compétences validées</p>
        </div>

        {/* Score global */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl md:text-5xl font-bold text-white">{prog.pourcentage}<span className="text-2xl text-noir-400">%</span></p>
              <p className="text-noir-400 text-sm mt-1">Progression globale</p>
            </div>
            <div className="w-20 h-20 md:w-24 md:h-24 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a1a2e" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3"
                  strokeDasharray={`${prog.pourcentage} ${100 - prog.pourcentage}`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gold-400 font-bold text-sm">{prog.pourcentage}%</span>
              </div>
            </div>
          </div>
          <ProgressBar value={prog.pourcentage} color="#f59e0b" height={8} animated />
        </div>

        {/* Catégories */}
        <div className="space-y-4 mb-6">
          {categories.map(([cat, stats]) => {
            const colors = CAT_COLORS[cat] || DEFAULT_COLOR
            const isSelected = selectedCat === cat
            const comps = prog.categories?.[cat] || []

            return (
              <div key={cat} className={`card border ${colors.border} ${colors.bg} transition-all`}>
                <button onClick={() => setSelectedCat(isSelected ? null : cat)} className="w-full text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: colors.bar }} />
                      <h3 className={`font-semibold text-sm ${colors.text}`}>{cat}</h3>
                      {stats.certificat && (
                        <span className="text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30 px-2 py-0.5 rounded-full">
                          Certificat obtenu
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-sm">{stats.validees}/{stats.total}</span>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                        className={`text-noir-500 transition-transform ${isSelected ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                  <ProgressBar value={stats.validees} max={stats.total} color={colors.bar} height={6} animated />
                  <p className="text-noir-500 text-xs mt-2">{stats.pourcentage}% complété</p>
                </button>

                {isSelected && comps.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-noir-800/50 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {comps.map((c, i) => (
                      <div key={i} className="flex items-center gap-2.5 bg-noir-900/50 rounded-xl px-3 py-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          c.validee ? 'bg-green-500/20 border border-green-500/40' : 'bg-noir-800 border border-noir-700'
                        }`}>
                          {c.validee
                            ? <svg width="10" height="10" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                            : <div className="w-2 h-2 rounded-full bg-noir-600" />
                          }
                        </div>
                        <span className={`text-xs ${c.validee ? 'text-white' : 'text-noir-500'}`}>{c.competence}</span>
                        {c.validee && c.validee_at && (
                          <span className="text-noir-600 text-xs ml-auto shrink-0">
                            {new Date(c.validee_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Message encouragement */}
        <div className="card text-center py-8 border-gold-500/20 bg-gold-500/5">
          
          <p className="text-white font-medium text-sm">
            {prog.pourcentage >= 100 ? 'Formation complète ! Félicitations !' :
             prog.pourcentage >= 66 ? 'Excellent travail, continuez !' :
             prog.pourcentage >= 33 ? 'Bonne progression, ne lâchez pas !' :
             'Chaque compétence validée est une victoire !'}
          </p>
          <p className="text-noir-400 text-xs mt-1">
            {prog.total - prog.validees} compétence{prog.total - prog.validees > 1 ? 's' : ''} restante{prog.total - prog.validees > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </EleveLayout>
  )
}