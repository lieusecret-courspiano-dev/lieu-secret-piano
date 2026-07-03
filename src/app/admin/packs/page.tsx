'use client'
import { usePathname } from 'next/navigation'

import { useState, useEffect } from 'react'
import { Search, Plus, ToggleLeft, ToggleRight, Copy, Check, BookOpen , Download } from 'lucide-react'

interface CoursePack {
  id: string
  code: string
  pack_label: string
  heures_total: number
  heures_restantes: number
  montant: number
  acheteur_nom: string
  acheteur_email: string
  status: string
  expires_at: string
  created_at: string
}

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif',    color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  used:   { label: 'Épuisé',   color: 'bg-noir-500/10 text-noir-400 border-noir-500/20'   },
  expired:{ label: 'Expiré',   color: 'bg-red-500/10 text-red-400 border-red-500/20'      },
  disabled:{ label: 'Désactivé', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
}

// Fallback si les paramètres admin ne sont pas encore chargés
const PACK_OPTIONS = [
  { label: 'Pack 5h',  heures: 5,  montant: 100 },
  { label: 'Pack 8h',  heures: 8,  montant: 165 },
  { label: 'Pack 12h', heures: 12, montant: 250 },
]

function exportExcel(packs: CoursePack[]) {
  import('xlsx').then(XLSX => {
    const data = packs.map(p => ({ 'Code': p.code, 'Élève': p.acheteur_nom, 'Email': p.acheteur_email, 'Pack': p.pack_label, 'H. restantes': p.heures_restantes, 'H. total': p.heures_total, 'Montant (€)': p.montant, 'Statut': STATUS[p.status]?.label || p.status, 'Expire le': new Date(p.expires_at).toLocaleDateString('fr-FR') }))
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Packs'); XLSX.writeFile(wb, `packs-${new Date().toISOString().split('T')[0]}.xlsx`)
  })
}

function exportPDF(packs: CoursePack[]) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }); const W = 297
    doc.setFillColor(245, 158, 11); doc.rect(0, 0, W, 18, 'F'); doc.setTextColor(26, 26, 46); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('LIEU SECRET — Packs de cours', 10, 12); doc.setFontSize(8); doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${packs.length} packs`, 200, 12)
    const cols = ['Code', 'Eleve', 'Email', 'Pack', 'H.rest', 'H.tot', 'Montant', 'Statut', 'Expire']; const widths = [28, 32, 48, 24, 14, 14, 20, 22, 24]; let x = 10, y = 28
    doc.setFillColor(37, 37, 64); doc.rect(10, y - 5, W - 20, 8, 'F'); doc.setTextColor(245, 158, 11); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); for (let ci = 0; ci < cols.length; ci++) { doc.text(cols[ci], x, y); x += widths[ci] }
    doc.setFont('helvetica', 'normal')
    for (let ri = 0; ri < packs.length; ri++) {
      const p = packs[ri]; y += 8; if (y > 190) { doc.addPage(); y = 20 }
      if (ri % 2 === 0) { doc.setFillColor(50, 50, 80); doc.rect(10, y - 5, W - 20, 8, 'F') } else { doc.setFillColor(37, 37, 64); doc.rect(10, y - 5, W - 20, 8, 'F') }
      doc.setTextColor(230, 230, 230); x = 10
      const row = [p.code, p.acheteur_nom.substring(0, 14), p.acheteur_email.substring(0, 20), p.pack_label.substring(0, 10), p.heures_restantes + 'h', p.heures_total + 'h', p.montant + ' EUR', STATUS[p.status]?.label || p.status, new Date(p.expires_at).toLocaleDateString('fr-FR')]
      for (let ci = 0; ci < row.length; ci++) { doc.text(String(row[ci]), x, y); x += widths[ci] }
    }
    doc.save(`packs-${new Date().toISOString().split('T')[0]}.pdf`)
  }).catch(() => alert('Erreur PDF'))
}

export default function AdminPacks() {
  const pathname = usePathname()
  const [packs, setPacks]       = useState<CoursePack[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<CoursePack | null>(null)
  const [copied, setCopied]     = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [packOptions, setPackOptions] = useState<{ label: string; heures: number; montant: number }[]>([])
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ pack_label: '', heures_total: 5, montant: 100, acheteur_nom: '', acheteur_email: '', date_paiement: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [createError, setCreateError] = useState('')

  const [createForm, setCreateForm] = useState({
    pack_label:       'Pack 5h',
    heures_total:     5,
    heures_utilisees: 0,
    montant:          100,
    acheteur_nom:     '',
    acheteur_email:   '',
    payment_method:   'virement',
    date_paiement:    new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchPacks()
    fetch('/api/settings').then(r => r.json()).then((d: Record<string, string>) => {
      function parseH(label: string): number { const m = label.match(/(\d+)\s*h/i); return m ? parseInt(m[1]) : 5 }
      const loaded: { label: string; heures: number; montant: number }[] = []
      for (let i = 1; i <= 10; i++) {
        const lbl = d[`tarif_pack_label${i}`]; const prix = d[`tarif_pack_prix${i}`]
        if (lbl && prix && parseFloat(prix) > 0) loaded.push({ label: lbl, heures: parseH(lbl), montant: parseFloat(prix) })
      }
      if (loaded.length > 0) {
        setPackOptions(loaded)
        setCreateForm(f => ({ ...f, pack_label: loaded[0].label, heures_total: loaded[0].heures, montant: loaded[0].montant }))
      }
    }).catch(() => {})
  }, [])

  async function fetchPacks() {
    setLoading(true)
    const res  = await fetch('/api/admin/packs')
    const data = await res.json()
    setPacks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setEditSaving(true)
    await fetch(`/api/admin/packs/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_label:    editForm.pack_label,
        heures_total:  editForm.heures_total,
        montant:       editForm.montant,
        acheteur_nom:  editForm.acheteur_nom,
        acheteur_email: editForm.acheteur_email,
        date_paiement: editForm.date_paiement || null,
      }),
    })
    setEditSaving(false)
    setShowEdit(false)
    fetchPacks()
    setSelected(null)
  }

  async function handleToggle(pack: CoursePack) {
    const newStatus = pack.status === 'active' ? 'disabled' : 'active'
    await fetch(`/api/admin/packs/${pack.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchPacks(); setSelected(null)
  }

  async function handleAddHeure(pack: CoursePack) {
    await fetch(`/api/admin/packs/${pack.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heures_restantes: pack.heures_restantes + 1, status: 'active', ajustement: 1, commentaire: (window as Window & { _packAjustCommentaire?: string })._packAjustCommentaire || 'Ajout manuel par l\'administrateur' }),
    })
    fetchPacks(); setSelected(null)
  }

  async function handleRemoveHeure(pack: CoursePack) {
    if (pack.heures_restantes <= 0) return
    const newHeures = pack.heures_restantes - 1
    await fetch(`/api/admin/packs/${pack.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heures_restantes: newHeures, status: newHeures <= 0 ? 'used' : 'active', ajustement: -1, commentaire: (window as Window & { _packAjustCommentaire?: string })._packAjustCommentaire || 'Retrait manuel par l\'administrateur' }),
    })
    fetchPacks(); setSelected(null)
  }

  async function handleDelete(pack: CoursePack) {
    if (!confirm(`Supprimer définitivement le pack de ${pack.acheteur_nom} ?\nCette action est irréversible.`)) return
    await fetch(`/api/admin/packs/${pack.id}`, { method: 'DELETE' })
    fetchPacks(); setSelected(null)
  }

  async function handleConfirmVirement(pack: CoursePack) {
    if (!confirm(`Confirmer le paiement reçu pour ${pack.acheteur_nom} — ${pack.pack_label} ?\n\nUn code PK sera généré et envoyé par email à l'élève.`)) return
    const res = await fetch(`/api/admin/packs/${pack.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm_virement: true }),
    })
    const data = await res.json()
    if (res.ok) {
      alert(`Pack activé ! Code PK : ${data.code || data.pack_code}\nEmail envoyé à ${pack.acheteur_email}`)
      fetchPacks(); setSelected(null)
    } else {
      alert(`Erreur : ${data.error}`)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.acheteur_nom || !createForm.acheteur_email) { setCreateError('Nom et email requis'); return }
    setSaving(true); setCreateError('')
    try {
      const res = await fetch('/api/admin/packs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erreur création')
      setShowCreate(false)
      setCreateForm({ pack_label: 'Pack 5h', heures_total: 5, heures_utilisees: 0, montant: 100, acheteur_nom: '', acheteur_email: '', payment_method: 'virement', date_paiement: new Date().toISOString().split('T')[0] })
      fetchPacks()
    } catch (err: any) {
      setCreateError(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  function copyCode(code: string) { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 2000) }

  function handlePackOptionChange(label: string) {
    if (label === 'Personnalisé') {
      setCreateForm(f => ({ ...f, pack_label: 'Personnalisé', heures_total: 5, montant: 0 }))
      return
    }
    const opt = packOptions.find(p => p.label === label)
    if (opt) setCreateForm(f => ({ ...f, pack_label: opt.label, heures_total: opt.heures, montant: opt.montant }))
    else setCreateForm(f => ({ ...f, pack_label: label }))
  }

  const filtered = packs.filter(p =>
    !search ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.acheteur_nom.toLowerCase().includes(search.toLowerCase()) ||
    p.acheteur_email.toLowerCase().includes(search.toLowerCase())
  )

  const totalActifs  = packs.filter(p => p.status === 'active').length
  const totalHeures  = packs.filter(p => p.status === 'active').reduce((s, p) => s + p.heures_restantes, 0)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Packs de cours</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez les packs d&apos;heures de vos élèves</p>
        </div>
        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
          <a href="/admin/packs" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/packs' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Packs de cours</a>
        <a href="/admin/cadeaux" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/cadeaux' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Bons cadeaux</a>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportExcel(packs)} className="btn-outline text-sm flex items-center gap-1 px-3 py-2"><Download size={14} /> Excel</button>
          <button onClick={() => exportPDF(packs)} className="btn-outline text-sm flex items-center gap-1 px-3 py-2"><Download size={14} /> PDF</button>
          <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2"><Plus size={16} /> Créer un pack</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center"><div className="text-2xl font-bold text-gold-400 mb-1">{packs.length}</div><div className="text-xs text-noir-500 uppercase">Total packs</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-400 mb-1">{totalActifs}</div><div className="text-xs text-noir-500 uppercase">Actifs</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-blue-400 mb-1">{totalHeures}h</div><div className="text-xs text-noir-500 uppercase">Heures restantes</div></div>
      </div>

      {/* Recherche */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par code, nom ou email..." className="input w-full pl-9 max-w-sm" />
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12"><BookOpen size={32} className="text-noir-600 mx-auto mb-3" /><p className="text-noir-400">Aucun pack pour le moment</p><p className="text-noir-600 text-xs mt-2">Créez un pack manuellement ou les élèves en achètent via le site</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-noir-800">
                {['Code','Élève','Pack','Heures','Montant','Statut','Expiration',''].map(h => (
                  <th key={h} className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)} className="border-b border-noir-800/50 hover:bg-noir-800/30 cursor-pointer transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gold-400 text-sm font-bold">{p.code}</span>
                      <button onClick={e => { e.stopPropagation(); copyCode(p.code) }} className="text-noir-600 hover:text-gold-400">
                        {copied === p.code ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4"><p className="text-white text-sm">{p.acheteur_nom}</p><p className="text-noir-500 text-xs">{p.acheteur_email}</p></td>
                  <td className="py-3 px-4 text-noir-300 text-sm">{p.pack_label}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className={`font-bold text-sm ${p.heures_restantes <= 1 ? 'text-red-400' : p.heures_restantes <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>{p.heures_restantes}h</span>
                      <span className="text-noir-600 text-xs">/ {p.heures_total}h</span>
                    </div>
                    <div className="w-full bg-noir-800 rounded-full h-1.5 mt-1">
                      <div className="bg-gold-500 h-1.5 rounded-full" style={{ width: `${(p.heures_restantes / p.heures_total) * 100}%` }} />
                    </div>
                  </td>
                  <td className="py-3 px-4"><span className="text-gold-400 font-medium">{p.montant} €</span></td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS[p.status]?.color || 'text-noir-400'}`}>
                      {STATUS[p.status]?.label || p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-noir-500 text-xs">{new Date(p.expires_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">
                    <button onClick={e => { e.stopPropagation(); handleToggle(p) }} className={`transition-colors ${p.status === 'active' ? 'text-green-400 hover:text-yellow-400' : 'text-noir-600 hover:text-green-400'}`}>
                      {p.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal détail pack */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header fixe */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl flex items-center gap-2">
                <BookOpen size={18} className="text-gold-400" />{selected.pack_label}
              </h2>
              <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Code */}
              <div className="bg-noir-800 rounded-xl p-3 text-center">
                <p className="text-noir-500 text-xs uppercase tracking-widest mb-1">Code</p>
                <p className="font-mono text-gold-400 font-bold tracking-widest text-lg">{selected.code}</p>
              </div>

              {/* Heures */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-noir-400 text-sm">Heures restantes</span>
                  <span className="text-white font-bold">{selected.heures_restantes}h / {selected.heures_total}h</span>
                </div>
                <div className="w-full bg-noir-800 rounded-full h-3">
                  <div className="h-3 rounded-full bg-gold-500 transition-all"
                    style={{ width: `${Math.round(selected.heures_restantes / selected.heures_total * 100)}%` }} />
                </div>
              </div>

              {/* Ajustement rapide */}
              <div>
                <p className="label mb-2 block">Ajustement rapide</p>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => handleRemoveHeure(selected)} disabled={selected.heures_restantes <= 0}
                    className="btn-outline flex-1 text-sm disabled:opacity-40">- 1h</button>
                  <button onClick={() => handleAddHeure(selected)} className="btn-outline flex-1 text-sm">+ 1h</button>
                </div>
                <input
                  type="text"
                  placeholder="Raison (ex: heure offerte, correction...)"
                  className="input w-full text-xs py-2"
                  id="ajustement-commentaire"
                  onChange={e => {
                    // Stocker le commentaire pour les prochains ajustements
                    (window as Window & { _packAjustCommentaire?: string })._packAjustCommentaire = e.target.value
                  }}
                />
                <p className="text-noir-600 text-xs mt-1">Ce commentaire apparaîtra dans l&apos;historique des mouvements.</p>
              </div>

              {/* Infos */}
              <div className="space-y-2">
                {[
                  { label: 'Élève',      value: `${selected.acheteur_nom} (${selected.acheteur_email})` },
                  { label: 'Montant',    value: `${selected.montant} €` },
                  { label: 'Tarif/h',   value: `${Math.round(selected.montant / selected.heures_total * 100) / 100} €/h` },
                  { label: 'Statut',    value: STATUS[selected.status]?.label || selected.status },
                  { label: 'Expiration',value: new Date(selected.expires_at).toLocaleDateString('fr-FR') },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-noir-800 pb-2">
                    <span className="text-noir-400 shrink-0 w-24">{item.label}</span>
                    <span className="text-white text-right text-xs">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Bouton confirmer virement */}
              {selected.status === 'pending_virement' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-400 text-sm font-medium mb-1">Paiement en attente</p>
                  <p className="text-noir-400 text-xs mb-3">Confirmez après réception du virement. Un code PK sera généré et envoyé à l&apos;élève.</p>
                  <button onClick={() => handleConfirmVirement(selected)} className="btn-gold w-full text-sm">
                    Confirmer le paiement reçu
                  </button>
                </div>
              )}
            </div>

            {/* Boutons fixes en bas */}
            <div className="px-6 py-4 border-t border-noir-800 shrink-0">
              <div className="flex gap-2 flex-wrap">
                {(selected.status === 'active' || selected.status === 'disabled') && (
                  <button onClick={() => handleToggle(selected)} className={`flex-1 text-sm ${selected.status === 'active' ? 'btn-outline' : 'btn-gold'}`}>
                    {selected.status === 'active' ? 'Désactiver' : 'Réactiver'}
                  </button>
                )}
                <button onClick={() => copyCode(selected.code)} className="btn-outline flex items-center gap-1 text-sm">
                  {copied === selected.code ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}Copier
                </button>
                <button onClick={() => {
                  setEditForm({
                    pack_label:     selected.pack_label,
                    heures_total:   selected.heures_total,
                    montant:        selected.montant,
                    acheteur_nom:   selected.acheteur_nom,
                    acheteur_email: selected.acheteur_email,
                    date_paiement:  (selected as CoursePack & { date_paiement?: string }).date_paiement || selected.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                  })
                  setShowEdit(true)
                }} className="btn-outline text-sm flex items-center gap-1">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Modifier
                </button>
                <button onClick={async () => {
                  if (!confirm(`Supprimer définitivement le pack de ${selected.acheteur_nom} ?`)) return
                  await fetch(`/api/admin/packs/${selected.id}`, { method: 'DELETE' })
                  fetchPacks(); setSelected(null)
                }} className="btn-outline text-red-400 border-red-500/30 hover:bg-red-500/10 text-sm">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale modification pack */}
      {showEdit && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800">
              <h2 className="text-white font-serif text-xl">Modifier le pack</h2>
              <button onClick={() => setShowEdit(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div><label className="label mb-1 block">Nom du pack *</label>
                <input value={editForm.pack_label} onChange={e => setEditForm(f => ({ ...f, pack_label: e.target.value }))} className="input w-full" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label mb-1 block">Heures total *</label>
                  <input type="number" min="1" value={editForm.heures_total} onChange={e => setEditForm(f => ({ ...f, heures_total: parseInt(e.target.value) || 1 }))} className="input w-full" required />
                </div>
                <div><label className="label mb-1 block">Montant (€) *</label>
                  <input type="number" min="0" step="0.01" value={editForm.montant} onChange={e => setEditForm(f => ({ ...f, montant: parseFloat(e.target.value) || 0 }))} className="input w-full" required />
                </div>
              </div>
              <div><label className="label mb-1 block">Nom de l&apos;élève *</label>
                <input value={editForm.acheteur_nom} onChange={e => setEditForm(f => ({ ...f, acheteur_nom: e.target.value }))} className="input w-full" required />
              </div>
              <div><label className="label mb-1 block">Email de l&apos;élève *</label>
                <input type="email" value={editForm.acheteur_email} onChange={e => setEditForm(f => ({ ...f, acheteur_email: e.target.value }))} className="input w-full" required />
              </div>
              <div>
                <label className="label mb-1 block">Date de paiement</label>
                <input type="date" value={editForm.date_paiement} onChange={e => setEditForm(f => ({ ...f, date_paiement: e.target.value }))} className="input w-full" />
                <p className="text-noir-600 text-xs mt-1">Utilisée pour la comptabilité URSSAF. Modifiez si le paiement a eu lieu avant la création du pack.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" disabled={editSaving} className="btn-gold flex-1">{editSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl flex flex-col overflow-hidden" style={{maxWidth:"420px",maxHeight:"92vh",height:"auto"}}>
            {/* Header fixe */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">Créer un pack manuellement</h2>
              <button onClick={() => setShowCreate(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* Contenu scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <p className="text-noir-400 text-xs mb-4">Pour les élèves ayant payé par virement ou ayant un pack existant.</p>
              <div className="space-y-4">
                <div>
                  <label className="label mb-1 block">Formule</label>
                  <select value={createForm.pack_label} onChange={e => handlePackOptionChange(e.target.value)} className="input w-full">
                    {packOptions.length > 0
                      ? packOptions.map(p => <option key={p.label} value={p.label}>{p.label} — {p.montant} €</option>)
                      : PACK_OPTIONS.map(p => <option key={p.label} value={p.label}>{p.label} — {p.montant} €</option>)
                    }
                    <option value="Personnalisé">Personnalisé</option>
                  </select>
                </div>
                {createForm.pack_label === 'Personnalisé' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label mb-1 block">Heures *</label><input type="number" min="1" value={createForm.heures_total} onChange={e => { const h = parseInt(e.target.value) || 1; setCreateForm(f => ({ ...f, heures_total: h, pack_label: `Pack ${h}h` })) }} className="input w-full" autoFocus /></div>
                    <div><label className="label mb-1 block">Montant (€) *</label><input type="number" min="0" step="0.01" value={createForm.montant} onChange={e => setCreateForm(f => ({ ...f, montant: parseFloat(e.target.value) || 0 }))} className="input w-full" /></div>
                  </div>
                )}
                {createForm.pack_label !== 'Personnalisé' && (
                  <div>
                    <label className="label mb-1 block">Montant payé (€) — modifiable</label>
                    <input type="number" min="0" step="0.01" value={createForm.montant} onChange={e => setCreateForm(f => ({ ...f, montant: parseFloat(e.target.value) || 0 }))} className="input w-full" />
                    <p className="text-noir-600 text-xs mt-1">Modifiez si le montant réel est différent du tarif standard.</p>
                  </div>
                )}
                <div><label className="label mb-1 block">Nom de l&apos;élève *</label><input value={createForm.acheteur_nom} onChange={e => setCreateForm(f => ({ ...f, acheteur_nom: e.target.value }))} placeholder="Prénom Nom" className="input w-full" required /></div>
                <div><label className="label mb-1 block">Email de l&apos;élève *</label><input type="email" value={createForm.acheteur_email} onChange={e => setCreateForm(f => ({ ...f, acheteur_email: e.target.value }))} placeholder="eleve@exemple.com" className="input w-full" required /></div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="label mb-1 block">Heures déjà utilisées</label>
                    <input
                      type="number" min="0" max={createForm.heures_total}
                      value={createForm.heures_utilisees}
                      onChange={e => {
                        const used = Math.min(parseInt(e.target.value) || 0, createForm.heures_total)
                        setCreateForm(f => ({ ...f, heures_utilisees: used }))
                      }}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label mb-1 block">Heures restantes</label>
                    <div className="flex items-center justify-center h-[42px] bg-noir-700 border border-noir-600 rounded-xl px-4">
                      <span className="text-gold-400 font-bold text-lg">{Math.max(0, createForm.heures_total - createForm.heures_utilisees)}h</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label mb-1 block">Mode de paiement</label>
                  <select value={createForm.payment_method} onChange={e => setCreateForm(f => ({ ...f, payment_method: e.target.value }))} className="input w-full">
                    <option value="virement">Virement bancaire</option>
                    <option value="stripe">Carte bancaire (CB)</option>
                    <option value="paypal">PayPal</option>
                    <option value="especes">Espèces</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="label mb-1 block">Date du paiement</label>
                  <input type="date" value={createForm.date_paiement} onChange={e => setCreateForm(f => ({ ...f, date_paiement: e.target.value }))} className="input w-full" />
                </div>
                <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-3 text-sm">
                  <div className="flex justify-between"><span className="text-noir-400">Pack</span><span className="text-white font-medium">{createForm.pack_label}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-noir-400">Heures restantes</span><span className="text-gold-400 font-bold">{Math.max(0, createForm.heures_total - createForm.heures_utilisees)}h</span></div>
                  <div className="flex justify-between mt-1"><span className="text-noir-400">Montant</span><span className="text-gold-400 font-bold">{createForm.montant} €</span></div>
                </div>
                {createError && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{createError}</div>}
              </div>
            </div>
            {/* Boutons fixes en bas */}
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-outline flex-1">Annuler</button>
              <button onClick={handleCreate} className="btn-gold flex-1" disabled={saving}>{saving ? 'Création...' : 'Créer le pack'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale modification pack */}
      {showEdit && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800">
              <h2 className="text-white font-serif text-xl">Modifier le pack</h2>
              <button onClick={() => setShowEdit(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div><label className="label mb-1 block">Nom du pack *</label>
                <input value={editForm.pack_label} onChange={e => setEditForm(f => ({ ...f, pack_label: e.target.value }))} className="input w-full" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label mb-1 block">Heures total *</label>
                  <input type="number" min="1" value={editForm.heures_total} onChange={e => setEditForm(f => ({ ...f, heures_total: parseInt(e.target.value) || 1 }))} className="input w-full" required />
                </div>
                <div><label className="label mb-1 block">Montant (€) *</label>
                  <input type="number" min="0" step="0.01" value={editForm.montant} onChange={e => setEditForm(f => ({ ...f, montant: parseFloat(e.target.value) || 0 }))} className="input w-full" required />
                </div>
              </div>
              <div><label className="label mb-1 block">Nom de l&apos;élève *</label>
                <input value={editForm.acheteur_nom} onChange={e => setEditForm(f => ({ ...f, acheteur_nom: e.target.value }))} className="input w-full" required />
              </div>
              <div><label className="label mb-1 block">Email de l&apos;élève *</label>
                <input type="email" value={editForm.acheteur_email} onChange={e => setEditForm(f => ({ ...f, acheteur_email: e.target.value }))} className="input w-full" required />
              </div>
              <div>
                <label className="label mb-1 block">Date de paiement</label>
                <input type="date" value={editForm.date_paiement} onChange={e => setEditForm(f => ({ ...f, date_paiement: e.target.value }))} className="input w-full" />
                <p className="text-noir-600 text-xs mt-1">Utilisée pour la comptabilité URSSAF. Modifiez si le paiement a eu lieu avant la création du pack.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" disabled={editSaving} className="btn-gold flex-1">{editSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
