'use client'
import { useState, useEffect } from 'react'
import { Search, Gift, Download, ToggleLeft, ToggleRight, Copy, Check } from 'lucide-react'
interface GiftCard { id: string; code: string; montant: number; montant_restant: number; acheteur_nom: string; acheteur_email: string; destinataire_nom: string; message: string | null; status: string; expires_at: string; created_at: string }
const STATUS: Record<string, { label: string; color: string }> = {
  active:           { label: 'Actif',      color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  used:             { label: 'Utilisé',    color: 'bg-noir-500/10 text-noir-400 border-noir-500/20' },
  expired:          { label: 'Expiré',     color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  disabled:         { label: 'Désactivé',  color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  pending_virement: { label: 'En attente', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
}
function exportExcel(cards: GiftCard[]) {
  import('xlsx').then(XLSX => {
    const data = cards.map(c => ({ 'Code': c.code, 'Acheteur': c.acheteur_nom, 'Email': c.acheteur_email, 'Destinataire': c.destinataire_nom, 'Montant (€)': c.montant, 'Statut': STATUS[c.status]?.label || c.status, 'Expire le': new Date(c.expires_at).toLocaleDateString('fr-FR') }))
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Bons cadeaux'); XLSX.writeFile(wb, `bons-cadeaux-${new Date().toISOString().split('T')[0]}.xlsx`)
  })
}

function exportPDF(cards: GiftCard[]) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const W = 210
    doc.setFillColor(245, 158, 11); doc.rect(0, 0, W, 18, 'F'); doc.setTextColor(26, 26, 46); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('LIEU SECRET — Bons cadeaux', 10, 12); doc.setFontSize(8); doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${cards.length} bons`, 140, 12)
    const cols = ['Code', 'Acheteur', 'Email', 'Destinataire', 'Montant', 'Statut', 'Expire']; const widths = [30, 35, 45, 35, 18, 22, 22]; let x = 8, y = 28
    doc.setFillColor(37, 37, 64); doc.rect(8, y - 5, W - 16, 8, 'F'); doc.setTextColor(245, 158, 11); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); for (let ci = 0; ci < cols.length; ci++) { doc.text(cols[ci], x, y); x += widths[ci] }
    doc.setFont('helvetica', 'normal')
    for (let ri = 0; ri < cards.length; ri++) {
      const c = cards[ri]; y += 8; if (y > 270) { doc.addPage(); y = 20 }
      if (ri % 2 === 0) { doc.setFillColor(50, 50, 80); doc.rect(8, y - 5, W - 16, 8, 'F') } else { doc.setFillColor(37, 37, 64); doc.rect(8, y - 5, W - 16, 8, 'F') }
      doc.setTextColor(230, 230, 230); x = 8
      const row = [c.code, c.acheteur_nom.substring(0, 14), c.acheteur_email.substring(0, 18), c.destinataire_nom.substring(0, 14), c.montant + ' EUR', STATUS[c.status]?.label || c.status, new Date(c.expires_at).toLocaleDateString('fr-FR')]
      for (let ci = 0; ci < row.length; ci++) { doc.text(String(row[ci]), x, y); x += widths[ci] }
    }
    doc.save(`bons-cadeaux-${new Date().toISOString().split('T')[0]}.pdf`)
  }).catch(() => alert('Erreur PDF'))
}

export default function AdminCadeaux() {
  const pathname = usePathname()
  const [cards, setCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GiftCard | null>(null)
  const [copied, setCopied]     = useState('')
  const [showCreate, setShowCreate]   = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError]   = useState('')
  const [createForm, setCreateForm]     = useState({
    acheteur_nom: '', acheteur_email: '', destinataire_nom: '', message: '', montant: 60,
  })
  useEffect(() => { fetch('/api/admin/cadeaux').then(r => r.json()).then(d => { setCards(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false)) }, [])
  async function handleConfirmVirement(card: GiftCard) {
    if (!confirm(`Confirmer le paiement pour ${card.acheteur_nom} ?`)) return
    const res = await fetch(`/api/admin/cadeaux/${card.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm_virement: true }) })
    const data = await res.json()
    if (res.ok) { alert(`Bon cadeau activé ! Code : ${data.code}`); const r = await fetch('/api/admin/cadeaux'); const d = await r.json(); setCards(Array.isArray(d) ? d : []); setSelected(null) }
    else { alert(`Erreur : ${data.error}`) }
  }

  async function handleDelete(card: GiftCard) {
    if (!confirm(`Supprimer le bon cadeau de ${card.acheteur_nom} ?`)) return
    await fetch(`/api/admin/cadeaux/${card.id}`, { method: 'DELETE' })
    const r = await fetch('/api/admin/cadeaux'); const d = await r.json(); setCards(Array.isArray(d) ? d : []); setSelected(null)
  }

  async function handleToggle(card: GiftCard) {
    const newStatus = card.status === 'active' ? 'disabled' : 'active'
    await fetch(`/api/admin/cadeaux/${card.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    const res = await fetch('/api/admin/cadeaux'); const data = await res.json(); setCards(Array.isArray(data) ? data : []); setSelected(null)
  }
  function copyCode(code: string) { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 2000) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.acheteur_nom || !createForm.acheteur_email || !createForm.destinataire_nom) { setCreateError('Nom, email et destinataire requis'); return }
    setCreateSaving(true); setCreateError('')
    const res = await fetch('/api/admin/cadeaux', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    if (res.ok) {
      setShowCreate(false)
      setCreateForm({ acheteur_nom: '', acheteur_email: '', destinataire_nom: '', message: '', montant: 60 })
      const r = await fetch('/api/admin/cadeaux'); const data = await r.json(); setCards(Array.isArray(data) ? data : [])
    } else { const d = await res.json(); setCreateError(d.error || 'Erreur') }
    setCreateSaving(false)
  }
  const filtered = cards.filter(c => !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.acheteur_nom.toLowerCase().includes(search.toLowerCase()) || c.destinataire_nom.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-serif text-white">Bons cadeaux</h1><p className="text-noir-400 text-sm mt-1">Gérez les bons cadeaux vendus sur le site</p></div>
        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
          <a href="/admin/packs" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/packs' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Packs de cours</a>
        <a href="/admin/cadeaux" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/cadeaux' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Bons cadeaux</a>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportExcel(filtered)} className="btn-outline text-sm flex items-center gap-1 px-3 py-2"><Download size={14} /> Excel</button>
          <button onClick={() => exportPDF(filtered)} className="btn-outline text-sm flex items-center gap-1 px-3 py-2"><Download size={14} /> PDF</button>
          <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Créer un bon
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center"><div className="text-2xl font-bold text-gold-400 mb-1">{cards.reduce((s, c) => s + c.montant, 0)} €</div><div className="text-xs text-noir-500 uppercase">Total vendu</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-400 mb-1">{cards.filter(c => c.status === 'active').length}</div><div className="text-xs text-noir-500 uppercase">Actifs</div></div>
      </div>
      <div className="relative mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input w-full pl-9 max-w-sm" /></div>
      {loading ? <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : filtered.length === 0 ? <div className="card text-center py-12"><Gift size={32} className="text-noir-600 mx-auto mb-3" /><p className="text-noir-400">Aucun bon cadeau pour le moment</p></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead><tr className="border-b border-noir-800">{['Code','Acheteur','Pour','Montant','Statut','Expiration',''].map(h => <th key={h} className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">{h}</th>)}</tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.id} onClick={() => setSelected(c)} className="border-b border-noir-800/50 hover:bg-noir-800/30 cursor-pointer transition-colors">
                <td className="py-3 px-4"><div className="flex items-center gap-2"><span className="font-mono text-gold-400 text-sm font-bold">{c.code}</span><button onClick={e => { e.stopPropagation(); copyCode(c.code) }} className="text-noir-600 hover:text-gold-400">{copied === c.code ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}</button></div></td>
                <td className="py-3 px-4"><p className="text-white text-sm">{c.acheteur_nom}</p><p className="text-noir-500 text-xs">{c.acheteur_email}</p></td>
                <td className="py-3 px-4 text-noir-300 text-sm">{c.destinataire_nom}</td>
                <td className="py-3 px-4"><span className="text-gold-400 font-medium">{c.montant} €</span></td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS[c.status]?.color || 'text-noir-400'}`}>{STATUS[c.status]?.label || c.status}</span></td>
                <td className="py-3 px-4 text-noir-500 text-xs">{new Date(c.expires_at).toLocaleDateString('fr-FR')}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); handleToggle(c) }} className={`transition-colors ${c.status === 'active' ? 'text-green-400 hover:text-yellow-400' : 'text-noir-600 hover:text-green-400'}`}>{c.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(c) }} className="text-noir-600 hover:text-red-400 transition-colors" title="Supprimer">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4"><h2 className="text-white font-serif text-xl flex items-center gap-2"><Gift size={18} className="text-gold-400" />Bon cadeau</h2><button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
            <div className="bg-noir-800 border border-gold-500/30 rounded-xl p-4 text-center mb-4"><p className="text-noir-400 text-xs uppercase tracking-widest mb-1">Code</p><div className="font-mono text-2xl text-gold-400 font-bold tracking-widest">{selected.code}</div></div>
            <div className="space-y-2 mb-6">{[{ label: 'Acheteur', value: `${selected.acheteur_nom} (${selected.acheteur_email})` }, { label: 'Pour', value: selected.destinataire_nom }, { label: 'Montant', value: `${selected.montant} €` }, { label: 'Statut', value: STATUS[selected.status]?.label || selected.status }, { label: 'Expiration', value: new Date(selected.expires_at).toLocaleDateString('fr-FR') }, selected.message ? { label: 'Message', value: selected.message } : null].filter(Boolean).map((item, i) => (<div key={i} className="flex justify-between text-sm border-b border-noir-800 pb-2"><span className="text-noir-400 shrink-0 w-24">{item!.label}</span><span className="text-white text-right text-xs">{item!.value}</span></div>))}</div>
            <div className="flex gap-2 flex-wrap">
                  {(selected.status === 'active' || selected.status === 'disabled') && (
                    <button onClick={() => handleToggle(selected)} className={`flex-1 ${selected.status === 'active' ? 'btn-outline' : 'btn-gold'}`}>
                      {selected.status === 'active' ? 'Désactiver' : 'Réactiver'}
                    </button>
                  )}
                  <button onClick={() => copyCode(selected.code)} className="btn-outline flex items-center gap-2">
                    {copied === selected.code ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}Copier
                  </button>
                  <button onClick={() => handleDelete(selected)} className="btn-outline text-red-400 hover:border-red-500 flex items-center gap-2">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    Supprimer
                  </button>
                </div>
          </div>
        </div>
      )}

      {/* Modale création manuelle */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-serif text-xl">Créer un bon cadeau</h2>
              <button onClick={() => setShowCreate(false)} className="text-noir-400 hover:text-white p-1"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <p className="text-noir-400 text-sm mb-4">Créez un bon cadeau manuellement pour un paiement reçu par virement ou en espèces.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="label mb-1 block">Acheteur (nom) *</label><input value={createForm.acheteur_nom} onChange={e => setCreateForm(f => ({ ...f, acheteur_nom: e.target.value }))} placeholder="Prénom Nom" className="input w-full" required /></div>
              <div><label className="label mb-1 block">Email acheteur *</label><input type="email" value={createForm.acheteur_email} onChange={e => setCreateForm(f => ({ ...f, acheteur_email: e.target.value }))} placeholder="acheteur@exemple.com" className="input w-full" required /></div>
              <div><label className="label mb-1 block">Destinataire *</label><input value={createForm.destinataire_nom} onChange={e => setCreateForm(f => ({ ...f, destinataire_nom: e.target.value }))} placeholder="Prénom du bénéficiaire" className="input w-full" required /></div>
              <div><label className="label mb-1 block">Montant (EUR) *</label><input type="number" min="1" value={createForm.montant} onChange={e => setCreateForm(f => ({ ...f, montant: parseFloat(e.target.value) || 0 }))} className="input w-full" required /></div>
              <div><label className="label mb-1 block">Message (optionnel)</label><textarea value={createForm.message} onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))} rows={2} className="input w-full resize-none" /></div>
              {createError && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{createError}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" className="btn-gold flex-1" disabled={createSaving}>{createSaving ? 'Création...' : 'Créer et envoyer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
