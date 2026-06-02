'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeProvider'

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
}

const NIVEAUX    = ['Débutant (jamais joué)', 'Débutant (quelques notions)', 'Intermédiaire', 'Avancé']
const RYTHMES    = ['Matin (avant 12h)', 'Après-midi (12h–18h)', 'Soir (après 18h)', 'Week-end']
const FREQUENCES = ['1 fois par semaine', '2 fois par semaine', '1 fois toutes les 2 semaines']

export default function InscriptionPage() {
  const router = useRouter()
  const [form, setForm] = useState<InscriptionForm>({
    prenom: '', nom: '', email: '', telephone: '',
    adresse: '', ville: '', code_postal: '', pays: 'France',
    niveau: '', annees_pratique: '',
    rythme: [], frequence: [],
    objectifs: '', message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

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
          <h2 className="font-serif text-3xl text-white mb-4">Demande envoyée !</h2>
          <p className="text-noir-300 mb-2">Merci pour votre demande d&apos;inscription à Lieu Secret.</p>
          <p className="text-noir-400 text-sm mb-8">Vous allez recevoir un email de confirmation. Nous vous contacterons rapidement.</p>
          <button onClick={() => router.push('/')} className="btn-gold">Retour à l&apos;accueil</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <header className="border-b border-noir-800 bg-noir-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-lg text-gold-400 tracking-widest">LIEU SECRET</span>
          </a>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-gold-500 text-xs tracking-widest uppercase mb-3">Rejoindre Lieu Secret</div>
          <h1 className="font-serif text-4xl text-white mb-4">Formulaire d&apos;inscription</h1>
          <p className="text-noir-400 leading-relaxed">
            Remplissez ce formulaire pour rejoindre l&apos;école. Nous vous contacterons rapidement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Informations personnelles */}
          <div className="card">
            <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-3 gap-3">
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
                  <input value={form.pays} onChange={e => handleChange('pays', e.target.value)} placeholder="France" className="input w-full" />
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
                    <input type="radio" name="niveau" value={n} checked={form.niveau === n} onChange={() => handleChange('niveau', n)} className="w-4 h-4 accent-gold-500" />
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
              <div className="grid grid-cols-2 gap-2">
                {RYTHMES.map(r => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer group bg-noir-800 rounded-lg px-3 py-2">
                    <input type="checkbox" checked={form.rythme.includes(r)} onChange={() => handleMulti('rythme', r)} className="w-4 h-4 accent-gold-500" />
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
                    <input type="checkbox" checked={form.frequence.includes(f)} onChange={() => handleMulti('frequence', f)} className="w-4 h-4 accent-gold-500" />
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