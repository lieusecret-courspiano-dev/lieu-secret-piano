'use client'
import SubNav from '@/components/eleve/SubNav'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Search, Download, Play, FileText, Music, Link as LinkIcon, BookOpen } from 'lucide-react'
import MediaPlayer from '@/components/eleve/MediaPlayer'

interface Media {
  id: string; titre: string; compositeur: string | null; niveau: string; type: string
  style: string; description: string | null; url_pdf: string | null; url_video: string | null
  url_audio: string | null; url_image: string | null; gratuit: boolean; created_at: string
}

const NIVEAUX = ['tous', 'debutant', 'elementaire', 'intermediaire', 'avance']
const TYPES   = ['tous', 'pdf', 'video', 'audio', 'partition', 'exercice', 'lien']
const NIVEAU_LABELS: Record<string, string> = { tous: 'Tous niveaux', debutant: 'Débutant', elementaire: 'Élémentaire', intermediaire: 'Intermédiaire', avance: 'Avancé' }
const TYPE_LABELS: Record<string, string>   = { tous: 'Tous types', pdf: 'PDF', video: 'Vidéo', audio: 'Audio', partition: 'Partition', exercice: 'Exercice', lien: 'Lien' }

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match ? match[1] : null
}

function MediaCard({ m }: { m: Media }) {
  const ytId = m.url_video ? getYouTubeId(m.url_video) : null
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    pdf:       { icon: <FileText size={18} />,  color: 'text-red-400 bg-red-500/10 border-red-500/20',    label: 'PDF' },
    video:     { icon: <Play size={18} />,       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',  label: 'Vidéo' },
    audio:     { icon: <Music size={18} />,      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Audio' },
    partition: { icon: <BookOpen size={18} />,   color: 'text-gold-400 bg-gold-500/10 border-gold-500/20', label: 'Partition' },
    exercice:  { icon: <FileText size={18} />,   color: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'Exercice' },
    lien:      { icon: <LinkIcon size={18} />,   color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',  label: 'Lien' },
  }
  const tc = typeConfig[m.type] || typeConfig['pdf']

  return (
    <div className="card hover:border-gold-500/40 transition-all overflow-hidden group">
      {/* Aperçu visuel */}
      {(ytThumb || m.url_image || m.type === 'video') && (
        <div className="relative -mx-5 -mt-5 mb-4 h-36 overflow-hidden bg-noir-800">
          {ytThumb ? (
            <>
              <img src={ytThumb} alt={m.titre} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                  <Play size={20} className="text-white ml-1" fill="white" />
                </div>
              </div>
            </>
          ) : m.url_image ? (
            <img src={m.url_image} alt={m.titre} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${tc.color}`}>
                {tc.icon}
              </div>
            </div>
          )}
          {/* Badge type */}
          <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border font-medium ${tc.color}`}>{tc.label}</span>
        </div>
      )}

      {/* Contenu */}
      <div className="flex items-start gap-3">
        {!ytThumb && !m.url_image && m.type !== 'video' && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tc.color}`}>
            {tc.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base leading-tight">{m.titre}</h3>
          {m.compositeur && <p className="text-gold-400 text-sm mt-0.5">{m.compositeur}</p>}
          {m.description && <p className="text-noir-400 text-xs mt-1 line-clamp-2">{m.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {m.niveau !== 'tous' && <span className="text-xs bg-noir-800 text-noir-400 px-2 py-0.5 rounded-full">{NIVEAU_LABELS[m.niveau] || m.niveau}</span>}
            {m.style && m.style !== 'classique' && <span className="text-xs bg-noir-800 text-noir-400 px-2 py-0.5 rounded-full capitalize">{m.style}</span>}
          </div>
        </div>
      </div>

      {/* Lecteur intégré vidéo/audio */}
      {m.url_video && (
        <div className="mt-3">
          <MediaPlayer url={m.url_video} titre={m.titre} compact />
        </div>
      )}
      {m.url_audio && !m.url_video && (
        <div className="mt-3">
          <MediaPlayer url={m.url_audio} titre={m.titre} />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-noir-800">
        {m.url_pdf && (
          <a href={m.url_pdf} target="_blank" rel="noopener noreferrer" className="btn-gold flex-1 text-sm py-2 flex items-center justify-center gap-2">
            <Download size={14} /> Télécharger PDF
          </a>
        )}
        {!m.url_pdf && !m.url_video && !m.url_audio && m.url_image && (
          <a href={m.url_image} target="_blank" rel="noopener noreferrer" className="btn-outline flex-1 text-sm py-2 flex items-center justify-center gap-2">
            <LinkIcon size={14} /> Ouvrir
          </a>
        )}
      </div>
    </div>
  )
}

export default function MediathequeElevePage() {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [medias, setMedias] = useState<Media[]>([])
  const [nbRessources, setNbRessources] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [niveau, setNiveau] = useState('tous')
  const [type, setType] = useState('tous')

  useEffect(() => {
    fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()).then(me => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
    })
    Promise.all([
      fetch('/api/partitions').then(r => r.json()),
      fetch('/api/eleve/ressources').then(r => r.json()),
    ]).then(([mediasData, ressData]) => {
      setMedias(Array.isArray(mediasData) ? mediasData : [])
      setNbRessources(Array.isArray(ressData) ? ressData.length : 0)
      setLoading(false)
    })
  }, [router])

  const filtered = medias.filter(m => {
    const matchSearch = !search || m.titre.toLowerCase().includes(search.toLowerCase()) || (m.compositeur || '').toLowerCase().includes(search.toLowerCase())
    const matchNiveau = niveau === 'tous' || m.niveau === niveau
    const matchType   = type === 'tous' || m.type === type
    return matchSearch && matchNiveau && matchType
  })

  return (
    <EleveLayout prenom={prenom} nbNotifs={0} nbMedias={medias.length} nbRessources={nbRessources}>
      <div className="p-4 md:p-6 lg:p-4 md:p-8 pb-24 md:pb-4 md:pb-8">
        {/* Grand titre */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 animate-fade-in-up">Médiathèque</h1>
        <SubNav items={[{href:'/espace-eleve/ressources',label:'Ressources'},{href:'/espace-eleve/partitions',label:'Médiathèque'},{href:'/espace-eleve/mes-supports',label:'Mes supports'}]} />
          <p className="text-noir-400">Partitions, vidéos, exercices et ressources pédagogiques</p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input pl-9 w-full" />
          </div>
          <select value={type} onChange={e => setType(e.target.value)} className="input w-auto">
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <select value={niveau} onChange={e => setNiveau(e.target.value)} className="input w-auto">
            {NIVEAUX.map(n => <option key={n} value={n}>{NIVEAU_LABELS[n]}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="text-noir-600 mx-auto mb-4" />
            <p className="text-noir-400 text-lg font-medium">Aucun contenu disponible</p>
            <p className="text-noir-600 text-sm mt-1">Votre professeur ajoutera bientôt des ressources ici.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(m => <MediaCard key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
