'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

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
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video_youtube:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  coaching_visio: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/></svg>,
  formation:      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  documentation:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  audio:          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  autre:          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
}

const TYPE_LABELS: Record<string, string> = {
  video_youtube: 'Vidéo', coaching_visio: 'Coaching Visio', formation: 'Formation',
  documentation: 'Documentation', audio: 'Audio', autre: 'Ressource',
}

const FILTERS = ['Tous', 'Vidéo', 'Coaching Visio', 'Formation', 'Documentation']

export default function RessourcesPremiumPage() {
  const [ressources, setRessources] = useState<Ressource[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')

  useEffect(() => {
    fetch('/api/ressources-premium').then(r => r.json()).then(d => {
      setRessources(Array.isArray(d) ? d : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'Tous' ? ressources
    : ressources.filter(r => TYPE_LABELS[r.type] === filter)

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-14 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Contenu exclusif</span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mt-4 mb-6">
              Ressources <span className="text-gold-400">Premium</span>
            </h1>
            <p className="text-noir-300 text-base sm:text-lg leading-relaxed">
              Vidéos exclusives, coachings visio, formations et documentations pour accélérer votre progression au piano.
            </p>
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
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-noir-400 text-lg">Aucune ressource disponible pour le moment.</p>
              <p className="text-noir-600 text-sm mt-2">Revenez bientôt !</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((r, i) => (
                <FadeUp key={r.id} delay={i * 0.07}>
                  <Link href={`/ressources-premium/${r.id}`}
                    className="group block bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all hover:-translate-y-1 h-full">
                    {/* Image / placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-gold-500/10 to-noir-800 flex items-center justify-center relative overflow-hidden">
                      {r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt={r.titre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gold-500/40">{TYPE_ICONS[r.type] || TYPE_ICONS.autre}</div>
                      )}
                      {/* Badge type */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-noir-950/80 backdrop-blur text-gold-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-gold-500/20">
                          {TYPE_LABELS[r.type] || r.type}
                        </span>
                      </div>
                      
                    </div>

                    <div className="p-5">
                      <h3 className="font-serif text-lg text-white mb-2 group-hover:text-gold-400 transition-colors line-clamp-2">
                        {r.titre}
                      </h3>
                      {r.description && (
                        <p className="text-noir-400 text-sm leading-relaxed line-clamp-3 mb-3">{r.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-noir-500 flex-wrap">
                        {r.duree_minutes && <span>{r.duree_minutes} min</span>}
                        {r.date_coaching && (
                          <span className="text-blue-400">
                            {new Date(r.date_coaching).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {r.nb_places && <span>{r.nb_places} places</span>}
                        <span className="capitalize">{r.niveau !== 'tous' ? r.niveau : 'Tous niveaux'}</span>
                      </div>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}