'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Package, Upload, X } from 'lucide-react'

interface Article {
  id: string
  nom: string
  slug: string
  description: string | null
  description_courte: string | null
  photos: string[]
  numero_serie: string | null
  valeur_declaree: number | null
  prix_jour: number | null
  prix_weekend: number | null
  prix_semaine: number | null
  prix_mois: number | null
  caution: number
  accessoires_inclus: string | null
  disponible: boolean
  stock: number
  categorie: string
  position: number
  publie: boolean
  created_at: string
}

const CATEGORIES = ['instrument', 'accessoire', 'autre']
const EMPTY_FORM = {
  nom: '', slug: '', description: '', description_courte: '',
  numero_serie: '', valeur_declaree: '', prix_jour: '', prix_weekend: '',
  prix_semaine: '', prix_mois: '', caution: '', accessoires_inclus: '',
  disponible: true, stock: '1', categorie: 'instrument', position: '0', publie: false,
}

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminLocationCataloguePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Article | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [photos, setPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadArticles() }, [])

  async function loadArticles() {
    setLoading(true)
    const data = await fetch('/api/admin/location/catalogue').then(r => r.json()).catch(() => [])
    setArticles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openNew() {
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
    setPhotos([])
    setShowForm(true)
  }

  function openEdit(a: Article) {
    setEditItem(a)
    setForm({
      nom: a.nom, slug: a.slug,
      description: a.description || '', description_courte: a.description_courte || '',
      numero_serie: a.numero_serie || '', valeur_declaree: a.valeur_declaree?.toString() || '',
      prix_jour: a.prix_jour?.toString() || '', prix_weekend: a.prix_weekend?.toString() || '',
      prix_semaine: a.prix_semaine?.toString() || '', prix_mois: a.prix_mois?.toString() || '',
      caution: a.caution.toString(), accessoires_inclus: a.accessoires_inclus || '',
      disponible: a.disponible, stock: a.stock.toString(),
      categorie: a.categorie, position: a.position.toString(), publie: a.publie,
    })
    setPhotos(a.photos || [])
    setShowForm(true)
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'location')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setPhotos(prev => [...prev, data.url])
    } catch { alert('Erreur lors de l\'upload de la photo') }
    setUploadingPhoto(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        photos,
        valeur_declaree: form.valeur_declaree ? parseFloat(form.valeur_declaree) : null,
        prix_jour: form.prix_jour ? parseFloat(form.prix_jour) : null,
        prix_weekend: form.prix_weekend ? parseFloat(form.prix_weekend) : null,
        prix_semaine: form.prix_semaine ? parseFloat(form.prix_semaine) : null,
        prix_mois: form.prix_mois ? parseFloat(form.prix_mois) : null,
        caution: parseFloat(form.caution) || 0,
        stock: parseInt(form.stock) || 1,
        position: parseInt(form.position) || 0,
      }
      const method = editItem ? 'PATCH' : 'POST'
      const body = editItem ? { id: editItem.id, ...payload } : payload
      const res = await fetch('/api/admin/location/catalogue', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erreur') }
      await loadArticles()
      setShowForm(false)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet article ? Cette action est irréversible.')) return
    await fetch('/api/admin/location/catalogue', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  async function togglePublish(a: Article) {
    await fetch('/api/admin/location/catalogue', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, publie: !a.publie }),
    })
    setArticles(prev => prev.map(x => x.id === a.id ? { ...x, publie: !x.publie } : x))
  }

  function f(val: number | null) {
    if (val === null) return '—'
    return val.toFixed(2).replace('.', ',') + ' €'
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Catalogue de location</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez vos instruments et accessoires disponibles à la location</p>
        </div>
        <div className="flex gap-2">
          {showForm && (
            <button onClick={() => setShowForm(false)} className="btn-outline text-sm">
              ← Retour à la liste
            </button>
          )}
          {!showForm && (
            <button onClick={openNew} className="btn-gold flex items-center gap-2">
              <Plus size={16} /> Nouvel article
            </button>
          )}
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSave} className="space-y-5 max-w-4xl">
          {/* Infos générales */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4">
              {editItem ? 'Modifier l\'article' : 'Nouvel article'}
            </h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">Nom de l'article *</label>
                  <input value={form.nom} onChange={e => {
                    const nom = e.target.value
                    setForm(f => ({ ...f, nom, slug: editItem ? f.slug : slugify(nom) }))
                  }} className="input w-full" placeholder="Ex : Clavier Yamaha P-45" required />
                </div>
                <div>
                  <label className="label mb-1.5 block">Slug (URL) *</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    className="input w-full font-mono text-sm" placeholder="clavier-yamaha-p45" required />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label mb-1.5 block">Catégorie</label>
                  <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="input w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label mb-1.5 block">Stock (nb d'exemplaires)</label>
                  <input type="number" min="0" value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="label mb-1.5 block">Position d'affichage</label>
                  <input type="number" min="0" value={form.position}
                    onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="input w-full" />
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block">Description courte (affichée dans la liste)</label>
                <input value={form.description_courte}
                  onChange={e => setForm(f => ({ ...f, description_courte: e.target.value }))}
                  className="input w-full" placeholder="Résumé en une phrase..." />
              </div>

              <div>
                <label className="label mb-1.5 block">Description complète</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input w-full h-28 resize-none" placeholder="Description détaillée de l'article..." />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">Numéro de série</label>
                  <input value={form.numero_serie}
                    onChange={e => setForm(f => ({ ...f, numero_serie: e.target.value }))}
                    className="input w-full" placeholder="SN-XXXXXXXX" />
                </div>
                <div>
                  <label className="label mb-1.5 block">Valeur déclarée (€)</label>
                  <input type="number" step="0.01" min="0" value={form.valeur_declaree}
                    onChange={e => setForm(f => ({ ...f, valeur_declaree: e.target.value }))}
                    className="input w-full" placeholder="500.00" />
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block">Accessoires inclus</label>
                <input value={form.accessoires_inclus}
                  onChange={e => setForm(f => ({ ...f, accessoires_inclus: e.target.value }))}
                  className="input w-full" placeholder="Ex : Housse, pédale sustain, alimentation, câble USB" />
              </div>
            </div>
          </div>

          {/* Tarifs */}
          <div className="card">
            <h2 className="text-white font-semibold mb-1">Tarifs de location</h2>
            <p className="text-noir-500 text-xs mb-4">Laissez vide si la durée n'est pas disponible pour cet article.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'prix_jour', label: 'Prix / jour (€)' },
                { key: 'prix_weekend', label: 'Prix / week-end (€)' },
                { key: 'prix_semaine', label: 'Prix / semaine (€)' },
                { key: 'prix_mois', label: 'Prix / mois (€)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="label mb-1.5 block text-xs">{label}</label>
                  <input type="number" step="0.01" min="0"
                    value={form[key as keyof typeof form] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input w-full" placeholder="—" />
                </div>
              ))}
            </div>
            <div className="mt-4 max-w-xs">
              <label className="label mb-1.5 block">Caution (€) *</label>
              <input type="number" step="0.01" min="0" value={form.caution}
                onChange={e => setForm(f => ({ ...f, caution: e.target.value }))}
                className="input w-full" placeholder="200.00" required />
            </div>
          </div>

          {/* Photos */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4">Photos</h2>
            <div className="flex flex-wrap gap-3 mb-3">
              {photos.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-noir-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-noir-700 hover:border-gold-500/50 flex flex-col items-center justify-center gap-1 text-noir-500 hover:text-gold-400 transition-colors">
                {uploadingPhoto ? (
                  <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={18} />
                    <span className="text-[10px]">Ajouter</span>
                  </>
                )}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]) }} />
            <p className="text-noir-600 text-xs">La première photo sera utilisée comme image principale.</p>
          </div>

          {/* Statut */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4">Statut</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-2 block">Disponibilité</label>
                <div className="flex gap-2">
                  {[{ v: true, l: 'Disponible' }, { v: false, l: 'Indisponible' }].map(x => (
                    <button key={String(x.v)} type="button"
                      onClick={() => setForm(f => ({ ...f, disponible: x.v }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.disponible === x.v
                          ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                          : 'border-noir-700 text-noir-400'
                      }`}>
                      {x.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label mb-2 block">Publication</label>
                <div className="flex gap-2">
                  {[{ v: false, l: 'Brouillon' }, { v: true, l: 'Publié' }].map(x => (
                    <button key={String(x.v)} type="button"
                      onClick={() => setForm(f => ({ ...f, publie: x.v }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.publie === x.v
                          ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                          : 'border-noir-700 text-noir-400'
                      }`}>
                      {x.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            <button type="submit" disabled={saving} className="btn-gold">
              {saving ? 'Enregistrement...' : editItem ? 'Enregistrer les modifications' : 'Créer l\'article'}
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      {!showForm && (
        loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : articles.length === 0 ? (
          <div className="card text-center py-16">
            <Package size={40} className="text-noir-700 mx-auto mb-4" />
            <p className="text-noir-400 text-lg mb-4">Aucun article dans le catalogue</p>
            <button onClick={openNew} className="btn-gold">Créer le premier article</button>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(a => (
              <div key={a.id} className="card flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Photo */}
                  <div className="w-16 h-16 rounded-xl bg-noir-800 border border-noir-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {a.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.photos[0]} alt={a.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-noir-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.publie ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-noir-500 border-noir-700'
                      }`}>
                        {a.publie ? 'Publié' : 'Brouillon'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.disponible ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
                      }`}>
                        {a.disponible ? 'Disponible' : 'Indisponible'}
                      </span>
                      <span className="text-xs text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-full capitalize">{a.categorie}</span>
                      <span className="text-xs text-noir-500">Stock : {a.stock}</span>
                    </div>
                    <h3 className="text-white font-semibold truncate">{a.nom}</h3>
                    {a.description_courte && (
                      <p className="text-noir-400 text-sm mt-0.5 truncate">{a.description_courte}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-noir-500">
                      {a.prix_jour && <span>Jour : <span className="text-white">{f(a.prix_jour)}</span></span>}
                      {a.prix_weekend && <span>Week-end : <span className="text-white">{f(a.prix_weekend)}</span></span>}
                      {a.prix_semaine && <span>Semaine : <span className="text-white">{f(a.prix_semaine)}</span></span>}
                      {a.prix_mois && <span>Mois : <span className="text-white">{f(a.prix_mois)}</span></span>}
                      <span>Caution : <span className="text-gold-400">{f(a.caution)}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => togglePublish(a)}
                    className={`p-1.5 rounded transition-colors ${a.publie ? 'text-green-400 hover:text-noir-400' : 'text-noir-600 hover:text-green-400'}`}
                    title={a.publie ? 'Dépublier' : 'Publier'}>
                    {a.publie ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => openEdit(a)} className="text-noir-600 hover:text-gold-400 p-1.5 rounded transition-colors" title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="text-noir-600 hover:text-red-400 p-1.5 rounded transition-colors" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}