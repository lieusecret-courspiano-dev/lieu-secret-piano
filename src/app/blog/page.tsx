'use client'
import { useRef } from 'react'
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

const ARTICLES = [
  {
    slug: 'apprendre-piano-adulte',
    titre: 'Apprendre le piano à l\'âge adulte : mythe ou réalité ?',
    extrait: 'Beaucoup pensent qu\'il est trop tard pour apprendre le piano passé un certain âge. Découvrez pourquoi c\'est faux et comment commencer efficacement.',
    categorie: 'Conseils',
    date: '15 juin 2026',
    lecture: '5 min',
    image: null,
  },
  {
    slug: 'choisir-clavier-piano',
    titre: 'Comment choisir son premier clavier ou piano numérique ?',
    extrait: 'Toucher dynamique, nombre de touches, polyphonie... Voici les critères essentiels pour choisir l\'instrument idéal pour débuter.',
    categorie: 'Matériel',
    date: '8 juin 2026',
    lecture: '7 min',
    image: null,
  },
  {
    slug: 'progresser-piano-en-ligne',
    titre: '5 conseils pour progresser rapidement au piano en ligne',
    extrait: 'Les cours en ligne offrent une flexibilité incomparable. Voici comment en tirer le meilleur parti pour progresser efficacement.',
    categorie: 'Pédagogie',
    date: '1 juin 2026',
    lecture: '6 min',
    image: null,
  },
  {
    slug: 'accords-piano-debutant',
    titre: 'Les 10 accords essentiels pour débuter au piano',
    extrait: 'Maîtriser ces 10 accords fondamentaux vous permettra d\'accompagner des centaines de chansons et de comprendre l\'harmonie musicale.',
    categorie: 'Technique',
    date: '25 mai 2026',
    lecture: '8 min',
    image: null,
  },
  {
    slug: 'routine-pratique-piano',
    titre: 'Créer une routine de pratique efficace au piano',
    extrait: 'La régularité est la clé du progrès musical. Découvrez comment structurer vos sessions de pratique pour des résultats optimaux.',
    categorie: 'Conseils',
    date: '18 mai 2026',
    lecture: '5 min',
    image: null,
  },
  {
    slug: 'lire-partition-piano',
    titre: 'Apprendre à lire une partition de piano : guide complet',
    extrait: 'La lecture de partition peut sembler intimidante au début. Ce guide pas-à-pas vous accompagne de la clé de sol aux premières mélodies.',
    categorie: 'Technique',
    date: '10 mai 2026',
    lecture: '10 min',
    image: null,
  },
]

const CATEGORIES = ['Tous', 'Conseils', 'Technique', 'Pédagogie', 'Matériel']

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.05),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Blog</span>
            <h1 className="font-serif text-5xl md:text-6xl text-white mt-4 mb-6">
              Conseils & <span className="text-gold-400">Inspirations</span>
            </h1>
            <p className="text-noir-300 text-lg leading-relaxed">
              Articles, conseils pédagogiques et ressources pour progresser au piano et enrichir votre pratique musicale.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filtres */}
      <section className="px-4 mb-12">
        <div className="max-w-5xl mx-auto flex gap-2 flex-wrap justify-center">
          {CATEGORIES.map((cat, i) => (
            <button key={i}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                i === 0 ? 'bg-gold-500 text-noir-950' : 'bg-noir-900 border border-noir-800 text-noir-400 hover:text-white hover:border-noir-700'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="py-8 px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Article vedette */}
          <FadeUp className="mb-8">
            <div className="bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden hover:border-noir-700 transition-all group">
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto bg-gradient-to-br from-gold-500/10 to-noir-800 flex items-center justify-center min-h-48">
                  <svg width="60" height="60" fill="none" stroke="#f59e0b" strokeWidth="1" viewBox="0 0 24 24" className="opacity-30">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-gold-500/10 text-gold-400 text-xs font-semibold px-3 py-1 rounded-full border border-gold-500/20">
                      {ARTICLES[0].categorie}
                    </span>
                    <span className="text-noir-500 text-xs">{ARTICLES[0].date}</span>
                    <span className="text-noir-600 text-xs">· {ARTICLES[0].lecture} de lecture</span>
                  </div>
                  <h2 className="font-serif text-2xl text-white mb-3 group-hover:text-gold-400 transition-colors">
                    {ARTICLES[0].titre}
                  </h2>
                  <p className="text-noir-400 text-sm leading-relaxed mb-6">{ARTICLES[0].extrait}</p>
                  <Link href={`/blog/${ARTICLES[0].slug}`}
                    className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors">
                    Lire l'article
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Grille articles */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARTICLES.slice(1).map((article, i) => (
              <FadeUp key={article.slug} delay={i * 0.08}>
                <Link href={`/blog/${article.slug}`}
                  className="group block bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden hover:border-noir-700 transition-all hover:-translate-y-1 h-full">
                  <div className="aspect-video bg-gradient-to-br from-noir-800 to-noir-900 flex items-center justify-center">
                    <svg width="40" height="40" fill="none" stroke="#3a3a5c" strokeWidth="1" viewBox="0 0 24 24">
                      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gold-500 text-xs font-semibold">{article.categorie}</span>
                      <span className="text-noir-600 text-xs">· {article.lecture}</span>
                    </div>
                    <h3 className="font-serif text-lg text-white mb-2 group-hover:text-gold-400 transition-colors line-clamp-2">
                      {article.titre}
                    </h3>
                    <p className="text-noir-400 text-sm leading-relaxed line-clamp-3">{article.extrait}</p>
                    <div className="mt-4 text-xs text-noir-500">{article.date}</div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 bg-noir-900/30">
        <div className="max-w-xl mx-auto text-center">
          <FadeUp>
            <h2 className="font-serif text-3xl text-white mb-3">Restez inspiré</h2>
            <p className="text-noir-400 mb-6 text-sm">Recevez nos meilleurs articles et conseils directement dans votre boîte mail.</p>
            <form className="flex gap-2" onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="votre@email.com" className="input flex-1" />
              <button type="submit" className="btn-gold shrink-0">S'abonner</button>
            </form>
          </FadeUp>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}