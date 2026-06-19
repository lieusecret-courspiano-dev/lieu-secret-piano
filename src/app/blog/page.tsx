'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

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
  id: string; titre: string; slug: string; extrait: string
  categorie: string; image_url: string | null; created_at: string; temps_lecture: string
}

const CATEGORIES = ['Tous', 'Conseils', 'Technique', 'Pédagogie', 'Matériel', 'Actualités']

// Articles par défaut si aucun article en base
const DEFAULT_ARTICLES: Article[] = [
  { id: '1', titre: "Apprendre le piano à l'âge adulte : mythe ou réalité ?", slug: 'apprendre-piano-adulte', extrait: "Beaucoup pensent qu'il est trop tard pour apprendre le piano passé un certain âge. Découvrez pourquoi c'est faux.", categorie: 'Conseils', image_url: null, created_at: new Date().toISOString(), temps_lecture: '5 min' },
  { id: '2', titre: 'Comment choisir son premier clavier ou piano numérique ?', slug: 'choisir-clavier-piano', extrait: 'Toucher dynamique, nombre de touches, polyphonie... Voici les critères essentiels pour choisir l\'instrument idéal.', categorie: 'Matériel', image_url: null, created_at: new Date().toISOString(), temps_lecture: '7 min' },
  { id: '3', titre: '5 conseils pour progresser rapidement au piano en ligne', slug: 'progresser-piano-en-ligne', extrait: 'Les cours en ligne offrent une flexibilité incomparable. Voici comment en tirer le meilleur parti.', categorie: 'Pédagogie', image_url: null, created_at: new Date().toISOString(), temps_lecture: '6 min' },
]

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [categorie, setCategorie] = useState('Tous')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    fetch('/api/blog').then(r => r.json()).then((d: Article[]) => {
      setArticles(Array.isArray(d) && d.length > 0 ? d : DEFAULT_ARTICLES)
    }).catch(() => setArticles(DEFAULT_ARTICLES)).finally(() => setLoading(false))
  }, [])

  const filtered = categorie === 'Tous' ? articles : articles.filter(a => a.categorie === categorie)

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-14 sm:pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.05),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Blog</span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mt-4 mb-6">
              Conseils & <span className="text-gold-400">Inspirations</span>
            </h1>
            <p className="text-noir-300 text-base sm:text-lg leading-relaxed">
              Articles, conseils pédagogiques et ressources pour progresser au piano et enrichir votre pratique musicale.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filtres catégories */}
      <section className="px-4 mb-10 sm:mb-12">
        <div className="max-w-5xl mx-auto flex gap-2 flex-wrap justify-center">
          {CATEGORIES.map((cat, i) => (
            <button key={i} onClick={() => setCategorie(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                categorie === cat ? 'bg-gold-500 text-noir-950' : 'bg-noir-900 border border-noir-800 text-noir-400 hover:text-white hover:border-noir-700'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="py-4 px-4 pb-20 sm:pb-24">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-noir-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-noir-800 rounded w-1/3" />
                    <div className="h-5 bg-noir-800 rounded" />
                    <div className="h-4 bg-noir-800 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-noir-400 text-lg">Aucun article dans cette catégorie.</p>
              <button onClick={() => setCategorie('Tous')} className="mt-4 text-gold-400 hover:text-gold-300 underline text-sm">
                Voir tous les articles
              </button>
            </div>
          ) : (
            <>
              {/* Article vedette */}
              {filtered.length > 0 && (
                <FadeUp className="mb-6 sm:mb-8">
                  <Link href={`/blog/${filtered[0].slug}`}
                    className="group block bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden hover:border-noir-700 transition-all">
                    <div className="grid md:grid-cols-2">
                      <div className="aspect-video md:aspect-auto bg-gradient-to-br from-gold-500/10 to-noir-800 flex items-center justify-center min-h-48 relative overflow-hidden">
                        {filtered[0].image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={filtered[0].image_url} alt={filtered[0].titre} className="w-full h-full object-cover" />
                        ) : (
                          <svg width="60" height="60" fill="none" stroke="#f59e0b" strokeWidth="1" viewBox="0 0 24 24" className="opacity-20">
                            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v8M10 4v5M14 4v8M17 4v5"/>
                          </svg>
                        )}
                      </div>
                      <div className="p-6 sm:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <span className="bg-gold-500/10 text-gold-400 text-xs font-semibold px-3 py-1 rounded-full border border-gold-500/20">
                            {filtered[0].categorie}
                          </span>
                          <span className="text-noir-500 text-xs">{new Date(filtered[0].created_at).toLocaleDateString('fr-FR')}</span>
                          <span className="text-noir-600 text-xs">· {filtered[0].temps_lecture} de lecture</span>
                        </div>
                        <h2 className="font-serif text-xl sm:text-2xl text-white mb-3 group-hover:text-gold-400 transition-colors">
                          {filtered[0].titre}
                        </h2>
                        <p className="text-noir-400 text-sm leading-relaxed mb-6 line-clamp-3">{filtered[0].extrait}</p>
                        <span className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors">
                          Lire l'article
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </FadeUp>
              )}

              {/* Grille */}
              {filtered.length > 1 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filtered.slice(1).map((article, i) => (
                    <FadeUp key={article.id} delay={i * 0.07}>
                      <Link href={`/blog/${article.slug}`}
                        className="group block bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden hover:border-noir-700 transition-all hover:-translate-y-1 h-full">
                        <div className="aspect-video bg-gradient-to-br from-noir-800 to-noir-900 flex items-center justify-center relative overflow-hidden">
                          {article.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={article.image_url} alt={article.titre} className="w-full h-full object-cover" />
                          ) : (
                            <svg width="36" height="36" fill="none" stroke="#3a3a5c" strokeWidth="1" viewBox="0 0 24 24">
                              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v8M10 4v5M14 4v8M17 4v5"/>
                            </svg>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="text-gold-500 text-xs font-semibold">{article.categorie}</span>
                            <span className="text-noir-600 text-xs">· {article.temps_lecture}</span>
                          </div>
                          <h3 className="font-serif text-base sm:text-lg text-white mb-2 group-hover:text-gold-400 transition-colors line-clamp-2">
                            {article.titre}
                          </h3>
                          <p className="text-noir-400 text-sm leading-relaxed line-clamp-3">{article.extrait}</p>
                          <div className="mt-4 text-xs text-noir-500">{new Date(article.created_at).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </Link>
                    </FadeUp>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-14 sm:py-16 px-4 bg-noir-900/30">
        <div className="max-w-xl mx-auto text-center">
          <FadeUp>
            <h2 className="font-serif text-2xl sm:text-3xl text-white mb-3">Restez inspiré</h2>
            <p className="text-noir-400 mb-6 text-sm">Recevez nos meilleurs articles et conseils directement dans votre boîte mail.</p>
            {subscribed ? (
              <p className="text-green-400 font-medium">Merci pour votre inscription !</p>
            ) : (
              <form className="flex flex-col sm:flex-row gap-2" onSubmit={e => { e.preventDefault(); if (email) setSubscribed(true) }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com" className="input flex-1" required />
                <button type="submit" className="btn-gold shrink-0">S'abonner</button>
              </form>
            )}
          </FadeUp>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}