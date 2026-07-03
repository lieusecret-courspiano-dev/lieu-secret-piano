'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-noir-800/40 border border-noir-700 rounded-xl animate-pulse" />,
})

interface Article {
  id: string; titre: string; slug: string; extrait: string; contenu: string
  categorie: string; image_url: string | null; temps_lecture: string
  est_publie: boolean; created_at: string; updated_at?: string
}

const CATEGORIES = ['Conseils', 'Technique', 'Pédagogie', 'Matériel', 'Actualités']
const EMPTY = { titre: '', extrait: '', contenu: '', categorie: 'Conseils', image_url: '', temps_lecture: '5 min', est_publie: false }

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Article | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'liste' | 'editeur'>('liste')

  useEffect(() => { loadArticles() }, [])

  async function loadArticles() {
    setLoading(true)
    const data = await fetch('/api/admin/blog').then(r => r.json()).catch(() => [])
    setArticles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openNew() {
    setEditItem(null)
    setForm({ ...EMPTY })
    setShowForm(true)
    setTab('editeur')
  }

  function openEdit(a: Article) {
    setEditItem(a)
    setForm({ titre: a.titre, extrait: a.extrait, contenu: a.contenu, categorie: a.categorie, image_url: a.image_url || '', temps_lecture: a.temps_lecture, est_publie: a.est_publie })
    setShowForm(true)
    setTab('editeur')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      let res
      if (editItem) {
        res = await fetch('/api/admin/blog', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
      } else {
        res = await fetch('/api/admin/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      }
      if (res && !res.ok) { const d = await res.json(); throw new Error(d.error || 'Erreur') }
      await loadArticles(); setShowForm(false); setTab('liste')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet article ?')) return
    await fetch('/api/admin/blog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  async function togglePublish(a: Article) {
    await fetch('/api/admin/blog', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, est_publie: !a.est_publie }) })
    setArticles(prev => prev.map(x => x.id === a.id ? { ...x, est_publie: !x.est_publie } : x))
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Blog</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez vos articles de blog</p>
        </div>
        <div className="flex gap-2">
          {showForm && (
            <button onClick={() => { setShowForm(false); setTab('liste') }}
              className="btn-outline text-sm">
              Retour à la liste
            </button>
          )}
          <button onClick={openNew} className="btn-gold flex items-center gap-2">
            <Plus size={16} /> Nouvel article
          </button>
        </div>
      </div>

      {/* Tabs */}
      {showForm && (
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 w-fit mb-6">
          {[{ key: 'editeur', label: 'Éditeur' }, { key: 'liste', label: 'Liste' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'liste' | 'editeur')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Éditeur */}
      {showForm && tab === 'editeur' && (
        <div className="max-w-4xl">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="card">
              <h2 className="text-white font-semibold mb-4">{editItem ? 'Modifier l\'article' : 'Nouvel article'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="label mb-1.5 block">Titre *</label>
                  <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                    className="input w-full text-lg" placeholder="Titre de l'article" required />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label mb-1.5 block">Catégorie</label>
                    <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="input w-full">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Temps de lecture</label>
                    <input value={form.temps_lecture} onChange={e => setForm(f => ({ ...f, temps_lecture: e.target.value }))}
                      className="input w-full" placeholder="5 min" />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Statut</label>
                    <div className="flex gap-2">
                      {[{ v: false, l: 'Brouillon' }, { v: true, l: 'Publié' }].map(x => (
                        <button key={String(x.v)} type="button" onClick={() => setForm(f => ({ ...f, est_publie: x.v }))}
                          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${form.est_publie === x.v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>
                          {x.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5 block">URL de l'image de couverture (optionnel)</label>
                  <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className="input w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="label mb-1.5 block">Extrait / Résumé</label>
                  <textarea value={form.extrait} onChange={e => setForm(f => ({ ...f, extrait: e.target.value }))}
                    className="input w-full h-20 resize-none" placeholder="Courte description de l'article (affiché dans la liste)..." />
                </div>
              </div>
            </div>

            <div className="card">
              <label className="label mb-3 block">Contenu de l'article</label>
              <RichTextEditor
                value={form.contenu}
                onChange={html => setForm(f => ({ ...f, contenu: html }))}
                placeholder="Rédigez votre article ici... Utilisez la barre d'outils pour mettre en forme votre texte."
                minHeight="400px"
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setTab('liste') }} className="btn-outline">Annuler</button>
              <button type="submit" disabled={saving} className="btn-gold">
                {saving ? 'Enregistrement...' : editItem ? 'Enregistrer les modifications' : 'Publier l\'article'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {(!showForm || tab === 'liste') && (
        loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : articles.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-noir-400 text-lg mb-4">Aucun article créé</p>
            <button onClick={openNew} className="btn-gold">Créer le premier article</button>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(a => (
              <div key={a.id} className="card flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${a.est_publie ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-noir-500 border-noir-700'}`}>
                      {a.est_publie ? 'Publié' : 'Brouillon'}
                    </span>
                    <span className="text-xs text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-full">{a.categorie}</span>
                    <span className="text-xs text-noir-500">{a.temps_lecture}</span>
                  </div>
                  <h3 className="text-white font-semibold truncate">{a.titre}</h3>
                  {a.extrait && <p className="text-noir-400 text-sm mt-1 line-clamp-2">{a.extrait}</p>}
                  <p className="text-noir-600 text-xs mt-1">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={`/blog/${a.slug}`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded text-noir-600 hover:text-blue-400 transition-colors" title="Voir l'article">
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={() => togglePublish(a)}
                    className={`p-1.5 rounded transition-colors ${a.est_publie ? 'text-green-400 hover:text-noir-400' : 'text-noir-600 hover:text-green-400'}`}>
                    {a.est_publie ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => openEdit(a)} className="text-noir-600 hover:text-gold-400 p-1.5 rounded transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="text-noir-600 hover:text-red-400 p-1.5 rounded transition-colors">
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