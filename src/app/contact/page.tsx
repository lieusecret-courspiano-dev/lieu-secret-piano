'use client'
import { useState, useEffect, Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

interface Question {
  id: string; label: string; type: string; options: string | null
  required: boolean; placeholder: string | null; hint: string | null
}

function ContactFormContent() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/inscription-form').then(r => r.json()).then(data => {
      setQuestions(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function handleChange(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function handleMulti(id: string, option: string, checked: boolean) {
    setAnswers(prev => {
      const current = (prev[id] as string[]) || []
      return { ...prev, [id]: checked ? [...current, option] : current.filter(v => v !== option) }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Vérifier les champs obligatoires
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id]
        if (!val || (Array.isArray(val) && val.length === 0) || val === '') {
          setError(`Le champ "${q.label}" est obligatoire.`)
          return
        }
      }
    }
    setSubmitting(true); setError('')
    try {
      const answersObj: Record<string, string> = {}
      for (const q of questions) {
        const val = answers[q.id]
        if (val) answersObj[q.label] = Array.isArray(val) ? val.join(', ') : String(val)
      }
      const res = await fetch('/api/contact-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersObj }),
      })
      if (!res.ok) throw new Error('Erreur lors de l\'envoi')
      setSubmitted(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi')
    } finally { setSubmitting(false) }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full card border-gold-500/30 text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="font-serif text-2xl text-white mb-3">Message envoyé !</h2>
          <p className="text-noir-400 text-sm mb-6 leading-relaxed">
            Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
          </p>
          <p className="text-noir-600 text-xs mb-6">Vérifiez votre dossier Spam si vous ne recevez pas de réponse.</p>
          <Link href="/" className="btn-gold px-8">Retour à l'accueil</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16 pb-24">
        {/* En-tête */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-2 mb-6">
            <svg width="14" height="14" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span className="text-gold-400 text-xs font-medium tracking-widest uppercase">Nous contacter</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-white mb-4 animate-fade-in-up">Prenons contact</h1>
          <p className="text-noir-400 max-w-md mx-auto leading-relaxed">
            Remplissez ce formulaire et nous vous répondrons rapidement.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : questions.length === 0 ? (
          <div className="card text-center py-16">
            <svg width="40" height="40" fill="none" stroke="#505080" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-4">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <p className="text-noir-400 text-lg">Formulaire en cours de configuration</p>
            <p className="text-noir-600 text-sm mt-2">Revenez bientôt ou contactez-nous directement.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {questions.map((q, i) => {
              const opts = q.options
                    ? (q.options.includes('|')
                        ? q.options.split('|')
                        : q.options.split(',')
                      ).map(o => o.trim()).filter(Boolean)
                    : []
              const val = answers[q.id]

              return (
                <div key={q.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  {/* Label */}
                  <label className="block text-white font-semibold text-sm mb-1">
                    {q.label}
                    {q.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {q.hint && <p className="text-noir-500 text-xs mb-3 leading-relaxed">{q.hint}</p>}

                  {/* Texte court */}
                  {(q.type === 'text' || q.type === 'email' || q.type === 'tel' || q.type === 'number') && (
                    <input
                      type={q.type}
                      value={(val as string) || ''}
                      onChange={e => handleChange(q.id, e.target.value)}
                      placeholder={q.placeholder || ''}
                      className="input w-full"
                      required={q.required}
                    />
                  )}

                  {/* Texte long */}
                  {q.type === 'textarea' && (
                    <textarea
                      value={(val as string) || ''}
                      onChange={e => handleChange(q.id, e.target.value)}
                      placeholder={q.placeholder || ''}
                      rows={3}
                      className="input w-full resize-none"
                      required={q.required}
                    />
                  )}

                  {/* Date */}
                  {q.type === 'date' && (
                    <input type="date" value={(val as string) || ''} onChange={e => handleChange(q.id, e.target.value)} className="input w-full" required={q.required} />
                  )}

                  {/* Liste déroulante */}
                  {q.type === 'select' && (
                    <select value={(val as string) || ''} onChange={e => handleChange(q.id, e.target.value)} className="input w-full" required={q.required}>
                      <option value="">Choisir une option...</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}

                  {/* Boutons radio — choix unique */}
                  {q.type === 'radio' && (
                    <div className="space-y-2 mt-2">
                      {opts.map(o => {
                        const isSelected = val === o
                        return (
                          <label key={o} className={`flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 border transition-all ${isSelected ? 'bg-gold-500/10 border-gold-500/30' : 'border-noir-700 hover:border-noir-600 hover:bg-noir-800/30'}`}>
                            <input type="radio" name={q.id} value={o} checked={isSelected} onChange={() => handleChange(q.id, o)} required={q.required} />
                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-noir-300'}`}>{o}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Cases à cocher — choix multiple */}
                  {q.type === 'multiselect' && (
                    <div className="space-y-2 mt-2">
                      {opts.map(o => {
                        const checked = Array.isArray(val) && val.includes(o)
                        return (
                          <label key={o} className={`flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 border transition-all ${checked ? 'bg-gold-500/10 border-gold-500/30' : 'border-noir-700 hover:border-noir-600 hover:bg-noir-800/30'}`}>
                            <input type="checkbox" checked={checked} onChange={e => handleMulti(q.id, o, e.target.checked)} />
                            <span className={`text-sm font-medium ${checked ? 'text-white' : 'text-noir-300'}`}>{o}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Case à cocher simple oui/non */}
                  {q.type === 'checkbox' && (
                    <label className={`flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 border transition-all mt-2 ${val === 'true' ? 'bg-gold-500/10 border-gold-500/30' : 'border-noir-700 hover:border-noir-600'}`}>
                      <input type="checkbox" checked={val === 'true'} onChange={e => handleChange(q.id, e.target.checked ? 'true' : 'false')} />
                      <span className={`text-sm font-medium ${val === 'true' ? 'text-white' : 'text-noir-300'}`}>{q.placeholder || 'Oui'}</span>
                    </label>
                  )}
                </div>
              )
            })}

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-gold w-full py-4 text-base font-bold">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </span>
              ) : 'Envoyer mon message'}
            </button>

            <p className="text-noir-600 text-xs text-center">
              Vérifiez votre dossier Spam si vous ne recevez pas de réponse.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ContactFormContent />
    </Suspense>
  )
}