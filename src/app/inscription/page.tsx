'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeProvider'
import PublicNav from '@/components/PublicNav'

interface InscriptionForm {
  prenom: string
  nom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  code_postal: string
  pays: string
  niveau: string
  annees_pratique: string
  rythme: string[]
  frequence: string[]
  objectifs: string
  message: string
  ref_code: string
}

const NIVEAUX    = ['Débutant (jamais joué)', 'Débutant (quelques notions)', 'Intermédiaire', 'Avancé']
const RYTHMES    = ['Matin (avant 12h)', 'Après-midi (12h–18h)', 'Soir (après 18h)', 'Week-end']
const FREQUENCES = ['1 fois par semaine', '2 fois par semaine', '1 fois toutes les 2 semaines']

function InscriptionContent() {
  const router = useRouter()
  const [form, setForm] = useState<InscriptionForm>({
    prenom: '', nom: '', email: '', telephone: '',
    adresse: '', ville: '', code_postal: '', pays: '',
    niveau: '', annees_pratique: '',
    rythme: [], frequence: [],
    objectifs: '', message: '', ref_code: '',
  })
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [extraQuestions, setExtraQuestions] = useState<{id: string; label: string; type: string; options: string | null; required: boolean}[]>([])
  const [extraAnswers, setExtraAnswers] = useState<Record<string, string | string[]>>({})

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setForm(f => ({ ...f, ref_code: ref.toUpperCase() }))
    
  }, [searchParams])

  function handleChange(key: keyof InscriptionForm, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleMulti(key: 'rythme' | 'frequence', value: string) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter(v => v !== value)
        : [...f[key], value],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.prenom || !form.nom || !form.email || !form.niveau) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setLoading(true); setError('')

    const answers: Record<string, string> = {
      'Prénom':               form.prenom,
      'Nom':                  form.nom,
      'Email':                form.email,
      'Téléphone':            form.telephone,
      'Adresse':              form.adresse,
      'Ville':                form.ville,
      'Code postal':          form.code_postal,
      'Pays':                 form.pays,
      'Niveau actuel':        form.niveau,
      'Années de pratique':   form.annees_pratique,
      'Disponibilités':       form.rythme.join(', '),
      'Fréquence souhaitée':  form.frequence.join(', '),
      'Objectifs':            form.objectifs,
      'Message':              form.message,
    }
    // Ajouter les réponses aux questions dynamiques
    for (const q of extraQuestions) {
      const val = extraAnswers[q.id]
      if (val) answers[q.label] = Array.isArray(val) ? val.join(', ') : String(val)
    }

    try {
      const res = await fetch('/api/inscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ answers, questions: [] }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Erreur lors de l'inscription")
      }
      setSuccess(true)
      // Traiter le code de parrainage si présent
      if (form.ref_code.trim()) {
        try {
          await fetch('/api/parrainage', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: form.ref_code.trim(), filleul_email: form.email, filleul_nom: `${form.prenom} ${form.nom}`.trim() }),
          })
        } catch {}
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="font-serif text-3xl text-white mb-4">Inscription envoyée !</h2>
          <p className="text-noir-300 mb-2">Bienvenue chez Lieu Secret, {form.prenom} !</p>
          <p className="text-noir-400 text-sm mb-4">Votre demande d&apos;inscription a bien été reçue. Vous allez recevoir un email de confirmation.</p>
          <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-gold-400 text-sm font-medium mb-2">Prochaines étapes :</p>
            <ul className="space-y-1 text-noir-300 text-sm">
              <li>• Vérifiez votre email (et vos spams)</li>
              <li>• Vous recevrez un lien pour créer votre espace élève</li>
              <li>• Nous vous contacterons pour planifier votre premier cours</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/espace-eleve/login')} className="btn-gold">Accéder à mon espace élève</button>
            <button onClick={() => router.push('/')} className="btn-outline">Retour à l&apos;accueil</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      <div className="max-w-2xl mx-auto px-4 pt-28 sm:pt-32 pb-12">
        <div className="text-center mb-10">
          <div className="text-gold-500 text-xs tracking-widest uppercase mb-3">Rejoindre Lieu Secret</div>
          <h1 className="font-serif text-4xl text-white mb-4 animate-fade-in-up">Formulaire d&apos;inscription</h1>
          <p className="text-noir-400 leading-relaxed">
            Remplissez ce formulaire pour rejoindre l&apos;école. Nous vous contacterons rapidement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Informations personnelles */}
          <div className="card">
            <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1 block">Prénom <span className="text-red-400">*</span></label>
                <input value={form.prenom} onChange={e => handleChange('prenom', e.target.value)} placeholder="Votre prénom" className="input w-full" required />
              </div>
              <div>
                <label className="label mb-1 block">Nom <span className="text-red-400">*</span></label>
                <input value={form.nom} onChange={e => handleChange('nom', e.target.value)} placeholder="Votre nom" className="input w-full" required />
              </div>
            </div>
            <div className="mt-4">
              <label className="label mb-1 block">Email <span className="text-red-400">*</span></label>
              <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="votre@email.com" className="input w-full" required />
            </div>
            <div className="mt-4">
              <label className="label mb-1 block">Téléphone (optionnel)</label>
              <input value={form.telephone} onChange={e => handleChange('telephone', e.target.value)} placeholder="+33 6 00 00 00 00" className="input w-full" />
            </div>
          </div>

          {/* Adresse */}
          <div className="card">
            <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Adresse (optionnel)</h2>
            <div className="space-y-4">
              <div>
                <label className="label mb-1 block">Adresse</label>
                <input value={form.adresse} onChange={e => handleChange('adresse', e.target.value)} placeholder="Numéro et nom de rue" className="input w-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="label mb-1 block">Code postal</label>
                  <input value={form.code_postal} onChange={e => handleChange('code_postal', e.target.value)} placeholder="75001" className="input w-full" />
                  <p className="text-xs text-noir-600 mt-1">99 si inconnu</p>
                </div>
                <div>
                  <label className="label mb-1 block">Ville</label>
                  <input value={form.ville} onChange={e => handleChange('ville', e.target.value)} placeholder="Paris" className="input w-full" />
                </div>
                <div>
                  <label className="label mb-1 block">Pays</label>
                  <input value={form.pays} onChange={e => handleChange('pays', e.target.value)} placeholder="Votre pays" className="input w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Niveau musical */}
          <div className="card">
            <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Niveau musical</h2>
            <div>
              <label className="label mb-2 block">Votre niveau actuel <span className="text-red-400">*</span></label>
              <div className="space-y-2">
                {NIVEAUX.map(n => (
                  <label key={n} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="niveau" value={n} checked={form.niveau === n} onChange={() => handleChange('niveau', n)} className="mt-0.5" />
                    <span className="text-sm text-noir-300 group-hover:text-white transition-colors">{n}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="label mb-1 block">Années de pratique</label>
              <select value={form.annees_pratique} onChange={e => handleChange('annees_pratique', e.target.value)} className="input w-full">
                <option value="">Sélectionnez...</option>
                <option value="Aucune">Aucune (débutant absolu)</option>
                <option value="Moins d'1 an">Moins d&apos;1 an</option>
                <option value="1 à 3 ans">1 à 3 ans</option>
                <option value="3 à 5 ans">3 à 5 ans</option>
                <option value="5 à 10 ans">5 à 10 ans</option>
                <option value="Plus de 10 ans">Plus de 10 ans</option>
              </select>
            </div>
          </div>

          {/* Disponibilités */}
          <div className="card">
            <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Disponibilités</h2>
            <div>
              <label className="label mb-2 block">Créneaux préférés (plusieurs choix possibles)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RYTHMES.map(r => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer group bg-noir-800 rounded-lg px-3 py-2">
                    <input type="checkbox" checked={form.rythme.includes(r)} onChange={() => handleMulti('rythme', r)} className="mt-0.5" />
                    <span className="text-sm text-noir-300 group-hover:text-white transition-colors">{r}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="label mb-2 block">Fréquence souhaitée (plusieurs choix possibles)</label>
              <div className="space-y-2">
                {FREQUENCES.map(f => (
                  <label key={f} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={form.frequence.includes(f)} onChange={() => handleMulti('frequence', f)} className="mt-0.5" />
                    <span className="text-sm text-noir-300 group-hover:text-white transition-colors">{f}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Objectifs */}
          <div className="card">
            <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Vos objectifs</h2>
            <div>
              <label className="label mb-1 block">Qu&apos;espérez-vous apprendre ou améliorer ?</label>
              <textarea value={form.objectifs} onChange={e => handleChange('objectifs', e.target.value)} placeholder="Ex : apprendre à lire la musique, jouer des morceaux classiques..." rows={3} className="input w-full resize-none" />
            </div>
            <div className="mt-4">
              <label className="label mb-1 block">Message complémentaire (optionnel)</label>
              <textarea value={form.message} onChange={e => handleChange('message', e.target.value)} placeholder="Toute information utile pour votre professeur..." rows={2} className="input w-full resize-none" />
            </div>

            {/* Questions supplémentaires configurées dans l'admin */}
            {extraQuestions.length > 0 && (
              <div className="mt-6 space-y-4 border-t border-noir-800 pt-6">
                <p className="text-gold-400 text-xs font-bold uppercase tracking-wider">Questions complémentaires</p>
                {extraQuestions.map(q => {
                  const opts = q.options
                    ? (q.options.includes('|')
                        ? q.options.split('|')
                        : q.options.split(',')
                      ).map((o: string) => o.trim()).filter(Boolean)
                    : []
                  const val = extraAnswers[q.id]
                  return (
                    <div key={q.id}>
                      <label className="label mb-1 block">{q.label}{q.required && <span className="text-red-400 ml-1">*</span>}</label>
                      {q.type === 'text' && <input type="text" value={(val as string) || ''} onChange={e => setExtraAnswers(a => ({ ...a, [q.id]: e.target.value }))} className="input w-full" required={q.required} />}
                      {q.type === 'textarea' && <textarea value={(val as string) || ''} onChange={e => setExtraAnswers(a => ({ ...a, [q.id]: e.target.value }))} className="input w-full h-16 resize-none" required={q.required} />}
                      {q.type === 'email' && <input type="email" value={(val as string) || ''} onChange={e => setExtraAnswers(a => ({ ...a, [q.id]: e.target.value }))} className="input w-full" required={q.required} />}
                      {q.type === 'tel' && <input type="tel" value={(val as string) || ''} onChange={e => setExtraAnswers(a => ({ ...a, [q.id]: e.target.value }))} className="input w-full" required={q.required} />}
                      {q.type === 'select' && (
                        <select value={(val as string) || ''} onChange={e => setExtraAnswers(a => ({ ...a, [q.id]: e.target.value }))} className="input w-full" required={q.required}>
                          <option value="">Choisir...</option>
                          {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                      {q.type === 'radio' && (
                        <div className="space-y-2 mt-1">
                          {opts.map((o: string) => (
                            <label key={o} className="flex items-center gap-3 cursor-pointer">
                              <input type="radio" name={q.id} value={o} checked={val === o} onChange={() => setExtraAnswers(a => ({ ...a, [q.id]: o }))} className="mt-0.5" required={q.required} />
                              <span className="text-sm text-noir-300">{o}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {q.type === 'multiselect' && (
                        <div className="space-y-2 mt-1">
                          {opts.map((o: string) => {
                            const checked = Array.isArray(val) && val.includes(o)
                            return (
                              <label key={o} className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={e => setExtraAnswers(a => {
                                  const cur = (a[q.id] as string[]) || []
                                  return { ...a, [q.id]: e.target.checked ? [...cur, o] : cur.filter(v => v !== o) }
                                })} className="mt-0.5" />
                                <span className="text-sm text-noir-300">{o}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <button type="submit" className="btn-gold w-full text-base py-3.5" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </span>
            ) : "Envoyer ma demande d'inscription"}
          </button>

          <p className="text-center text-xs text-noir-500">
            Les champs marqués d&apos;un <span className="text-red-400">*</span> sont obligatoires.
          </p>
        </form>
      </div>
    </div>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <InscriptionContent />
    </Suspense>
  )
}
