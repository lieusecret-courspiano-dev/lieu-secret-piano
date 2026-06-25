'use client'
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator'
import { validatePassword } from '@/lib/password-strength'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function EleveLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/espace-eleve/dashboard'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ email: '', password: '', prenom: '', nom: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/eleve/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur connexion')
      router.push(redirectTo)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!form.prenom.trim() || !form.nom.trim()) { setError('Prénom et nom requis'); return }
    // La validation complète est faite côté serveur
    const { valid: pwValid, errors: pwErrors } = validatePassword(form.password)
    if (!pwValid) { setError(pwErrors[0]); return }
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/eleve/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password, prenom: form.prenom, nom: form.nom }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur inscription')
      setSuccess(`Bienvenue, ${form.prenom} ! Votre espace élève a été créé avec succès.`)
      setTimeout(() => router.push('/espace-eleve/dashboard'), 2000)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  const EyeIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  const EyeOffIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6"><div className="w-px h-5 bg-gold-500" /><span className="font-serif text-xl text-gold-400 tracking-widest">LIEU SECRET</span></Link>
          <h1 className="font-serif text-2xl text-white mb-2">Espace Élève</h1>
          <p className="text-noir-400 text-sm">Votre espace personnel Lieu Secret</p>
        </div>
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6">
          <button onClick={() => { setMode('login'); setError('') }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Se connecter</button>
          <button onClick={() => { setMode('register'); setError('') }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Créer un compte</button>
        </div>
        <div className="card border-gold-500/20">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="label mb-1 block">Adresse email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vous@exemple.com" className="input w-full" required autoFocus /></div>
              <div><label className="label mb-1 block">Mot de passe</label>
                <div className="relative"><input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="input w-full pr-10" required />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-white">{showPw ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full">{loading ? <span className="w-5 h-5 border-2 border-noir-900 border-t-transparent rounded-full animate-spin inline-block" /> : 'Se connecter'}</button>
              <div className="text-center"><Link href="/espace-eleve/reset" className="text-gold-500 text-sm hover:text-gold-400">Mot de passe oublié ?</Link></div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label mb-1 block">Prénom *</label><input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Prénom" className="input w-full" required autoFocus /></div>
                <div><label className="label mb-1 block">Nom *</label><input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom" className="input w-full" required /></div>
              </div>
              <div><label className="label mb-1 block">Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vous@exemple.com" className="input w-full" required /></div>
              <div>
                <label className="label mb-1 block">Mot de passe *</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="input w-full pr-10" required />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-white">{showPw ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
                {form.password && <PasswordStrengthIndicator password={form.password} className="mt-2" />}
              </div>
              <div><label className="label mb-1 block">Confirmer *</label><input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" className="input w-full" required /></div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full">{loading ? <span className="w-5 h-5 border-2 border-noir-900 border-t-transparent rounded-full animate-spin inline-block" /> : 'Créer mon compte'}</button>
            </form>
          )}
        </div>
        <p className="text-center text-noir-500 text-xs mt-6">Besoin d&apos;aide ? <Link href="/aide" className="text-gold-500 hover:text-gold-400">Centre d&apos;aide</Link></p>
        <div className="text-center mt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-noir-500 hover:text-noir-300 text-sm transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function EleveLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EleveLoginContent />
    </Suspense>
  )
}
