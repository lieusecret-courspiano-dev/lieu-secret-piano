'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import { Package } from 'lucide-react'

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

interface Article {
  id: string
  nom: string
  slug: string
  description_courte: string | null
  photos: string[]
  prix_jour: number | null
  prix_weekend: number | null
  prix_semaine: number | null
  prix_mois: number | null
  caution: number
  categorie: string
  accessoires_inclus: string | null
}

function PrixMin(a: Article) {
  const prix = [a.prix_jour, a.prix_weekend, a.prix_semaine, a.prix_mois].filter(Boolean) as number[]
  if (prix.length === 0) return null
  return Math.min(...prix)
}

const CATEGORIES = [
  { value: '', label: 'Tous' },
  { value: 'instrument', label: 'Instruments' },
  { value: 'accessoire', label: 'Accessoires' },
  { value: 'autre', label: 'Autre' },
]

export default function LocationPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [categorie, setCategorie] = useState('')

  useEffect(() => {
    fetch('/api/location')
      .then(r => r.json())
      .then(d => { setArticles(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = articles.filter(a => !categorie || a.categorie === categorie)

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Location</span>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white mt-4 mb-6">
              Louez votre <span className="text-gold-400">matériel musical</span>
            </h1>
            <p className="text-noir-300 text-lg leading-relaxed max-w-2xl mx-auto">
              Instruments et accessoires disponibles à la location — retrait sur place ou livraison
              dans la région stéphanoise. Contrat de location signé en ligne, paiement sécurisé.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Avantages */}
      <section className="pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
                  titre: 'Contrat en ligne',
                  desc: 'Signez votre contrat de location directement depuis le site, en quelques clics.',
                },
                {
                  icon: <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
                  titre: 'Paiement sécurisé',
                  desc: 'Stripe, PayPal ou virement bancaire — choisissez le moyen de paiement qui vous convient.',
                },
                {
                  icon: <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
                  titre: 'Retrait ou livraison',
                  desc: 'Récupérez le matériel sur place ou faites-vous livrer dans un rayon de 50 km autour de Saint-Étienne.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-noir-900 border border-noir-800 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{item.titre}</h3>
                    <p className="text-noir-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Catalogue */}
      <section className="py-8 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-serif text-3xl text-white">Catalogue</h2>
              <p className="text-noir-400 text-sm mt-1">
                {filtered.length} article{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
              </p>
            </div>
            {/* Filtre catégorie */}
            <div className="flex gap-1.5 bg-noir-900 border border-noir-800 rounded-xl p-1">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategorie(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    categorie === c.value ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </FadeUp>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="text-noir-700 mx-auto mb-4" />
              <p className="text-noir-400 text-lg">Aucun article disponible pour le moment.</p>
              <p className="text-noir-600 text-sm mt-2">Revenez bientôt ou contactez-nous pour plus d'informations.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((a, i) => {
                const prixMin = PrixMin(a)
                return (
                  <FadeUp key={a.id} delay={i * 0.07}>
                    <Link href={`/location/${a.slug}`}
                      className="group bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden hover:border-noir-700 hover:-translate-y-1 transition-all flex flex-col h-full">
                      {/* Photo */}
                      <div className="aspect-video bg-noir-800 overflow-hidden relative">
                        {a.photos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.photos[0]} alt={a.nom}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={40} className="text-noir-600" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="text-xs bg-noir-950/80 backdrop-blur-sm text-gold-400 border border-gold-500/20 px-2.5 py-1 rounded-full capitalize">
                            {a.categorie}
                          </span>
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-gold-400 transition-colors">
                          {a.nom}
                        </h3>
                        {a.description_courte && (
                          <p className="text-noir-400 text-sm leading-relaxed mb-4 flex-1">
                            {a.description_courte}
                          </p>
                        )}
                        {a.accessoires_inclus && (
                          <p className="text-noir-600 text-xs mb-4">
                            Inclus : {a.accessoires_inclus}
                          </p>
                        )}

                        {/* Tarifs */}
                        <div className="border-t border-noir-800 pt-4 mt-auto">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {a.prix_jour && (
                              <span className="text-xs bg-noir-800 text-noir-300 px-2.5 py-1 rounded-full">
                                {a.prix_jour.toFixed(2).replace('.', ',')} €/jour
                              </span>
                            )}
                            {a.prix_weekend && (
                              <span className="text-xs bg-noir-800 text-noir-300 px-2.5 py-1 rounded-full">
                                {a.prix_weekend.toFixed(2).replace('.', ',')} €/week-end
                              </span>
                            )}
                            {a.prix_semaine && (
                              <span className="text-xs bg-noir-800 text-noir-300 px-2.5 py-1 rounded-full">
                                {a.prix_semaine.toFixed(2).replace('.', ',')} €/semaine
                              </span>
                            )}
                            {a.prix_mois && (
                              <span className="text-xs bg-noir-800 text-noir-300 px-2.5 py-1 rounded-full">
                                {a.prix_mois.toFixed(2).replace('.', ',')} €/mois
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            {prixMin && (
                              <div>
                                <span className="text-noir-500 text-xs">À partir de </span>
                                <span className="text-gold-400 font-bold text-lg">
                                  {prixMin.toFixed(2).replace('.', ',')} €
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gold-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                              Voir & réserver →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </FadeUp>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA contact */}
      <section className="py-16 px-4 bg-noir-900/30">
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <h2 className="font-serif text-3xl text-white mb-4">Une question ?</h2>
            <p className="text-noir-400 mb-8">
              Vous ne trouvez pas ce que vous cherchez ou vous souhaitez plus d'informations
              sur nos conditions de location ? Contactez-nous.
            </p>
            <Link href="/contact" className="btn-gold px-8 py-3 inline-block">
              Nous contacter
            </Link>
          </FadeUp>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}