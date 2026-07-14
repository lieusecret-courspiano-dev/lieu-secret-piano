'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
const PdfViewer = dynamic(() => import('./PdfViewer'), { ssr: false })

interface ApercuModalProps {
  ressource: {
    id: string; titre: string; type: string; prix: number; est_gratuit: boolean
    fichier_url?: string | null; youtube_url?: string | null; zoom_url?: string | null
    apercu_url?: string | null; apercu_duree?: number | null; apercu_pages?: number | null; nb_pages?: number | null
    image_url?: string | null
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
          {playing
            ? <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
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

function VideoPlayer({ url, apercuDuree }: { url: string; apercuDuree?: number | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [blocked, setBlocked] = useState(false)
  const maxTime = apercuDuree || 60

  useEffect(() => {
    const video = videoRef.current; if (!video) return
    const handleTime = () => { if (apercuDuree && video.currentTime >= maxTime) { video.pause(); setBlocked(true) } }
    video.addEventListener('timeupdate', handleTime)
    return () => video.removeEventListener('timeupdate', handleTime)
  }, [maxTime, apercuDuree])

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-noir-900">
      {!blocked ? (
        <video ref={videoRef} controls className="w-full h-full" controlsList="nodownload" onContextMenu={e => e.preventDefault()}>
          <source src={url} />
        </video>
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

export default function ApercuModal({ ressource, onClose, onBuy }: ApercuModalProps) {
  const type = ressource.type
  const effectiveUrl = ressource.apercu_url || ressource.fichier_url || ''
  const isYoutubeUrl = (u: string) => u.includes('youtube.com') || u.includes('youtu.be')
  const youtubeUrl = ressource.youtube_url || (isYoutubeUrl(effectiveUrl) ? effectiveUrl : '')

  const showYoutube = !!youtubeUrl && (type === 'video_youtube' || type === 'formation' || isYoutubeUrl(effectiveUrl))
  const showPdf     = type === 'documentation' && !!effectiveUrl && !isYoutubeUrl(effectiveUrl)
  const showAudio   = type === 'audio' && !!effectiveUrl && !isYoutubeUrl(effectiveUrl)
  const showVideo   = !showYoutube && !showPdf && !showAudio && !!effectiveUrl && (
    effectiveUrl.includes('.mp4') || effectiveUrl.includes('.webm') ||
    effectiveUrl.includes('/video/') || type === 'coaching_visio'
  )
  const hasContent = showYoutube || showPdf || showAudio || showVideo

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

          <div className="flex items-center justify-between px-5 py-4 border-b border-noir-800 shrink-0">
            <div>
              <h2 className="text-white font-semibold text-base line-clamp-1">{ressource.titre}</h2>
              <p className="text-gold-500 text-xs mt-0.5">
                Aperçu gratuit
                {showPdf && ressource.apercu_pages && ` — ${ressource.apercu_pages} page${ressource.apercu_pages > 1 ? 's' : ''} sur ${ressource.nb_pages || '?'}`}
                {(showYoutube || showAudio || showVideo) && ressource.apercu_duree && ` — ${ressource.apercu_duree}s`}
              </p>
            </div>
            <button onClick={onClose} className="text-noir-400 hover:text-white p-1.5 rounded-lg hover:bg-noir-800 transition-colors">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {showYoutube && <YoutubeEmbed url={youtubeUrl} apercuDuree={ressource.apercu_duree} />}
            {showPdf     && <PdfViewer url={effectiveUrl} apercuPages={ressource.apercu_pages} nbPages={ressource.nb_pages} isPaid={!ressource.est_gratuit} />}
            {showAudio   && <AudioPlayer url={effectiveUrl} apercuDuree={ressource.apercu_duree} />}
            {showVideo   && <VideoPlayer url={effectiveUrl} apercuDuree={ressource.apercu_duree} />}
            {!hasContent && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Aperçu non disponible</p>
                  <p className="text-noir-400 text-sm">
                    {!effectiveUrl && !youtubeUrl
                      ? "Aucun fichier d'aperçu n'a été configuré pour cette ressource."
                      : "Le format de ce fichier ne peut pas être prévisualisé directement."}
                  </p>
                </div>
                {(effectiveUrl || youtubeUrl) && (
                  <a href={effectiveUrl || youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm px-4 py-2">
                    Ouvrir dans un nouvel onglet
                  </a>
                )}
              </div>
            )}
          </div>

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
