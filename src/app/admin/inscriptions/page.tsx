'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle, Clock, XCircle, Trash2, Download } from 'lucide-react'

interface Inscription {
  id: string
  prenom: string
  nom: string
  email: string
  telephone: string | null
  adresse: string | null
  ville: string | null
  pays: string | null
  niveau: string
  annees_pratique: string | null
  rythme: string | null
  frequence: string | null
  objectifs: string | null
  message: string | null
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  confirme:   { label: 'Confirmé',   color: 'bg-green-500/10 text-green-400 border-green-500/20'   },
  refuse:     { label: 'Refusé',     color: 'bg-red-500/10 text-red-400 border-red-500/20'         },
}

// ── Export CSV (compatible Excel) ─────────────────────────────────────
function exportCSV(inscriptions: Inscription[]) {
  const BOM = '\uFEFF' // BOM UTF-8 pour Excel
  const headers = [
    'Prénom', 'Nom', 'Email', 'Téléphone', 'Adresse', 'Ville', 'Pays',
    'Niveau', 'Années de pratique', 'Disponibilités', 'Fréquence',
    'Objectifs', 'Message', 'Statut', 'Date d\'inscription',
  ]

  function escapeCSV(val: string | null | undefined): string {
    if (!val) return ''
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows = inscriptions.map(i => [
    escapeCSV(i.prenom),
    escapeCSV(i.nom),
    escapeCSV(i.email),
    escapeCSV(i.telephone),
    escapeCSV(i.adresse),
    escapeCSV(i.ville),
    escapeCSV(i.pays),
    escapeCSV(i.niveau),
    escapeCSV(i.annees_pratique),
    escapeCSV(i.rythme),
    escapeCSV(i.frequence),
    escapeCSV(i.objectifs),
    escapeCSV(i.message),
    escapeCSV(STATUS_LABELS[i.status]?.label || i.status),
    escapeCSV(new Date(i.created_at).toLocaleDateString('fr-FR')),
  ].join(';'))

  const csv = BOM + [headers.join(';'), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `inscriptions-lieu-secret-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Export PDF via fenêtre d'impression ──────────────────────────────
function exportExcel(inscriptions: Inscription[]) {
  import('xlsx').then(XLSX => {
    const data = inscriptions.map(i => ({ 'Prénom': i.prenom, 'Nom': i.nom, 'Email': i.email, 'Téléphone': i.telephone || '', 'Niveau': i.niveau || '', 'Rythme': (Array.isArray(i.rythme) ? i.rythme : []).join(', '), 'Objectifs': i.objectifs || '', 'Ville': i.ville || '', 'Pays': i.pays || '', 'Date': new Date(i.created_at).toLocaleDateString('fr-FR') }))
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Inscriptions'); XLSX.writeFile(wb, `inscriptions-${new Date().toISOString().split('T')[0]}.xlsx`)
  })
}

function exportPDF(inscriptions: Inscription[]) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const W = 210
    doc.setFillColor(245, 158, 11); doc.rect(0, 0, W, 18, 'F'); doc.setTextColor(26, 26, 46); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('LIEU SECRET — Inscriptions', 10, 12); doc.setFontSize(8); doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${inscriptions.length} inscriptions`, 130, 12)
    const cols = ['Nom', 'Email', 'Téléphone', 'Niveau', 'Rythme', 'Date']; const widths = [38, 50, 30, 25, 30, 22]; let x = 8, y = 28
    doc.setFillColor(37, 37, 64); doc.rect(8, y - 5, W - 16, 8, 'F'); doc.setTextColor(245, 158, 11); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); for (let ci = 0; ci < cols.length; ci++) { doc.text(cols[ci], x, y); x += widths[ci] }
    doc.setFont('helvetica', 'normal')
    for (let ri = 0; ri < inscriptions.length; ri++) {
      const ins = inscriptions[ri]; y += 8; if (y > 270) { doc.addPage(); y = 20 }
      if (ri % 2 === 0) { doc.setFillColor(50, 50, 80); doc.rect(8, y - 5, W - 16, 8, 'F') } else { doc.setFillColor(37, 37, 64); doc.rect(8, y - 5, W - 16, 8, 'F') }
      doc.setTextColor(230, 230, 230); x = 8
      const row = [`${ins.prenom} ${ins.nom}`.substring(0, 16), ins.email.substring(0, 22), ins.telephone || '-', ins.niveau?.substring(0, 10) || '-', (Array.isArray(ins.rythme) ? ins.rythme : []).join(', ').substring(0, 12) || '-', new Date(ins.created_at).toLocaleDateString('fr-FR')]
      for (let ci = 0; ci < row.length; ci++) { doc.text(String(row[ci]), x, y); x += widths[ci] }
    }
    doc.save(`inscriptions-${new Date().toISOString().split('T')[0]}.pdf`)
  }).catch(() => alert('Erreur PDF'))
}

export default function AdminInscriptions() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<Inscription | null>(null)

  useEffect(() => { fetchInscriptions() }, [])

  async function fetchInscriptions() {
    setLoading(true)
    const res  = await fetch('/api/admin/inscriptions')
    const data = await res.json()
    setInscriptions(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleStatus(id: string, status: string) {
    await fetch(`/api/admin/inscriptions/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    fetchInscriptions()
    setSelected(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette inscription ?')) return
    await fetch(`/api/admin/inscriptions/${id}`, { method: 'DELETE' })
    fetchInscriptions()
    setSelected(null)
  }

  const filtered = inscriptions.filter(i =>
    !search ||
    (i.prenom + ' ' + i.nom).toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Inscriptions</h1>
          <p className="text-noir-400 text-sm mt-1">{inscriptions.length} demande{inscriptions.length > 1 ? 's' : ''} au total</p>
        </div>

        {/* Boutons export */}
        {inscriptions.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportExcel(filtered.length > 0 ? filtered : inscriptions)}
              className="btn-outline flex items-center gap-2 text-xs px-3 py-2"
              title="Exporter en CSV (compatible Excel)"
            >
              <Download size={14} />
              Export Excel
            </button>
            <button
              onClick={() => exportPDF(filtered.length > 0 ? filtered : inscriptions)}
              className="btn-outline flex items-center gap-2 text-xs px-3 py-2"
              title="Exporter en PDF"
            >
              <Download size={14} />
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Recherche */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un élève..."
          className="input w-full pl-9 max-w-sm"
        />
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-noir-400">
          <p>Aucune inscription pour le moment</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-noir-800">
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Élève</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Email</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Niveau</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Ville</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Disponibilités</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Statut</th>
                <th className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">Date</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr
                  key={i.id}
                  onClick={() => setSelected(i)}
                  className="border-b border-noir-800/50 hover:bg-noir-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="text-white font-medium text-sm">{i.prenom} {i.nom}</p>
                    {i.telephone && <p className="text-noir-500 text-xs">{i.telephone}</p>}
                  </td>
                  <td className="py-3 px-4 text-noir-300 text-sm">{i.email}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded-full px-2 py-0.5">
                      {i.niveau.split(' ')[0]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-noir-400 text-sm">{i.ville || '—'}</td>
                  <td className="py-3 px-4 text-noir-400 text-xs max-w-[150px] truncate">{i.rythme || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_LABELS[i.status]?.color || 'text-noir-400'}`}>
                      {STATUS_LABELS[i.status]?.label || i.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-noir-500 text-xs">
                    {new Date(i.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(i.id) }}
                      className="text-noir-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-serif text-xl">{selected.prenom} {selected.nom}</h2>
              <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {[
                { label: 'Email',           value: selected.email },
                { label: 'Téléphone',       value: selected.telephone || '—' },
                { label: 'Adresse',         value: [selected.adresse, selected.ville, selected.pays].filter(Boolean).join(', ') || '—' },
                { label: 'Niveau',          value: selected.niveau },
                { label: 'Pratique',        value: selected.annees_pratique || '—' },
                { label: 'Disponibilités',  value: selected.rythme || '—' },
                { label: 'Fréquence',       value: selected.frequence || '—' },
                { label: 'Objectifs',       value: selected.objectifs || '—' },
                { label: 'Message',         value: selected.message || '—' },
                { label: 'Statut',          value: STATUS_LABELS[selected.status]?.label || selected.status },
                { label: 'Date',            value: new Date(selected.created_at).toLocaleDateString('fr-FR') },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-noir-800 pb-2">
                  <span className="text-noir-400 shrink-0 w-32">{item.label}</span>
                  <span className="text-white text-right">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {selected.status !== 'confirme' && (
                <button onClick={() => handleStatus(selected.id, 'confirme')} className="btn-gold flex items-center gap-1 text-sm flex-1">
                  <CheckCircle size={14} /> Confirmer
                </button>
              )}
              {selected.status !== 'en_attente' && (
                <button onClick={() => handleStatus(selected.id, 'en_attente')} className="btn-outline flex items-center gap-1 text-sm flex-1">
                  <Clock size={14} /> En attente
                </button>
              )}
              {selected.status !== 'refuse' && (
                <button onClick={() => handleStatus(selected.id, 'refuse')} className="btn-outline flex items-center gap-1 text-sm">
                  <XCircle size={14} /> Refuser
                </button>
              )}
              <button onClick={() => handleDelete(selected.id)} className="btn-outline border-red-500/50 text-red-400 hover:bg-red-900/20 flex items-center gap-1 text-sm">
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}