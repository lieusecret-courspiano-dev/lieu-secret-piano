'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ApercuModalProps {
  ressource: {
    id: string; titre: string; type: string; prix: number; est_gratuit: boolean
    fichier_url?: string | null; youtube_url?: string | null; zoom_url?: string | null
    apercu_url?: string | null; apercu_duree?: number | null; apercu_pages?: number | null; nb_pages?: number | null
  }
  onClose: () => void
  onBuy: () => void
}

function YoutubeEmbed({ url, apercuDuree }: { url: string; apercuDuree?: number | null }) {
  const [blocked, setBlocked] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const getYtId = (u: string) => { const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/); return m ? m[1] : null }
  const videoId = getYtId(url)

  useEffect(() => {
    if (apercuDuree && apercuDuree > 0) timerRef.current = setTimeout(() => setBlocked(true), apercuDuree * 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [apercuDuree])

  if (!videoId) return <div className="text-noir-400 text-center py-8">URL YouTube invalide</div>

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-noir-900">
      {!blocked ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          className="w-full h-full" allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      ) : (
        <div className="absolute inset-0 bg-noir-950/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div><p className="text-white font-semibold text-lg mb-1">Aperçu terminé</p><p className="text-noir-400 text-sm">Achetez pour regarder la vidéo complète</p></div>
        </div>
      )}
      {apercuDuree && !blocked && (
        <div className="absolute bottom-3 right-3 bg-noir-950/80 backdrop-blur text-xs text-gold-400 px-2 py-1 rounded-full">Aperçu {apercuDuree}s</div>
      )}
    </div>
  )
}

function AudioPlayer({ url, apercuDuree }: { url: string; apercuDuree?: number | null }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [blocked, setBlocked] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const maxTime = apercuDuree || 30

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return
    const handleTime = () => { setCurrentTime(audio.currentTime); if (audio.currentTime >= maxTime) { audio.pause(); setBlocked(true); setPlaying(false) } }
    audio.addEventListener('timeupdate', handleTime)
    return () => audio.removeEventListener('timeupdate', handleTime)
  }, [maxTime])

  function togglePlay() {
    const audio = audioRef.current; if (!audio || blocked) return
    if (playing) { audio.pause(); setPlaying(false) } else { audio.play(); setPlaying(true) }
  }

  return (
    <div className="bg-noir-800 rounded-2xl p-6">
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-4 mb-4">
        <button onClick={togglePlay} disabled={blocked}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${blocked ? 'bg-noir-700 text-noir-500 cursor-not-allowed' : 'bg-gold-500 text-noir-950 hover:bg-gold-400'}`}>
          {playing ? <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
        </button>
        <div className="flex-1">
          <div className="h-2 bg-noir-700 rounded-full overflow-hidden">
            <div className="h-full bg-gold-500 rounded-full transition-all" style={{ width: `${Math.min(100, (currentTime / maxTime) * 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-noir-500 mt-1"><span>{Math.floor(currentTime)}s</span><span>Aperçu {maxTime}s</span></div>
        </div>
      </div>
      {blocked && <div className="bg-noir-900 border border-gold-500/20 rounded-xl p-4 text-center"><p className="text-white text-sm font-semibold mb-1">Aperçu terminé</p><p className="text-noir-400 text-xs">Achetez pour écouter l'audio complet</p></div>}
    </div>
  )
}

function PdfViewer({ url, apercuPages, nbPages }: { url: string; apercuPages?: number | null; nbPages?: number | null }) {
  const pages = apercuPages || 3
  const total = nbPages || '?'
  const [currentPage, setCurrentPage] = useState(1)
  const isPdfDirect = url.toLowerCase().includes('.pdf') || url.includes('cloudinary.com')

  if (!isPdfDirect) {
    return (
      <div className="space-y-3">
        <div className="bg-noir-800 rounded-xl p-3 text-center">
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider">Aperçu — {pages} premières pages sur {total}</p>
        </div>
        <div className="rounded-xl overflow-hidden bg-noir-900 border border-noir-700" style={{ height: '500px' }}>
          <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} className="w-full h-full" title="Aperçu PDF" />
        </div>
      </div>
    )
  }

  const pageUrl = `${url}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-noir-800 rounded-xl px-4 py-2.5">
        <div>
          <span className="text-gold-400 text-xs font-semibold">Aperçu gratuit</span>
          <span className="text-noir-500 text-xs ml-2">— {pages} pages sur {total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
            className="w-7 h-7 rounded-lg bg-noir-700 text-noir-300 hover:bg-noir-600 disabled:opacity-30 flex items-center justify-center transition-colors">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-white text-xs font-medium min-w-[60px] text-center">Page {currentPage}/{pages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(pages, p + 1))} disabled={currentPage >= pages}
            className="w-7 h-7 rounded-lg bg-noir-700 text-noir-300 hover:bg-noir-600 disabled:opacity-30 flex items-center justify-center transition-colors">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden bg-noir-900 border border-noir-700 relative" style={{ height: '480px' }}>
        <iframe key={currentPage} src={pageUrl} className="w-full h-full" style={{ border: 'none' }} title={`Page ${currentPage}`} sandbox="allow-scripts allow-same-origin" />
        <div className="absolute inset-0 pointer-events-none" style={{ userSelect: 'none' }} />
      </div>
      {currentPage >= pages && (
        <div className="bg-gradient-to-r from-gold-500/10 to-noir-900 border border-gold-500/20 rounded-xl p-4 text-center">
          <p className="text-white text-sm font-semibold mb-1">Fin de l'aperçu</p>
          <p className="text-noir-400 text-xs">Ce document contient {total} pages. Achetez pour accéder à l'intégralité.</p>
        </div>
      )}
    </div>
  )
}

export default function ApercuModal({ ressource, onClose, onBuy }: ApercuModalProps) {
  // Priorité basée sur le TYPE de la ressource
  const isPdf    = ressource.type === 'documentation'
  const isAudio  = ressource.type === 'audio'
  const isYoutube = !isPdf && !isAudio && !!(ressource.youtube_url && (ressource.youtube_url.includes('youtube') || ressource.youtube_url.includes('youtu.be')))
  const isVideo  = !isPdf && !isAudio && !isYoutube && !!(ressource.apercu_url && (ressource.apercu_url.includes('.mp4') || ressource.apercu_url.includes('/video/')))

  const pdfUrl   = ressource.apercu_url || ressource.fichier_url
  const audioUrl = ressource.apercu_url || ressource.fichier_url

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.25 }}
          className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-noir-800 shrink-0">
            <div>
              <h2 className="text-white font-semibold text-base line-clamp-1">{ressource.titre}</h2>
              <p className="text-gold-500 text-xs mt-0.5">
                Aperçu gratuit
                {isPdf && ressource.apercu_pages && ` — ${ressource.apercu_pages} page${ressource.apercu_pages > 1 ? 's' : ''} sur ${ressource.nb_pages || '?'}`}
                {(isYoutube || isAudio) && ressource.apercu_duree && ` — ${ressource.apercu_duree}s`}
              </p>
            </div>
            <button onClick={onClose} className="text-noir-400 hover:text-white p-1.5 rounded-lg hover:bg-noir-800 transition-colors">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto p-5">
            {isPdf && pdfUrl && (
              <PdfViewer url={pdfUrl} apercuPages={ressource.apercu_pages} nbPages={ressource.nb_pages} />
            )}
            {isAudio && audioUrl && (
              <AudioPlayer url={audioUrl} apercuDuree={ressource.apercu_duree} />
            )}
            {isYoutube && (
              <YoutubeEmbed url={ressource.youtube_url!} apercuDuree={ressource.apercu_duree} />
            )}
            {isVideo && ressource.apercu_url && (
              <div className="aspect-video rounded-xl overflow-hidden bg-noir-900">
                <video controls className="w-full h-full" controlsList="nodownload" onContextMenu={e => e.preventDefault()}>
                  <source src={ressource.apercu_url} />
                </video>
              </div>
            )}
            {!isPdf && !isAudio && !isYoutube && !isVideo && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <p className="text-white font-semibold mb-2">Aperçu non disponible</p>
                <p className="text-noir-400 text-sm">Achetez pour accéder au contenu complet.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-noir-800 shrink-0 flex items-center justify-between gap-3">
            <div>
              <span className="text-white font-bold text-lg">{ressource.est_gratuit ? 'Gratuit' : `${ressource.prix} €`}</span>
              {!ressource.est_gratuit && <span className="text-noir-500 text-xs ml-2">Accès permanent</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-outline text-sm px-4 py-2">Fermer</button>
              <button onClick={onBuy} className="btn-gold text-sm px-5 py-2">
                {ressource.est_gratuit ? 'Accéder gratuitement' : 'Acheter'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}