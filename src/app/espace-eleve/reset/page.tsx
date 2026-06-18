'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    await fetch('/api/eleve/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    setSent(true); setLoading(false)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/eleve/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/espace-eleve/login')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><Link href="/" className="inline-flex items-center gap-3 mb-6"><div className="w-px h-5 bg-gold-500" /><span className="font-serif text-xl text-gold-400 tracking-widest">LIEU SECRET</span></Link><h1 className="font-serif text-2xl text-white mb-2">Mot de passe oublié</h1></div>
        <div className="card border-gold-500/20">
          {token ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div><label className="label mb-1 block">Nouveau mot de passe</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input w-full" required /></div>
              <div><label className="label mb-1 block">Confirmer</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input w-full" required /></div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full">{loading ? '...' : 'Réinitialiser'}</button>
            </form>
          ) : sent ? (
            <div className="text-center"><p className="text-green-400 mb-2">Email envoyé !</p><p className="text-noir-400 text-sm">Vérifiez votre boîte mail et les spams.</p></div>
          ) : (
            <form onSubmit={handleRequest} className="space-y-4">
              <div><label className="label mb-1 block">Votre adresse email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" className="input w-full" required autoFocus /></div>
              <button type="submit" disabled={loading} className="btn-gold w-full">{loading ? '...' : 'Envoyer le lien'}</button>
            </form>
          )}
          <div className="mt-4 text-center"><Link href="/espace-eleve/login" className="text-noir-400 text-sm hover:text-gold-400">← Retour à la connexion</Link></div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPage() {
  return <Suspense fallback={<div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>}><ResetContent /></Suspense>
}
