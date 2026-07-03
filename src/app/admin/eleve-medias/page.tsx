'use client'
import { useState, useEffect, useRef } from 'react'
import { Mic, Video, Link as LinkIcon, MessageSquare, Play, Pause, CheckCircle } from 'lucide-react'

interface MediaPriv {
  id: string; titre: string; description: string | null; type: string
  url: string | null; storage_path: string | null; taille_bytes: number | null
  commentaire_admin: string | null; commentaire_at: string | null
  lu_admin: boolean; lu_eleve: boolean; created_at: string
  eleves: { id: string; prenom: string; nom: string; email: string } | null
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
  const ref = useRef<HTMLAudioElement | null>(null)

  if (type === 'video') {
    return <video controls className="w-full rounded-xl max-h-56 bg-noir-950" src={url}>Votre navigateur ne supporte pas la vidéo.</video>
  }

  return (
    <div className="flex items-center gap-3 bg-noir-800 rounded-xl px-4 py-3">
      <audio ref={ref} src={url}
        onTimeUpdate={() => { if (ref.current) setProgress((ref.current.currentTime / ref.current.duration) * 100) }}
        onLoadedMetadata={() => { if (ref.current) setDuration(ref.current.duration) }}
        onEnded={() => setPlaying(false)} />
      <button onClick={() => {
        if (!ref.current) return
        if (playing) { ref.current.pause(); setPlaying(false) } else { ref.current.play(); setPlaying(true) }
      }} className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center shrink-0 hover:bg-gold-400 transition-colors">
        {playing ? <Pause size={14} className="text-noir-950" /> : <Play size={14} className="text-noir-950 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="w-full bg-noir-700 rounded-full h-1.5 cursor-pointer" onClick={e => {
          if (!ref.current || !ref.current.duration) return
          const rect = e.currentTarget.getBoundingClientRect()
          ref.current.currentTime = ((e.clientX - rect.left) / rect.width) * ref.current.duration
        }}>
          <div className="h-1.5 rounded-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        {duration > 0 && <p className="text-[10px] text-noir-600 mt-1">{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</p>}
      </div>
    </div>
  )
}

export default function AdminEleveMedias() {
  const [medias, setMedias] = useState<MediaPriv[]>([])
  const [loading, setLoading] = useState(true)
  const [nbEnregNonLus, setNbEnregNonLus] = useState(0)
  const [selected, setSelected] = useState<MediaPriv | null>(null)
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterEleve, setFilterEleve] = useState('tous')
  const [refreshingUrl, setRefreshingUrl] = useState<string | null>(null)

  useEffect(() => { loadMedias() }, [])

  async function loadMedias() {
    setLoading(true)
    const data = await fetch('/api/admin/eleve-medias').then(r => r.json())
    const mediasList = Array.isArray(data) ? data : []
    setMedias(mediasList)
    setNbEnregNonLus(mediasList.filter((m: MediaPriv) => !m.lu_admin).length)
    setLoading(false)
  }

  async function handleDeleteMedia(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer cet enregistrement ? Le fichier sera supprimé de Cloudinary.')) return
    await fetch('/api/admin/eleve-medias', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMedias(prev => {
      const updated = prev.filter(m => m.id !== id)
      setNbEnregNonLus(updated.filter(m => !m.lu_admin).length)
      return updated
    })
    if (selected?.id === id) setSelected(null)
  }

  async function openMedia(m: MediaPriv) {
    setSelected(m)
    setCommentaire(m.commentaire_admin || '')

    // Marquer comme lu
    if (!m.lu_admin) {
      await fetch('/api/admin/eleve-medias', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) })
      setMedias(prev => {
        const updated = prev.map(x => x.id === m.id ? { ...x, lu_admin: true } : x)
        // Mettre à jour le compteur badge
        const newCount = updated.filter(x => !x.lu_admin).length
        setNbEnregNonLus(newCount)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('enreg-admin-count-update', { detail: { count: newCount } }))
        }
        return updated
      })
    }

    // Si fichier Storage, rafraîchir l'URL signée
    if (m.storage_path && !m.url?.includes('token=')) {
      setRefreshingUrl(m.id)
      const res = await fetch('/api/admin/eleve-medias', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, refresh_url: true }) })
      const data = await res.json()
      if (data.url) {
        setSelected(prev => prev ? { ...prev, url: data.url } : null)
        setMedias(prev => prev.map(x => x.id === m.id ? { ...x, url: data.url } : x))
      }
      setRefreshingUrl(null)
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !commentaire.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/eleve-medias', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, commentaire_admin: commentaire }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMedias(prev => prev.map(m => m.id === selected.id ? { ...m, commentaire_admin: updated.commentaire_admin, commentaire_at: updated.commentaire_at } : m))
        setSelected(prev => prev ? { ...prev, commentaire_admin: updated.commentaire_admin, commentaire_at: updated.commentaire_at } : null)
      } else {
        const d = await res.json(); alert(d.error || 'Erreur lors de la sauvegarde')
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  // nbNonLus géré par l'état nbEnregNonLus
  const eleves = Array.from(new Map(medias.filter(m => m.eleves).map(m => [m.eleves!.id, m.eleves!])).values())
  const filtered = filterEleve === 'tous' ? medias : medias.filter(m => m.eleves?.id === filterEleve)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white flex items-center gap-3">
            Enregistrements élèves
            {nbEnregNonLus > 0 && <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full font-normal">{nbEnregNonLus} nouveau{nbEnregNonLus > 1 ? 'x' : ''}</span>}
          </h1>
          <p className="text-noir-400 text-sm mt-1">Écoutez et commentez les enregistrements de vos élèves</p>
        </div>
      </div>

      {/* Filtre par élève */}
      {eleves.length > 1 && (
        <div className="flex gap-1 flex-wrap bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit">
          <button onClick={() => setFilterEleve('tous')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterEleve === 'tous' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
            Tous ({medias.length})
          </button>
          {eleves.map(e => (
            <button key={e.id} onClick={() => setFilterEleve(e.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterEleve === e.id ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {e.prenom} {e.nom}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Mic size={40} className="text-noir-700 mx-auto mb-4" />
          <p className="text-noir-400 text-lg">Aucun enregistrement reçu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} onClick={() => openMedia(m)}
              className={`card cursor-pointer hover:border-gold-500/30 transition-all group ${!m.lu_admin ? 'border-gold-500/20 bg-gold-500/3' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.type === 'video' ? 'bg-blue-500/10' : m.type === 'lien' ? 'bg-purple-500/10' : 'bg-gold-500/10'}`}>
                  {m.type === 'video' ? <Video size={16} className="text-blue-400" /> :
                   m.type === 'lien' ? <LinkIcon size={16} className="text-purple-400" /> :
                   <Mic size={16} className="text-gold-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${!m.lu_admin ? 'text-white' : 'text-noir-300'}`}>{m.titre}</p>
                    {!m.lu_admin && <span className="text-[10px] bg-gold-500/20 text-gold-400 border border-gold-500/30 px-1.5 py-0.5 rounded-full">Nouveau</span>}
                    {m.commentaire_admin && <CheckCircle size={12} className="text-green-400" />}
                  </div>
                  <p className="text-noir-500 text-xs mt-0.5">
                    {m.eleves?.prenom} {m.eleves?.nom} · {new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {m.taille_bytes && ` · ${formatSize(m.taille_bytes)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={e => handleDeleteMedia(m.id, e)}
                    className="text-noir-600 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-noir-600"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale détail + commentaire */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'560px'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <div>
                <p className="text-white font-semibold">{selected.titre}</p>
                <p className="text-noir-500 text-xs">{selected.eleves?.prenom} {selected.eleves?.nom} · {new Date(selected.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { handleDeleteMedia(selected.id, e); setSelected(null) }}
                  className="text-noir-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Supprimer">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
                <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {selected.description && <p className="text-noir-400 text-sm leading-relaxed">{selected.description}</p>}

              {/* Lecteur */}
              {refreshingUrl === selected.id ? (
                <div className="flex items-center justify-center py-6"><div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : selected.url && selected.type !== 'lien' ? (
                <AudioPlayer url={selected.url} type={selected.type} />
              ) : selected.type === 'lien' && selected.url ? (
                <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors">
                  <LinkIcon size={14} /> Ouvrir le lien
                </a>
              ) : null}

              {/* Commentaire existant */}
              {selected.commentaire_admin && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Votre commentaire</p>
                  <p className="text-white text-sm whitespace-pre-wrap">{selected.commentaire_admin}</p>
                </div>
              )}

              {/* Formulaire commentaire */}
              <form onSubmit={handleComment} className="space-y-3">
                <div>
                  <label className="label mb-1 block flex items-center gap-2">
                    <MessageSquare size={12} />
                    {selected.commentaire_admin ? 'Modifier le commentaire' : 'Ajouter un commentaire'}
                  </label>
                  <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                    className="input w-full h-24 resize-none"
                    placeholder="Vos retours sur cet enregistrement... (posture, rythme, doigté, progrès...)" />
                </div>
                <button type="submit" disabled={saving || !commentaire.trim()} className="btn-gold w-full disabled:opacity-50">
                  {saving ? 'Envoi...' : selected.commentaire_admin ? 'Mettre à jour le commentaire' : 'Envoyer le commentaire'}
                </button>
                <p className="text-noir-600 text-xs text-center">L'élève recevra une notification et un email</p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}