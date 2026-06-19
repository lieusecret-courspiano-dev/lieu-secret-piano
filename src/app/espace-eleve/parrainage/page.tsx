'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'

interface ParrainageData {
  code: string
  nb_filleuls: number
  credits_gagnes: number
  filleuls: { filleul_email: string; status: string; created_at: string }[]
}

export default function ParrainagePage() {
  const router = useRouter()
  const [data, setData] = useState<ParrainageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/parrainage')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (d && !d.error) setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  function copyCode() {
    if (!data?.code) return
    navigator.clipboard.writeText(data.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = `https://www.lieusecret-courspiano.fr/inscription?ref=${data?.code}`

  if (loading) return <EleveLayout><div className="p-4 md:p-6 space-y-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-32" />)}</div></EleveLayout>

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-serif text-white mb-1">Parrainage</h1>
          <p className="text-noir-400 text-sm">Invitez vos amis et gagnez des heures de cours</p>
        </div>

        {/* Comment ça marche */}
        <div className="card mb-6">
          <h2 className="text-white font-semibold text-sm mb-4">Comment ça marche ?</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: '1', icon: '🔗', text: 'Partagez votre code' },
              { step: '2', icon: '👤', text: 'Votre ami s\'inscrit' },
              { step: '3', icon: '🎁', text: 'Vous gagnez 1h offerte' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-2 text-xl">
                  {s.icon}
                </div>
                <p className="text-xs text-noir-400">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Code parrainage */}
        {data?.code ? (
          <>
            <div className="card mb-4 border-gold-500/20 bg-gold-500/5">
              <p className="text-noir-400 text-xs mb-2 uppercase tracking-wider">Votre code</p>
              <div className="flex items-center gap-3">
                <p className="text-white font-mono text-2xl font-bold flex-1">{data.code}</p>
                <button onClick={copyCode}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    copied ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'border-gold-500/30 text-gold-400 hover:bg-gold-500/10'
                  }`}>
                  {copied ? '✓ Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card text-center py-4">
                <p className="text-3xl font-bold text-white">{data.nb_filleuls}</p>
                <p className="text-xs text-noir-400 mt-1">Filleul{data.nb_filleuls > 1 ? 's' : ''}</p>
              </div>
              <div className="card text-center py-4">
                <p className="text-3xl font-bold text-gold-400">{data.credits_gagnes}h</p>
                <p className="text-xs text-noir-400 mt-1">Crédit{data.credits_gagnes > 1 ? 's' : ''} gagné{data.credits_gagnes > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Partager */}
            <div className="card mb-6">
              <p className="text-white font-semibold text-sm mb-3">Partager</p>
              <div className="flex gap-2 flex-wrap">
                <a href={`https://wa.me/?text=Rejoins%20Lieu%20Secret%20Piano%20avec%20mon%20code%20${data.code}%20!%20${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-4 py-2 rounded-xl hover:bg-green-500/20 transition-all">
                  WhatsApp
                </a>
                <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="flex items-center gap-2 bg-noir-800 border border-noir-700 text-noir-300 text-xs px-4 py-2 rounded-xl hover:border-noir-600 transition-all">
                  Copier le lien
                </button>
              </div>
            </div>

            {/* Filleuls */}
            {data.filleuls && data.filleuls.length > 0 && (
              <div className="card">
                <p className="text-white font-semibold text-sm mb-3">Mes filleuls</p>
                <div className="space-y-2">
                  {data.filleuls.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-noir-800 last:border-0">
                      <p className="text-noir-300 text-sm">{f.filleul_email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        f.status === 'validated' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                      }`}>
                        {f.status === 'validated' ? 'Validé' : 'En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">🎁</p>
            <p className="text-white font-medium">Parrainage non disponible</p>
            <p className="text-noir-400 text-sm mt-1">Contactez votre professeur pour activer le parrainage</p>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}