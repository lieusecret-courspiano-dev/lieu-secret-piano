'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Star, Pencil } from 'lucide-react'

interface Media {
  id: string
  type: string
  titre: string | null
  description: string | null
  url: string
  auteur: string | null
  is_active: boolean
  position: number
}

const TYPES = [
  { value: 'photo',       label: 'Photo' },
  { value: 'video',       label: 'Vidéo YouTube/Vimeo' },
  { value: 'temoignage',  label: 'Témoignage élève' },
]

const EMPTY = { type: 'photo', titre: '', description: '', url: '', auteur: '', position: 0 }

export default function AdminMedias() {
  const [medias, setMedias]     = useState<Media[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Media | null>(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  useEffect(() => { fetchMedias() }, [])

  async function fetchMedias() {
    setLoading(true)
    const res  = await fetch('/api/medias?admin=true')
    const data = await res.json()
    setMedias(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.url && !editItem) { setError('URL requise'); return }
    setSaving(true); setError('')
    try {

    if (editItem) {
      // Modification
      const res = await fetch(`/api/medias/${editItem.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: form.titre, description: form.description, url: form.url, auteur: form.auteur }),
      })
      if (res.ok) {
        setShowForm(false); setEditItem(null); setForm(EMPTY)
        setSuccess('Média modifié'); setTimeout(() => setSuccess(''), 3000)
        fetchMedias()
      } else {
        const d = await res.json(); setError(d.error || 'Erreur')
      }
    } else {
      // Ajout
      const res = await fetch('/api/medias', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false); setForm(EMPTY)
        setSuccess('Média ajouté'); setTimeout(() => setSuccess(''), 3000)
        fetchMedias()
      } else {
        const d = await res.json(); setError(d.error)
      }
    }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(m: Media) {
    setEditItem(m)
    setForm({ type: m.type, titre: m.titre || '', description: m.description || '', url: m.url, auteur: m.auteur || '', position: m.position })
    setShowForm(true)
    setError('')
  }

  async function handleToggle(m: Media) {
    await fetch(`/api/medias/${m.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !m.is_active }),
    })
    fetchMedias()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce média ?')) return
    await fetch(`/api/medias/${id}`, { method: 'DELETE' })
    fetchMedias()
  }

  function getEmbedUrl(url: string): string {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return url
  }

  const byType = (type: string) => medias.filter(m => m.type === type)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Médias & Témoignages</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez vos photos, vidéos et témoignages d'élèves</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {error   && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-500/50 text-green-300 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-8">
          {TYPES.map(({ value, label }) => (
            <div key={value}>
              <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">{label}s</h2>
              {byType(value).length === 0 ? (
                <p className="text-noir-600 text-sm italic">Aucun {label.toLowerCase()} ajouté</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {byType(value).map(m => (
                    <div key={m.id} className={`card ${!m.is_active ? 'border-yellow-500/30' : ''}`}>
                      {!m.is_active && m.type === 'temoignage' && <div className="mb-2"><span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">En attente de validation</span></div>}
                      {/* Preview */}
                      {value === 'photo' && (
                        <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-noir-800">
                          <img src={m.url} alt={m.titre || ''} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                      {value === 'video' && (
                        <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-noir-800">
                          <iframe src={getEmbedUrl(m.url)} className="w-full h-full" allowFullScreen />
                        </div>
                      )}
                      {value === 'temoignage' && (
                        <div className="bg-noir-800 rounded-lg p-3 mb-3">
                          <p className="text-noir-300 text-sm italic line-clamp-3">{m.description || m.url}</p>
                        </div>
                      )}
                      {/* Infos */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {m.titre && <p className="text-white text-sm font-medium truncate">{m.titre}</p>}
                          {m.auteur && <p className="text-noir-500 text-xs">{m.auteur}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleToggle(m)}
                            className={`p-1.5 rounded transition-colors ${m.is_active ? 'text-green-400 hover:text-noir-400' : 'text-noir-600 hover:text-green-400'}`}
                            title={m.is_active ? 'Désactiver' : 'Activer'}>
                            {m.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button onClick={() => openEdit(m)}
                            className="text-noir-600 hover:text-gold-400 transition-colors p-1.5 rounded" title="Modifier">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(m.id)}
                            className="text-noir-600 hover:text-red-400 transition-colors p-1.5 rounded" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md p-6 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-serif text-xl">{editItem ? 'Modifier le média' : 'Ajouter un média'}</h2>
              <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1 block">
                  {form.type === 'photo' ? 'URL de la photo *' : form.type === 'video' ? 'URL YouTube/Vimeo *' : 'Texte du témoignage *'}
                </label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder={form.type === 'photo' ? 'https://...' : form.type === 'video' ? 'https://youtube.com/watch?v=...' : 'Texte du témoignage...'}
                  className="input w-full"
                  required
                />
                {form.type === 'photo' && (
                  <p className="text-xs text-noir-500 mt-1">Utilisez un lien direct vers une image (Unsplash, Google Drive, etc.)</p>
                )}
              </div>
              <div>
                <label className="label mb-1 block">Titre (optionnel)</label>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Titre du média" className="input w-full" />
              </div>
              {form.type === 'temoignage' && (
                <div>
                  <label className="label mb-1 block">Nom de l'élève</label>
                  <input value={form.auteur} onChange={e => setForm(f => ({ ...f, auteur: e.target.value }))} placeholder="Prénom Nom" className="input w-full" />
                </div>
              )}
              <div>
                <label className="label mb-1 block">Description (optionnel)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input w-full resize-none" />
              </div>
              <div>
                <label className="label mb-1 block">Position (ordre d'affichage)</label>
                <input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: Number(e.target.value) }))} className="input w-full" min={0} />
              </div>
              {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); setForm(EMPTY) }} className="btn-outline flex-1">Annuler</button>
                <button type="submit" className="btn-gold flex-1" disabled={saving}>
                  {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}