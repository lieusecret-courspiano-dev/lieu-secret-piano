'use client'
import { useState, useEffect } from 'react'
import PublicNav from '@/components/PublicNav'
import { TIMEZONES } from '@/types'
import { Check } from 'lucide-react'

const NIVEAUX = [
  { value: 'debutant',      label: "Débutant — Je n'ai jamais joué" },
  { value: 'elementaire',   label: 'Élémentaire — Quelques notions' },
  { value: 'intermediaire', label: 'Intermédiaire — Quelques années' },
  { value: 'avance',        label: 'Avancé — Niveau confirmé' },
]

export default function EssaiPage() {
  const [form, setForm] = useState({ nom: '', email: '', phone: '', niveau: 'debutant', message: '', timezone: 'Europe/Paris' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [texts, setTexts] = useState({
    label: '{texts.label}',
    titre: "Cours d'essai gratuit",
    sous_titre: '{texts.sous_titre}',
    duree: '1h offerte',
    duree_desc: 'Cours individuel',
    format: 'En ligne',
    format_desc: 'Via Zoom',
    gratuit: 'Gratuit',
    gratuit_desc: 'Sans engagement',
    form_titre: "Réservez votre cours d'essai",
    btn_label: "Demander mon cours d'essai gratuit",
  })

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then((d: Record<string, string>) => {
      setTexts(t => ({
        ...t,
        label:       d.essai_label       || t.label,
        titre:       d.essai_titre       || t.titre,
        sous_titre:  d.essai_sous_titre  || t.sous_titre,
        duree:       d.essai_duree       || t.duree,
        duree_desc:  d.essai_duree_desc  || t.duree_desc,
        format:      d.essai_format      || t.format,
        format_desc: d.essai_format_desc || t.format_desc,
        form_titre:  d.essai_form_titre  || t.form_titre,
        btn_label:   d.essai_btn_label   || t.btn_label,
      }))
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.email.trim()) { setError('Nom et email requis'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/essai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setSuccess(true)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <div className="max-w-2xl mx-auto px-4 pt-28 sm:pt-32 pb-16">
        {success ? (
          <div className="card border-green-500/30 text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="font-serif text-3xl text-white mb-3">Demande envoyée !</h2>
            <p className="text-noir-400 mb-2">Nous vous contacterons très prochainement pour convenir d&apos;un créneau.</p>
            <p className="text-noir-500 text-sm">Vérifiez votre dossier Spam si vous ne recevez pas d&apos;email de confirmation.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="text-gold-500 text-xs tracking-widest uppercase mb-3">Sans engagement</div>
              <h1 className="font-serif text-4xl text-white mb-4 animate-fade-in-up">{texts.titre}</h1>
              <p className="text-noir-400 max-w-lg mx-auto">{texts.sous_titre}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[{ title: texts.duree, desc: texts.duree_desc }, { title: texts.format, desc: texts.format_desc }, { title: texts.gratuit, desc: texts.gratuit_desc }].map((item, i) => (
                <div key={i} className="card text-center py-4">
                  <p className="text-white font-bold text-sm mb-1">{item.title}</p>
                  <p className="text-noir-500 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="card">
              <h2 className="font-serif text-xl text-white mb-6">{texts.form_titre}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label mb-1 block">Votre nom *</label><input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Prénom Nom" className="input w-full" required /></div>
                  <div><label className="label mb-1 block">Votre email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vous@exemple.com" className="input w-full" required /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label mb-1 block">Téléphone (optionnel)</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+33 6 00 00 00 00" className="input w-full" /></div>
                  <div><label className="label mb-1 block">Fuseau horaire</label>
                    <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} className="input w-full">
                      {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label mb-2 block">Votre niveau</label>
                  <div className="grid grid-cols-2 gap-2">
                    {NIVEAUX.map(n => (
                      <button key={n.value} type="button" onClick={() => setForm(f => ({ ...f, niveau: n.value }))}
                        className={`p-3 rounded-xl border text-sm text-left transition-all ${form.niveau === n.value ? 'border-gold-500 bg-gold-500/10 text-white' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="label mb-1 block">Message (optionnel)</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Vos objectifs, disponibilités préférées..." rows={3} className="input w-full resize-none" />
                </div>
                {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>}
                <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-base">
                  {loading ? 'Envoi en cours...' : texts.btn_label}
                </button>
                <p className="text-noir-600 text-xs text-center">Vérifiez votre dossier Spam si vous ne recevez pas l&apos;email de confirmation.</p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
