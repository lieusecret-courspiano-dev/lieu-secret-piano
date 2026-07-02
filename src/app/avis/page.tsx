'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
function AvisContent() {
 const searchParams = useSearchParams()
 const token = searchParams.get('token') || ''
 const [step, setStep] = useState<'form' | 'success' | 'error' | 'loading'>('loading')
 const [note, setNote] = useState(5)
 const [texte, setTexte] = useState('')
 const [auteur, setAuteur] = useState('')
 const [submitting, setSubmitting] = useState(false)
 const [errorMsg, setErrorMsg] = useState('')
 useEffect(() => {
 if (!token) { setStep('error'); return }
 fetch(`/api/avis/verify?token=${encodeURIComponent(token)}`).then(r => r.json()).then(data => { if (data.valid) { setAuteur(data.student_name || ''); setStep('form') } else setStep('error') }).catch(() => setStep('error'))
 }, [token])
 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!texte.trim()) { setErrorMsg('Veuillez écrire votre avis.'); return }
 setSubmitting(true); setErrorMsg('')
 try {
 const res = await fetch('/api/avis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, note, texte, auteur }) })
 if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erreur') }
 setStep('success')
 } catch (e: unknown) { setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue') }
 finally { setSubmitting(false) }
 }
 if (step === 'loading') return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
 if (step === 'error') return <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4"><div className="text-center"><h2 className="font-serif text-2xl text-white mb-4">Lien invalide ou expiré</h2><Link href="/" className="btn-gold">Retour</Link></div></div>
 if (step === 'success') return <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4"><div className="text-center"><h2 className="font-serif text-3xl text-white mb-4">Merci pour votre avis !</h2><Link href="/" className="btn-gold">Retour</Link></div></div>
 return (
 <div className="min-h-screen bg-noir-950 text-noir-100">
 <header className="border-b border-noir-800 bg-noir-900/80 backdrop-blur-sm"><div className="max-w-2xl mx-auto px-4 py-4"><Link href="/" className="flex items-center gap-3"><div className="w-px h-5 bg-gold-500" /><span className="font-serif text-lg text-gold-400 tracking-widest">LIEU SECRET</span></Link></div></header>
 <div className="max-w-lg mx-auto px-4 py-12">
 <div className="text-center mb-10"><h1 className="font-serif text-4xl text-white mb-4">Comment s&apos;est passé votre cours ?</h1></div>
 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="card text-center">
 <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-6">Votre note</h2>
 <div className="flex justify-center gap-3 mb-2">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setNote(n)} className="transition-transform hover:scale-110"><svg width="36" height="36" viewBox="0 0 24 24" fill={n <= note ? '#f59e0b' : 'none'} stroke={n <= note ? '#f59e0b' : '#404040'} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></button>)}</div>
 </div>
 <div className="card"><label className="label mb-1 block">Votre prénom</label><input value={auteur} onChange={e => setAuteur(e.target.value)} placeholder="Prénom" className="input w-full" /></div>
 <div className="card"><label className="label mb-1 block">Votre témoignage</label><textarea value={texte} onChange={e => setTexte(e.target.value)} placeholder="Partagez votre expérience..." rows={5} className="input w-full resize-none" required /></div>
 {errorMsg && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{errorMsg}</div>}
 <button type="submit" className="btn-gold w-full text-base py-3.5" disabled={submitting}>{submitting ? 'Envoi…' : ' Envoyer mon avis'}</button>
 </form>
 </div>
 </div>
 )
}
export default function AvisPage() {
 return <Suspense fallback={<div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>}><AvisContent /></Suspense>
}
