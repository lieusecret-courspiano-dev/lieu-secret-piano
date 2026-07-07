'use client'
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator'
import { validatePassword } from '@/lib/password-strength'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function SetupContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { valid, errors } = validatePassword(password)
    if (!valid) { setError(errors[0]); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/eleve/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setSuccess(true)
      setTimeout(() => router.push('/espace-eleve/dashboard'), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="card text-center max-w-sm">
        <p className="text-red-400">Lien invalide ou expiré.</p>
        <Link href="/espace-eleve/login" className="btn-gold mt-4 inline-block">Se connecter</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-xl text-gold-400 tracking-widest">LIEU SECRET</span>
          </Link>
          <h1 className="font-serif text-2xl text-white mb-2">Créer mon mot de passe</h1>
          <p className="text-noir-400 text-sm">Choisissez un mot de passe sécurisé</p>
        </div>

        {success ? (
          <div className="card border-green-500/30 text-center py-4 md:py-8">
            <svg width="40" height="40" fill="none" stroke="#22c55e" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p className="text-green-400 font-medium text-lg">Mot de passe créé !</p>
            <p className="text-noir-400 text-sm mt-2">Redirection vers votre espace...</p>
          </div>
        ) : (
          <div className="card border-gold-500/20">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Champ 1 : Mot de passe */}
              <div>
                <label className="label mb-1 block">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="input w-full pr-10"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-white transition-colors"
                    aria-label={showPw ? 'Masquer' : 'Afficher'}
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} className="mt-2" />
              </div>

              {/* Champ 2 : Confirmation */}
              <div>
                <label className="label mb-1 block">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showCf ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Répétez votre mot de passe"
                    className="input w-full pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCf(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-white transition-colors"
                    aria-label={showCf ? 'Masquer' : 'Afficher'}
                  >
                    <EyeIcon open={showCf} />
                  </button>
                </div>
                {/* Indicateur de correspondance */}
                {confirm && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${password === confirm ? 'text-green-400' : 'text-red-400'}`}>
                    {password === confirm ? (
                      <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Les mots de passe correspondent</>
                    ) : (
                      <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Ne correspondent pas encore</>
                    )}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-gold w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                    Création...
                  </span>
                ) : 'Créer mon mot de passe'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  )
}
