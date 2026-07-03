'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { DateTime } from 'luxon'
import { EleveSearchSelect } from '@/components/admin/ui/EleveSearchSelect'
import { QuestionEditor, type ExamenQuestion } from '@/components/admin/ui/QuestionEditor'

interface Examen {
  id: string; titre: string; description: string | null; categorie: string
  score_min: number; duree_minutes: number; date_examen: string
  nb_tentatives: number; est_actif: boolean; created_at: string
  examen_eleves?: { count: number }[]; examen_sessions?: { count: number }[]
}
interface Eleve { id: string; prenom: string; nom: string; email: string }
interface Session {
  id: string; eleve: { prenom: string; nom: string; email: string }
  score: number; reussi: boolean; niveau_medaille: string | null
  eleve_id: string; submitted_at: string | null; tentative_num: number
}

const CATEGORIES = ['Fondamentaux', 'Compréhension et autonomie', 'Expression et maîtrise']
const DUREES = [30, 40, 45, 60, 90, 120]
const EMPTY_FORM = {
  titre: '', description: '', categorie: 'Fondamentaux', quiz_id: '',
  score_min: 75, duree_minutes: 60, date_examen: '', nb_tentatives: 1,
}

export default function AdminExamensPage() {
  const pathname = usePathname()
  const [examens, setExamens] = useState<Examen[]>([])
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [quiz, setQuiz] = useState<{id: string; titre: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editExamen, setEditExamen] = useState<Examen | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [selectedEleves, setSelectedEleves] = useState<string[]>([])
  const [questions, setQuestions] = useState<ExamenQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{type: 'ok'|'err'; text: string} | null>(null)
  const [viewResultats, setViewResultats] = useState<string | null>(null)
  const [resultats, setResultats] = useState<Session[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/examens').then(r => r.json()),
      fetch('/api/admin/eleves').then(r => r.json()),
      fetch('/api/admin/quiz').then(r => r.json()),
    ]).then(([ex, el, qz]) => {
      setExamens(Array.isArray(ex) ? ex : [])
      setEleves(Array.isArray(el) ? el : [])
      setQuiz(Array.isArray(qz) ? qz : [])
      setLoading(false)
    })
  }, [])

  // Charger automatiquement les questions de la banque quand la catégorie change
  // (seulement en mode création, sans questions déjà saisies)
  useEffect(() => {
    if (!showForm || editExamen || !form.categorie || questions.length > 0) return
    fetch(`/api/admin/banque-questions?categorie=${encodeURIComponent(form.categorie)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data.map((q: any, i: number) => ({
            type: q.type, question: q.question,
            options: q.options || ['', '', '', ''],
            bonne_reponse: q.bonne_reponse || '', explication: q.explication || '',
            audio_url: q.audio_url || '', image_url: q.image_url || '', video_url: q.video_url || '',
            points: q.points || 1, position: i,
          })))
        }
      }).catch(() => {})
  }, [form.categorie, showForm, editExamen])

  function showMsg(type: 'ok'|'err', text: string) {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 4000)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      // Convertir l'heure locale saisie en UTC pour Supabase
      const dateLocalInput = new Date(form.date_examen)
      const dateISO = dateLocalInput.toISOString()
      const body = { ...form, date_examen: dateISO, eleve_ids: selectedEleves, quiz_id: form.quiz_id || null, questions_examen: questions }
      const url = editExamen ? '/api/admin/examens' : '/api/admin/examens'
      const method = editExamen ? 'PATCH' : 'POST'
      const payload = editExamen ? { id: editExamen.id, ...body } : body
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erreur')
      // Mettre à jour les questions si modification
      if (editExamen) {
        await fetch('/api/admin/examens/questions', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examen_id: editExamen.id, questions }),
        })
      }
      showMsg('ok', editExamen ? 'Examen modifié' : 'Examen créé')
      setShowForm(false); setEditExamen(null); setForm({ ...EMPTY_FORM }); setSelectedEleves([]); setQuestions([])
      const ex = await fetch('/api/admin/examens').then(r => r.json())
      setExamens(Array.isArray(ex) ? ex : [])
    } catch (err: any) { showMsg('err', err.message) } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet examen ?')) return
    await fetch('/api/admin/examens', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setExamens(prev => prev.filter(e => e.id !== id))
    showMsg('ok', 'Examen supprimé')
  }

  async function loadResultats(examen_id: string) {
    setViewResultats(examen_id)
    const data = await fetch(`/api/admin/examens/resultats?examen_id=${examen_id}`).then(r => r.json())
    setResultats(Array.isArray(data) ? data : [])
  }

  async function autoriserTentative(examen_id: string, eleve_id: string) {
    await fetch('/api/admin/examens/resultats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ examen_id, eleve_id }) })
    showMsg('ok', 'Nouvelle tentative autorisée')
  }

  async function loadFromBanque() {
    if (!form.categorie) return
    try {
      const res = await fetch(`/api/admin/banque-questions?categorie=${encodeURIComponent(form.categorie)}`)
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        alert(`Aucune question dans la banque pour "${form.categorie}". Ajoutez-en dans l'onglet "Banque de questions".`)
        return
      }
      if (questions.length > 0 && !confirm(`Remplacer les ${questions.length} question(s) actuelles par les ${data.length} questions de la banque ?`)) return
      setQuestions(data.map((q: any, i: number) => ({
        type: q.type, question: q.question,
        options: q.options || ['', '', '', ''],
        bonne_reponse: q.bonne_reponse || '',
        explication: q.explication || '',
        audio_url: q.audio_url || '',
        image_url: q.image_url || '',
        video_url: q.video_url || '',
        points: q.points || 1, position: i,
      })))
    } catch { alert('Erreur lors du chargement de la banque') }
  }

  async function startEdit(ex: Examen) {
    setEditExamen(ex)
    const dateUTC = new Date(ex.date_examen)
    const offset = dateUTC.getTimezoneOffset() * 60000
    const dateLocal = new Date(dateUTC.getTime() - offset)
    const dateLocalStr = dateLocal.toISOString().slice(0, 16)
    setForm({ titre: ex.titre, description: ex.description || '', categorie: ex.categorie, quiz_id: '', score_min: ex.score_min, duree_minutes: ex.duree_minutes, date_examen: dateLocalStr, nb_tentatives: ex.nb_tentatives })
    // Charger les questions existantes de cet examen
    try {
      const res = await fetch(`/api/admin/examens/questions?examen_id=${ex.id}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(Array.isArray(data) ? data.map((q: any, i: number) => ({
          id: q.id, type: q.type, question: q.question,
          options: q.options || ['', '', '', ''],
          bonne_reponse: q.bonne_reponse || '', explication: q.explication || '',
          audio_url: q.audio_url || '', image_url: q.image_url || '', video_url: q.video_url || '',
          points: q.points || 1, position: i,
        })) : [])
      } else {
        setQuestions([])
      }
    } catch { setQuestions([]) }
    setShowForm(true)
  }

  const MEDAILLE_LABELS: Record<string, string> = { or: 'Or', argent: 'Argent', bronze: 'Bronze' }
  const MEDAILLE_COLORS: Record<string, string> = { or: 'text-yellow-400', argent: 'text-gray-300', bronze: 'text-orange-400' }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl">
      {/* Onglets */}
      <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">

        <a href="/admin/examens" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/examens' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Examens finaux</a>
        <a href="/admin/examens/banque" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/examens/banque' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Banque de questions</a>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-white">Examens finaux</h1>
          <p className="text-noir-400 text-sm mt-1">Validation automatique des compétences par examen</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditExamen(null); setForm({ ...EMPTY_FORM }); setSelectedEleves([]) }} className="btn-gold flex items-center gap-2">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Créer un examen
        </button>
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${msg.type === 'ok' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>{msg.text}</div>}

      {/* Liste des examens */}
      {examens.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-noir-400">Aucun examen créé</p>
          <p className="text-noir-600 text-sm mt-1">Créez votre premier examen final</p>
        </div>
      ) : (
        <div className="space-y-3">
          {examens.map(ex => {
            const dateEx = DateTime.fromISO(ex.date_examen, { zone: 'utc' }).setZone('local').setLocale('fr')
            const isPast = new Date(ex.date_examen) < new Date()
            const nbEleves = ex.examen_eleves?.[0]?.count || 0
            const nbSessions = ex.examen_sessions?.[0]?.count || 0
            return (
              <div key={ex.id} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold">{ex.titre}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${isPast ? 'text-noir-500 border-noir-700' : 'text-green-400 border-green-500/30 bg-green-500/10'}`}>
                        {isPast ? 'Passé' : 'À venir'}
                      </span>
                      {!ex.est_actif && <span className="text-xs px-2 py-0.5 rounded-full border text-red-400 border-red-500/30">Désactivé</span>}
                    </div>
                    <p className="text-gold-400 text-xs font-medium">{ex.categorie}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-noir-400 flex-wrap">
                      <span>{dateEx.toFormat("d MMM yyyy 'à' HH'h'mm")}</span>
                      <span>{ex.duree_minutes} min</span>
                      <span>Score min : {ex.score_min}%</span>
                      <span>{nbEleves} élève{nbEleves > 1 ? 's' : ''} autorisé{nbEleves > 1 ? 's' : ''}</span>
                      <span>{nbSessions} session{nbSessions > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => loadResultats(ex.id)} className="btn-outline text-xs px-3 py-1.5">Résultats</button>
                    <button onClick={() => startEdit(ex)} className="text-noir-400 hover:text-gold-400 p-1.5 transition-colors">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(ex.id)} className="text-noir-600 hover:text-red-400 p-1.5 transition-colors">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal résultats */}
      {viewResultats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">Résultats de l'examen</h2>
              <button onClick={() => setViewResultats(null)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {resultats.length === 0 ? (
                <p className="text-noir-400 text-center py-8">Aucun résultat pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {resultats.map(s => (
                    <div key={s.id} className={`card border ${s.reussi ? 'border-green-500/20' : 'border-red-500/20'}`}>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-white font-medium text-sm">{s.eleve?.prenom} {s.eleve?.nom}</p>
                          <p className="text-noir-500 text-xs">{s.eleve?.email}</p>
                          {s.submitted_at && <p className="text-noir-600 text-xs mt-0.5">{DateTime.fromISO(s.submitted_at).setLocale('fr').toFormat("d MMM yyyy 'à' HH'h'mm")}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          {s.niveau_medaille && (
                            <span className={`text-sm font-bold ${MEDAILLE_COLORS[s.niveau_medaille] || ''}`}>
                              {MEDAILLE_LABELS[s.niveau_medaille]}
                            </span>
                          )}
                          <span className={`text-lg font-bold ${s.reussi ? 'text-green-400' : 'text-red-400'}`}>{s.score}%</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${s.reussi ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                            {s.reussi ? 'Réussi' : 'Échoué'}
                          </span>
                          {!s.reussi && (
                            <button onClick={async () => {
                              await autoriserTentative(viewResultats!, s.eleve_id)
                              // Recharger les résultats
                              const data = await fetch(`/api/admin/examens/resultats?examen_id=${viewResultats}`).then(r => r.json())
                              setResultats(Array.isArray(data) ? data : [])
                            }} className="btn-outline text-xs px-2 py-1">
                              +1 tentative
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{ maxWidth: '560px' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <h2 className="text-white font-serif text-xl">{editExamen ? "Modifier l'examen" : 'Créer un examen final'}</h2>
              <button onClick={() => { setShowForm(false); setEditExamen(null) }} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSave} id="examen-form" className="space-y-4">
                <div>
                  <label className="label mb-1 block">Titre *</label>
                  <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input w-full" required placeholder="Ex: Examen Fondamentaux — Promotion 2026" />
                </div>
                <div>
                  <label className="label mb-1 block">Catégorie de compétences *</label>
                  <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="input w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <p className="text-noir-600 text-xs mt-1">Les compétences de cette catégorie seront validées automatiquement si l'élève réussit</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label mb-1 block">Date et heure *</label>
                    <input type="datetime-local" value={form.date_examen} onChange={e => setForm(f => ({ ...f, date_examen: e.target.value }))} className="input w-full" required />
                  </div>
                  <div>
                    <label className="label mb-1 block">Durée (minutes)</label>
                    <div className="flex gap-2">
                      <select value={DUREES.includes(form.duree_minutes) ? form.duree_minutes : 0}
                        onChange={e => { const v = parseInt(e.target.value); if (v > 0) setForm(f => ({ ...f, duree_minutes: v })) }}
                        className="input flex-1">
                        {DUREES.map(d => <option key={d} value={d}>{d} min</option>)}
                        <option value={0}>Personnalisé</option>
                      </select>
                      {!DUREES.includes(form.duree_minutes) && (
                        <input type="number" min="5" max="300" value={form.duree_minutes}
                          onChange={e => setForm(f => ({ ...f, duree_minutes: parseInt(e.target.value) || 60 }))}
                          className="input w-20 text-center" placeholder="min" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label mb-1 block">Score minimum : {form.score_min}%</label>
                    <input type="range" min="50" max="100" step="5" value={form.score_min} onChange={e => setForm(f => ({ ...f, score_min: parseInt(e.target.value) }))} className="w-full" />
                    <div className="flex justify-between text-xs text-noir-600 mt-1"><span>50%</span><span>75%</span><span>100%</span></div>
                  </div>
                  <div>
                    <label className="label mb-1 block">Tentatives autorisées</label>
                    <select value={form.nb_tentatives} onChange={e => setForm(f => ({ ...f, nb_tentatives: parseInt(e.target.value) }))} className="input w-full">
                      {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <EleveSearchSelect
                  eleves={eleves}
                  selected={selectedEleves}
                  onChange={setSelectedEleves}
                  label="Élèves autorisés (recevront un email de convocation)"
                />
                <QuestionEditor questions={questions} onChange={setQuestions} />
              </form>
            </div>
            <div className="px-6 py-4 border-t border-noir-800 shrink-0 flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditExamen(null) }} className="btn-outline flex-1">Annuler</button>
              <button type="submit" form="examen-form" disabled={saving} className="btn-gold flex-1">
                {saving ? 'Enregistrement...' : editExamen ? 'Modifier' : "Créer l'examen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
