'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface EleveDetail {
  eleve: { id: string; email: string; prenom: string; nom: string; telephone: string | null; is_active: boolean; created_at: string }
  reservations: { id: string; slot_start: string; status: string }[]
  packs: { id: string; code: string; pack_label: string; heures_restantes: number; heures_total: number; status: string; history?: { id: string; type: string; delta: number; note: string | null; commentaire: string | null; created_at: string }[] }[]
  certificats: { id: string; numero: string; nom_certificat: string; niveau: string | null; date_obtention: string }[]
  notes: { id: string; date_cours: string; resume: string | null }[]
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteForm, setNoteForm] = useState({ date_cours: new Date().toISOString().split('T')[0], resume: '', notions: '', exercices: '', objectifs: '', commentaires: '' })
  const [noteSaving, setNoteSaving] = useState(false)
  const [certForm, setCertForm] = useState({ nom_certificat: '', niveau: '', date_obtention: new Date().toISOString().split('T')[0], commentaire: '', verset: '' })
  const [certSaving, setCertSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetch(`/api/admin/eleves/${id}`).then(r => r.json()), fetch(`/api/admin/eleves/${id}/progression`).then(r => r.json())]).then(([detail, prog]) => {
      setData(detail); setCompetences(prog.competences || []); setProgression(prog.progression || [])
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
      <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 w-fit mb-6">{(['info', 'packs', 'progression', 'notes', 'certificats'] as const).map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>{tab === 'info' ? 'Infos' : tab === 'packs' ? 'Packs' : tab === 'progression' ? 'Progression' : tab === 'notes' ? 'Notes' : 'Certificats'}</button>))}</div>
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
      {activeTab === 'progression' && (<div className="space-y-4">{categories.map(cat => (<div key={cat} className="card"><h3 className="text-gold-400 font-medium mb-3">{cat}</h3><div className="space-y-2">{competences.filter(c => c.categorie === cat).map(comp => { const prog = progression.find(p => p.competence === comp.nom); const validee = prog?.validee || false; return (<div key={comp.id} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleProgression(comp.nom, cat, validee)}><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${validee ? 'bg-green-500 border-green-500' : 'border-noir-600 hover:border-gold-500'}`}>{validee && <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}</div><span className={`text-sm ${validee ? 'text-white' : 'text-noir-400'}`}>{comp.nom}</span>{validee && prog?.validee_at && <span className="text-xs text-noir-600 ml-auto">{new Date(prog.validee_at).toLocaleDateString('fr-FR')}</span>}</div>) })}</div></div>))}</div>)}
      {activeTab === 'notes' && (<div className="space-y-6"><div className="card"><h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-4">Ajouter une note</h3><form onSubmit={addNote} className="space-y-3"><div><label className="label mb-1 block">Date *</label><input type="date" value={noteForm.date_cours} onChange={e => setNoteForm(f => ({ ...f, date_cours: e.target.value }))} className="input w-full" required /></div><div><label className="label mb-1 block">Résumé</label><textarea value={noteForm.resume} onChange={e => setNoteForm(f => ({ ...f, resume: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Notions</label><textarea value={noteForm.notions} onChange={e => setNoteForm(f => ({ ...f, notions: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Exercices</label><textarea value={noteForm.exercices} onChange={e => setNoteForm(f => ({ ...f, exercices: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Objectifs</label><textarea value={noteForm.objectifs} onChange={e => setNoteForm(f => ({ ...f, objectifs: e.target.value }))} className="input w-full h-16 resize-none" /></div><button type="submit" disabled={noteSaving} className="btn-gold">{noteSaving ? 'Enregistrement...' : 'Ajouter la note'}</button></form></div><div className="space-y-3">{data.notes.map(n => (<div key={n.id} className="card flex items-start justify-between"><div><p className="text-gold-400 text-sm font-medium">{new Date(n.date_cours).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>{n.resume && <p className="text-noir-300 text-sm mt-1">{n.resume}</p>}</div><button onClick={async () => { if (!confirm('Supprimer cette note ?')) return; await fetch(`/api/admin/eleves/${id}/notes/${n.id}`, { method: 'DELETE' }); const detail = await fetch(`/api/admin/eleves/${id}`).then(r => r.json()); setData(detail) }} className="text-noir-600 hover:text-red-400 ml-2 shrink-0"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button></div>))}</div></div>)}
      {activeTab === 'certificats' && (<div className="space-y-6"><div className="card"><h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-4">Générer un certificat</h3><form onSubmit={addCertificat} className="space-y-3"><div><label className="label mb-1 block">Nom du certificat *</label><input value={certForm.nom_certificat} onChange={e => setCertForm(f => ({ ...f, nom_certificat: e.target.value }))} placeholder="Ex: Certificat Fondamentaux" className="input w-full" required /></div><div><label className="label mb-1 block">Niveau</label><input value={certForm.niveau} onChange={e => setCertForm(f => ({ ...f, niveau: e.target.value }))} placeholder="Ex: Débutant, Intermédiaire..." className="input w-full" /></div><div><label className="label mb-1 block">Date *</label><input type="date" value={certForm.date_obtention} onChange={e => setCertForm(f => ({ ...f, date_obtention: e.target.value }))} className="input w-full" required /></div><div><label className="label mb-1 block">Commentaire</label><textarea value={certForm.commentaire} onChange={e => setCertForm(f => ({ ...f, commentaire: e.target.value }))} className="input w-full h-16 resize-none" /></div><div><label className="label mb-1 block">Verset biblique (optionnel)</label><input value={certForm.verset} onChange={e => setCertForm(f => ({ ...f, verset: e.target.value }))} className="input w-full" /></div><button type="submit" disabled={certSaving} className="btn-gold">{certSaving ? 'Génération...' : 'Générer et envoyer'}</button></form></div><div className="space-y-3">{data.certificats.map(c => (<div key={c.id} className="card flex items-center justify-between"><div><p className="text-white font-medium">{c.nom_certificat}</p>{c.niveau && <p className="text-gold-400 text-sm">{c.niveau}</p>}<p className="text-noir-500 text-xs">{new Date(c.date_obtention).toLocaleDateString('fr-FR')} • {c.numero}</p></div></div>))}</div></div>)}
    </div>
  )
}
