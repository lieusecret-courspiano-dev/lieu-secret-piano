'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, CheckCircle, Pencil, X, Check } from 'lucide-react'

interface Rule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface Exception {
  id: string
  exception_date: string
  type: 'closed' | 'open'
  start_time: string | null
  end_time: string | null
  reason: string | null
}

interface BookingSettings {
  slot_duration_min: number
  buffer_min: number
  min_notice_hours: number
  max_days_ahead: number
  slot_increment_min: number
  timezone: string
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const TIME_SLOTS = Array.from({ length: 31 }, (_, i) => {
  const h = Math.floor(i / 2) + 7
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export default function AdminDisponibilites() {
  const [rules, setRules]           = useState<Rule[]>([])
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [settings, setSettings]     = useState<BookingSettings>({
    slot_duration_min: 60, buffer_min: 15, min_notice_hours: 10,
    max_days_ahead: 60, slot_increment_min: 60, timezone: 'Europe/Paris',
  })
  const [loading, setLoading]   = useState(true)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  // Formulaire nouvelle règle
  const [newRule, setNewRule] = useState({ day_of_week: 1, start_time: '09:00', end_time: '18:00' })

  // Édition inline d'une règle
  const [editRuleId, setEditRuleId]   = useState<string | null>(null)
  const [editRuleForm, setEditRuleForm] = useState({ day_of_week: 1, start_time: '09:00', end_time: '18:00' })

  // Formulaire nouvelle exception
  const [newEx, setNewEx] = useState({
    exception_date: '', type: 'closed' as 'closed' | 'open',
    start_time: '09:00', end_time: '18:00', reason: '',
  })

  // Édition inline d'une exception
  const [editExId, setEditExId]     = useState<string | null>(null)
  const [editExForm, setEditExForm] = useState({
    exception_date: '', type: 'closed' as 'closed' | 'open',
    start_time: '09:00', end_time: '18:00', reason: '',
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [rRes, eRes, sRes] = await Promise.all([
      fetch('/api/availability/rules'),
      fetch('/api/availability/exceptions'),
      fetch('/api/availability/settings'),
    ])
    setRules(await rRes.json())
    setExceptions(await eRes.json())
    setSettings(await sRes.json())
    setLoading(false)
  }

  // ── Règles ──────────────────────────────────────────────────────────────────

  async function addRule() {
    if (newRule.start_time >= newRule.end_time) { setError('Heure de fin doit être après le début'); return }
    setError('')
    const res = await fetch('/api/availability/rules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    })
    if (res.ok) { fetchAll(); setSuccess('Règle ajoutée'); setTimeout(() => setSuccess(''), 3000) }
    else { const d = await res.json(); setError(d.error) }
  }

  function startEditRule(r: Rule) {
    setEditRuleId(r.id)
    setEditRuleForm({ day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time })
  }

  async function saveEditRule(id: string) {
    if (editRuleForm.start_time >= editRuleForm.end_time) { setError('Heure de fin doit être après le début'); return }
    const res = await fetch('/api/availability/rules', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editRuleForm }),
    })
    if (res.ok) { setEditRuleId(null); fetchAll(); setSuccess('Règle modifiée'); setTimeout(() => setSuccess(''), 3000) }
    else { const d = await res.json(); setError(d.error) }
  }

  async function toggleRule(rule: Rule) {
    await fetch('/api/availability/rules', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }),
    })
    fetchAll()
  }

  async function deleteRule(id: string) {
    if (!confirm('Supprimer cette règle ?')) return
    await fetch('/api/availability/rules', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchAll()
  }

  // ── Exceptions ──────────────────────────────────────────────────────────────

  async function addException() {
    if (!newEx.exception_date) { setError('Date requise'); return }
    setError('')
    const res = await fetch('/api/availability/exceptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEx),
    })
    if (res.ok) {
      fetchAll()
      setNewEx({ exception_date: '', type: 'closed', start_time: '09:00', end_time: '18:00', reason: '' })
      setSuccess('Exception ajoutée'); setTimeout(() => setSuccess(''), 3000)
    } else { const d = await res.json(); setError(d.error) }
  }

  function startEditEx(ex: Exception) {
    setEditExId(ex.id)
    setEditExForm({
      exception_date: ex.exception_date,
      type: ex.type,
      start_time: ex.start_time || '09:00',
      end_time: ex.end_time || '18:00',
      reason: ex.reason || '',
    })
  }

  async function saveEditEx(id: string) {
    const res = await fetch('/api/availability/exceptions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editExForm }),
    })
    if (res.ok) { setEditExId(null); fetchAll(); setSuccess('Exception modifiée'); setTimeout(() => setSuccess(''), 3000) }
    else { const d = await res.json(); setError(d.error) }
  }

  async function deleteException(id: string) {
    if (!confirm('Supprimer cette exception ?')) return
    await fetch('/api/availability/exceptions', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchAll()
  }

  async function saveSettings() {
    const res = await fetch('/api/availability/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else { const d = await res.json(); setError(d.error) }
  }

  // Grouper les règles par jour
  const rulesByDay = DAYS.map((day, i) => ({
    day, dayNum: i,
    rules: rules.filter(r => r.day_of_week === i),
  }))

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Disponibilités</h1>
        <p className="text-noir-400 text-sm mt-1">Gérez vos horaires, exceptions et paramètres de réservation</p>
      </div>

      {error   && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-500/50 text-green-300 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

      {/* ── PARAMÈTRES ── */}
      <div className="card mb-6">
        <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Paramètres de réservation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-1 block">Durée d'un cours (min)</label>
            <input type="number" value={settings.slot_duration_min} onChange={e => setSettings(s => ({ ...s, slot_duration_min: Number(e.target.value) }))} className="input w-full" min={15} step={15} />
          </div>
          <div>
            <label className="label mb-1 block">Buffer entre cours (min)</label>
            <input type="number" value={settings.buffer_min} onChange={e => setSettings(s => ({ ...s, buffer_min: Number(e.target.value) }))} className="input w-full" min={0} step={5} />
          </div>
          <div>
            <label className="label mb-1 block">Préavis minimum (heures)</label>
            <input type="number" value={settings.min_notice_hours} onChange={e => setSettings(s => ({ ...s, min_notice_hours: Number(e.target.value) }))} className="input w-full" min={0} />
          </div>
          <div>
            <label className="label mb-1 block">Fenêtre de réservation (jours)</label>
            <input type="number" value={settings.max_days_ahead} onChange={e => setSettings(s => ({ ...s, max_days_ahead: Number(e.target.value) }))} className="input w-full" min={1} />
          </div>
          <div className="col-span-2">
            <label className="label mb-1 block">Fuseau horaire</label>
            <select value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))} className="input w-full">
              <option value="Europe/Paris">France (Paris)</option>
              <option value="Europe/London">Royaume-Uni</option>
              <option value="Europe/Brussels">Belgique</option>
              <option value="Europe/Zurich">Suisse</option>
              <option value="America/Montreal">Canada (Montréal)</option>
              <option value="Africa/Abidjan">Côte d'Ivoire</option>
              <option value="Africa/Dakar">Sénégal</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
        <button onClick={saveSettings} className="btn-gold mt-4 flex items-center gap-2">
          {saved ? <><CheckCircle size={16} /> Enregistré !</> : <><Save size={16} /> Enregistrer</>}
        </button>
      </div>

      {/* ── RÈGLES RÉCURRENTES ── */}
      <div className="card mb-6">
        <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-1">Horaires hebdomadaires</h2>
        <p className="text-noir-500 text-xs mb-4">Cliquez sur le crayon pour modifier un horaire existant.</p>

        <div className="space-y-2 mb-6">
          {rulesByDay.map(({ day, dayNum, rules: dayRules }) => (
            <div key={dayNum} className="rounded-xl border border-noir-800">
              <div className="flex items-center justify-between px-4 py-2 bg-noir-800/50">
                <span className="text-sm font-medium text-white">{day}</span>
                {dayRules.length === 0 && <span className="text-xs text-noir-600 italic">Aucune disponibilité</span>}
              </div>
              {dayRules.map(r => (
                <div key={r.id}>
                  {editRuleId === r.id ? (
                    /* ── Mode édition ── */
                    <div className="px-4 py-3 bg-gold-500/5 border-t border-gold-500/20">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="label mb-1 block">Jour</label>
                          <select value={editRuleForm.day_of_week} onChange={e => setEditRuleForm(f => ({ ...f, day_of_week: Number(e.target.value) }))} className="input w-full text-xs">
                            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label mb-1 block">Début</label>
                          <select value={editRuleForm.start_time} onChange={e => setEditRuleForm(f => ({ ...f, start_time: e.target.value }))} className="input w-full text-xs">
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label mb-1 block">Fin</label>
                          <select value={editRuleForm.end_time} onChange={e => setEditRuleForm(f => ({ ...f, end_time: e.target.value }))} className="input w-full text-xs">
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEditRule(r.id)} className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1">
                          <Check size={12} /> Enregistrer
                        </button>
                        <button onClick={() => setEditRuleId(null)} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1">
                          <X size={12} /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Mode affichage ── */
                    <div className={`flex items-center justify-between px-4 py-2 border-t border-noir-800 text-sm ${r.is_active ? 'text-white' : 'text-noir-600'}`}>
                      <span className="font-mono">{r.start_time} — {r.end_time}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleRule(r)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${r.is_active !== false ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400' : 'bg-noir-800 border-noir-700 text-noir-500 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400'}`}>
                          {r.is_active !== false ? 'Actif' : 'Inactif'}
                        </button>
                        <button onClick={() => startEditRule(r)} className="text-noir-400 hover:text-gold-400 transition-colors p-1" title="Modifier">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteRule(r.id)} className="text-noir-600 hover:text-red-400 transition-colors p-1" title="Supprimer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Ajouter une règle */}
        <div className="bg-noir-800 rounded-xl p-4">
          <p className="text-xs text-gold-500 uppercase tracking-wider mb-3">Ajouter une disponibilité</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label mb-1 block">Jour</label>
              <select value={newRule.day_of_week} onChange={e => setNewRule(r => ({ ...r, day_of_week: Number(e.target.value) }))} className="input w-full">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-1 block">Début</label>
              <select value={newRule.start_time} onChange={e => setNewRule(r => ({ ...r, start_time: e.target.value }))} className="input w-full">
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-1 block">Fin</label>
              <select value={newRule.end_time} onChange={e => setNewRule(r => ({ ...r, end_time: e.target.value }))} className="input w-full">
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button onClick={addRule} className="btn-gold mt-3 flex items-center gap-2 text-sm">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* ── EXCEPTIONS ── */}
      <div className="card">
        <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-1">Exceptions ponctuelles</h2>
        <p className="text-noir-500 text-xs mb-4">Fermetures (vacances, jours fériés) ou ouvertures exceptionnelles. Les exceptions ont priorité sur les règles habituelles.</p>

        {/* Exceptions à venir (aujourd'hui et futures) */}
        {exceptions.filter(ex => ex.exception_date >= new Date().toISOString().split('T')[0]).length === 0 && (
          <p className="text-noir-600 text-xs italic mb-4">Aucune exception à venir.</p>
        )}
        {exceptions.filter(ex => ex.exception_date >= new Date().toISOString().split('T')[0]).length > 0 && (
          <div className="space-y-2 mb-4">
            {exceptions.filter(ex => ex.exception_date >= new Date().toISOString().split('T')[0]).map(ex => (
              <div key={ex.id}>
                {editExId === ex.id ? (
                  /* ── Mode édition exception ── */
                  <div className="bg-gold-500/5 border border-gold-500/20 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="label mb-1 block">Date</label>
                        <input type="date" value={editExForm.exception_date} onChange={e => setEditExForm(f => ({ ...f, exception_date: e.target.value }))} className="input w-full" />
                      </div>
                      <div>
                        <label className="label mb-1 block">Type</label>
                        <select value={editExForm.type} onChange={e => setEditExForm(f => ({ ...f, type: e.target.value as 'closed' | 'open' }))} className="input w-full">
                          <option value="closed">Fermeture</option>
                          <option value="open">Ouverture exceptionnelle</option>
                        </select>
                      </div>
                    </div>
                    {editExForm.type === 'open' && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="label mb-1 block">Début</label>
                          <select value={editExForm.start_time} onChange={e => setEditExForm(f => ({ ...f, start_time: e.target.value }))} className="input w-full">
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label mb-1 block">Fin</label>
                          <select value={editExForm.end_time} onChange={e => setEditExForm(f => ({ ...f, end_time: e.target.value }))} className="input w-full">
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="label mb-1 block">Raison (optionnel)</label>
                      <input value={editExForm.reason} onChange={e => setEditExForm(f => ({ ...f, reason: e.target.value }))} className="input w-full" placeholder="Ex: Vacances, Jour férié..." />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEditEx(ex.id)} className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1">
                        <Check size={12} /> Enregistrer
                      </button>
                      <button onClick={() => setEditExId(null)} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1">
                        <X size={12} /> Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Mode affichage exception ── */
                  <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${ex.type === 'closed' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-green-500/10 border-green-500/20 text-green-300'}`}>
                    <div>
                      <span className="font-medium">{ex.exception_date}</span>
                      <span className="mx-2">—</span>
                      <span>{ex.type === 'closed' ? 'Fermé' : `Ouvert ${ex.start_time}–${ex.end_time}`}</span>
                      {ex.reason && <span className="text-xs opacity-70 ml-2">({ex.reason})</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEditEx(ex)} className="opacity-60 hover:opacity-100 transition-opacity p-1" title="Modifier">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteException(ex.id)} className="opacity-60 hover:opacity-100 hover:text-red-400 transition-all p-1" title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ajouter une exception */}
        <div className="bg-noir-800 rounded-xl p-4">
          <p className="text-xs text-gold-500 uppercase tracking-wider mb-3">Ajouter une exception</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label mb-1 block">Date</label>
              <input type="date" value={newEx.exception_date} onChange={e => setNewEx(x => ({ ...x, exception_date: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="label mb-1 block">Type</label>
              <select value={newEx.type} onChange={e => setNewEx(x => ({ ...x, type: e.target.value as 'closed' | 'open' }))} className="input w-full">
                <option value="closed">Fermeture (vacances, férié...)</option>
                <option value="open">Ouverture exceptionnelle</option>
              </select>
            </div>
          </div>
          {newEx.type === 'open' && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label mb-1 block">Heure début</label>
                <select value={newEx.start_time} onChange={e => setNewEx(x => ({ ...x, start_time: e.target.value }))} className="input w-full">
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1 block">Heure fin</label>
                <select value={newEx.end_time} onChange={e => setNewEx(x => ({ ...x, end_time: e.target.value }))} className="input w-full">
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="mb-3">
            <label className="label mb-1 block">Raison (optionnel)</label>
            <input value={newEx.reason} onChange={e => setNewEx(x => ({ ...x, reason: e.target.value }))} placeholder="Ex: Vacances, Jour férié..." className="input w-full" />
          </div>
          <button onClick={addException} className="btn-gold flex items-center gap-2 text-sm">
            <Plus size={14} /> Ajouter l'exception
          </button>
        </div>
      </div>
    </div>
  )
}
