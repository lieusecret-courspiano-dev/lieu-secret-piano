'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function ContactModal({ onClose }: Props) {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setError('Le nom, l\'email et le message sont requis.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Adresse email invalide.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur lors de l\'envoi')
      }
      setSuccess(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 sticky top-0 bg-noir-900 z-10">
          <h2 className="text-white font-serif text-lg">Nous contacter</h2>
          <button onClick={onClose} className="text-noir-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mx-auto mb-4">
              <Send size={20} className="text-gold-400" />
            </div>
            <h3 className="text-white font-serif text-xl mb-2">Message envoyé !</h3>
            <p className="text-noir-400 text-sm mb-6">Nous vous répondrons dans les plus brefs délais.</p>
            <button onClick={onClose} className="btn-gold">Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="label mb-1 block">Votre nom *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Prénom Nom" className="input w-full" />
            </div>
            <div>
              <label className="label mb-1 block">Votre email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="vous@exemple.com" className="input w-full" />
            </div>
            <div>
              <label className="label mb-1 block">Sujet</label>
              <input name="subject" value={form.subject} onChange={handleChange} placeholder="Objet de votre message" className="input w-full" />
            </div>
            <div>
              <label className="label mb-1 block">Message *</label>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Votre message…" rows={4} className="input w-full resize-none" />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-gold w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                  Envoi…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send size={16} /> Envoyer
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}