'use client'
import SubNav from '@/components/eleve/SubNav'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'
import { FileText, Video, Music, Link as LinkIcon, ExternalLink, Download, BookOpen, CheckCircle, ChevronLeft, Play, Lock, ShoppingCart } from 'lucide-react'
import MediaPlayer from '@/components/eleve/MediaPlayer'

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
            {/* Affichage direct du PDF — fonctionne avec Supabase Storage */}
            <iframe
              src={support.fichier_url}
              className="w-full flex-1 border-0"
              style={{ minHeight: '400px' }}
              title={support.titre}
            />
            <div className="bg-noir-900 border-t border-noir-800 px-4 py-2 flex items-center justify-between shrink-0">
              <p className="text-noir-500 text-xs">Si le document ne s&apos;affiche pas, utilisez le bouton ci-dessous</p>
              <a href={support.fichier_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                <ExternalLink size={12} /> Ouvrir / Télécharger
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
          <div className="flex flex-col items-center justify-center h-full gap-6 p-4 md:p-8">
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
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
            <p className="text-white font-serif text-xl text-center">{support.titre}</p>
            {support.description && <p className="text-noir-400 text-center max-w-md text-sm">{support.description}</p>}
            <div className="w-full max-w-lg">
              <MediaPlayer url={support.fichier_url} titre={support.titre} />
            </div>
          </div>
        )}

        {!support.fichier_url && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-4 md:p-8">
            <FileText size={48} className="text-noir-600" />
            <p className="text-noir-400 text-center">Ce support n&apos;a pas encore de fichier associé.</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface RessourcePremiumAchat {
  id: string
  token_acces: string
  ressources_premium: {
    id: string; titre: string; description: string; type: string
    fichier_url: string | null; youtube_url: string | null; zoom_url: string | null
    duree_minutes: number | null; nb_pages: number | null; image_url: string | null
  }
}

export default function MesSupportsPage() {
  const router = useRouter()
  const [supports, setSupports] = useState<Support[]>([])
  const [ressourcesPremium, setRessourcesPremium] = useState<RessourcePremiumAchat[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const [viewing, setViewing] = useState<Support | null>(null)
  const [eleveEmail, setEleveEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/eleve/me')
      .then(r => {
        if (r.status === 401) { router.push('/espace-eleve/login'); return null }
        return r.json()
      })
      .then(me => {
        if (!me) return
        setEleveEmail(me.email)
        loadSupports()
        loadRessourcesPremium(me.email)
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

  async function loadRessourcesPremium(email: string) {
    try {
      const data = await fetch(`/api/eleve/ressources-premium?email=${encodeURIComponent(email)}`).then(r => r.json())
      setRessourcesPremium(Array.isArray(data) ? data : [])
    } catch {
      setRessourcesPremium([])
    }
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
      <div className="p-4 md:p-6 lg:p-4 md:p-8 pb-24 md:pb-4 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-serif text-white">Mes supports de cours</h1>
        <SubNav items={[{href:'/espace-eleve/ressources',label:'Ressources'},{href:'/espace-eleve/partitions',label:'Médiathèque'},{href:'/espace-eleve/mes-supports',label:'Mes supports'}]} />
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

        {/* ── Section Ressources Premium achetées ── */}
        {ressourcesPremium.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-serif text-white">Ressources Premium</h2>
                <p className="text-noir-400 text-xs mt-0.5">{ressourcesPremium.length} ressource{ressourcesPremium.length > 1 ? 's' : ''} achetée{ressourcesPremium.length > 1 ? 's' : ''}</p>
              </div>
              
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ressourcesPremium.map(achat => {
                const r = achat.ressources_premium
                const typeLabels: Record<string, string> = {
                  video_youtube: 'Vidéo', coaching_visio: 'Coaching Visio',
                  formation: 'Formation', documentation: 'PDF', audio: 'Audio', autre: 'Ressource',
                }
                return (
                  <a key={achat.id} href={`/ressources-premium/acces/${achat.token_acces}`}
                    className="group block bg-noir-900 border border-gold-500/20 rounded-2xl overflow-hidden hover:border-gold-500/40 transition-all hover:-translate-y-0.5">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-gold-500/10 to-noir-800 flex items-center justify-center relative overflow-hidden">
                      {r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt={r.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <svg width="32" height="32" fill="none" stroke="#f59e0b" strokeWidth="1" viewBox="0 0 24 24" className="opacity-30">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="bg-noir-950/85 text-gold-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gold-500/20">
                          {typeLabels[r.type] || r.type}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          Acheté
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white text-sm font-semibold group-hover:text-gold-400 transition-colors line-clamp-2 mb-1">{r.titre}</h3>
                      {r.description && <p className="text-noir-500 text-xs line-clamp-2 mb-2">{r.description}</p>}
                      <div className="flex items-center gap-2 text-xs text-noir-500">
                        {r.duree_minutes && <span>{r.duree_minutes} min</span>}
                        {r.nb_pages && <span>{r.nb_pages} pages</span>}
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-gold-400 text-xs font-medium">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Accéder à la ressource
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Lien boutique si aucune ressource premium */}
        {ressourcesPremium.length === 0 && !loading && (
          <div className="mt-8 bg-gradient-to-r from-gold-500/5 to-noir-900 border border-gold-500/15 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">Découvrez nos ressources premium</h3>
              <p className="text-noir-400 text-xs">Vidéos exclusives, coachings visio, formations et documentations.</p>
            </div>
            <Link href="/ressources-premium" className="btn-gold text-xs px-4 py-2 shrink-0">
              Voir la boutique
            </Link>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}