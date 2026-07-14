'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeProvider'
import PublicNav from '@/components/PublicNav'
import { DateTime } from 'luxon'

interface HistoryEntry { id: string; type: string; delta: number; note: string | null; commentaire: string | null; created_at: string }

interface PackStatus {
 code: string
 pack_label: string
 heures_total: number
 heures_restantes: number
 heures_utilisees: number
 montant: number
 tarif_horaire: number
 status: string
 expires_at: string
 acheteur_nom: string
 created_at: string
 history: HistoryEntry[]
 reservations: {
 id: string
 slot_start: string
 slot_end: string
 student_name: string
 student_timezone: string
 status: string
 created_at: string
 }[]
}

const STATUS_COLORS: Record<string, string> = {
 active: 'text-green-400 bg-green-500/10 border-green-500/20',
 used: 'text-noir-400 bg-noir-800 border-noir-700',
 expired: 'text-red-400 bg-red-500/10 border-red-500/20',
 disabled: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
}
const STATUS_LABELS: Record<string, string> = {
 active: 'Actif', used: 'Épuisé', expired: 'Expiré', disabled: 'Désactivé',
}

export default function MonPackPage() {
 const [code, setCode] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')
 const [pack, setPack] = useState<PackStatus | null>(null)
 const [activeTab, setActiveTab] = useState<'cours' | 'historique'>('cours')

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!code.trim()) { setError('Veuillez saisir votre code pack'); return }
 setLoading(true); setError(''); setPack(null)
 try {
 const res = await fetch('/api/pack/status', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ code: code.trim() }),
 })
 const data = await res.json()
 if (!res.ok) throw new Error(data.error || 'Code invalide')
 setPack(data)
 } catch (e: unknown) {
 setError(e instanceof Error ? e.message : 'Erreur inconnue')
 } finally {
 setLoading(false)
 }
 }

 const pct = pack ? Math.round((pack.heures_restantes / pack.heures_total) * 100) : 0
 const barColor = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444'

 return (
 <div className="min-h-screen bg-noir-950 text-noir-100">
 {/* Header */}
 <PublicNav />

 <div className="max-w-2xl mx-auto px-4 pt-28 sm:pt-32 pb-12">
 {/* Titre */}
 <div className="text-center mb-10">
 <div className="text-gold-500 text-xs tracking-widest uppercase mb-3">Espace élève</div>
 <h1 className="font-serif text-4xl text-white mb-4"> Mon pack de cours</h1>
 <p className="text-noir-400 leading-relaxed">
 Consultez vos heures restantes et l&apos;historique de vos cours.
 </p>
 </div>

 {/* Formulaire de recherche */}
 <form onSubmit={handleSubmit} className="card mb-8">
 <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Saisir votre code pack</h2>
 <div className="flex gap-3">
 <input
 value={code}
 onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
 placeholder="PK-XXXX-XXXX"
 className="input flex-1 font-mono tracking-widest text-center text-lg"
 maxLength={12}
 />
 <button type="submit" className="btn-gold px-6" disabled={loading}>
 {loading ? <span className="w-5 h-5 border-2 border-noir-900 border-t-transparent rounded-full animate-spin inline-block" /> : 'Consulter'}
 </button>
 </div>
 {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
 <p className="text-noir-600 text-xs mt-3">Votre code pack vous a été envoyé par email lors de l&apos;activation de votre pack.</p>
 <div className="flex items-start gap-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl p-3 mt-3">
   <svg className="shrink-0 mt-0.5" width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
     <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
     <polyline points="22,6 12,13 2,6"/>
   </svg>
   <div>
     <p className="text-amber-300 text-xs font-semibold mb-0.5">Email non reçu ?</p>
     <p className="text-amber-400/80 text-xs leading-relaxed">Vérifiez votre dossier <strong className="text-white">Spam</strong> ou <strong className="text-white">Courrier indésirable</strong>. Nos emails proviennent de <strong className="text-white">noreply@lieusecret-courspiano.fr</strong></p>
   </div>
 </div>
 </form>

 {/* Résultats */}
 {pack && (
 <div className="space-y-6">
 {/* Carte principale */}
 <div className="card border-gold-500/30 relative overflow-hidden">
 <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

 <div className="flex items-start justify-between mb-4">
 <div>
 <h2 className="font-serif text-2xl text-white">{pack.pack_label}</h2>
 <p className="text-noir-400 text-sm mt-1">Bonjour {pack.acheteur_nom}</p>
 </div>
 <span className={`text-xs px-3 py-1 rounded-full border ${STATUS_COLORS[pack.status] || STATUS_COLORS.active}`}>
 {STATUS_LABELS[pack.status] || pack.status}
 </span>
 </div>

 {/* Code */}
 <div className="bg-noir-800 rounded-xl p-3 mb-4 text-center">
 <p className="text-noir-500 text-xs uppercase tracking-widest mb-1">Code</p>
 <p className="font-mono text-gold-400 font-bold tracking-widest text-lg">{pack.code}</p>
 </div>

 {/* Heures — grande visualisation */}
 <div className="mb-4">
 <div className="flex justify-between items-end mb-2">
 <div>
 <span className="text-4xl font-bold text-white">{pack.heures_restantes}</span>
 <span className="text-noir-400 text-lg ml-1">h restantes</span>
 </div>
 <div className="text-right">
 <span className="text-noir-500 text-sm">{pack.heures_utilisees}h utilisées</span>
 <span className="text-noir-600 text-sm"> / {pack.heures_total}h total</span>
 </div>
 </div>
 {/* Barre de progression */}
 <div className="w-full bg-noir-800 rounded-full h-4 overflow-hidden">
 <div
 className="h-4 rounded-full transition-all duration-500"
 style={{ width: `${pct}%`, backgroundColor: barColor }}
 />
 </div>
 <div className="flex justify-between mt-1">
 <span className="text-xs" style={{ color: barColor }}>{pct}% restant</span>
 {pack.heures_restantes <= 2 && pack.status === 'active' && (
 <span className="text-xs text-red-400"> Pack bientôt épuisé</span>
 )}
 </div>
 </div>

 {/* Infos */}
 <div className="grid grid-cols-2 gap-3">
 {[
 { label: 'Tarif/heure', value: `${pack.tarif_horaire} €/h` },
 { label: 'Valeur totale', value: `${pack.montant} €` },
 { label: 'Activé le', value: new Date(pack.created_at).toLocaleDateString('fr-FR') },
 { label: 'Expire le', value: new Date(pack.expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
 ].map((item, i) => (
 <div key={i} className="bg-noir-800 rounded-lg p-3">
 <p className="text-noir-500 text-xs uppercase tracking-wider mb-1">{item.label}</p>
 <p className="text-white font-medium text-sm">{item.value}</p>
 </div>
 ))}
 </div>

 {/* CTA si pack actif */}
 {pack.status === 'active' && pack.heures_restantes > 0 && (
 <div className="mt-4">
 <Link href="/reservation" className="btn-gold w-full text-center block">
 Réserver un cours avec ce pack
 </Link>
 </div>
 )}

 {/* CTA si pack épuisé */}
 {(pack.status === 'used' || pack.heures_restantes === 0) && (
 <div className="mt-4 bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 text-center">
 <p className="text-gold-400 text-sm font-medium mb-2">Votre pack est épuisé </p>
 <p className="text-noir-400 text-xs mb-3">Rechargez pour continuer vos cours !</p>
 <Link href="/packs" className="btn-gold text-sm px-6">Acheter un nouveau pack</Link>
 </div>
 )}
 </div>

 {/* Historique avec onglets */}
            <div className="card">
              <div className="flex gap-1 bg-noir-800 rounded-lg p-1 mb-4">
                <button onClick={() => setActiveTab('cours')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'cours' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                  Cours ({pack.reservations.length})
                </button>
                <button onClick={() => setActiveTab('historique')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'historique' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                  Tous les mouvements
                </button>
              </div>
              {activeTab === 'cours' && (
                <div className="space-y-3">
                  {pack.reservations.length === 0 ? (
                    <div className="text-center py-8"><p className="text-noir-500 text-sm">Aucun cours réservé avec ce pack.</p><Link href="/reservation" className="text-gold-400 text-sm hover:text-gold-300 mt-2 inline-block">Réserver →</Link></div>
                  ) : pack.reservations.map((res, i) => {
                    const tz = res.student_timezone || 'Europe/Paris'
                    const start = DateTime.fromISO(res.slot_start, { zone: 'utc' }).setZone(tz)
                    const end = DateTime.fromISO(res.slot_end, { zone: 'utc' }).setZone(tz)
                    const isPast = start < DateTime.now()
                    return (
                      <div key={res.id} className={`flex items-center justify-between p-3 rounded-xl border ${isPast ? 'bg-noir-800/50 border-noir-700' : 'bg-gold-500/5 border-gold-500/20'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-noir-500' : 'bg-gold-500'}`} />
                          <div>
                            <p className="text-white text-sm font-medium capitalize">{start.setLocale('fr').toFormat('EEEE d MMMM yyyy')}</p>
                            <p className="text-noir-400 text-xs">{start.toFormat('HH:mm')} — {end.toFormat('HH:mm')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isPast ? 'text-noir-400 bg-noir-700' : 'text-gold-400 bg-gold-500/10'}`}>{isPast ? 'Effectué' : 'À venir'}</span>
                          <p className="text-red-400 text-xs mt-1 font-medium">- 1h</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {activeTab === 'historique' && (
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-noir-800/50">
                    <div><p className="text-white text-sm font-medium">Achat {pack.pack_label}</p><p className="text-noir-500 text-xs">{new Date(pack.created_at).toLocaleDateString('fr-FR')}</p></div>
                    <span className="text-green-400 text-sm font-bold ml-4">+{pack.heures_total}h</span>
                  </div>
                  {pack.history && pack.history.map((h: { id: string; type: string; delta: number; note: string | null; commentaire: string | null; created_at: string }) => (
                    <div key={h.id} className="flex justify-between py-2 border-b border-noir-800/50 last:border-0">
                      <div>
                        <p className="text-white text-sm font-medium">{h.type === 'cours' ? 'Cours individuel' : h.type === 'ajustement' ? 'Ajustement' : h.type}</p>
                        {h.commentaire && <p className="text-gold-400 text-xs italic">{h.commentaire}</p>}
                        <p className="text-noir-600 text-xs">{new Date(h.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <span className={`text-sm font-bold ml-4 ${h.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>{h.delta > 0 ? '+' : ''}{h.delta}h</span>
                    </div>
                  ))}
                  {pack.reservations.map((res: { id: string; slot_start: string; student_timezone: string }) => {
                    const tz = res.student_timezone || 'Europe/Paris'
                    const start = DateTime.fromISO(res.slot_start, { zone: 'utc' }).setZone(tz)
                    return (
                      <div key={res.id} className="flex justify-between py-2 border-b border-noir-800/50 last:border-0">
                        <div><p className="text-white text-sm font-medium">Cours individuel</p><p className="text-noir-400 text-xs capitalize">{start.setLocale('fr').toFormat('EEEE d MMMM yyyy')}</p></div>
                        <span className="text-red-400 text-sm font-bold ml-4">- 1h</span>
                      </div>
                    )
                  })}
                  <div className="flex justify-between pt-3 border-t border-gold-500/30">
                    <p className="text-gold-400 font-bold">Solde actuel</p>
                    <p className="text-white text-lg font-bold">{pack.heures_restantes}h</p>
                  </div>
                </div>
              )}
            </div>

            {/* Acheter un nouveau pack */}
 <div className="card border-dashed border-gold-500/20 text-center">
 <p className="text-noir-400 text-sm mb-3">Besoin de plus d&apos;heures ?</p>
 <Link href="/packs" className="btn-outline text-sm px-6">Voir les packs disponibles</Link>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}