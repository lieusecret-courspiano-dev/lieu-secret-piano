'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Identifiants incorrects')
      }

      router.push('/admin')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-px h-6 bg-gold-500/50 mx-auto mb-2"></div>
          <h1 className="font-serif text-2xl text-gold-400 tracking-widest">LIEU SECRET</h1>
          <p className="text-noir-500 text-xs mt-1 tracking-widest">ESPACE ADMINISTRATEUR</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-noir-900 border border-noir-700 rounded-2xl p-6 shadow-2xl"
        >
          <h2 className="text-white font-serif text-xl mb-6 text-center">Connexion</h2>

          <div className="mb-4">
            <label className="label mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@lieusecret-courspiano.fr"
              className="input w-full"
              required
            />
          </div>

          <div className="mb-6">
            <label className="label mb-1 block">Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="input w-full"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button type="submit" className="btn-gold w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                Connexion…
              </span>
            ) : 'Se connecter'}
          </button>
        </form>

        <p className="text-center mt-4">
          <a href="/" className="text-noir-500 text-xs hover:text-noir-300 transition-colors">
            ← Retour au site
          </a>
        </p>
      </div>
    </div>
  )
}