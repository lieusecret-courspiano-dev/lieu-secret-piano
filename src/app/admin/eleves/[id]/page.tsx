'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface EleveDetail {
  eleve: { id: string; email: string; prenom: string; nom: string; telephone: string | null; is_active: boolean; created_at: string }
  reservations: { id: string; slot_start: string; status: string }[]
  packs: { id: string; code: string; pack_label: string; heures_restantes: number; heures_total: number; status: string; history?: { id: string; type: string; delta: number; note: string | null; commentaire: string | null; created_at: string }[] }[]
  certificats: { id: string; numero: string; nom_certificat: string; niveau: string | null; date_obtention: string }[]
  notes: { id: string; date_cours: string; resume: string | null; notions: string | null; exercices: string | null; objectifs: string | null; commentaires: string | null; updated_at?: string | null }[]
}
interface Competence { id: string; categorie: string; nom: string; ordre: number }
interface Progression { competence: string; validee: boolean; validee_at: string | null }

export default function AdminEleveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<EleveDetail | null>(null)
  const [competences, setCompetences] = useState<Competence[]>([])
  const [progression, setProgression] = useState<Progression[]>([])
  const [activeTab, setActiveTab] = useState<'info' | 'packs' | 'progression' | 'notes' | 'certificats'>('info')

  // Auto-ouvrir l'onglet progression si #progression dans l'URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#progression') {
      setActiveTab('progression')
      // Scroll vers les onglets
      setTimeout(() => {
        const el = document.getElementById('admin-tabs')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 500)
    }
  }, [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteForm, setNoteForm] = useState({ date_cours: new Date().toISOString().split('T')[0], resume: '', notions: '', exercices: '', objectifs: '', commentaires: '' })
  const [noteSaving, setNoteSaving] = useState(false)
  const [editNote, setEditNote] = useState<typeof data extends null ? null : NonNullable<typeof data>['notes'][0] | null>(null)
  const [editNoteForm, setEditNoteForm] = useState({ date_cours: '', resume: '', notions: '', exercices: '', objectifs: '', commentaires: '' })
  const [certForm, setCertForm] = useState({ nom_certificat: '', niveau: '', date_obtention: new Date().toISOString().split('T')[0], commentaire: '', verset: '' })
  const [certSaving, setCertSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetch(`/api/admin/eleves/${id}`).then(r => r.json()), fetch(`/api/admin/eleves/${id}/progression`).then(r => r.json())]).then(([detail, prog]) => {
      setData(detail)
      // Nouveau format: prog.categories contient les compétences groupées
      if (prog.categories) {
        const allComps: Competence[] = []
        const allProg: Progression[] = []
        Object.entries(prog.categories as Record<string, { competence: string; categorie: string; validee: boolean; validee_at: string | null }[]>).forEach(([cat, items]) => {
          items.forEach((item, idx) => {
            allComps.push({ id: `${cat}-${idx}`, categorie: cat, nom: item.competence, ordre: idx })
            if (item.validee) allProg.push({ competence: item.competence, validee: true, validee_at: item.validee_at })
          })
        })
        setCompetences(allComps)
        setProgression(allProg)
      } else {
        setCompetences(prog.competences || [])
        setProgression(prog.progression || [])
      }
    }).finally(() => setLoading(false))
  }, [id])

  async function toggleProgression(competence: string, categorie: string, current: boolean) {
    await fetch(`/api/admin/eleves/${id}/progression`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ competence, categorie, validee: !current }) })
    setProgression(prev => { const ex = prev.find(p => p.competence === competence); if (ex) return prev.map(p => p.competence === competence ? { ...p, validee: !current, validee_at: !current ? new Date().toISOString() : null } : p); return [...prev, { competence, validee: !current, validee_at: !current ? new Date().toISOString() : null }] })
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault(); setNoteSaving(true)
    await fetch(`/api/admin/eleves/${id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(noteForm) })
    setNoteSaving(false); setNoteForm({ date_cours: new Date().toISOString().split('T')[0], resume: '', notions: '', exercices: '', objectifs: '', commentaires: '' })
    const detail = await fetch(`/api/admin/eleves/${id}`).then(r => r.json()); setData(detail)
  }

  async function addCertificat(e: React.FormEvent) {
    e.preventDefault(); setCertSaving(true)
    await fetch('/api/admin/certificats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eleve_id: id, ...certForm }) })
    setCertSaving(false); setCertForm({ nom_certificat: '', niveau: '', date_obtention: new Date().toISOString().split('T')[0], commentaire: '', verset: '' })
    const detail = await fetch(`/api/admin/eleves/${id}`).then(r => r.json()); setData(detail)
  }

  async function resendWelcome() {
    setSaving(true)
    await fetch(`/api/admin/eleves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resend_welcome: true }) })
    setSaving(false); alert('Email de bienvenue renvoyé !')
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!data) return <div className="p-8 text-red-400">Élève introuvable</div>

  const { eleve } = data
  const categories = Array.from(new Set(competences.map(c => c.categorie)))

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6"><Link href="/admin/eleves" className="text-noir-400 hover:text-white">← Élèves</Link><span className="text-noir-700">/</span><h1 className="text-xl font-serif text-white">{eleve.prenom} {eleve.nom}</h1></div>
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div><p className="text-white font-medium text-lg">{eleve.prenom} {eleve.nom}</p><p className="text-gold-400 text-sm">{eleve.email}</p>{eleve.telephone && <p className="text-noir-400 text-sm">{eleve.telephone}</p>}<p className="text-noir-500 text-xs mt-1">Inscrit le {new Date(eleve.created_at).toLocaleDateString('fr-FR')}</p></div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={resendWelcome} disabled={saving} className="btn-outline text-sm px-3 py-2">{saving ? '...' : 'Renvoyer email'}</button>
            <button onClick={async () => { if (!confirm(`Supprimer le compte de ${eleve.prenom} ${eleve.nom} ?`)) return; await fetch(`/api/admin/eleves/${id}`, { method: 'DELETE' }); router.push('/admin/eleves') }} className="text-sm px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">Supprimer</button>
            <span className={`text-xs px-3 py-1 rounded-full border self-start ${eleve.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{eleve.is_active ? 'Actif' : 'Inactif'}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">{[{ label: 'Réservations', value: data.reservations.length }, { label: 'Packs', value: data.packs.length }, { label: 'Certificats', value: data.certificats.length }, { label: 'Notes', value: data.notes.length }].map((s, i) => (<div key={i} className="bg-noir-800 rounded-lg p-3 text-center"><p className="text-xl font-bold text-gold-400">{s.value}</p><p className="text-xs text-noir-500">{s.label}</p></div>))}</div>
      </div>
      <div id="admin-tabs" className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 w-fit mb-6 flex-wrap">{(['info', 'packs', 'progression', 'notes', 'certificats'] as const).map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>{tab === 'info' ? 'Infos' : tab === 'packs' ? 'Packs' : tab === 'progression' ? 'Progression' : tab === 'notes' ? 'Notes' : 'Certificats'}</button>))}</div>
      {activeTab === 'info' && (<div className="grid md:grid-cols-2 gap-6"><div className="card"><h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-3">Réservations</h3>{data.reservations.length === 0 ? <p className="text-noir-500 text-sm">Aucune</p> : <div className="space-y-2">{data.reservations.slice(0, 5).map(r => (<div key={r.id} className="flex justify-between text-sm"><span className="text-noir-300">{new Date(r.slot_start).toLocaleDateString('fr-FR')}</span><span className={`text-xs ${r.status === 'confirmed' ? 'text-green-400' : 'text-noir-400'}`}>{r.status}</span></div>))}</div>}</div><div className="card"><h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-3">Packs</h3>{data.packs.length === 0 ? <p className="text-noir-500 text-sm">Aucun</p> : <div className="space-y-3">{data.packs.map(p => (<div key={p.id} className="bg-noir-800 rounded-lg p-3"><div className="flex justify-between items-center mb-1"><span className="text-white text-sm font-medium">{p.pack_label}</span><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-noir-700 text-noir-400'}`}>{p.status}</span></div><div className="flex justify-between text-xs text-noir-400"><span>Code : <span className="font-mono text-gold-400">{p.code}</span></span><span><span className="text-gold-400 font-bold">{p.heures_restantes}h</span> / {p.heures_total}h</span></div><div className="w-full bg-noir-700 rounded-full h-1.5 mt-2"><div className="h-1.5 rounded-full bg-gold-500" style={{width: `${Math.round(p.heures_restantes/p.heures_total*100)}%`}} /></div></div>))}</div>}</div></div>)}
      {activeTab === 'packs' && (
        <div className="space-y-4">
          {data.packs.length === 0 ? (
            <div className="card text-center py-8"><p className="text-noir-400">Aucun pack pour cet élève</p></div>
          ) : data.packs.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">{p.pack_label}</h3>
                  <p className="font-mono text-gold-400 text-sm">{p.code}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${p.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-noir-700 text-noir-400 border-noir-600'}`}>{p.status === 'active' ? 'Actif' : p.status === 'used' ? 'Épuisé' : p.status}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-noir-400">Heures restantes</span>
                <span className="text-gold-400 font-bold">{p.heures_restantes}h / {p.heures_total}h</span>
              </div>
              <div className="w-full bg-noir-800 rounded-full h-2 mb-4">
                <div className="h-2 rounded-full bg-gold-500" style={{width: `${Math.round(p.heures_restantes/p.heures_total*100)}%`}} />
              </div>
              {p.history && p.history.length > 0 && (
                <div className="border-t border-noir-800 pt-3">
                  <p className="text-noir-500 text-xs uppercase tracking-wider mb-2">Historique des mouvements</p>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-noir-800/50">
                      <div><p className="text-white text-sm">Achat {p.pack_label}</p><p className="text-noir-500 text-xs">Création du pack</p></div>
                      <span className="text-green-400 font-bold">+{p.heures_total}h</span>
                    </div>
                    {p.history.map(h => {
                      const typeLabel = h.type === 'cours' ? 'Cours individuel' : h.type === 'ajustement' ? 'Ajustement admin' : h.type === 'annulation' ? 'Annulation' : h.type
                      const detail = h.note || h.commentaire
                      return (
                        <div key={h.id} className="flex justify-between py-1.5 border-b border-noir-800/50 last:border-0">
                          <div>
                            <p className="text-white text-sm">{typeLabel}</p>
                            {detail && <p className="text-gold-400 text-xs italic">{detail}</p>}
                            <p className="text-noir-500 text-xs">{new Date(h.created_at).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <span className={`font-bold shrink-0 ml-4 ${h.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>{h.delta > 0 ? '+' : ''}{h.delta}h</span>
                        </div>
                      )
                    })}
                    <div className="flex justify-between pt-2 border-t border-gold-500/30">
                      <p className="text-gold-400 font-bold text-sm">Solde actuel</p>
                      <p className="text-white font-bold">{p.heures_restantes}h</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {activeTab === 'progression' && (<div className="space-y-4">
  {/* Bouton vérification certificats */}
  <div className="flex items-center justify-between">
    <p className="text-noir-400 text-xs">Cliquez sur chaque compétence pour la valider. Les certificats sont générés automatiquement.</p>
    <button onClick={async () => {
      // Déclencher la vérification des certificats pour toutes les catégories
      const cats = ['Fondamentaux', 'Compréhension et autonomie', 'Expression et maîtrise']
      for (const cat of cats) {
        const catComps = competences.filter(c => c.categorie === cat)
        const catValidees = catComps.filter(c => progression.find(p => p.competence === c.nom && p.validee)).length
        if (catComps.length > 0 && catValidees === catComps.length) {
          // Toutes validées — forcer une validation pour déclencher la génération
          const lastComp = catComps[catComps.length - 1]
          const prog = progression.find(p => p.competence === lastComp.nom)
          if (prog?.validee) {
            await fetch(`/api/admin/eleves/${id}/progression`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ competence: lastComp.nom, categorie: cat, validee: true }) })
          }
        }
      }
      alert('Vérification effectuée. Rechargez la page pour voir les nouveaux certificats.')
    }} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0">
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
      Vérifier les certificats
    </button>
  </div>
  {/* Barre globale */}
  <div className="card border-gold-500/20">
    <div className="flex items-center justify-between mb-2">
      <p className="text-white font-medium">Progression globale</p>
      <span className="text-2xl font-bold text-gold-400">{competences.length > 0 ? Math.round((progression.filter(p => p.validee).length / competences.length) * 100) : 0}%</span>
    </div>
    <div className="w-full bg-noir-800 rounded-full h-3 overflow-hidden">
      <div className="h-3 rounded-full bg-gold-500 transition-all" style={{ width: `${competences.length > 0 ? Math.round((progression.filter(p => p.validee).length / competences.length) * 100) : 0}%` }} />
    </div>
    <p className="text-noir-500 text-xs mt-1">{progression.filter(p => p.validee).length} / {competences.length} compétences validées</p>
  </div>
  {categories.map(cat => {
    const catComps = competences.filter(c => c.categorie === cat)
    const catValidees = catComps.filter(c => progression.find(p => p.competence === c.nom && p.validee)).length
    const catPct = catComps.length > 0 ? Math.round((catValidees / catComps.length) * 100) : 0
    return (
      <div key={cat} className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gold-400 font-medium">{cat}</h3>
          <span className="text-sm font-bold text-gold-400">{catPct}%</span>
        </div>
        <div className="w-full bg-noir-800 rounded-full h-1.5 mb-3 overflow-hidden">
          <div className="h-1.5 rounded-full bg-gold-500 transition-all" style={{ width: `${catPct}%` }} />
        </div>
        <div className="space-y-1.5">{catComps.map(comp => {
          const prog = progression.find(p => p.competence === comp.nom)
          const validee = prog?.validee || false
          return (
            <div key={comp.id} className={`flex items-center gap-3 cursor-pointer py-1.5 px-2 rounded-lg transition-colors ${validee ? 'hover:bg-green-500/5' : 'hover:bg-noir-800/40'}`} onClick={() => toggleProgression(comp.nom, cat, validee)}>
              <input type="checkbox" checked={validee} onChange={() => toggleProgression(comp.nom, cat, validee)}
                className="mt-0.5 w-5 h-5" style={{accentColor: validee ? '#22c55e' : '#f59e0b'}} />
              <span className={`text-sm flex-1 ${validee ? 'text-white' : 'text-noir-400'}`}>{comp.nom}</span>
              {validee && prog?.validee_at && <span className="text-xs text-noir-600 shrink-0">{new Date(prog.validee_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
            </div>
          )
        })}</div>
      </div>
    )
  })}
</div>)}
      {activeTab === 'notes' && (<div className="space-y-6"><div className="card"><h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-4">Ajouter une note</h3><form onSubmit={addNote} className="space-y-3"><div><label className="label mb-1 block">Date *</label><input type="date" value={noteForm.date_cours} onChange={e => setNoteForm(f => ({ ...f, date_cours: e.target.value }))} className="input w-full" required /></div><div><label className="label mb-1 block">Résumé</label><textarea value={noteForm.resume} onChange={e => setNoteForm(f => ({ ...f, resume: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Notions</label><textarea value={noteForm.notions} onChange={e => setNoteForm(f => ({ ...f, notions: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Exercices</label><textarea value={noteForm.exercices} onChange={e => setNoteForm(f => ({ ...f, exercices: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Objectifs</label><textarea value={noteForm.objectifs} onChange={e => setNoteForm(f => ({ ...f, objectifs: e.target.value }))} className="input w-full h-16 resize-none" /></div><button type="submit" disabled={noteSaving} className="btn-gold">{noteSaving ? 'Enregistrement...' : 'Ajouter la note'}</button></form></div><div className="space-y-3">{data.notes.map(n => (<div key={n.id} className="card">
  <div className="flex items-start justify-between gap-2">
    <p className="text-gold-400 text-sm font-medium capitalize">{new Date(n.date_cours).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
    <div className="flex gap-1.5 shrink-0">
      <button onClick={() => { setEditNote(n); setEditNoteForm({ date_cours: n.date_cours, resume: n.resume || '', notions: n.notions || '', exercices: n.exercices || '', objectifs: n.objectifs || '', commentaires: n.commentaires || '' }) }} className="text-noir-500 hover:text-gold-400 p-1 rounded transition-colors"><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button onClick={async () => { if (!confirm('Supprimer cette note ?')) return; await fetch(`/api/admin/eleves/${id}/notes`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) }); const detail = await fetch(`/api/admin/eleves/${id}`).then(r => r.json()); setData(detail) }} className="text-noir-500 hover:text-red-400 p-1 rounded transition-colors"><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    </div>
  </div>
  {n.resume && <p className="text-noir-300 text-sm mt-1 line-clamp-2">{n.resume}</p>}
  {n.updated_at && <p className="text-noir-600 text-xs mt-1">Modifié le {new Date(n.updated_at).toLocaleDateString('fr-FR')}</p>}
</div>))}
{editNote && (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"><div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'480px'}}><div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0"><h2 className="text-white font-serif text-xl">Modifier la note</h2><button onClick={() => setEditNote(null)} className="text-noir-400 hover:text-white p-1"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div className="overflow-y-auto flex-1 px-6 py-4 space-y-3"><div><label className="label mb-1 block">Date *</label><input type="date" value={editNoteForm.date_cours} onChange={e => setEditNoteForm(f => ({ ...f, date_cours: e.target.value }))} className="input w-full" required /></div><div><label className="label mb-1 block">Résumé</label><textarea value={editNoteForm.resume} onChange={e => setEditNoteForm(f => ({ ...f, resume: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Notions</label><textarea value={editNoteForm.notions} onChange={e => setEditNoteForm(f => ({ ...f, notions: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Exercices</label><textarea value={editNoteForm.exercices} onChange={e => setEditNoteForm(f => ({ ...f, exercices: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Objectifs</label><textarea value={editNoteForm.objectifs} onChange={e => setEditNoteForm(f => ({ ...f, objectifs: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Commentaires</label><textarea value={editNoteForm.commentaires} onChange={e => setEditNoteForm(f => ({ ...f, commentaires: e.target.value }))} className="input w-full h-16 resize-none" /></div></div><div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3"><button onClick={() => setEditNote(null)} className="btn-outline flex-1">Annuler</button><button onClick={async () => { setNoteSaving(true); await fetch(`/api/admin/eleves/${id}/notes`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editNote.id, ...editNoteForm }) }); const detail = await fetch(`/api/admin/eleves/${id}`).then(r => r.json()); setData(detail); setEditNote(null); setNoteSaving(false) }} disabled={noteSaving} className="btn-gold flex-1">{noteSaving ? 'Enregistrement...' : 'Enregistrer'}</button></div></div></div>)}
</div></div>)}
      {activeTab === 'certificats' && (
  <div className="space-y-6">
    {/* Info sur les certificats automatiques */}
    <div className="card border-gold-500/20 bg-gold-500/5">
      <div className="flex items-start gap-3">
        <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <p className="text-gold-400 font-medium text-sm">Certificats automatiques</p>
          <p className="text-noir-400 text-xs mt-1">Les certificats sont générés automatiquement quand toutes les compétences d'une catégorie sont validées dans l'onglet Progression. Vous pouvez aussi en créer un manuellement ci-dessous.</p>
        </div>
      </div>
    </div>

    {/* Certificats existants */}
    {data.certificats.length > 0 && (
      <div className="space-y-3">
        <h3 className="text-white font-medium text-sm uppercase tracking-wider">Certificats obtenus</h3>
        {data.certificats.map(c => (
          <div key={c.id} className="card border-gold-500/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{c.nom_certificat}</p>
                  {c.niveau && <p className="text-gold-400 text-xs">{c.niveau}</p>}
                  <p className="text-noir-500 text-xs mt-0.5">{new Date(c.date_obtention).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} • {c.numero}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Formulaire génération manuelle */}
    <div className="card">
      <h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-4">Générer un certificat manuellement</h3>
      <form onSubmit={addCertificat} className="space-y-3">
        <div><label className="label mb-1 block">Nom du certificat *</label><input value={certForm.nom_certificat} onChange={e => setCertForm(f => ({ ...f, nom_certificat: e.target.value }))} placeholder="Ex: Certificat Fondamentaux" className="input w-full" required /></div>
        <div><label className="label mb-1 block">Niveau</label><input value={certForm.niveau} onChange={e => setCertForm(f => ({ ...f, niveau: e.target.value }))} placeholder="Ex: Niveau 1 — Fondamentaux" className="input w-full" /></div>
        <div><label className="label mb-1 block">Date *</label><input type="date" value={certForm.date_obtention} onChange={e => setCertForm(f => ({ ...f, date_obtention: e.target.value }))} className="input w-full" required /></div>
        <div><label className="label mb-1 block">Commentaire</label><textarea value={certForm.commentaire} onChange={e => setCertForm(f => ({ ...f, commentaire: e.target.value }))} className="input w-full h-16 resize-none" /></div>
        <div><label className="label mb-1 block">Verset biblique (optionnel)</label><input value={certForm.verset} onChange={e => setCertForm(f => ({ ...f, verset: e.target.value }))} className="input w-full" /></div>
        <button type="submit" disabled={certSaving} className="btn-gold">{certSaving ? 'Génération...' : 'Générer et envoyer'}</button>
      </form>
    </div>
  </div>
)}
    </div>
  )
}
