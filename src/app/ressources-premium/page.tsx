'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import dynamic from 'next/dynamic'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
const PdfThumbnail = dynamic(() => import('@/components/ressources/PdfThumbnail'), { ssr: false })

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

// fix: miniature PDF placeholder
function RessourceCard({ r }: { r: Ressource }) {

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
        {thumbnail && !thumbnail.includes('.pdf') && !thumbnail.includes('/raw/') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={r.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : r.type === 'documentation' && (r.fichier_url || r.apercu_url) ? (
          /* Miniature PDF — 1ère page rendue via PDF.js */
          <PdfThumbnail
            url={r.fichier_url || r.apercu_url || ''}
            titre={r.titre}
            nbPages={r.nb_pages}
          />
        ) : (
          <div className="text-gold-500/25 scale-[2]">{TYPE_ICONS[r.type] || TYPE_ICONS.autre}</div>
        )}
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
                  <RessourceCard r={r} />
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