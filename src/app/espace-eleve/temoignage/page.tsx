'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

export default function TemoignagePage() {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()).then(me => { if (!me) { router.push('/espace-eleve/login'); return } setPrenom(me.prenom) })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentaire.trim()) { setError('Veuillez écrire un commentaire'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/eleve/temoignage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note, commentaire }) })
      if (!res.ok) throw new Error('Erreur')
      setSent(true)
    } catch { setError("Erreur lors de l'envoi") }
    finally { setLoading(false) }
  }

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-6 md:p-8">
        <h1 className="font-serif text-2xl text-white mb-6">Laisser un Témoignage</h1>
        {sent ? (<div className="card border-green-500/30 text-center py-12"><svg className="mx-auto mb-4 text-green-400" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><h2 className="font-serif text-xl text-white mb-2">Merci pour votre témoignage !</h2><p className="text-noir-400 text-sm">Il sera publié après validation par votre professeur.</p></div>) : (
          <div className="card max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className="label mb-2 block">Votre note</label><div className="flex gap-2">{[1,2,3,4,5].map(n => (<button key={n} type="button" onClick={() => setNote(n)} className={`text-3xl transition-all ${n <= note ? 'opacity-100' : 'opacity-30'}`}><svg width="28" height="28" fill={n <= note ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>))}</div></div>
              <div><label className="label mb-1 block">Votre témoignage *</label><textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Partagez votre expérience avec Lieu Secret..." className="input w-full h-32 resize-none" required /></div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full">{loading ? '...' : 'Envoyer mon témoignage'}</button>
              <p className="text-noir-500 text-xs text-center">Votre témoignage sera visible après validation.</p>
            </form>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
