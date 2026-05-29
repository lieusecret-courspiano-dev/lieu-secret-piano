'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react'

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
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

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
  const [loading, setLoading]       = useState(true)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  // Formulaire nouvelle règle
  const [newRule, setNewRule] = useState({ day_of_week: 1, start_time: '09:00', end_time: '18:00' })

  // Formulaire nouvelle exception
  const [newEx, setNewEx] = useState({
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

  async function addRule() {
    if (newRule.start_time >= newRule.end_time) { setError('Heure de fin doit etre apres le debut'); return }
    setError('')
    const res = await fetch('/api/availability/rules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    })
    if (res.ok) { fetchAll(); setSuccess('Regle ajoutee'); setTimeout(() => setSuccess(''), 3000) }
    else { const d = await res.json(); setError(d.error) }
  }

  async function deleteRule(id: string) {
    if (!confirm('Supprimer cette regle ?')) return
    await fetch(`/api/availability/rules/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function toggleRule(rule: Rule) {
    await fetch(`/api/availability/rules/${rule.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    })
    fetchAll()
  }

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
      setSuccess('Exception ajoutee'); setTimeout(() => setSuccess(''), 3000)
    } else { const d = await res.json(); setError(d.error) }
  }

  async function deleteException(id: string) {
    await fetch(`/api/availability/exceptions/${id}`, { method: 'DELETE' })
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
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Disponibilites</h1>
        <p className="text-noir-400 text-sm mt-1">Gerez vos horaires, exceptions et parametres de reservation</p>
      </div>

      {error   && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-500/50 text-green-300 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

      {/* ── PARAMETRES ── */}
      <div className="card mb-6">
        <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Parametres de reservation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-1 block">Duree d'un cours (min)</label>
            <input type="number" value={settings.slot_duration_min} onChange={e => setSettings(s => ({ ...s, slot_duration_min: Number(e.target.value) }))} className="input w-full" min={15} step={15} />
          </div>
          <div>
            <label className="label mb-1 block">Buffer entre cours (min)</label>
            <input type="number" value={settings.buffer_min} onChange={e => setSettings(s => ({ ...s, buffer_min: Number(e.target.value) }))} className="input w-full" min={0} step={5} />
          </div>
          <div>
            <label className="label mb-1 block">Preavois minimum (heures)</label>
            <input type="number" value={settings.min_notice_hours} onChange={e => setSettings(s => ({ ...s, min_notice_hours: Number(e.target.value) }))} className="input w-full" min={0} />
          </div>
          <div>
            <label className="label mb-1 block">Fenetre de reservation (jours)</label>
            <input type="number" value={settings.max_days_ahead} onChange={e => setSettings(s => ({ ...s, max_days_ahead: Number(e.target.value) }))} className="input w-full" min={1} />
          </div>
          <div>
            <label className="label mb-1 block">Fuseau horaire</label>
            <select value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))} className="input w-full">
              <option value="Europe/Paris">France (Paris)</option>
              <option value="Europe/London">Royaume-Uni</option>
              <option value="America/Montreal">Canada (Montreal)</option>
              <option value="Africa/Abidjan">Cote d'Ivoire</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
        <button onClick={saveSettings} className="btn-gold mt-4 flex items-center gap-2">
          {saved ? <><CheckCircle size={16} /> Enregistre !</> : <><Save size={16} /> Enregistrer</>}
        </button>
      </div>

      {/* ── REGLES RECURRENTES ── */}
      <div className="card mb-6">
        <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Horaires hebdomadaires</h2>
        <p className="text-noir-500 text-xs mb-4">Definissez vos disponibilites par jour de la semaine. Les creneaux sont generes automatiquement.</p>

        {/* Affichage par jour */}
        <div className="space-y-3 mb-6">
          {rulesByDay.map(({ day, dayNum, rules: dayRules }) => (
            <div key={dayNum} className="flex items-start gap-3">
              <div className="w-24 shrink-0 pt-2">
                <span className="text-sm text-white font-medium">{day}</span>
              </div>
              <div className="flex-1">
                {dayRules.length === 0 ? (
                  <span className="text-xs text-noir-600 italic">Pas de disponibilite</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dayRules.map(r => (
                      <div key={r.id} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${r.is_active ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-noir-800 border-noir-700 text-noir-500'}`}>
                        <span>{r.start_time} — {r.end_time}</span>
                        <button onClick={() => toggleRule(r)} className="hover:opacity-70 text-xs">
                          {r.is_active ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => deleteRule(r.id)} className="hover:text-red-400">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ajouter une règle */}
        <div className="bg-noir-800 rounded-xl p-4">
          <p className="text-xs text-gold-500 uppercase tracking-wider mb-3">Ajouter une disponibilite</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label mb-1 block">Jour</label>
              <select value={newRule.day_of_week} onChange={e => setNewRule(r => ({ ...r, day_of_week: Number(e.target.value) }))} className="input w-full">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-1 block">Debut</label>
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
        <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Exceptions ponctuelles</h2>
        <p className="text-noir-500 text-xs mb-4">Ajoutez des fermetures (vacances, jours feries) ou des ouvertures exceptionnelles. Les exceptions ont priorite sur les regles habituelles.</p>

        {/* Liste des exceptions */}
        {exceptions.length > 0 && (
          <div className="space-y-2 mb-4">
            {exceptions.map(ex => (
              <div key={ex.id} className={`flex items-center justify-between px-4 py-2 rounded-lg border text-sm ${ex.type === 'closed' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-green-500/10 border-green-500/20 text-green-300'}`}>
                <div>
                  <span className="font-medium">{ex.exception_date}</span>
                  <span className="mx-2">—</span>
                  <span>{ex.type === 'closed' ? 'Ferme' : `Ouvert ${ex.start_time}–${ex.end_time}`}</span>
                  {ex.reason && <span className="text-xs opacity-70 ml-2">({ex.reason})</span>}
                </div>
                <button onClick={() => deleteException(ex.id)} className="hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
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
                <option value="closed">Fermeture (vacances, ferie...)</option>
                <option value="open">Ouverture exceptionnelle</option>
              </select>
            </div>
          </div>
          {newEx.type === 'open' && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label mb-1 block">Heure debut</label>
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
            <input value={newEx.reason} onChange={e => setNewEx(x => ({ ...x, reason: e.target.value }))} placeholder="Ex: Vacances, Jour ferie..." className="input w-full" />
          </div>
          <button onClick={addException} className="btn-gold flex items-center gap-2 text-sm">
            <Plus size={14} /> Ajouter l'exception
          </button>
        </div>
      </div>
    </div>
  )
}