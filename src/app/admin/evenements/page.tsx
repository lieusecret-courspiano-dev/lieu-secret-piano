'use client'

import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star } from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string | null
  type: string
  date_heure: string
  duration_minutes: number
  max_spots: number | null
  spots_remaining: number
  price: number
  is_free: boolean
  is_active: boolean
  is_featured: boolean
  zoom_link: string | null
}

const TYPE_OPTIONS = [
  { value: 'cours',       label: 'Cours collectif' },
  { value: 'atelier',     label: 'Atelier' },
  { value: 'evenement',   label: 'Evenement' },
  { value: 'masterclass', label: 'Masterclass' },
]

const EMPTY_FORM = {
  title: '', description: '', type: 'atelier',
  date: '', time: '14:00', duration_minutes: 60,
  max_spots: '', price: '0', is_free: true, zoom_link: '', is_featured: false,
}

export default function AdminEvenements() {
  const [events, setEvents]     = useState<Event[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Event | null>(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    setLoading(true)
    const res  = await fetch('/api/events?all=true')
    const data = await res.json()
    setEvents(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(ev: Event) {
    setEditing(ev)
    const dt = DateTime.fromISO(ev.date_heure, { zone: 'utc' }).setZone('Europe/Paris')
    setForm({
      title:            ev.title,
      description:      ev.description || '',
      type:             ev.type,
      date:             dt.toFormat('yyyy-MM-dd'),
      time:             dt.toFormat('HH:mm'),
      duration_minutes: ev.duration_minutes,
      max_spots:        ev.max_spots?.toString() || '',
      price:            ev.price.toString(),
      is_free:          ev.is_free,
      zoom_link:        ev.zoom_link || '',
      is_featured:      ev.is_featured || false,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const date_heure = DateTime.fromISO(`${form.date}T${form.time}:00`, { zone: 'Europe/Paris' }).toUTC().toISO()
      const body = {
        title:            form.title,
        description:      form.description || null,
        type:             form.type,
        date_heure,
        duration_minutes: Number(form.duration_minutes),
        max_spots:        form.max_spots ? Number(form.max_spots) : null,
        price:            form.is_free ? 0 : Number(form.price),
        is_free:          form.is_free,
        zoom_link:        form.zoom_link || null,
        is_featured:      form.is_featured,
      }

      const url    = editing ? `/api/events/${editing.id}` : '/api/events'
      const method = editing ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setShowForm(false)
      fetchEvents()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(ev: Event) {
    await fetch(`/api/events/${ev.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_active: !ev.is_active }),
    })
    fetchEvents()
  }

  async function handleFeature(ev: Event) {
    // Retirer la vedette de tous les autres, puis activer sur celui-ci
    await fetch(`/api/events/${ev.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_featured: !ev.is_featured }),
    })
    fetchEvents()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet evenement ?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  function formatDate(iso: string) {
    return DateTime.fromISO(iso, { zone: 'utc' }).setZone('Europe/Paris').setLocale('fr').toFormat("d MMM yyyy 'a' HH'h'mm")
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Evenements</h1>
          <p className="text-noir-400 text-sm mt-1">Ateliers, masterclass et evenements. Mettez-en un en vedette pour l'afficher en banniere sur le site.</p>
        </div>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Creer
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center py-12 text-noir-400">
          <p className="text-4xl mb-3">—</p>
          <p>Aucun evenement cree</p>
          <button onClick={openCreate} className="btn-gold mt-4">Creer le premier</button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(ev => (
            <div key={ev.id} className={`card ${!ev.is_active ? 'opacity-50' : ''} ${ev.is_featured ? 'border-gold-500/50' : ''}`}>
              {ev.is_featured && (
                <div className="text-xs text-gold-400 font-medium mb-2 flex items-center gap-1">
                  <Star size={12} className="fill-gold-400" /> En vedette sur le site
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-medium">{ev.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                      {TYPE_OPTIONS.find(t => t.value === ev.type)?.label || ev.type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      ev.is_free
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-gold-500/10 text-gold-400 border-gold-500/20'
                    }`}>
                      {ev.is_free ? 'Gratuit' : `${ev.price.toFixed(2)} EUR`}
                    </span>
                  </div>
                  <p className="text-noir-400 text-sm">{formatDate(ev.date_heure)}</p>
                  {ev.max_spots !== null && (
                    <p className="text-noir-500 text-xs mt-1">
                      {ev.spots_remaining}/{ev.max_spots} places restantes
                    </p>
                  )}
                  {ev.description && (
                    <p className="text-noir-500 text-xs mt-1 line-clamp-1">{ev.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleFeature(ev)}
                    className={`transition-colors ${ev.is_featured ? 'text-gold-400' : 'text-noir-600 hover:text-gold-500'}`}
                    title={ev.is_featured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                  >
                    <Star size={16} className={ev.is_featured ? 'fill-gold-400' : ''} />
                  </button>
                  <button onClick={() => handleToggle(ev)} className="text-noir-400 hover:text-gold-400 transition-colors" title={ev.is_active ? 'Desactiver' : 'Activer'}>
                    {ev.is_active ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => openEdit(ev)} className="text-noir-400 hover:text-gold-400 transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(ev.id)} className="text-noir-400 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-serif text-xl">{editing ? 'Modifier' : 'Nouvel evenement'}</h2>
              <button onClick={() => setShowForm(false)} className="text-noir-400 hover:text-white">x</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label mb-1 block">Titre *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nom de l'evenement" className="input w-full" required />
              </div>

              <div>
                <label className="label mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1 block">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input w-full" required />
                </div>
                <div>
                  <label className="label mb-1 block">Heure *</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="input w-full" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1 block">Duree (min)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className="input w-full" min={15} />
                </div>
                <div>
                  <label className="label mb-1 block">Places max</label>
                  <input type="number" value={form.max_spots} onChange={e => setForm(f => ({ ...f, max_spots: e.target.value }))} placeholder="Illimite" className="input w-full" min={1} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                  <span className="text-sm text-white">Gratuit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                  <span className="text-sm text-white">Mettre en vedette</span>
                </label>
              </div>

              {!form.is_free && (
                <div>
                  <label className="label mb-1 block">Prix (EUR)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input w-full" min={0} step={0.01} />
                </div>
              )}

              <div>
                <label className="label mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description de l'evenement..." rows={3} className="input w-full resize-none" />
              </div>

              <div>
                <label className="label mb-1 block">Lien Zoom / Meet (optionnel)</label>
                <input value={form.zoom_link} onChange={e => setForm(f => ({ ...f, zoom_link: e.target.value }))} placeholder="https://zoom.us/j/..." className="input w-full" />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Annuler</button>
                <button type="submit" className="btn-gold flex-1" disabled={saving}>
                  {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}