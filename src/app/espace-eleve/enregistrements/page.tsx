'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Upload, Mic, Video, Link as LinkIcon, Trash2, MessageSquare, Play, Pause } from 'lucide-react'

interface MediaPriv {
  id: string; titre: string; description: string | null; type: string
  url: string | null; storage_path: string | null; taille_bytes: number | null
  commentaire_admin: string | null; commentaire_at: string | null
  lu_eleve: boolean; created_at: string
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function AudioPlayer({ url, type }: { url: string; type: string }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const ref = useRef<HTMLAudioElement | HTMLVideoElement | null>(null)

  if (type === 'video') {
    return (
      <video controls className="w-full rounded-xl max-h-48 bg-noir-950" src={url}>
        Votre navigateur ne supporte pas la vidéo.
      </video>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-noir-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
      <audio ref={ref as React.RefObject<HTMLAudioElement>} src={url}
        onTimeUpdate={() => { const a = ref.current as HTMLAudioElement; if (a) setProgress((a.currentTime / a.duration) * 100) }}
        onLoadedMetadata={() => { const a = ref.current as HTMLAudioElement; if (a) setDuration(a.duration) }}
        onEnded={() => setPlaying(false)} />
      <button onClick={() => {
        const a = ref.current as HTMLAudioElement
        if (!a) return
        if (playing) { a.pause(); setPlaying(false) } else { a.play(); setPlaying(true) }
      }} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gold-500 flex items-center justify-center shrink-0 hover:bg-gold-400 transition-colors">
        {playing ? <Pause size={14} className="text-noir-950" /> : <Play size={14} className="text-noir-950 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="w-full bg-noir-700 rounded-full h-1.5 cursor-pointer" onClick={e => {
          const a = ref.current as HTMLAudioElement
          if (!a || !a.duration) return
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          a.currentTime = pct * a.duration
        }}>
          <div className="h-1.5 rounded-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        {duration > 0 && (
          <p className="text-[10px] text-noir-600 mt-1">
            {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  )
}

export default function EnregistrementsPage() {
  const router = useRouter()
  const [medias, setMedias] = useState<MediaPriv[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploadMode, setUploadMode] = useState<'fichier' | 'lien'>('fichier')
  const [form, setForm] = useState({ titre: '', description: '', lien_url: '' })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/medias-prives').then(r => r.json()),
    ]).then(([me, data]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      const mediasList = Array.isArray(data) ? data : []
      setMedias(mediasList)
      // Mettre à jour le badge dans EleveNav
      const nbNouveauxCommentaires = mediasList.filter(
        (m: { commentaire_admin: string | null; lu_eleve: boolean }) => m.commentaire_admin && !m.lu_eleve
      ).length
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('enreg-count-update', { detail: { count: nbNouveauxCommentaires } }))
      }
      // Marquer les commentaires non lus comme lus
      const nonLus = mediasList.filter(
        (m: { id: string; commentaire_admin: string | null; lu_eleve: boolean }) => m.commentaire_admin && !m.lu_eleve
      )
      if (nonLus.length > 0) {
        // Marquer comme lus via PATCH
        nonLus.forEach((m: { id: string }) => {
          fetch('/api/eleve/medias-prives', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: m.id, lu_eleve: true }),
          }).catch(() => {})
        })
        setMedias(prev => prev.map(m => ({ ...m, lu_eleve: true })))
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('enreg-count-update', { detail: { count: 0 } }))
        }
      }
    }).finally(() => setLoading(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titre.trim()) { setError('Titre requis'); return }
    setUploading(true); setError(''); setUploadProgress(0)

    try {
      let url: string | null = null
      let storagePath: string | null = null
      let tailleBytes: number | null = null
      let type = 'audio'

      if (uploadMode === 'fichier' && file) {
        // Étape 1 : Obtenir la signature depuis notre API (sécurisé)
        setUploadProgress(10)
        const sigRes = await fetch('/api/eleve/medias-prives/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name }),
        })
        if (!sigRes.ok) {
          const d = await sigRes.json()
          throw new Error(d.error || 'Erreur de signature')
        }
        const { signature, timestamp, folder, public_id, api_key, cloud_name } = await sigRes.json()

        // Étape 2 : Upload DIRECT vers Cloudinary (contourne la limite Vercel de 4.5 MB)
        setUploadProgress(20)
        const fd = new FormData()
        fd.append('file', file)
        fd.append('signature', signature)
        fd.append('timestamp', String(timestamp))
        fd.append('folder', folder)
        fd.append('public_id', public_id)
        fd.append('api_key', api_key)
        // Note: resource_type est dans l'URL, pas dans les params signés

        // Upload direct vers l'API Cloudinary (pas via Vercel)
        // /auto/upload détecte automatiquement audio ou vidéo
        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
          { method: 'POST', body: fd }
        )
        setUploadProgress(80)

        if (!cloudRes.ok) {
          const d = await cloudRes.json()
          throw new Error(d.error?.message || 'Erreur upload Cloudinary')
        }
        const cloudData = await cloudRes.json()
        url = cloudData.secure_url
        storagePath = cloudData.public_id
        tailleBytes = cloudData.bytes
        type = file.type.startsWith('video') ? 'video' : 'audio'
      } else if (uploadMode === 'lien') {
        if (!form.lien_url.trim()) { setError('URL requise'); setUploading(false); return }
        url = form.lien_url.trim()
        type = 'lien'
      }

      setUploadProgress(90)
      const res = await fetch('/api/eleve/medias-prives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: form.titre, description: form.description || null, type, url, storage_path: storagePath, taille_bytes: tailleBytes }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const created = await res.json()
      setMedias(prev => [created, ...prev])
      setShowForm(false)
      setForm({ titre: '', description: '', lien_url: '' })
      setFile(null)
      setUploadProgress(100)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally { setUploading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet enregistrement ?')) return
    await fetch('/api/eleve/medias-prives', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setMedias(prev => prev.filter(m => m.id !== id))
  }

  const nbNonLus = medias.filter(m => !m.lu_eleve && m.commentaire_admin).length

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-4 md:p-8 pb-24 md:pb-4 md:pb-8">

        {/* Titre */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Mes enregistrements</h1>
            <p className="text-noir-400 text-sm">Envoyez vos exercices à votre professeur pour recevoir des retours</p>
          </div>
          <button onClick={() => { setShowForm(true); setError('') }} className="btn-gold flex items-center gap-2">
            <Upload size={16} /> Envoyer un enregistrement
          </button>
        </div>

        {/* Alerte nouveaux commentaires */}
        {nbNonLus > 0 && (
          <div className="card border-gold-500/30 bg-gold-500/5 mb-6 flex items-center gap-3">
            <MessageSquare size={18} className="text-gold-400 shrink-0" />
            <p className="text-gold-400 text-sm font-medium">
              {nbNonLus} nouveau{nbNonLus > 1 ? 'x' : ''} commentaire{nbNonLus > 1 ? 's' : ''} de votre professeur
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : medias.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
              <Mic size={28} className="text-gold-400" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">Aucun enregistrement</p>
            <p className="text-noir-400 text-sm max-w-sm mx-auto mb-6">Enregistrez vos exercices et envoyez-les à votre professeur pour recevoir des retours personnalisés.</p>
            <button onClick={() => setShowForm(true)} className="btn-gold px-4 md:px-8">Envoyer mon premier enregistrement</button>
          </div>
        ) : (
          <div className="space-y-4">
            {medias.map(m => (
              <div key={m.id} className={`card transition-all ${!m.lu_eleve && m.commentaire_admin ? 'border-gold-500/30 bg-gold-500/3' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.type === 'video' ? 'bg-blue-500/10' : m.type === 'lien' ? 'bg-purple-500/10' : 'bg-gold-500/10'}`}>
                      {m.type === 'video' ? <Video size={14} className="text-blue-400" /> :
                       m.type === 'lien' ? <LinkIcon size={14} className="text-purple-400" /> :
                       <Mic size={14} className="text-gold-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{m.titre}</p>
                      <p className="text-noir-600 text-xs">
                        {new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {m.taille_bytes && ` · ${formatSize(m.taille_bytes)}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(m.id)} className="text-noir-600 hover:text-red-400 p-1 rounded transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>

                {m.description && <p className="text-noir-400 text-xs mb-3 leading-relaxed">{m.description}</p>}

                {/* Lecteur audio/vidéo */}
                {m.url && m.type !== 'lien' && (
                  <div className="mb-3">
                    <AudioPlayer url={m.url} type={m.type} />
                  </div>
                )}

                {/* Lecteur intégré pour liens YouTube/Vimeo */}
                {m.type === 'lien' && m.url && (() => {
                  const ytMatch = m.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
                  const vimeoMatch = m.url.match(/vimeo\.com\/(\d+)/)
                  if (ytMatch) return (
                    <div className="rounded-xl overflow-hidden bg-noir-800 mb-3" style={{ aspectRatio: '16/9', maxHeight: '200px' }}>
                      <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="w-full h-full" allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={m.titre} />
                    </div>
                  )
                  if (vimeoMatch) return (
                    <div className="rounded-xl overflow-hidden bg-noir-800 mb-3" style={{ aspectRatio: '16/9', maxHeight: '200px' }}>
                      <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} className="w-full h-full" allowFullScreen title={m.titre} />
                    </div>
                  )
                  return (
                    <a href={m.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mb-3 transition-colors">
                      <LinkIcon size={14} /> Ouvrir le lien
                    </a>
                  )
                })()}

                {/* Commentaire du professeur */}
                {m.commentaire_admin && (
                  <div className={`rounded-xl p-4 mt-2 ${!m.lu_eleve ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-noir-800/60'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                        <svg width="12" height="12" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <p className="text-gold-400 text-xs font-bold">Commentaire de votre professeur</p>
                      {!m.lu_eleve && <span className="text-[10px] bg-gold-500 text-noir-950 px-1.5 py-0.5 rounded-full font-bold">Nouveau</span>}
                    </div>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{m.commentaire_admin}</p>
                    {m.commentaire_at && (
                      <p className="text-noir-600 text-xs mt-2">{new Date(m.commentaire_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    )}
                  </div>
                )}

                {!m.commentaire_admin && (
                  <p className="text-noir-700 text-xs mt-2 flex items-center gap-1.5">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    En attente du commentaire de votre professeur
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modale envoi */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'480px'}}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
                <h2 className="text-white font-serif text-xl">Envoyer un enregistrement</h2>
                <button onClick={() => { setShowForm(false); setFile(null); setError('') }} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4">
                <form onSubmit={handleSubmit} id="upload-form" className="space-y-4">
                  {/* Mode */}
                  <div>
                    <label className="label mb-2 block">Type d'envoi</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setUploadMode('fichier')}
                        className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${uploadMode === 'fichier' ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
                        <Upload size={16} /> Fichier audio/vidéo
                      </button>
                      <button type="button" onClick={() => setUploadMode('lien')}
                        className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${uploadMode === 'lien' ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
                        <LinkIcon size={16} /> Lien (YouTube, Drive...)
                      </button>
                    </div>
                  </div>

                  <div><label className="label mb-1 block">Titre *</label><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Ex: Gamme de Do majeur - semaine 3" /></div>
                  <div><label className="label mb-1 block">Description (optionnel)</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input w-full h-16 resize-none" placeholder="Ce que vous souhaitez que votre professeur écoute ou remarque..." /></div>

                  {uploadMode === 'fichier' ? (
                    <div>
                      <label className="label mb-2 block">Fichier audio ou vidéo *</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? 'border-gold-500/50 bg-gold-500/5' : 'border-noir-700 hover:border-noir-600'}`}>
                        <input ref={fileInputRef} type="file" accept="audio/*,video/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
                        {file ? (
                          <div>
                            <p className="text-gold-400 font-medium text-sm">{file.name}</p>
                            <p className="text-noir-500 text-xs mt-1">{formatSize(file.size)}</p>
                          </div>
                        ) : (
                          <div>
                            <Upload size={24} className="text-noir-600 mx-auto mb-2" />
                            <p className="text-noir-400 text-sm">Cliquez pour choisir un fichier</p>
                            <p className="text-noir-600 text-xs mt-1">Audio ou vidéo — max 100 Mo · Stockage sécurisé</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="label mb-1 block">URL *</label>
                      <input type="url" value={form.lien_url} onChange={e => setForm(f => ({ ...f, lien_url: e.target.value }))} className="input w-full" placeholder="https://youtube.com/... ou https://drive.google.com/..." />
                      <p className="text-noir-600 text-xs mt-1">YouTube, Google Drive, Dropbox, OneDrive...</p>
                    </div>
                  )}

                  {/* Barre de progression */}
                  {uploading && uploadProgress > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-noir-400 mb-1">
                        <span>Upload en cours...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-noir-800 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full bg-gold-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>}
                </form>
              </div>

              <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setFile(null); setError('') }} className="btn-outline flex-1">Annuler</button>
                <button type="submit" form="upload-form" disabled={uploading || (uploadMode === 'fichier' && !file)} className="btn-gold flex-1 disabled:opacity-50">
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </span>
                  ) : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}