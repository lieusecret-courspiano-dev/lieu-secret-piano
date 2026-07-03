'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, Video, Music, Link as LinkIcon, CheckCircle, Clock, UserPlus, X, Users } from 'lucide-react'

interface Support {
  id: string; titre: string; description: string | null; niveau: string
  type: string; fichier_url: string | null; fichier_nom: string | null
  apercu_url: string | null; est_gratuit: boolean; prix: number
  est_publie: boolean; nb_pages: number | null; created_at: string
}
interface Achat {
  id: string; support_id: string; acheteur_email: string; acheteur_nom: string
  montant: number; payment_method: string; statut: string; created_at: string
  attribue_manuellement?: boolean; note_admin?: string
  eleves?: { prenom: string; nom: string; email: string }
  supports_pedagogiques?: { titre: string }
}

const NIVEAUX = ['fondamentaux', 'comprehension', 'expression', 'tous']
const TYPES = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'video', label: 'Vidéo', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'lien', label: 'Lien externe', icon: LinkIcon },
]
const EMPTY = { titre: '', description: '', niveau: 'fondamentaux', type: 'pdf', fichier_url: '', fichier_nom: '', apercu_url: '', est_gratuit: false, prix: 5, est_publie: false, nb_pages: '' }
const EMPTY_ATTR = { eleve_email: '', note_admin: '', montant: '', payment_method: 'virement' }

export default function AdminSupportsPage() {
  const [supports, setSupports] = useState<Support[]>([])
  const [achats, setAchats] = useState<Achat[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'supports' | 'achats' | 'attributions'>('supports')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Support | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [showAttrForm, setShowAttrForm] = useState(false)
  const [attrSupportId, setAttrSupportId] = useState<string | null>(null)
  const [attrForm, setAttrForm] = useState({ ...EMPTY_ATTR })
  const [attrMsg, setAttrMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [attributions, setAttributions] = useState<Achat[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [s, a, attr] = await Promise.all([
      fetch('/api/admin/supports').then(r => r.json()),
      fetch('/api/admin/supports?achats=1').then(r => r.json()),
      fetch('/api/admin/supports/attribuer').then(r => r.json()),
    ])
    setSupports(Array.isArray(s) ? s : [])
    setAchats(Array.isArray(a) ? a : [])
    setAttributions(Array.isArray(attr) ? attr : [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
    const payload = { ...form, prix: parseFloat(form.prix as any) || 0, nb_pages: form.nb_pages ? parseInt(form.nb_pages as any) : null }
    if (editItem) {
      await fetch('/api/admin/supports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...payload }) })
    } else {
      await fetch('/api/admin/supports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    await loadData(); setShowForm(false); setEditItem(null); setForm({ ...EMPTY }); } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce support ?')) return
    await fetch('/api/admin/supports', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setSupports(prev => prev.filter(s => s.id !== id))
  }

  async function togglePublish(s: Support) {
    await fetch('/api/admin/supports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, est_publie: !s.est_publie }) })
    setSupports(prev => prev.map(x => x.id === s.id ? { ...x, est_publie: !x.est_publie } : x))
  }

  async function confirmAchat(id: string) {
    await fetch('/api/admin/supports/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ achat_id: id }) })
    setAchats(prev => prev.map(a => a.id === id ? { ...a, statut: 'actif' } : a))
  }

  async function handleAttribuer(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setAttrMsg(null)
    const support = supports.find(s => s.id === attrSupportId)
    const res = await fetch('/api/admin/supports/attribuer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        support_id: attrSupportId,
        eleve_email: attrForm.eleve_email,
        note_admin: attrForm.note_admin,
        montant: attrForm.montant ? parseFloat(attrForm.montant) : support?.prix || 0,
        payment_method: attrForm.payment_method,
      })
    })
    const data = await res.json()
    if (res.ok) {
      setAttrMsg({ type: 'ok', text: `Support attribué à ${data.eleve?.prenom} ${data.eleve?.nom} avec succès. Un email lui a été envoyé.` })
      setAttrForm({ ...EMPTY_ATTR })
      await loadData()
    } else {
      setAttrMsg({ type: 'err', text: data.error || 'Erreur lors de l\'attribution' })
    }
    setSaving(false)
  }

  async function revoquerAcces(achatId: string) {
    if (!confirm('Révoquer l\'accès de cet élève à ce support ?')) return
    await fetch('/api/admin/supports/attribuer', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ achat_id: achatId }) })
    setAttributions(prev => prev.filter(a => a.id !== achatId))
  }

  const TypeIcon = ({ type }: { type: string }) => {
    const t = TYPES.find(x => x.value === type)
    const Icon = t?.icon || FileText
    return <Icon size={14} className="text-gold-400" />
  }

  const nbEnAttente = achats.filter(a => a.statut === 'en_attente').length

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Bibliothèque pédagogique</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez les supports de cours et ressources pédagogiques</p>
        </div>
        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
          <a href="/admin/ressources-premium" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/ressources-premium' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Premium</a>
        <a href="/admin/ressources-admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/ressources-admin' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Élèves</a>
        <a href="/admin/partitions" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/partitions' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Médiathèque</a>
        <a href="/admin/supports" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/supports' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Bibliothèque</a>
        </div>
        {tab === 'supports' && (
          <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ ...EMPTY }) }} className="btn-gold flex items-center gap-2">
            <Plus size={16} /> Nouveau support
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-3"><p className="text-2xl font-bold text-gold-400">{supports.length}</p><p className="text-xs text-noir-400">Supports</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-yellow-400">{nbEnAttente}</p><p className="text-xs text-noir-400">En attente</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-green-400">{attributions.filter(a => a.statut === 'actif').length}</p><p className="text-xs text-noir-400">Accès actifs</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 w-fit mb-6 flex-wrap">
        {[
          { key: 'supports', label: 'Supports' },
          { key: 'achats', label: `Paiements${nbEnAttente > 0 ? ` (${nbEnAttente})` : ''}` },
          { key: 'attributions', label: `Accès élèves (${attributions.filter(a => a.statut === 'actif').length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : tab === 'supports' ? (
        supports.length === 0 ? (
          <div className="card text-center py-16"><p className="text-noir-400 text-lg">Aucun support créé</p></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {supports.map(s => (
              <div key={s.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                      <TypeIcon type={s.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight">{s.titre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-noir-500 capitalize">{s.niveau}</span>
                        <span className="text-xs text-noir-600">·</span>
                        <span className={`text-xs font-medium ${s.est_gratuit ? 'text-green-400' : 'text-gold-400'}`}>
                          {s.est_gratuit ? 'Gratuit' : `${s.prix} €`}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${s.est_publie ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-noir-600 border-noir-700'}`}>
                          {s.est_publie ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                      {s.description && <p className="text-noir-500 text-xs mt-1 line-clamp-1">{s.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setAttrSupportId(s.id); setAttrForm({ ...EMPTY_ATTR, montant: String(s.prix) }); setShowAttrForm(true); setAttrMsg(null) }}
                      title="Attribuer à un élève" className="text-noir-600 hover:text-blue-400 p-1.5 rounded transition-colors"><UserPlus size={14} /></button>
                    <button onClick={() => togglePublish(s)} className={`p-1.5 rounded transition-colors ${s.est_publie ? 'text-green-400 hover:text-noir-400' : 'text-noir-600 hover:text-green-400'}`}>
                      {s.est_publie ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => { setEditItem(s); setForm({ titre: s.titre, description: s.description || '', niveau: s.niveau, type: s.type, fichier_url: s.fichier_url || '', fichier_nom: s.fichier_nom || '', apercu_url: s.apercu_url || '', est_gratuit: s.est_gratuit, prix: s.prix, est_publie: s.est_publie, nb_pages: s.nb_pages?.toString() || '' }); setShowForm(true) }}
                      className="text-noir-600 hover:text-gold-400 p-1.5 rounded transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-noir-600 hover:text-red-400 p-1.5 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'achats' ? (
        achats.length === 0 ? (
          <div className="card text-center py-16"><p className="text-noir-400 text-lg">Aucun paiement enregistré</p></div>
        ) : (
          <div className="space-y-3">
            {achats.map(a => (
              <div key={a.id} className="card flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-white font-medium text-sm">{a.supports_pedagogiques?.titre || 'Support'}</p>
                  <p className="text-noir-400 text-xs mt-0.5">{a.acheteur_email} · {a.montant} € · {a.payment_method}</p>
                  <p className="text-noir-600 text-xs">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${a.statut === 'actif' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'}`}>
                    {a.statut === 'actif' ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {a.statut === 'actif' ? 'Confirmé' : 'En attente'}
                  </span>
                  {a.statut === 'en_attente' && (
                    <button onClick={() => confirmAchat(a.id)} className="btn-gold text-xs px-3 py-1.5">Confirmer</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Onglet Attributions */
        <div>
          <div className="card mb-4 border-blue-500/20 bg-blue-500/5">
            <div className="flex items-start gap-3">
              <Users size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm">Attribution manuelle</p>
                <p className="text-noir-400 text-xs mt-1">
                  Attribuez un support à un élève qui a déjà acheté avant la mise en place du système, ou offrez un accès gratuit.
                  L'élève recevra un email de notification automatiquement.
                </p>
              </div>
            </div>
          </div>

          {/* Sélecteur de support pour attribution rapide */}
          <div className="card mb-6">
            <p className="text-white font-medium text-sm mb-3">Attribuer un support à un élève</p>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label mb-1 block">Support</label>
                <select value={attrSupportId || ''} onChange={e => { setAttrSupportId(e.target.value); const s = supports.find(x => x.id === e.target.value); setAttrForm(f => ({ ...f, montant: String(s?.prix || 0) })) }} className="input w-full">
                  <option value="">Sélectionner un support...</option>
                  {supports.map(s => <option key={s.id} value={s.id}>{s.titre} — {s.est_gratuit ? 'Gratuit' : `${s.prix} €`}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1 block">Email de l'élève *</label>
                <input value={attrForm.eleve_email} onChange={e => setAttrForm(f => ({ ...f, eleve_email: e.target.value }))} className="input w-full" placeholder="eleve@exemple.com" type="email" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="label mb-1 block">Montant payé (€)</label>
                <input type="number" min="0" step="0.01" value={attrForm.montant} onChange={e => setAttrForm(f => ({ ...f, montant: e.target.value }))} className="input w-full" placeholder="0" />
              </div>
              <div>
                <label className="label mb-1 block">Mode de paiement</label>
                <select value={attrForm.payment_method} onChange={e => setAttrForm(f => ({ ...f, payment_method: e.target.value }))} className="input w-full">
                  <option value="virement">Virement bancaire</option>
                  <option value="especes">Espèces</option>
                  <option value="paypal">PayPal</option>
                  <option value="offert">Offert</option>
                  <option value="manuel">Attribution manuelle</option>
                </select>
              </div>
              <div>
                <label className="label mb-1 block">Note (optionnel)</label>
                <input value={attrForm.note_admin} onChange={e => setAttrForm(f => ({ ...f, note_admin: e.target.value }))} className="input w-full" placeholder="Ex: Acheté avant le système" />
              </div>
            </div>
            {attrMsg && (
              <div className={`text-sm px-4 py-3 rounded-xl mb-3 ${attrMsg.type === 'ok' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {attrMsg.text}
              </div>
            )}
            <button onClick={handleAttribuer as any} disabled={saving || !attrSupportId || !attrForm.eleve_email} className="btn-gold flex items-center gap-2 disabled:opacity-50">
              <UserPlus size={16} /> {saving ? 'Attribution...' : 'Attribuer l\'accès'}
            </button>
          </div>

          {/* Liste des attributions actives */}
          <h3 className="text-white font-medium text-sm mb-3">Accès actifs ({attributions.filter(a => a.statut === 'actif').length})</h3>
          {attributions.filter(a => a.statut === 'actif').length === 0 ? (
            <div className="card text-center py-8"><p className="text-noir-400 text-sm">Aucun accès attribué</p></div>
          ) : (
            <div className="space-y-2">
              {attributions.filter(a => a.statut === 'actif').map(a => (
                <div key={a.id} className="card flex items-center justify-between gap-3 flex-wrap py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{a.supports_pedagogiques?.titre || 'Support'}</p>
                    <p className="text-noir-400 text-xs mt-0.5">
                      {a.eleves ? `${a.eleves.prenom} ${a.eleves.nom}` : a.acheteur_nom} · {a.acheteur_email}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-noir-600">{a.montant} € · {a.payment_method}</span>
                      {a.attribue_manuellement && <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Manuel</span>}
                      {a.note_admin && <span className="text-xs text-noir-500 italic">{a.note_admin}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Actif</span>
                    <button onClick={() => revoquerAcces(a.id)} title="Révoquer l'accès" className="text-noir-600 hover:text-red-400 p-1.5 rounded transition-colors"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modale création/édition support */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'520px'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">{editItem ? 'Modifier le support' : 'Nouveau support'}</h2>
              <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSave} id="support-form" className="space-y-4">
                <div><label className="label mb-1 block">Titre *</label><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Titre du support" /></div>
                <div><label className="label mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input w-full h-16 resize-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label mb-1 block">Niveau</label>
                    <select value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))} className="input w-full">
                      {NIVEAUX.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
                    </select>
                  </div>
                  <div><label className="label mb-1 block">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label mb-1 block">URL du fichier / lien</label><input value={form.fichier_url} onChange={e => setForm(f => ({ ...f, fichier_url: e.target.value }))} className="input w-full" placeholder="https://..." /></div>
                <div><label className="label mb-1 block">Nom du fichier (affiché)</label><input value={form.fichier_nom} onChange={e => setForm(f => ({ ...f, fichier_nom: e.target.value }))} className="input w-full" placeholder="Ex: support-cours-piano.pdf" /></div>
                <div><label className="label mb-1 block">URL aperçu / miniature (optionnel)</label><input value={form.apercu_url} onChange={e => setForm(f => ({ ...f, apercu_url: e.target.value }))} className="input w-full" placeholder="https://..." /></div>
                <div>
                  <label className="label mb-2 block">Accès</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: false, l: 'Payant' }, { v: true, l: 'Gratuit' }].map(x => (
                      <button key={String(x.v)} type="button" onClick={() => setForm(f => ({ ...f, est_gratuit: x.v }))}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all ${form.est_gratuit === x.v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>{x.l}</button>
                    ))}
                  </div>
                </div>
                {!form.est_gratuit && (
                  <div><label className="label mb-1 block">Prix (€)</label><input type="number" min="0" step="0.01" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value as any }))} className="input w-full" /></div>
                )}
                <div><label className="label mb-1 block">Nombre de pages (optionnel)</label><input type="number" min="1" value={form.nb_pages} onChange={e => setForm(f => ({ ...f, nb_pages: e.target.value }))} className="input w-full" /></div>
                <div>
                  <label className="label mb-2 block">Statut</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: false, l: 'Brouillon' }, { v: true, l: 'Publié' }].map(x => (
                      <button key={String(x.v)} type="button" onClick={() => setForm(f => ({ ...f, est_publie: x.v }))}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all ${form.est_publie === x.v ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400'}`}>{x.l}</button>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
              <button type="submit" form="support-form" disabled={saving} className="btn-gold flex-1">{saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}