'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import dynamic from 'next/dynamic'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

const ApercuModal = dynamic(() => import('@/components/ressources/ApercuModal'), { ssr: false })

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

interface Ressource {
  id: string; titre: string; description: string; type: string
  prix: number; est_gratuit: boolean; image_url: string | null
  duree_minutes: number | null; nb_places: number | null
  date_coaching: string | null; niveau: string
  nb_pages?: number | null; taille_fichier?: string | null
  qualite_video?: string | null; format_audio?: string | null
  apercu_duree?: number | null; apercu_pages?: number | null
  apercu_url?: string | null; youtube_url?: string | null
  fichier_url?: string | null; zoom_url?: string | null
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video_youtube:  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  coaching_visio: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/></svg>,
  formation:      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  documentation:  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  audio:          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  autre:          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>,
}

const TYPE_LABELS: Record<string, string> = {
  video_youtube: 'Vidéo', coaching_visio: 'Coaching Visio', formation: 'Formation',
  documentation: 'Documentation', audio: 'Audio', autre: 'Ressource',
}

const FILTERS = ['Tous', 'Vidéo', 'Coaching Visio', 'Formation', 'Documentation', 'Audio']

function TechBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-noir-400 bg-noir-800 px-2 py-1 rounded-lg whitespace-nowrap">
      {icon}{label}
    </span>
  )
}

function RessourceCard({ r, onApercu }: { r: Ressource; onApercu: (r: Ressource) => void }) {
  const hasApercu = !!(r.youtube_url || r.apercu_url || r.fichier_url)

  // Miniature YouTube automatique si pas d'image
  const getYtId = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
    return m ? m[1] : null
  }
  const ytId = r.youtube_url ? getYtId(r.youtube_url) : null
  const thumbnail = r.image_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  return (
    <div className="group bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all hover:-translate-y-1 h-full flex flex-col shadow-lg hover:shadow-gold-500/10">

      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-gold-500/10 to-noir-800 flex items-center justify-center relative overflow-hidden">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={r.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="text-gold-500/25 scale-[2]">{TYPE_ICONS[r.type] || TYPE_ICONS.autre}</div>
        )}

        {/* Overlay aperçu au hover */}
        {hasApercu && (
          <div className="absolute inset-0 bg-noir-950/0 group-hover:bg-noir-950/50 transition-all duration-300 flex items-center justify-center">
            <button onClick={e => { e.preventDefault(); onApercu(r) }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white/25">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Voir l'aperçu
            </button>
          </div>
        )}

        {/* Badge type */}
        <div className="absolute top-3 left-3">
          <span className="bg-noir-950/90 backdrop-blur text-gold-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-gold-500/20">
            {TYPE_LABELS[r.type] || r.type}
          </span>
        </div>

        {/* Badge aperçu */}
        {hasApercu && (
          <div className="absolute bottom-3 right-3">
            <span className="bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg width="8" height="8" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Aperçu
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-5 flex flex-col flex-1">

        {/* Titre + Prix */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-base sm:text-lg text-white group-hover:text-gold-400 transition-colors line-clamp-2 flex-1 leading-snug">
            {r.titre}
          </h3>
          <span className={`shrink-0 text-sm font-bold px-3 py-1 rounded-xl whitespace-nowrap ${
            r.est_gratuit ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-gold-500 text-noir-950'
          }`}>
            {r.est_gratuit ? 'Gratuit' : `${r.prix} €`}
          </span>
        </div>

        {r.description && (
          <p className="text-noir-400 text-sm leading-relaxed line-clamp-2 mb-3">{r.description}</p>
        )}

        {/* Infos techniques */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {r.duree_minutes && (
            <TechBadge
              icon={<svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              label={`${r.duree_minutes} min`} />
          )}
          {r.nb_pages && (
            <TechBadge
              icon={<svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>}
              label={`${r.nb_pages} pages`} />
          )}
          {r.qualite_video && (r.type === 'video_youtube' || r.type === 'formation') && (
            <TechBadge
              icon={<svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2"/></svg>}
              label={r.qualite_video} />
          )}
          {r.format_audio && r.type === 'audio' && (
            <TechBadge
              icon={<svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/></svg>}
              label={r.format_audio} />
          )}
          {r.taille_fichier && (
            <TechBadge
              icon={<svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>}
              label={r.taille_fichier} />
          )}
          {r.date_coaching && (
            <TechBadge
              icon={<svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>}
              label={new Date(r.date_coaching).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} />
          )}
          <TechBadge
            icon={<svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            label={r.niveau !== 'tous' ? r.niveau : 'Tous niveaux'} />
        </div>

        {/* Boutons */}
        <div className="flex gap-2 mt-auto">
          {hasApercu && (
            <button onClick={() => onApercu(r)}
              className="flex-1 border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Aperçu
            </button>
          )}
          <Link href={`/ressources-premium/${r.id}`}
            className={`${hasApercu ? 'flex-1' : 'w-full'} btn-gold py-2.5 text-sm text-center flex items-center justify-center gap-1.5`}>
            {r.est_gratuit ? 'Accéder' : 'Acheter'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RessourcesPremiumPage() {
  const [ressources, setRessources] = useState<Ressource[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const [apercuRessource, setApercuRessource] = useState<Ressource | null>(null)

  useEffect(() => {
    fetch('/api/ressources-premium').then(r => r.json()).then(d => {
      setRessources(Array.isArray(d) ? d : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'Tous' ? ressources : ressources.filter(r => TYPE_LABELS[r.type] === filter)

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-14 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.07),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Contenu exclusif</span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mt-4 mb-6">
              Ressources <span className="text-gold-400">Premium</span>
            </h1>
            <p className="text-noir-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              Vidéos exclusives, coachings visio, formations et documentations pour accélérer votre progression au piano.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-noir-500">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Aperçu disponible
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Accès permanent
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Contenu sécurisé
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filtres */}
      <section className="px-4 mb-10">
        <div className="max-w-5xl mx-auto flex gap-2 flex-wrap justify-center">
          {FILTERS.map((f, i) => (
            <button key={i} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f ? 'bg-gold-500 text-noir-950' : 'bg-noir-900 border border-noir-800 text-noir-400 hover:text-white hover:border-noir-700'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Catalogue */}
      <section className="px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-noir-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-noir-800 rounded w-1/3" />
                    <div className="h-5 bg-noir-800 rounded" />
                    <div className="h-4 bg-noir-800 rounded w-3/4" />
                    <div className="flex gap-2 mt-4">
                      <div className="h-9 bg-noir-800 rounded-xl flex-1" />
                      <div className="h-9 bg-noir-800 rounded-xl flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-noir-900 border border-noir-800 flex items-center justify-center mx-auto mb-4 text-noir-600">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p className="text-noir-400 text-lg">Aucune ressource disponible pour le moment.</p>
              <p className="text-noir-600 text-sm mt-2">Revenez bientôt !</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((r, i) => (
                <FadeUp key={r.id} delay={i * 0.07}>
                  <RessourceCard r={r} onApercu={setApercuRessource} />
                </FadeUp>
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />

      {/* Modal aperçu */}
      {apercuRessource && (
        <ApercuModal
          ressource={apercuRessource}
          onClose={() => setApercuRessource(null)}
          onBuy={() => {
            const id = apercuRessource.id
            setApercuRessource(null)
            window.location.href = `/ressources-premium/${id}`
          }}
        />
      )}
    </div>
  )
}