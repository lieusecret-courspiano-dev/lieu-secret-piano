'use client'
import dynamic from 'next/dynamic'
const PdfThumbnail = dynamic(() => import('@/components/ressources/PdfThumbnail'), { ssr: false })
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

interface Ressource {
  id: string; titre: string; description: string; type: string
  prix: number; est_gratuit: boolean; image_url: string | null
  duree_minutes: number | null; nb_places: number | null
  date_coaching: string | null; niveau: string
  fichier_url?: string | null; apercu_url?: string | null
  nb_pages?: number | null; youtube_url?: string | null
  zoom_url?: string | null; token_acces?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  video_youtube: 'Vidéo YouTube', coaching_visio: 'Coaching Visio (Zoom)',
  formation: 'Formation', documentation: 'Documentation', audio: 'Audio', autre: 'Ressource',
}

export default function RessourcePremiumPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [ressource, setRessource] = useState<Ressource | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nom: '', email: '', payment_method: 'virement' })
  const [buying, setBuying] = useState(false)
  const [success, setSuccess] = useState<{ token: string; statut: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/ressources-premium?id=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setRessource(d); else router.push('/ressources-premium') })
      .catch(() => router.push('/ressources-premium'))
      .finally(() => setLoading(false))
  }, [id, router])

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.email.trim()) { setError('Nom et email requis'); return }
    setBuying(true); setError('')

    try {
      if (form.payment_method === 'stripe') {
        // Redirection Stripe
        const res = await fetch('/api/ressources-premium/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ressource_id: id, acheteur_nom: form.nom, acheteur_email: form.email }),
        })
        const data = await res.json()
        if (data.url) { window.location.href = data.url; return }
        setError(data.error || 'Erreur Stripe')
      } else if (form.payment_method === 'paypal') {
        // Redirection PayPal
        const res = await fetch('/api/ressources-premium/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ressource_id: id, acheteur_nom: form.nom, acheteur_email: form.email }),
        })
        const data = await res.json()
        if (data.approvalUrl) { window.location.href = data.approvalUrl; return }
        setError(data.error || 'Erreur PayPal')
      } else {
        // Virement ou gratuit
        const res = await fetch('/api/ressources-premium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ressource_id: id, acheteur_nom: form.nom, acheteur_email: form.email, payment_method: form.payment_method }),
        })
        const data = await res.json()
        if (res.ok) setSuccess({ token: data.token, statut: data.statut })
        else setError(data.error || 'Erreur')
      }
    } catch { setError('Une erreur est survenue.') }
    setBuying(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!ressource) return null

  const isGratuit = ressource.est_gratuit || ressource.prix === 0

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      <section className="pt-28 sm:pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-noir-500 mb-8 flex-wrap">
            <Link href="/" className="hover:text-gold-400 transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/ressources-premium" className="hover:text-gold-400 transition-colors">Ressources Premium</Link>
            <span>/</span>
            <span className="text-noir-400 truncate max-w-xs">{ressource.titre}</span>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Infos ressource */}
            <div className="lg:col-span-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Miniature : image manuelle ou 1ère page PDF */}
                {ressource.image_url ? (
                  <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ressource.image_url} alt={ressource.titre} className="w-full h-full object-cover" />
                  </div>
                ) : ressource.type === 'documentation' && (ressource.fichier_url || ressource.apercu_url) ? (
                  <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-white">
                    <PdfThumbnail
                      url={ressource.fichier_url || ressource.apercu_url || ''}
                      titre={ressource.titre}
                      nbPages={ressource.nb_pages}
                    />
                  </div>
                ) : null}

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="bg-gold-500/10 text-gold-400 text-xs font-semibold px-3 py-1 rounded-full border border-gold-500/20">
                    {TYPE_LABELS[ressource.type] || ressource.type}
                  </span>
                  <span className="text-noir-500 text-xs capitalize">{ressource.niveau !== 'tous' ? ressource.niveau : 'Tous niveaux'}</span>
                  {ressource.duree_minutes && <span className="text-noir-500 text-xs">{ressource.duree_minutes} min</span>}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl text-white mb-4">{ressource.titre}</h1>

                {ressource.date_coaching && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                    <p className="text-blue-400 text-sm font-semibold mb-1">Date du coaching</p>
                    <p className="text-white text-sm">
                      {new Date(ressource.date_coaching).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {ressource.nb_places && <p className="text-blue-300 text-xs mt-1">{ressource.nb_places} places disponibles</p>}
                  </div>
                )}

                {ressource.description && (
                  <p className="text-noir-300 leading-relaxed text-base">{ressource.description}</p>
                )}
              </motion.div>
            </div>

            {/* Formulaire d'achat */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div className="bg-noir-900 border border-gold-500/20 rounded-2xl p-6 sticky top-24">
                  {success ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      {success.statut === 'confirme' ? (
                        <>
                          <h3 className="text-white font-semibold text-lg mb-2">Accès débloqué !</h3>
                          <p className="text-noir-400 text-sm mb-4">Vérifiez votre email pour accéder à la ressource.</p>
                          <Link href={`/ressources-premium/acces/${success.token}`} className="btn-gold w-full text-center block">
                            Accéder maintenant
                          </Link>
                        </>
                      ) : (
                        <>
                          <h3 className="text-white font-semibold text-lg mb-2">Commande reçue !</h3>
                          <p className="text-noir-400 text-sm mb-2">Vous recevrez les instructions de paiement par email.</p>
                          <p className="text-noir-500 text-xs">Votre accès sera débloqué après confirmation du paiement.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-5">
                        <div className="text-3xl font-bold text-gold-400 mb-1">
                          {isGratuit ? 'Gratuit' : `${ressource.prix} €`}
                        </div>
                        {!isGratuit && <p className="text-noir-500 text-xs">Accès permanent</p>}
                      </div>

                      <form onSubmit={handleBuy} className="space-y-4">
                        <div>
                          <label className="label mb-1.5 block">Nom complet *</label>
                          <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                            className="input w-full" placeholder="Prénom Nom" required />
                        </div>
                        <div>
                          <label className="label mb-1.5 block">Email *</label>
                          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="input w-full" placeholder="vous@exemple.com" required />
                        </div>

                        {!isGratuit && (
                          <div>
                            <label className="label mb-2 block">Mode de paiement</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { v: 'stripe',   l: 'Carte bancaire' },
                                { v: 'paypal',   l: 'PayPal' },
                                { v: 'virement', l: 'Virement' },
                              ].map(pm => (
                                <button key={pm.v} type="button"
                                  onClick={() => setForm(f => ({ ...f, payment_method: pm.v }))}
                                  className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                                    form.payment_method === pm.v
                                      ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                                      : 'border-noir-700 text-noir-400 hover:border-noir-600'
                                  }`}>
                                  {pm.l}
                                </button>
                              ))}
                            </div>
                            {form.payment_method === 'virement' && (
                              <p className="text-noir-500 text-xs mt-2">Vous recevrez les coordonnées bancaires par email. L'accès sera débloqué après confirmation.</p>
                            )}
                          </div>
                        )}

                        {error && <p className="text-red-400 text-xs">{error}</p>}

                        <button type="submit" disabled={buying} className="btn-gold w-full py-3">
                          {buying ? 'Traitement...' : isGratuit ? 'Accéder gratuitement' : `Acheter — ${ressource.prix} €`}
                        </button>

                        <p className="text-noir-600 text-xs text-center">
                          Accès permanent après paiement
                        </p>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}