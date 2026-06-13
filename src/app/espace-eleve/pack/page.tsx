'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EleveLayout from '@/components/EleveNav'

interface Pack { id: string; code: string; pack_label: string; heures_total: number; heures_restantes: number; heures_utilisees: number; montant: number; status: string; expires_at: string; created_at: string; payment_method: string }
interface HistoryEntry { id: string; type: string; delta: number; note: string | null; commentaire: string | null; created_at: string }

export default function PackPage() {
  const router = useRouter()
  const [packs, setPacks] = useState<Pack[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'cours' | 'historique'>('cours')

  useEffect(() => {
    Promise.all([fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()), fetch('/api/eleve/pack').then(r => r.json())]).then(([me, packData]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom); setPacks(packData?.packs || []); setHistory(packData?.history || [])
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>

  const activePack = packs.find(p => p.status === 'active')
  const pct = activePack ? Math.round((activePack.heures_restantes / activePack.heures_total) * 100) : 0
  const barColor = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444'

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-6 md:p-8">
        <h1 className="font-serif text-2xl text-white mb-6 animate-fade-in-up">Mon Pack de Cours</h1>
        {!activePack ? (<div className="card text-center py-12"><p className="text-noir-400 mb-4">Vous n&apos;avez pas de pack actif</p><Link href="/espace-eleve/acheter-pack" className="btn-gold px-8">Acheter un pack</Link></div>) : (
          <div className="space-y-6">
            <div className="card border-gold-500/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
              <div className="flex items-start justify-between mb-4"><div><h2 className="font-serif text-2xl text-white">{activePack.pack_label}</h2><p className="font-mono text-gold-400 text-sm mt-1">{activePack.code}</p></div><span className="text-xs px-3 py-1 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">Actif</span></div>
              <div className="mb-4"><div className="flex justify-between items-end mb-2"><div><span className="text-4xl font-bold text-white">{activePack.heures_restantes}</span><span className="text-noir-400 text-lg ml-1">h restantes</span></div><span className="text-noir-500 text-sm">{activePack.heures_utilisees}h / {activePack.heures_total}h</span></div><div className="w-full bg-noir-800 rounded-full h-4 overflow-hidden"><div className="h-4 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} /></div></div>
              <div className="grid grid-cols-2 gap-3">{[{ label: 'Montant', value: `${activePack.montant} €` }, { label: 'Paiement', value: activePack.payment_method === 'stripe' ? 'Carte bancaire' : 'Virement' }, { label: 'Activé le', value: new Date(activePack.created_at).toLocaleDateString('fr-FR') }, { label: 'Expire le', value: new Date(activePack.expires_at).toLocaleDateString('fr-FR') }].map((item, i) => (<div key={i} className="bg-noir-800 rounded-lg p-3"><p className="text-noir-500 text-xs uppercase tracking-wider mb-1">{item.label}</p><p className="text-white text-sm font-medium">{item.value}</p></div>))}</div>
              {activePack.heures_restantes > 0 && <Link href="/espace-eleve/reserver" className="btn-gold w-full text-center block mt-4">Réserver un cours</Link>}
              {activePack.heures_restantes === 0 && <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center"><p className="text-red-400 text-sm font-medium mb-2">Pack épuisé</p><Link href="/espace-eleve/acheter-pack" className="btn-gold text-sm px-6">Recharger mon pack</Link></div>}
            </div>
            <div className="card">
              <div className="flex gap-1 bg-noir-800 rounded-lg p-1 mb-4">
                <button onClick={() => setActiveTab('cours')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'cours' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Cours</button>
                <button onClick={() => setActiveTab('historique')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'historique' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Tous les mouvements</button>
              </div>
              {activeTab === 'historique' && (
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-noir-800/50"><div><p className="text-white text-sm">Achat {activePack.pack_label}</p><p className="text-noir-500 text-xs">{new Date(activePack.created_at).toLocaleDateString('fr-FR')}</p></div><span className="text-green-400 font-bold">+{activePack.heures_total}h</span></div>
                  {history.map(h => {
                    const typeLabel = h.type === 'cours' ? 'Cours individuel' : h.type === 'ajustement' ? 'Ajustement administrateur' : h.type === 'achat' ? 'Achat pack' : h.type === 'cadeau' ? 'Bon cadeau' : h.type === 'annulation' ? 'Annulation' : h.type
                    const detail = h.note || h.commentaire
                    return (
                      <div key={h.id} className="flex justify-between py-3 border-b border-noir-800/50 last:border-0">
                        <div>
                          <p className="text-white text-sm font-medium">{typeLabel}</p>
                          {detail && <p className="text-gold-400 text-xs italic mt-0.5">{detail}</p>}
                          <p className="text-noir-500 text-xs mt-0.5">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <span className={`font-bold text-base shrink-0 ml-4 ${h.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>{h.delta > 0 ? '+' : ''}{h.delta}h</span>
                      </div>
                    )
                  })}
                  <div className="flex justify-between pt-3 border-t border-gold-500/30"><p className="text-gold-400 font-bold">Solde actuel</p><p className="text-white text-lg font-bold">{activePack.heures_restantes}h</p></div>
                </div>
              )}
              {activeTab === 'cours' && <p className="text-noir-500 text-sm text-center py-4">Historique des cours disponible dans l&apos;onglet &quot;Tous les mouvements&quot;</p>}
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
