'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'
import MediaPlayer from '@/components/eleve/MediaPlayer'

interface Travail {
  id: string
  titre: string
  description: string | null
  fichier_url: string | null
  echeance: string | null
  created_at: string
  termine: boolean
}

function daysLeft(echeance: string): { text: string; color: string } {
  const diff = Math.ceil((new Date(echeance).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { text: `${Math.abs(diff)}j de retard`, color: 'text-red-400' }
  if (diff === 0) return { text: "Aujourd'hui !", color: 'text-red-400' }
  if (diff <= 3) return { text: `${diff}j restants`, color: 'text-orange-400' }
  return { text: `${diff}j restants`, color: 'text-noir-500' }
}

export default function TravauxPage() {
  const router = useRouter()
  const [travaux, setTravaux] = useState<Travail[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'tous' | 'en_cours' | 'termines'>('en_cours')

  useEffect(() => {
    fetch('/api/eleve/travaux')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setTravaux(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  async function toggleTermine(id: string, termine: boolean) {
    const res = await fetch('/api/eleve/travaux', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, termine: !termine }),
    })
    if (res.ok) {
      setTravaux(prev => prev.map(t => t.id === id ? { ...t, termine: !termine } : t))
    }
  }

  const enCours = travaux.filter(t => !t.termine)
  const termines = travaux.filter(t => t.termine)
  const filtered = filter === 'tous' ? travaux : filter === 'en_cours' ? enCours : termines

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 space-y-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-4 md:p-8 pb-24 md:pb-4 md:pb-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-serif text-white mb-1">Travail à faire</h1>
          <p className="text-noir-400 text-sm">{enCours.length} en cours · {termines.length} terminé{termines.length > 1 ? 's' : ''}</p>
        </div>

        {/* Stats */}
        {travaux.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-noir-400 text-xs">Progression</p>
              <p className="text-white text-xs font-bold">{termines.length}/{travaux.length}</p>
            </div>
            <div className="h-2 bg-noir-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${travaux.length > 0 ? (termines.length / travaux.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'en_cours', label: `En cours (${enCours.length})` },
            { key: 'termines', label: `Terminés (${termines.length})` },
            { key: 'tous', label: 'Tous' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f.key ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            title={filter === 'en_cours' ? 'Tout est fait !' : 'Aucun travail'}
            description={filter === 'en_cours' ? 'Bravo, vous êtes à jour !' : 'Votre professeur ajoutera des exercices ici'}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(t => {
              const dl = t.echeance ? daysLeft(t.echeance) : null
              return (
                <div key={t.id} className={`card transition-all ${t.termine ? 'opacity-60' : 'hover:border-gold-500/20'}`}>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button onClick={() => toggleTermine(t.id, t.termine)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        t.termine
                          ? 'bg-green-500 border-green-500'
                          : 'border-noir-600 hover:border-gold-500'
                      }`}>
                      {t.termine && (
                        <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${t.termine ? 'text-noir-500 line-through' : 'text-white'}`}>
                        {t.titre}
                      </p>
                      {t.description && (
                        <p className="text-noir-500 text-xs mt-0.5">{t.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {t.echeance && dl && (
                          <span className={`text-xs flex items-center gap-1 ${dl.color}`}>
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {dl.text}
                          </span>
                        )}
                        {t.fichier_url && (
                          <div className="w-full mt-2">
                            <MediaPlayer url={t.fichier_url} titre={t.titre} compact />
                          </div>
                        )}
                        <span className="text-noir-700 text-xs">
                          Ajouté le {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
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