'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'

interface Certificat {
  id: string
  nom_certificat: string
  niveau: string | null
  date_obtention: string
  numero: string | null
  commentaire: string | null
  pdf_url: string | null
  created_at: string
}

const NIVEAU_COLORS: Record<string, { color: string; bg: string; emoji: string }> = {
  fondamentaux: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', emoji: '' },
  comprehension: { color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20', emoji: '' },
  expression: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', emoji: '' },
  diplome: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', emoji: '' },
}

function getNiveauConfig(niveau: string | null) {
  if (!niveau) return { color: 'text-noir-400', bg: 'bg-noir-800 border-noir-700', emoji: '' }
  const key = Object.keys(NIVEAU_COLORS).find(k => niveau.toLowerCase().includes(k))
  return key ? NIVEAU_COLORS[key] : { color: 'text-noir-400', bg: 'bg-noir-800 border-noir-700', emoji: '' }
}

export default function CertificatsPage() {
  const router = useRouter()
  const [certificats, setCertificats] = useState<Certificat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/eleve/certificats')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setCertificats(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-48" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif text-white mb-1">Mes certificats</h1>
          <p className="text-noir-400 text-sm">{certificats.length} certificat{certificats.length > 1 ? 's' : ''} obtenu{certificats.length > 1 ? 's' : ''}</p>
        </div>

        {certificats.length === 0 ? (
          <EmptyState
            icon={<svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>}
            title="Aucun certificat pour le moment"
            description="Vos certificats apparaîtront ici une fois validés par votre professeur"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificats.map(cert => {
              const cfg = getNiveauConfig(cert.niveau)
              return (
                <div key={cert.id} className={`card border ${cfg.bg} relative overflow-hidden`}>
                  {/* Décoration */}
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                    <svg viewBox="0 0 100 100" fill="currentColor" className={cfg.color}>
                      <circle cx="50" cy="50" r="40"/>
                    </svg>
                  </div>

                  <div className="relative">
                    {/* Badge niveau */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${cfg.bg}`}>
                        {cfg.emoji}
                      </div>
                      {cert.numero && (
                        <span className="text-xs text-noir-600 font-mono bg-noir-800 px-2 py-1 rounded-lg">
                          {cert.numero}
                        </span>
                      )}
                    </div>

                    {/* Infos */}
                    <h3 className="text-white font-bold text-base mb-1">{cert.nom_certificat}</h3>
                    {cert.niveau && (
                      <p className={`text-sm font-medium mb-2 ${cfg.color}`}>{cert.niveau}</p>
                    )}
                    <p className="text-noir-400 text-xs">
                      Obtenu le {new Date(cert.date_obtention).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {cert.commentaire && (
                      <p className="text-noir-500 text-xs mt-2 italic">{cert.commentaire}</p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      {/* Bouton téléchargement — toujours présent */}
                      <a
                        href={cert.pdf_url || `/api/eleve/certificats/${cert.id}/pdf`}
                        download={`Certificat-${(cert.nom_certificat || 'Lieu-Secret').replace(/\s+/g, '-')}-${cert.numero || ''}.pdf`}
                        className="btn-gold text-xs px-4 py-2 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Enregistrer le certificat
                      </a>
                      {/* Bouton aperçu */}
                      <a
                        href={cert.pdf_url || `/api/eleve/certificats/${cert.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline text-xs px-4 py-2 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Aperçu
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Message encouragement */}
        {certificats.length > 0 && certificats.length < 3 && (
          <div className="mt-6 card text-center py-6 border-gold-500/20 bg-gold-500/5">
            <p className="text-gold-400 font-medium text-sm">
              {3 - certificats.length} certificat{3 - certificats.length > 1 ? 's' : ''} restant{3 - certificats.length > 1 ? 's' : ''} pour le diplôme final !
            </p>
            <p className="text-noir-400 text-xs mt-1">Continuez votre progression pour obtenir tous les certificats</p>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}