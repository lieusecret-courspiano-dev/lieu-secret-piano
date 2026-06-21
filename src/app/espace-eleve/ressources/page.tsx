'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Search, Play, FileText, Music, Link as LinkIcon, BookOpen, ExternalLink } from 'lucide-react'
import MediaPlayer from '@/components/eleve/MediaPlayer'

interface Ressource {
  id: string; titre: string; description: string | null; type: string
  url: string | null; categorie: string | null; url_image: string | null; duree: string | null; created_at: string
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match ? match[1] : null
}

function RessourceCard({ r }: { r: Ressource }) {
  const ytId = r.url && r.type === 'video' ? getYouTubeId(r.url) : null
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string; action: string }> = {
    pdf:       { icon: <FileText size={18} />,  color: 'text-red-400 bg-red-500/10 border-red-500/20',    label: 'PDF',       action: 'Télécharger' },
    video:     { icon: <Play size={18} />,       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',  label: 'Vidéo',     action: 'Regarder' },
    audio:     { icon: <Music size={18} />,      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Audio', action: 'Écouter' },
    partition: { icon: <BookOpen size={18} />,   color: 'text-gold-400 bg-gold-500/10 border-gold-500/20', label: 'Partition', action: 'Ouvrir' },
    exercice:  { icon: <FileText size={18} />,   color: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'Exercice', action: 'Ouvrir' },
    lien:      { icon: <LinkIcon size={18} />,   color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',  label: 'Lien',      action: 'Visiter' },
    autre:     { icon: <FileText size={18} />,   color: 'text-noir-400 bg-noir-800 border-noir-700',        label: 'Document',  action: 'Ouvrir' },
  }
  const tc = typeConfig[r.type] || typeConfig['autre']

  return (
    <div className="card hover:border-gold-500/40 transition-all overflow-hidden group">
      {/* Aperçu visuel */}
      {(ytThumb || r.url_image) && (
        <div className="relative -mx-5 -mt-5 mb-4 h-40 overflow-hidden bg-noir-800">
          <img src={ytThumb || r.url_image!} alt={r.titre}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          {ytThumb && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                <Play size={22} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}
          {r.duree && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/80 text-white px-2 py-0.5 rounded font-mono">{r.duree}</span>
          )}
          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full border font-medium ${tc.color}`}>{tc.label}</span>
        </div>
      )}

      {/* Contenu */}
      <div className="flex items-start gap-3">
        {!ytThumb && !r.url_image && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tc.color}`}>
            {tc.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-semibold text-base leading-tight">{r.titre}</h3>
            {!ytThumb && !r.url_image && (
              <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${tc.color}`}>{tc.label}</span>
            )}
          </div>
          {r.categorie && <p className="text-gold-400 text-xs mt-0.5 font-medium uppercase tracking-wider">{r.categorie}</p>}
          {r.description && <p className="text-noir-400 text-sm mt-1 line-clamp-3 leading-relaxed">{r.description}</p>}
          <p className="text-noir-600 text-xs mt-2">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Lecteur intégré ou lien */}
      {r.url && (
        <div className="mt-4 pt-3 border-t border-noir-800">
          <MediaPlayer url={r.url} titre={r.titre} compact />
        </div>
      )}
    </div>
  )
}

export default function RessourcesPage() {
  const router = useRouter()
  const [ressources, setRessources] = useState<Ressource[]>([])
  const [prenom, setPrenom] = useState('')
  const [nbMedias, setNbMedias] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('tous')

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/ressources').then(r => r.json()),
      fetch('/api/partitions').then(r => r.json()),
    ]).then(([me, res, medias]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setRessources(Array.isArray(res) ? res : [])
      setNbMedias(Array.isArray(medias) ? medias.length : 0)
    }).finally(() => setLoading(false))
  }, [router])

  const types = ['tous', ...Array.from(new Set(ressources.map(r => r.type)))]
  const TYPE_LABELS: Record<string, string> = { tous: 'Tout', pdf: 'PDF', video: 'Vidéos', audio: 'Audio', partition: 'Partitions', exercice: 'Exercices', lien: 'Liens', autre: 'Documents' }

  const filtered = ressources.filter(r => {
    const matchSearch = !search || r.titre.toLowerCase().includes(search.toLowerCase()) || (r.categorie || '').toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase())
    const matchType = activeType === 'tous' || r.type === activeType
    return matchSearch && matchType
  })

  return (
    <EleveLayout prenom={prenom} nbNotifs={0} nbMedias={nbMedias} nbRessources={ressources.length}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        {/* Grand titre */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 animate-fade-in-up">Mes Ressources</h1>
          <p className="text-noir-400">Documents, vidéos et supports déposés par votre professeur pour vous</p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input pl-9 w-full" />
          </div>
          <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1 flex-wrap">
            {types.map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeType === t ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                {TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="text-noir-600 mx-auto mb-4" />
            <p className="text-noir-400 text-lg font-medium">Aucune ressource pour le moment</p>
            <p className="text-noir-600 text-sm mt-1">Votre professeur déposera ici des documents personnalisés pour vous.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(r => <RessourceCard key={r.id} r={r} />)}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
