'use client'
import { useState, useEffect } from 'react'
import { Plus, Music, Download } from 'lucide-react'

interface Partition { id: string; titre: string; compositeur: string | null; niveau: string; style: string; description: string | null; url_pdf: string; url_audio: string | null; gratuit: boolean; is_active: boolean; created_at: string }

const NIVEAUX = ['tous', 'debutant', 'elementaire', 'intermediaire', 'avance']
const STYLES  = ['classique', 'jazz', 'pop', 'contemporain', 'baroque', 'romantique']
const NIVEAU_LABELS: Record<string, string> = { tous: 'Tous niveaux', debutant: 'Débutant', elementaire: 'Élémentaire', intermediaire: 'Intermédiaire', avance: 'Avancé' }

const EMPTY_FORM = { titre: '', compositeur: '', niveau: 'tous', type: 'pdf', style: 'classique', description: '', url_pdf: '', url_video: '', url_audio: '', url_image: '', gratuit: true }

export default function AdminPartitions() {
  const [partitions, setPartitions] = useState<Partition[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reload = () => fetch('/api/partitions').then(r => r.json()).then(d => { setPartitions(Array.isArray(d) ? d : []); setLoading(false) })
  useEffect(() => { reload() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titre) { setError('Le titre est requis'); return }
    const hasUrl = form.url_pdf || form.url_video || form.url_audio || form.url_image
    if (!hasUrl) { setError('Au moins une URL est requise (PDF, vidéo, audio ou image)'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/partitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur'); return }
      setShowCreate(false); setForm(EMPTY_FORM); await reload()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette partition ?')) return
    await fetch(`/api/partitions?id=${id}`, { method: 'DELETE' })
    setPartitions(p => p.filter(x => x.id !== id))
  }

  async function handleToggle(p: Partition) {
    await fetch('/api/partitions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, is_active: !p.is_active }) })
    await reload()
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-serif text-white">Médiathèque</h1><p className="text-noir-400 text-sm mt-1">{partitions.length} partition{partitions.length > 1 ? 's' : ''}</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2"><Plus size={16} /> Ajouter un contenu</button>
      </div>

      {loading ? <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead><tr className="border-b border-noir-800">{['Titre','Compositeur','Niveau','Style','Statut',''].map(h => <th key={h} className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">{h}</th>)}</tr></thead>
            <tbody>{partitions.map(p => (
              <tr key={p.id} className="border-b border-noir-800/50 hover:bg-noir-800/30 transition-colors">
                <td className="py-3 px-4"><div className="flex items-center gap-2"><Music size={14} className="text-gold-400 shrink-0" /><span className="text-white font-medium">{p.titre}</span></div></td>
                <td className="py-3 px-4 text-noir-400 text-sm">{p.compositeur || '—'}</td>
                <td className="py-3 px-4 text-noir-300 text-sm">{NIVEAU_LABELS[p.niveau] || p.niveau}</td>
                <td className="py-3 px-4 text-noir-300 text-sm capitalize">{p.style}</td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full border ${p.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-noir-700 text-noir-500 border-noir-600'}`}>{p.is_active ? 'Actif' : 'Masqué'}</span></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <a href={p.url_pdf} target="_blank" rel="noopener noreferrer" className="text-noir-400 hover:text-gold-400 transition-colors"><Download size={14} /></a>
                    <button onClick={() => handleToggle(p)} className="text-noir-400 hover:text-gold-400 transition-colors text-xs">{p.is_active ? 'Masquer' : 'Activer'}</button>
                    <button onClick={() => handleDelete(p.id)} className="text-noir-600 hover:text-red-400 transition-colors"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">Ajouter un contenu</h2>
              <button onClick={() => setShowCreate(false)} className="text-noir-400 hover:text-white p-1"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="label mb-1 block">Titre *</label><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ex: Für Elise" className="input w-full" required /></div>
                <div><label className="label mb-1 block">Compositeur</label><input value={form.compositeur} onChange={e => setForm(f => ({ ...f, compositeur: e.target.value }))} placeholder="Ex: Beethoven" className="input w-full" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label mb-1 block">Niveau</label>
                    <select value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))} className="input w-full">
                      {NIVEAUX.map(n => <option key={n} value={n}>{NIVEAU_LABELS[n]}</option>)}
                    </select>
                  </div>
                  <div><label className="label mb-1 block">Style</label>
                    <select value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} className="input w-full">
                      {STYLES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input w-full resize-none" placeholder="Description courte..." /></div>
                <div><label className="label mb-1 block">Type de contenu</label>
                  <select value={form.type || 'pdf'} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                    <option value="pdf">PDF</option>
                    <option value="video">Vidéo (YouTube, Vimeo...)</option>
                    <option value="audio">Audio</option>
                    <option value="partition">Partition</option>
                    <option value="exercice">Exercice</option>
                    <option value="lien">Lien externe</option>
                  </select>
                </div>
                <div><label className="label mb-1 block">URL du PDF</label><input value={form.url_pdf} onChange={e => setForm(f => ({ ...f, url_pdf: e.target.value }))} placeholder="https://... (lien direct vers le PDF)" className="input w-full" /></div>
                <div><label className="label mb-1 block">URL vidéo (YouTube, Vimeo...)</label><input value={form.url_video || ''} onChange={e => setForm(f => ({ ...f, url_video: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className="input w-full" /></div>
                <div><label className="label mb-1 block">URL audio</label><input value={form.url_audio} onChange={e => setForm(f => ({ ...f, url_audio: e.target.value }))} placeholder="https://... (lien vers un fichier audio)" className="input w-full" /></div>
                <div><label className="label mb-1 block">URL image/miniature (optionnel)</label><input value={form.url_image || ''} onChange={e => setForm(f => ({ ...f, url_image: e.target.value }))} placeholder="https://... (aperçu visuel)" className="input w-full" /></div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setForm(f => ({ ...f, gratuit: !f.gratuit }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.gratuit ? 'bg-gold-500' : 'bg-noir-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.gratuit ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm text-noir-300">Accessible à tous les élèves</span>
                </div>
                {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>}
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-outline flex-1">Annuler</button>
              <button onClick={handleCreate} disabled={saving} className="btn-gold flex-1">{saving ? 'Ajout...' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
