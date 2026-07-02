'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
function CadeauConfirmationContent() {
 const params = useSearchParams()
 const sessionId = params.get('session_id')
 const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
 const [code, setCode] = useState('')
 useEffect(() => {
 if (!sessionId) { setStatus('error'); return }
 fetch(`/api/cadeau/confirm?session_id=${sessionId}`).then(r => r.json()).then(data => { if (data.success) { setCode(data.code); setStatus('done') } else setStatus('error') }).catch(() => setStatus('error'))
 }, [sessionId])
 if (status === 'loading') return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
 if (status === 'error') return <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4"><div className="text-center"><h2 className="font-serif text-2xl text-white mb-4">Une erreur est survenue</h2><Link href="/" className="btn-gold">Retour</Link></div></div>
 return (
 <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
 <div className="max-w-md w-full text-center">
 <div className="w-16 h-16 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center mx-auto mb-6"><svg width="32" height="32" fill="#f59e0b" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
 <h1 className="font-serif text-3xl text-white mb-4"> Bon cadeau créé !</h1>
 <p className="text-noir-300 mb-8">Votre bon cadeau a été envoyé par email.</p>
 <div className="bg-noir-900 border-2 border-gold-500/50 rounded-2xl p-8 mb-8">
 <p className="text-noir-400 text-xs uppercase tracking-widest mb-3">Code cadeau</p>
 <div className="font-mono text-3xl text-gold-400 font-bold tracking-widest mb-3">{code}</div>
 <p className="text-noir-500 text-xs">Valable 1 an — À utiliser lors de la réservation</p>
 </div>
 <Link href="/" className="btn-gold inline-block">Retour à l&apos;accueil</Link>
 </div>
 </div>
 )
}
export default function CadeauConfirmationPage() {
 return <Suspense fallback={<div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>}><CadeauConfirmationContent /></Suspense>
}
