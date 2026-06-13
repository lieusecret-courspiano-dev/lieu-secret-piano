'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Copy, Check, Gift } from 'lucide-react'

interface Parrainage { id: string; code: string; filleuls_count: number; heures_offertes: number }
interface Me { id: string; prenom: string; nom: string; email: string }

export default function ParrainagePage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [parrainage, setParrainage] = useState<Parrainage | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [appUrl, setAppUrl] = useState('https://www.lieusecret-courspiano.fr')

  useEffect(() => {
    if (typeof window !== 'undefined') setAppUrl(window.location.origin)
    fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()).then(async (meData: Me | null) => {
      if (!meData) { router.push('/espace-eleve/login'); return }
      setMe(meData)
      const res = await fetch('/api/parrainage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eleve_id: meData.id, email: meData.email, prenom: meData.prenom, nom: meData.nom }),
      })
      const data = await res.json()
      setParrainage(data)
      setLoading(false)
    })
  }, [router])

  function copyCode() {
    if (!parrainage) return
    const link = appUrl + '/inscription?ref=' + parrainage.code
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <EleveLayout prenom={me?.prenom} nbNotifs={0}>
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-white">Parrainage</h1>
          <p className="text-noir-400 text-sm mt-1">Parrainez vos proches et gagnez des heures de cours</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-6 max-w-lg">
            {/* Comment ça marche */}
            <div className="card">
              <h2 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-4">Comment ça marche ?</h2>
              <div className="space-y-3">
                {[
                  { step: '1', text: "Partagez votre lien de parrainage à un proche" },
                  { step: '2', text: "Il s'inscrit sur le site avec votre code" },
                  { step: '3', text: "Vous recevez automatiquement 1 heure offerte sur votre pack" },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gold-500 text-noir-950 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</div>
                    <p className="text-noir-300 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques */}
            {parrainage && (
              <div className="grid grid-cols-2 gap-4">
                <div className="card text-center">
                  <div className="text-3xl font-bold text-gold-400 mb-1">{parrainage.filleuls_count}</div>
                  <div className="text-noir-500 text-xs uppercase">Filleuls parrainés</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">{parrainage.heures_offertes}h</div>
                  <div className="text-noir-500 text-xs uppercase">Heures gagnées</div>
                </div>
              </div>
            )}

            {/* Code parrainage */}
            {parrainage && (
              <div className="card border-gold-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Gift size={20} className="text-gold-400" />
                  <h2 className="text-white font-medium">Votre code de parrainage</h2>
                </div>
                <div className="bg-noir-800 rounded-xl p-4 text-center mb-4">
                  <p className="font-mono text-3xl font-bold text-gold-400 tracking-widest">{parrainage.code}</p>
                </div>
                <div className="bg-noir-800 rounded-xl p-3 mb-4">
                  <p className="text-noir-500 text-xs mb-1">Lien de parrainage</p>
                  <p className="text-noir-300 text-xs font-mono break-all">{appUrl}/inscription?ref={parrainage.code}</p>
                </div>
                <button onClick={copyCode} className="btn-gold w-full flex items-center justify-center gap-2">
                  {copied ? <><Check size={16} /> Lien copié !</> : <><Copy size={16} /> Copier le lien de parrainage</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
