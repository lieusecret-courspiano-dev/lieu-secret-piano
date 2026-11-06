'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import { Package, ChevronLeft, ChevronRight, Shield, Truck, MapPin } from 'lucide-react'

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
  description: string | null
  description_courte: string | null
  photos: string[]
  numero_serie: string | null
  valeur_declaree: number | null
  prix_jour: number | null
  prix_weekend: number | null
  prix_semaine: number | null
  prix_mois: number | null
  caution: number
  accessoires_inclus: string | null
  disponible: boolean
  stock: number
  categorie: string
}

function f(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export default function LocationDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/location/${slug}?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => { if (d) { setArticle(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !article) return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Package size={48} className="text-noir-700 mb-4" />
        <h1 className="font-serif text-3xl text-white mb-2">Article introuvable</h1>
        <p className="text-noir-400 mb-6">Cet article n'existe pas ou n'est plus disponible.</p>
        <Link href="/location" className="btn-gold">Retour au catalogue</Link>
      </div>
      <PublicFooter />
    </div>
  )

  const tarifs = [
    { label: 'Par jour', value: article.prix_jour, key: 'jours' },
    { label: 'Week-end', value: article.prix_weekend, key: 'weekend' },
    { label: 'Par semaine', value: article.prix_semaine, key: 'semaine' },
    { label: 'Par mois', value: article.prix_mois, key: 'mois' },
  ].filter(t => t.value !== null)

  const photos = article.photos?.length ? article.photos : []

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Fil d'Ariane */}
          <FadeUp className="mb-6">
            <nav className="flex items-center gap-2 text-sm text-noir-500">
              <Link href="/location" className="hover:text-gold-400 transition-colors">Location</Link>
              <span>/</span>
              <span className="text-noir-300 capitalize">{article.categorie}</span>
              <span>/</span>
              <span className="text-white">{article.nom}</span>
            </nav>
          </FadeUp>

          <div className="grid lg:grid-cols-2 gap-10">

            {/* Galerie photos */}
            <FadeUp>
              <div className="space-y-3">
                {/* Photo principale */}
                <div className="aspect-video bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden relative">
                  {photos.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos[photoIndex]} alt={`${article.nom} — photo ${photoIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={e => {
                          const t = e.target as HTMLImageElement
                          t.style.display = 'none'
                        }} />
                      {photos.length > 1 && (
                        <>
                          <button onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-noir-950/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-noir-800 transition-colors">
                            <ChevronLeft size={18} />
                          </button>
                          <button onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-noir-950/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-noir-800 transition-colors">
                            <ChevronRight size={18} />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {photos.map((_, i) => (
                              <button key={i} onClick={() => setPhotoIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIndex ? 'bg-gold-400 w-4' : 'bg-white/40'}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={60} className="text-noir-700" />
                    </div>
                  )}
                </div>

                {/* Miniatures */}
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((url, i) => (
                      <button key={i} onClick={() => setPhotoIndex(i)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                          i === photoIndex ? 'border-gold-500' : 'border-noir-800 hover:border-noir-600'
                        }`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Infos pratiques */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { icon: <Shield size={16} className="text-gold-400" />, label: 'Caution', value: f(article.caution) },
                    { icon: <MapPin size={16} className="text-gold-400" />, label: 'Retrait', value: 'Saint-Étienne' },
                    { icon: <Truck size={16} className="text-gold-400" />, label: 'Livraison', value: '≤ 50 km' },
                  ].map((item, i) => (
                    <div key={i} className="bg-noir-900 border border-noir-800 rounded-xl p-3 text-center">
                      <div className="flex justify-center mb-1">{item.icon}</div>
                      <div className="text-noir-500 text-[10px] uppercase tracking-wider">{item.label}</div>
                      <div className="text-white text-xs font-medium mt-0.5">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Infos & réservation */}
            <FadeUp delay={0.1}>
              <div className="space-y-5">
                {/* En-tête */}
                <div>
                  <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest capitalize">{article.categorie}</span>
                  <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white mt-2 mb-3">{article.nom}</h1>
                  {article.description_courte && (
                    <p className="text-noir-300 text-base leading-relaxed">{article.description_courte}</p>
                  )}
                </div>

                {/* Disponibilité */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
                  article.disponible && article.stock > 0
                    ? 'text-green-400 border-green-500/30 bg-green-500/10'
                    : 'text-red-400 border-red-500/30 bg-red-500/10'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${article.disponible && article.stock > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                  {article.disponible && article.stock > 0 ? 'Disponible à la location' : 'Actuellement indisponible'}
                </div>

                {/* Tarifs */}
                {tarifs.length > 0 && (
                  <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5">
                    <h2 className="text-white font-semibold mb-4">Tarifs de location</h2>
                    <div className="space-y-2.5">
                      {tarifs.map(t => (
                        <div key={t.key} className="flex items-center justify-between">
                          <span className="text-noir-400 text-sm">{t.label}</span>
                          <span className="text-white font-semibold">{f(t.value!)}</span>
                        </div>
                      ))}
                      <div className="border-t border-noir-800 pt-2.5 flex items-center justify-between">
                        <span className="text-noir-500 text-sm">Caution</span>
                        <span className="text-gold-400 font-semibold">{f(article.caution)}</span>
                      </div>
                    </div>
                    <p className="text-noir-600 text-xs mt-3">
                      * La caution est restituée dans les 5 jours ouvrés après retour du matériel en bon état.
                    </p>
                  </div>
                )}

                {/* Accessoires inclus */}
                {article.accessoires_inclus && (
                  <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5">
                    <h2 className="text-white font-semibold mb-3">Accessoires inclus</h2>
                    <p className="text-noir-300 text-sm">{article.accessoires_inclus}</p>
                  </div>
                )}

                {/* Description complète */}
                {article.description && (
                  <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5">
                    <h2 className="text-white font-semibold mb-3">Description</h2>
                    <p className="text-noir-300 text-sm leading-relaxed whitespace-pre-line">{article.description}</p>
                  </div>
                )}

                {/* CTA */}
                {article.disponible && article.stock > 0 ? (
                  <Link href={`/location/reserver/${article.slug}`}
                    className="btn-gold w-full text-center py-4 text-base block">
                    Réserver cet article
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <div className="w-full text-center py-4 text-base bg-noir-800 text-noir-500 rounded-2xl cursor-not-allowed">
                      Article indisponible
                    </div>
                    <Link href="/contact" className="block text-center text-sm text-gold-400 hover:text-gold-300 transition-colors">
                      Me prévenir quand il est disponible →
                    </Link>
                  </div>
                )}

                {/* Rassurance */}
                <div className="bg-gold-500/5 border border-gold-500/15 rounded-xl p-4">
                  <ul className="space-y-2">
                    {[
                      'Contrat de location signé en ligne',
                      'Paiement sécurisé (Stripe, PayPal, virement)',
                      'Caution par chèque ou virement',
                      'Retrait à Saint-Étienne ou livraison à domicile',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-noir-300">
                        <svg width="13" height="13" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Retour catalogue */}
          <FadeUp className="mt-12 text-center">
            <Link href="/location" className="text-noir-400 hover:text-gold-400 transition-colors text-sm inline-flex items-center gap-2">
              <ChevronLeft size={16} /> Retour au catalogue
            </Link>
          </FadeUp>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}