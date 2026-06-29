'use client'
import { useState } from 'react'

interface MediaPlayerProps {
  url: string
  titre?: string
  type?: 'video' | 'audio' | 'pdf' | 'auto'
  compact?: boolean
}

function getYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
  return m ? m[1] : null
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

function detectType(url: string): 'youtube' | 'vimeo' | 'video' | 'audio' | 'pdf' | 'image' | 'link' {
  const ytId = getYtId(url)
  if (ytId) return 'youtube'
  const vimeoId = getVimeoId(url)
  if (vimeoId) return 'vimeo'
  const lower = url.toLowerCase()
  if (lower.includes('.mp4') || lower.includes('.webm') || lower.includes('/video/')) return 'video'
  if (lower.includes('.mp3') || lower.includes('.wav') || lower.includes('.aac') || lower.includes('.flac')) return 'audio'
  // OneDrive audio links
  if (lower.includes('1drv.ms') || lower.includes('onedrive.live.com')) return 'audio'
  if (lower.includes('.pdf') || lower.includes('/raw/upload/')) return 'pdf'
  // Supabase Storage — détecter par le type de fichier dans l'URL
  if (lower.includes('supabase.co/storage') || lower.includes('supabase.in/storage')) {
    if (lower.includes('pdf') || lower.includes('document')) return 'pdf'
    if (lower.includes('mp3') || lower.includes('wav') || lower.includes('audio')) return 'audio'
    if (lower.includes('mp4') || lower.includes('video')) return 'video'
    return 'link' // Lien de téléchargement pour les autres fichiers Supabase
  }
  if (lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.webp')) return 'image'
  return 'link'
}

export default function MediaPlayer({ url, titre, compact = false }: MediaPlayerProps) {
  const [expanded, setExpanded] = useState(false)
  const mediaType = detectType(url)
  const ytId = getYtId(url)
  const vimeoId = getVimeoId(url)

  if (mediaType === 'youtube' && ytId) {
    if (compact && !expanded) {
      return (
        <button onClick={() => setExpanded(true)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Regarder la vidéo
        </button>
      )
    }
    return (
      <div className="rounded-xl overflow-hidden bg-noir-800" style={{ aspectRatio: '16/9', maxHeight: '220px' }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          className="w-full h-full" allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title={titre || 'Vidéo'} />
      </div>
    )
  }

  if (mediaType === 'vimeo' && vimeoId) {
    if (compact && !expanded) {
      return (
        <button onClick={() => setExpanded(true)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Regarder la vidéo
        </button>
      )
    }
    return (
      <div className="rounded-xl overflow-hidden bg-noir-800" style={{ aspectRatio: '16/9', maxHeight: '220px' }}>
        <iframe src={`https://player.vimeo.com/video/${vimeoId}`} className="w-full h-full" allowFullScreen title={titre || 'Vidéo'} />
      </div>
    )
  }

  if (mediaType === 'video') {
    return (
      <div className="rounded-xl overflow-hidden bg-noir-800" style={{ maxHeight: '220px', aspectRatio: '16/9' }}>
        <video controls className="w-full h-full" controlsList="nodownload">
          <source src={url} />
        </video>
      </div>
    )
  }

  if (mediaType === 'audio') {
    return (
      <div className="bg-noir-800 rounded-xl p-3">
        <audio controls className="w-full" src={url}>
          Votre navigateur ne supporte pas la lecture audio.
        </audio>
      </div>
    )
  }

  if (mediaType === 'pdf') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Ouvrir le PDF
      </a>
    )
  }

  // Lien générique
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Ouvrir le lien
    </a>
  )
}