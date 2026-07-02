'use client'
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator'
import { validatePassword } from '@/lib/password-strength'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function SetupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    const { valid: pwValid, errors: pwErrors } = validatePassword(password)
    if (!pwValid) { setError(pwErrors[0]); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/eleve/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setSuccess(true)
      setTimeout(() => router.push('/espace-eleve/dashboard'), 2000)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  if (!token) return <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4"><div className="card text-center max-w-sm"><p className="text-red-400">Lien invalide.</p><Link href="/espace-eleve/login" className="btn-gold mt-4 inline-block">Se connecter</Link></div></div>

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><Link href="/" className="inline-flex items-center gap-3 mb-6"><div className="w-px h-5 bg-gold-500" /><span className="font-serif text-xl text-gold-400 tracking-widest">LIEU SECRET</span></Link><h1 className="font-serif text-2xl text-white mb-2">Créer mon mot de passe</h1></div>
        {success ? (
          <div className="card border-green-500/30 text-center"><p className="text-green-400 font-medium">Mot de passe créé !</p><p className="text-noir-400 text-sm mt-2">Redirection...</p></div>
        ) : (
          <div className="card border-gold-500/20">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label mb-1 block">Nouveau mot de passe</label>
                <div className="relative"><input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 caractères" className="input w-full pr-10" required autoFocus />
              </div>
              <PasswordStrengthIndicator password={password} className="mt-2" />
              <div className="relative">
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" className="input w-full" required />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-white"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                </div>
              </div>
              <div><label className="label mb-1 block">Confirmer</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répétez" className="input w-full" required /></div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full">{loading ? '...' : 'Créer mon mot de passe'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SetupPage() {
  return <Suspense fallback={<div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>}><SetupContent /></Suspense>
}
