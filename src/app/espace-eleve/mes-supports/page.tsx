'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { FileText, Video, Music, Link as LinkIcon, ExternalLink, Download, BookOpen, CheckCircle, ChevronLeft, Play, Lock, ShoppingCart } from 'lucide-react'

interface Support {
  id: string
  titre: string
  description: string | null
  niveau: string
  type: string
  fichier_url: string | null
  fichier_nom: string | null
  apercu_url: string | null
  est_gratuit: boolean
  prix: number
  nb_pages: number | null
  progression?: { page_actuelle: number; statut: string }
}

const NIVEAU_LABELS: Record<string, string> = {
  fondamentaux: 'Fondamentaux',
  comprehension: 'Compréhension',
  expression: 'Expression',
  tous: 'Tous niveaux',
}

function SupportViewer({ support, onClose }: { support: Support; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false)

  function handleDownload() {
    if (!support.fichier_url) return
    setDownloading(true)
    const a = document.createElement('a')
    a.href = support.fichier_url
    a.download = support.fichier_nom || support.titre
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setDownloading(false), 1500)
  }

  const isPdf = support.type === 'pdf'
  const isVideo = support.type === 'video'
  const isAudio = support.type === 'audio'
  const isLien = support.type === 'lien'

  return (
    <div className="fixed inset-0 z-50 bg-noir-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-noir-800 bg-noir-900 shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 text-noir-400 hover:text-white transition-colors text-sm">
          <ChevronLeft size={18} /> Retour
        </button>
        <div className="flex-1 mx-4 min-w-0">
          <p className="text-white font-medium text-sm truncate">{support.titre}</p>
          {support.nb_pages && <p className="text-noir-500 text-xs">{support.nb_pages} pages</p>}
        </div>
        {support.fichier_url && !isLien && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
          >
            <Download size={12} />
            {downloading ? 'Téléchargement...' : 'Télécharger'}
          </button>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: '70vh' }}>

        {isPdf && support.fichier_url && (
          <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(support.fichier_url)}&embedded=true`}
              className="w-full flex-1 border-0"
              style={{ minHeight: '400px' }}
              title={support.titre}
            />
            <div className="bg-noir-900 border-t border-noir-800 px-4 py-2 flex items-center justify-between shrink-0">
              <p className="text-noir-500 text-xs">Si le document ne s&apos;affiche pas, utilisez le bouton Télécharger</p>
              <a href={support.fichier_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                <ExternalLink size={12} /> Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>
        )}

        {isVideo && support.fichier_url && (
          <div className="flex items-center justify-center h-full bg-black p-4">
            {support.fichier_url.includes('youtube') || support.fichier_url.includes('youtu.be') ? (
              <iframe
                src={support.fichier_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                className="w-full max-w-4xl aspect-video rounded-xl"
                allowFullScreen
                title={support.titre}
              />
            ) : support.fichier_url.includes('vimeo') ? (
              <iframe
                src={support.fichier_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                className="w-full max-w-4xl aspect-video rounded-xl"
                allowFullScreen
                title={support.titre}
              />
            ) : (
              <video controls className="w-full max-w-4xl rounded-xl" src={support.fichier_url}>
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            )}
          </div>
        )}

        {isAudio && support.fichier_url && (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
            <div className="w-24 h-24 rounded-full bg-gold-500/10 border-2 border-gold-500/30 flex items-center justify-center">
              <Play size={36} className="text-gold-400" />
            </div>
            <p className="text-white font-serif text-xl text-center">{support.titre}</p>
            <audio controls className="w-full max-w-lg" src={support.fichier_url}>
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        )}

        {isLien && support.fichier_url && (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
            <ExternalLink size={48} className="text-gold-400" />
            <p className="text-white font-serif text-xl text-center">{support.titre}</p>
            {support.description && <p className="text-noir-400 text-center max-w-md">{support.description}</p>}
            <a
              href={support.fichier_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold flex items-center gap-2"
            >
              <ExternalLink size={16} /> Ouvrir le lien
            </a>
          </div>
        )}

        {!support.fichier_url && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <FileText size={48} className="text-noir-600" />
            <p className="text-noir-400 text-center">Ce support n&apos;a pas encore de fichier associé.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MesSupportsPage() {
  const router = useRouter()
  const [supports, setSupports] = useState<Support[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const [viewing, setViewing] = useState<Support | null>(null)

  useEffect(() => {
    fetch('/api/eleve/me')
      .then(r => {
        if (r.status === 401) { router.push('/espace-eleve/login'); return null }
        return r.json()
      })
      .then(me => {
        if (!me) return
        loadSupports()
      })
      .catch(() => router.push('/espace-eleve/login'))
  }, [])

  async function loadSupports() {
    setLoading(true)
    try {
      const data = await fetch('/api/eleve/supports').then(r => r.json())
      setSupports(Array.isArray(data) ? data : [])
    } catch {
      setSupports([])
    }
    setLoading(false)
  }

  async function updateProgression(supportId: string, statut: string) {
    await fetch('/api/eleve/supports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ support_id: supportId, statut }),
    })
    setSupports(prev =>
      prev.map(s =>
        s.id === supportId
          ? { ...s, progression: { page_actuelle: s.progression?.page_actuelle || 0, statut } }
          : s
      )
    )
  }

  function openSupport(s: Support) {
    setViewing(s)
    if (s.progression?.statut === 'non_commence' || !s.progression) {
      updateProgression(s.id, 'en_cours')
    }
  }

  const niveaux = ['tous', 'fondamentaux', 'comprehension', 'expression']
  const filtered = filter === 'tous'
    ? supports
    : supports.filter(s => s.niveau === filter || s.niveau === 'tous')

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={20} className="text-gold-400" />
      case 'video': return <Play size={20} className="text-blue-400" />
      case 'audio': return <Music size={20} className="text-purple-400" />
      case 'lien': return <LinkIcon size={20} className="text-green-400" />
      default: return <FileText size={20} className="text-gold-400" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf': return 'PDF'
      case 'video': return 'Vidéo'
      case 'audio': return 'Audio'
      case 'lien': return 'Lien'
      default: return type
    }
  }

  if (viewing) {
    return <SupportViewer support={viewing} onClose={() => setViewing(null)} />
  }

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-serif text-white">Mes supports de cours</h1>
          <p className="text-noir-400 text-sm mt-1">
            {loading
              ? 'Chargement...'
              : `${supports.length} support${supports.length > 1 ? 's' : ''} disponible${supports.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {niveaux.map(n => (
            <button
              key={n}
              onClick={() => setFilter(n)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === n
                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                  : 'border-noir-700 text-noir-400 hover:border-noir-600'
              }`}
            >
              {NIVEAU_LABELS[n] || 'Tous'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="text-noir-700 mx-auto mb-3" />
            <p className="text-noir-400 text-lg">Aucun support disponible</p>
            <p className="text-noir-600 text-sm mt-2">
              {supports.length === 0
                ? 'Votre professeur ajoutera des supports prochainement'
                : 'Aucun support pour ce niveau'}
            </p>
            <div className="mt-4">
              <a href="/bibliotheque-pedagogique" className="btn-gold text-xs px-4 py-2 inline-flex items-center gap-2">
                <ShoppingCart size={14} /> Voir et acheter les supports
              </a>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => {
              const statut = s.progression?.statut || 'non_commence'
              return (
                <div
                  key={s.id}
                  className="card hover:border-gold-500/30 transition-all cursor-pointer group"
                  onClick={() => openSupport(s)}
                >
                  {s.apercu_url ? (
                    <div className="h-36 rounded-xl overflow-hidden mb-3 bg-noir-800 -mx-1 relative">
                      <img src={s.apercu_url} alt={s.titre} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="bg-gold-500 rounded-full p-3">
                          <Play size={20} className="text-noir-950" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 rounded-xl mb-3 bg-noir-800 flex items-center justify-center group-hover:bg-noir-700 transition-colors">
                      {getTypeIcon(s.type)}
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight group-hover:text-gold-400 transition-colors">{s.titre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-noir-800 text-noir-400 px-2 py-0.5 rounded-full">{getTypeLabel(s.type)}</span>
                        <span className="text-xs text-noir-500">{NIVEAU_LABELS[s.niveau] || s.niveau}</span>
                        {s.nb_pages && <span className="text-xs text-noir-600">{s.nb_pages}p</span>}
                      </div>
                      {s.description && (
                        <p className="text-noir-500 text-xs mt-1.5 line-clamp-2">{s.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-noir-800 flex items-center justify-between">
                    <span className={`text-xs font-medium flex items-center gap-1 ${
                      statut === 'termine' ? 'text-green-400'
                      : statut === 'en_cours' ? 'text-gold-400'
                      : 'text-noir-600'
                    }`}>
                      {statut === 'termine' && <CheckCircle size={11} />}
                      {statut === 'termine' ? 'Terminé' : statut === 'en_cours' ? 'En cours' : 'Non commencé'}
                    </span>
                    <span className="text-xs text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Consulter →
                    </span>
                  </div>

                  {statut === 'en_cours' && (
                    <button
                      onClick={e => { e.stopPropagation(); updateProgression(s.id, 'termine') }}
                      className="mt-2 w-full text-xs text-noir-500 hover:text-green-400 transition-colors py-1 border border-noir-800 rounded-lg hover:border-green-500/30"
                    >
                      Marquer comme terminé
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}