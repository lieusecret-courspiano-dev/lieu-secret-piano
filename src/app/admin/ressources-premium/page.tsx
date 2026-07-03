'use client'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle, Clock, ExternalLink } from 'lucide-react'

interface Ressource {
  id: string; titre: string; description: string; type: string
  prix: number; est_gratuit: boolean; est_publie: boolean
  image_url: string | null; youtube_url: string | null; zoom_url: string | null
  fichier_url: string | null; duree_minutes: number | null; nb_places: number | null
  date_coaching: string | null; niveau: string; position: number; created_at: string
  nb_pages?: number | null; taille_fichier?: string | null
  qualite_video?: string | null; format_audio?: string | null
  apercu_duree?: number | null; apercu_pages?: number | null; apercu_url?: string | null
}
interface Achat {
  id: string; ressource_id: string; acheteur_email: string; acheteur_nom: string
  montant: number; payment_method: string; statut: string; created_at: string
  token_acces: string; ressources_premium?: { titre: string }
}

const TYPES = [
  { value: 'video_youtube',  label: 'Vidéo YouTube' },
  { value: 'coaching_visio', label: 'Coaching Visio (Zoom)' },
  { value: 'formation',      label: 'Formation complète' },
  { value: 'documentation',  label: 'Documentation / PDF' },
  { value: 'audio',          label: 'Audio' },
  { value: 'autre',          label: 'Autre' },
]
const NIVEAUX = ['tous', 'debutant', 'intermediaire', 'avance']

const EMPTY = {
  titre: '', description: '', type: 'video_youtube', prix: '', est_gratuit: false,
  est_publie: false, image_url: '', youtube_url: '', zoom_url: '', fichier_url: '',
  duree_minutes: '', nb_places: '', date_coaching: '', niveau: 'tous', position: '0',
  nb_pages: '', taille_fichier: '', qualite_video: 'HD', format_audio: 'MP3',
  apercu_duree: '30', apercu_pages: '3', apercu_url: '',
}

export default function AdminRessourcesPremiumPage() {
  const pathname = usePathname()
  const [ressources, setRessources] = useState<Ressource[]>([])
  const [achats, setAchats] = useState<Achat[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ressources' | 'achats'>('ressources')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Ressource | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [r, a] = await Promise.all([
      fetch('/api/admin/ressources-premium').then(r => r.json()).catch(() => []),
      fetch('/api/admin/ressources-premium?achats=1').then(r => r.json()).catch(() => []),
    ])
    setRessources(Array.isArray(r) ? r : [])
    setAchats(Array.isArray(a) ? a : [])
    setLoading(false)
  }

  function openNew() { setEditItem(null); setForm({ ...EMPTY }); setShowForm(true); setMsg(null) }

  function openEdit(r: Ressource) {
    setEditItem(r)
    setForm({
      titre: r.titre, description: r.description || '', type: r.type,
      prix: r.prix?.toString() || '0', est_gratuit: r.est_gratuit, est_publie: r.est_publie,
      image_url: r.image_url || '', youtube_url: r.youtube_url || '',
      zoom_url: r.zoom_url || '', fichier_url: r.fichier_url || '',
      duree_minutes: r.duree_minutes?.toString() || '', nb_places: r.nb_places?.toString() || '',
      date_coaching: r.date_coaching ? r.date_coaching.slice(0, 16) : '',
      niveau: r.niveau || 'tous', position: r.position?.toString() || '0',
      nb_pages: r.nb_pages?.toString() || '', taille_fichier: r.taille_fichier || '',
      qualite_video: r.qualite_video || 'HD', format_audio: r.format_audio || 'MP3',
      apercu_duree: r.apercu_duree?.toString() || '30',
      apercu_pages: r.apercu_pages?.toString() || '3', apercu_url: r.apercu_url || '',
    })
    setShowForm(true); setMsg(null)
  }

  // Valeur du champ URL principal selon le type
  function getMainUrl() {
    if (form.type === 'video_youtube' || form.type === 'formation') return form.youtube_url
    if (form.type === 'coaching_visio') return form.zoom_url
    return form.fichier_url
  }

  // Mise à jour du champ URL principal
  function setMainUrl(url: string) {
    if (form.type === 'video_youtube' || form.type === 'formation') {
      setForm(f => ({ ...f, youtube_url: url, image_url: url, apercu_url: url }))
    } else if (form.type === 'coaching_visio') {
      setForm(f => ({ ...f, zoom_url: url }))
    } else {
      setForm(f => ({ ...f, fichier_url: url, image_url: url, apercu_url: url }))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
    const payload = {
      ...form,
      prix: parseFloat(form.prix as string) || 0,
      duree_minutes: form.duree_minutes ? parseInt(String(form.duree_minutes)) : null,
      nb_places: form.nb_places ? parseInt(String(form.nb_places)) : null,
      date_coaching: form.date_coaching || null,
      position: parseInt(String(form.position)) || 0,
      nb_pages: form.nb_pages ? parseInt(String(form.nb_pages)) : null,
      apercu_duree: form.apercu_duree ? parseInt(String(form.apercu_duree)) : 30,
      apercu_pages: form.apercu_pages ? parseInt(String(form.apercu_pages)) : 3,
    }
    const method = editItem ? 'PATCH' : 'POST'
    const body   = editItem ? { id: editItem.id, ...payload } : payload
    const res = await fetch('/api/admin/ressources-premium', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      setMsg({ type: 'ok', text: editItem ? 'Ressource modifiée' : 'Ressource créée' })
      await loadData(); setShowForm(false)
    } else {
      const d = await res.json(); setMsg({ type: 'err', text: d.error || 'Erreur' })
    }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette ressource ?')) return
    await fetch('/api/admin/ressources-premium', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setRessources(prev => prev.filter(r => r.id !== id))
  }

  async function togglePublish(r: Ressource) {
    await fetch('/api/admin/ressources-premium', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, est_publie: !r.est_publie }) })
    setRessources(prev => prev.map(x => x.id === r.id ? { ...x, est_publie: !x.est_publie } : x))
  }

  async function confirmAchat(id: string) {
    const res = await fetch('/api/admin/ressources-premium/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ achat_id: id }) })
    if (res.ok) {
      setAchats(prev => prev.map(a => a.id === id ? { ...a, statut: 'confirme' } : a))
      setMsg({ type: 'ok', text: "Accès envoyé à l'acheteur" })
    }
  }

  const typeLabel = (t: string) => TYPES.find(x => x.value === t)?.label || t
  const nbAttente = achats.filter(a => a.statut === 'en_attente').length

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Ressources Premium</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez vos contenus payants (vidéos, coachings, formations...)</p>
        </div>
        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
          <a href="/admin/ressources-premium" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/ressources-premium' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Premium</a>
        <a href="/admin/ressources-admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/ressources-admin' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Élèves</a>
        <a href="/admin/partitions" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/partitions' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Médiathèque</a>
        <a href="/admin/supports" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/supports' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Bibliothèque</a>
        </div>
        {tab === 'ressources' && (
          <button onClick={openNew} className="btn-gold flex items-center gap-2">
            <Plus size={16} /> Nouvelle ressource
          </button>
        )}
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${msg.type === 'ok' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 w-fit mb-6">
        {[
          { key: 'ressources', label: `Ressources (${ressources.length})` },
          { key: 'achats', label: `Achats${nbAttente > 0 ? ` (${nbAttente} en attente)` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'ressources' | 'achats')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : tab === 'ressources' ? (
        <>
          {/* Formulaire */}
          {showForm && (
            <div className="card mb-6 border-gold-500/20 max-h-[80vh] overflow-y-auto">
              <h2 className="text-white font-serif text-xl mb-5 sticky top-0 bg-noir-900 pb-3 border-b border-noir-800">
                {editItem ? 'Modifier la ressource' : 'Nouvelle ressource'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">

                {/* Titre + Type + Niveau */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label mb-1.5 block">Titre *</label>
                    <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Titre de la ressource" />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Niveau</label>
                    <select value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))} className="input w-full">
                      {NIVEAUX.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="label mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input w-full h-20 resize-none" placeholder="Description..." />
                </div>

                {/* Prix + Durée */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label mb-1.5 block">Accès</label>
                    <div className="flex gap-2">
                      {[{ v: false, l: 'Payant' }, { v: true, l: 'Gratuit' }].map(x => (
                        <button key={String(x.v)} type="button" onClick={() => setForm(f => ({ ...f, est_gratuit: x.v }))}
                          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${form.est_gratuit === x.v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>
                          {x.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!form.est_gratuit && (
                    <div>
                      <label className="label mb-1.5 block">Prix (€)</label>
                      <input type="number" min="0" step="0.01" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} className="input w-full" placeholder="29.90" />
                    </div>
                  )}
                  <div>
                    <label className="label mb-1.5 block">Durée (min)</label>
                    <input type="number" min="0" value={form.duree_minutes} onChange={e => setForm(f => ({ ...f, duree_minutes: e.target.value }))} className="input w-full" placeholder="60" />
                  </div>
                </div>

                {/* URL principale selon le type */}
                <div>
                  <label className="label mb-1.5 block">
                    {form.type === 'video_youtube' || form.type === 'formation' ? 'URL YouTube *' :
                     form.type === 'documentation' ? 'URL du PDF (Cloudinary) *' :
                     form.type === 'audio' ? 'URL du fichier audio *' :
                     form.type === 'coaching_visio' ? 'Lien Zoom *' : 'URL du contenu *'}
                  </label>
                  <input
                    value={getMainUrl()}
                    onChange={e => setMainUrl(e.target.value)}
                    className="input w-full"
                    placeholder={
                      form.type === 'video_youtube' ? 'https://youtube.com/watch?v=...' :
                      form.type === 'documentation' ? 'https://res.cloudinary.com/votre-cloud/raw/upload/fichier.pdf' :
                      form.type === 'audio' ? 'https://res.cloudinary.com/votre-cloud/video/upload/audio.mp3' :
                      form.type === 'coaching_visio' ? 'https://zoom.us/j/...' : 'https://...'
                    }
                  />
                  <p className="text-noir-600 text-xs mt-1">
                    {form.type === 'coaching_visio' ? "Lien envoyé à l'acheteur après confirmation du paiement." :
                     form.type === 'documentation' ? 'Sert de miniature, aperçu (N premières pages) et accès complet après achat.' :
                     form.type === 'video_youtube' ? 'La miniature YouTube est générée automatiquement. Sert aussi d\'aperçu avec durée limitée.' :
                     'Sert de miniature, aperçu et accès après achat.'}
                  </p>
                </div>

                {/* Date/places pour coaching visio */}
                {form.type === 'coaching_visio' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label mb-1.5 block">Date et heure</label>
                      <input type="datetime-local" value={form.date_coaching} onChange={e => setForm(f => ({ ...f, date_coaching: e.target.value }))} className="input w-full" />
                    </div>
                    <div>
                      <label className="label mb-1.5 block">Nombre de places</label>
                      <input type="number" min="1" value={form.nb_places} onChange={e => setForm(f => ({ ...f, nb_places: e.target.value }))} className="input w-full" placeholder="10" />
                    </div>
                  </div>
                )}

                {/* Statut + Position */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-2 block">Statut</label>
                    <div className="flex gap-2">
                      {[{ v: false, l: 'Brouillon' }, { v: true, l: 'Publié' }].map(x => (
                        <button key={String(x.v)} type="button" onClick={() => setForm(f => ({ ...f, est_publie: x.v }))}
                          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${form.est_publie === x.v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>
                          {x.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Position (ordre)</label>
                    <input type="number" min="0" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="input w-full" />
                  </div>
                </div>

                {/* Infos techniques */}
                <div className="border-t border-noir-800 pt-4">
                  <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-4">Infos techniques</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {form.type === 'documentation' && (
                      <div>
                        <label className="label mb-1.5 block">Nombre de pages</label>
                        <input type="number" min="1" value={form.nb_pages} onChange={e => setForm(f => ({ ...f, nb_pages: e.target.value }))} className="input w-full" placeholder="42" />
                      </div>
                    )}
                    {form.type === 'documentation' && (
                      <div>
                        <label className="label mb-1.5 block">Pages aperçu (gratuites)</label>
                        <input type="number" min="1" max="10" value={form.apercu_pages} onChange={e => setForm(f => ({ ...f, apercu_pages: e.target.value }))} className="input w-full" placeholder="3" />
                      </div>
                    )}
                    {(form.type === 'video_youtube' || form.type === 'formation' || form.type === 'audio') && (
                      <div>
                        <label className="label mb-1.5 block">Durée aperçu (secondes)</label>
                        <input type="number" min="0" value={form.apercu_duree} onChange={e => setForm(f => ({ ...f, apercu_duree: e.target.value }))} className="input w-full" placeholder="30" />
                      </div>
                    )}
                    <div>
                      <label className="label mb-1.5 block">Taille du fichier</label>
                      <input value={form.taille_fichier} onChange={e => setForm(f => ({ ...f, taille_fichier: e.target.value }))} className="input w-full" placeholder="Ex: 2.4 Mo" />
                    </div>
                    {(form.type === 'video_youtube' || form.type === 'formation') && (
                      <div>
                        <label className="label mb-1.5 block">Qualité vidéo</label>
                        <select value={form.qualite_video} onChange={e => setForm(f => ({ ...f, qualite_video: e.target.value }))} className="input w-full">
                          {['SD', 'HD', 'Full HD', '4K'].map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                      </div>
                    )}
                    {form.type === 'audio' && (
                      <div>
                        <label className="label mb-1.5 block">Format audio</label>
                        <select value={form.format_audio} onChange={e => setForm(f => ({ ...f, format_audio: e.target.value }))} className="input w-full">
                          {['MP3', 'WAV', 'AAC', 'FLAC'].map(fa => <option key={fa} value={fa}>{fa}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                  <button type="submit" disabled={saving} className="btn-gold flex-1">
                    {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste ressources */}
          {ressources.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-noir-400 text-lg mb-4">Aucune ressource créée</p>
              <button onClick={openNew} className="btn-gold">Créer la première ressource</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {ressources.map(r => (
                <div key={r.id} className="card hover:border-noir-700 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded-full border border-gold-500/20">{typeLabel(r.type)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${r.est_publie ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-noir-600 border-noir-700'}`}>
                          {r.est_publie ? 'Publié' : 'Brouillon'}
                        </span>
                        <span className={`text-xs font-semibold ${r.est_gratuit ? 'text-green-400' : 'text-gold-400'}`}>
                          {r.est_gratuit ? 'Gratuit' : `${r.prix} €`}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-sm">{r.titre}</p>
                      {r.description && <p className="text-noir-500 text-xs mt-1 line-clamp-2">{r.description}</p>}
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {r.nb_pages && <span className="text-noir-600 text-xs">{r.nb_pages} pages</span>}
                        {r.qualite_video && (r.type === 'video_youtube' || r.type === 'formation') && <span className="text-noir-600 text-xs">{r.qualite_video}</span>}
                        {r.format_audio && r.type === 'audio' && <span className="text-noir-600 text-xs">{r.format_audio}</span>}
                        {(r.youtube_url || r.fichier_url || r.zoom_url) && <span className="text-green-600 text-xs">URL configurée</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => togglePublish(r)}
                        className={`p-1.5 rounded transition-colors ${r.est_publie ? 'text-green-400 hover:text-noir-400' : 'text-noir-600 hover:text-green-400'}`}>
                        {r.est_publie ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => openEdit(r)} className="text-noir-600 hover:text-gold-400 p-1.5 rounded transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(r.id)} className="text-noir-600 hover:text-red-400 p-1.5 rounded transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        achats.length === 0 ? (
          <div className="card text-center py-16"><p className="text-noir-400">Aucun achat enregistré</p></div>
        ) : (
          <div className="space-y-3">
            {achats.map(a => (
              <div key={a.id} className="card flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{a.ressources_premium?.titre || 'Ressource'}</p>
                  <p className="text-noir-400 text-xs mt-0.5">{a.acheteur_nom} · {a.acheteur_email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gold-400">{a.montant} €</span>
                    <span className="text-xs text-noir-500 capitalize">{a.payment_method}</span>
                    <span className="text-xs text-noir-500">{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${a.statut === 'confirme' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'}`}>
                    {a.statut === 'confirme' ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {a.statut === 'confirme' ? 'Confirmé' : 'En attente'}
                  </span>
                  {a.statut === 'en_attente' && (
                    <button onClick={() => confirmAchat(a.id)} className="btn-gold text-xs px-3 py-1.5">Confirmer</button>
                  )}
                  {a.statut === 'confirme' && (
                    <a href={`/ressources-premium/acces/${a.token_acces}`} target="_blank" rel="noopener noreferrer"
                      className="text-noir-600 hover:text-blue-400 p-1.5 rounded transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}