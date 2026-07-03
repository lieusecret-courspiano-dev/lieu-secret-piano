'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

interface Article {
  id: string; titre: string; slug: string; extrait: string; contenu: string
  categorie: string; image_url: string | null; created_at: string; temps_lecture: string
}

const DEFAULT_CONTENT: Record<string, { titre: string; contenu: string; categorie: string; temps_lecture: string }> = {
  'apprendre-piano-adulte': {
    titre: "Apprendre le piano à l'âge adulte : mythe ou réalité ?",
    categorie: 'Conseils', temps_lecture: '5 min',
    contenu: `<p>Beaucoup de personnes pensent qu'il est trop tard pour apprendre le piano une fois adulte. Cette idée reçue décourage de nombreux passionnés de musique. Pourtant, la réalité est bien différente.</p>
<h2>Le cerveau adulte apprend différemment, pas moins bien</h2>
<p>Contrairement aux enfants, les adultes ont une capacité de concentration plus développée et une motivation intrinsèque plus forte. Vous savez pourquoi vous voulez apprendre, ce qui est un avantage considérable.</p>
<h2>Les avantages d'apprendre adulte</h2>
<p>La lecture musicale est souvent plus rapide à acquérir pour un adulte. Votre compréhension théorique est facilitée par votre expérience générale. Vous pouvez pratiquer de manière plus autonome et ciblée.</p>
<h2>Combien de temps faut-il ?</h2>
<p>Avec 30 minutes de pratique quotidienne, la plupart des adultes peuvent jouer leurs premières mélodies en quelques semaines et accompagner des chansons simples en quelques mois.</p>
<h2>Nos conseils pour commencer</h2>
<p>Commencez par un cours d'essai gratuit pour évaluer votre niveau et définir vos objectifs. Choisissez un répertoire qui vous motive. La régularité prime sur la durée des sessions.</p>
<p>Il n'est jamais trop tard pour commencer le piano. La seule condition est de le vouloir vraiment.</p>`,
  },
  'choisir-clavier-piano': {
    titre: 'Comment choisir son premier clavier ou piano numérique ?',
    categorie: 'Matériel', temps_lecture: '7 min',
    contenu: `<p>Le choix de votre premier instrument est crucial pour votre apprentissage. Voici les critères essentiels à considérer.</p>
<h2>Le toucher dynamique : indispensable</h2>
<p>Un clavier avec toucher dynamique reproduit le comportement d'un vrai piano : plus vous appuyez fort, plus le son est fort. C'est essentiel pour développer une bonne technique.</p>
<h2>Le nombre de touches</h2>
<p>Un piano complet possède 88 touches. Pour débuter, 61 touches suffisent pour la plupart des morceaux. Idéalement, visez 76 ou 88 touches pour ne pas être limité.</p>
<h2>La polyphonie</h2>
<p>La polyphonie désigne le nombre de notes pouvant sonner simultanément. Visez au minimum 64 voix de polyphonie pour éviter les coupures de son.</p>
<h2>Notre recommandation pour débuter</h2>
<p>Pour un budget de 200-400€, des marques comme Yamaha (P-45), Roland (FP-30) ou Casio (PX-S1100) offrent d'excellentes options avec toucher dynamique et 88 touches.</p>`,
  },
  'progresser-piano-en-ligne': {
    titre: '5 conseils pour progresser rapidement au piano en ligne',
    categorie: 'Pédagogie', temps_lecture: '6 min',
    contenu: `<p>Les cours de piano en ligne offrent une flexibilité incomparable. Voici comment en tirer le meilleur parti.</p>
<h2>1. Préparez votre espace de pratique</h2>
<p>Installez votre clavier dans un endroit calme, bien éclairé, avec votre ordinateur ou tablette bien positionné pour que votre professeur puisse vous voir jouer via Zoom.</p>
<h2>2. Pratiquez régulièrement entre les cours</h2>
<p>30 minutes par jour valent mieux que 3 heures le week-end. La régularité est la clé du progrès musical.</p>
<h2>3. Enregistrez-vous</h2>
<p>Filmez-vous en train de jouer. Cela vous permet d'identifier vos erreurs et de mesurer votre progression.</p>
<h2>4. Utilisez un métronome</h2>
<p>Le sens du rythme s'acquiert avec la pratique. Commencez toujours lentement avec un métronome, puis augmentez progressivement le tempo.</p>
<h2>5. Jouez de la musique que vous aimez</h2>
<p>La motivation est le carburant de l'apprentissage. Demandez à votre professeur d'intégrer des morceaux que vous appréciez dans votre programme.</p>`,
  },
}

export default function ArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/blog?slug=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.titre) {
          setArticle(data)
        } else {
          const def = DEFAULT_CONTENT[slug]
          if (def) {
            setArticle({ id: slug, slug, extrait: '', image_url: null, created_at: new Date().toISOString(), ...def })
          } else {
            setNotFound(true)
          }
        }
      })
      .catch(() => {
        const def = DEFAULT_CONTENT[slug]
        if (def) {
          setArticle({ id: slug, slug, extrait: '', image_url: null, created_at: new Date().toISOString(), ...def })
        } else {
          setNotFound(true)
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-noir-950 text-noir-100">
        <PublicNav />
        <div className="pt-32 pb-24 px-4 text-center">
          <h1 className="font-serif text-4xl text-white mb-4">Article non trouvé</h1>
          <p className="text-noir-400 mb-8">Cet article n'existe pas ou a été supprimé.</p>
          <Link href="/blog" className="btn-gold">Retour au blog</Link>
        </div>
        <PublicFooter />
      </div>
    )
  }

  const isHtml = article.contenu.trim().startsWith('<')

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-10 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-noir-500 mb-8 flex-wrap">
              <Link href="/" className="hover:text-gold-400 transition-colors">Accueil</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-noir-400 truncate max-w-xs">{article.titre}</span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="bg-gold-500/10 text-gold-400 text-xs font-semibold px-3 py-1 rounded-full border border-gold-500/20">
                {article.categorie}
              </span>
              <span className="text-noir-500 text-sm">
                {new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-noir-600 text-sm">· {article.temps_lecture} de lecture</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
              {article.titre}
            </h1>

            {article.extrait && (
              <p className="text-noir-300 text-lg leading-relaxed border-l-2 border-gold-500/40 pl-5 mb-8">
                {article.extrait}
              </p>
            )}
          </motion.div>

          {/* Image de couverture */}
          {article.image_url && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="rounded-2xl overflow-hidden mb-10 aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.image_url} alt={article.titre} className="w-full h-full object-cover" />
            </motion.div>
          )}
        </div>
      </section>

      {/* Contenu */}
      <section className="pb-20 sm:pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            {isHtml ? (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: article.contenu }} />
            ) : (
              <div className="blog-content space-y-5">
                {article.contenu.split('\n\n').filter(Boolean).map((para, i) => {
                  if (para.startsWith('## ')) return (
                    <h2 key={i} className="font-serif text-2xl sm:text-3xl text-white mt-10 mb-4">{para.replace('## ', '')}</h2>
                  )
                  if (para.startsWith('# ')) return (
                    <h1 key={i} className="font-serif text-3xl sm:text-4xl text-white mt-10 mb-4">{para.replace('# ', '')}</h1>
                  )
                  return <p key={i} className="text-noir-300 leading-relaxed text-base sm:text-lg">{para}</p>
                })}
              </div>
            )}
          </motion.div>

          {/* CTA */}
          <div className="mt-14 sm:mt-16 bg-gradient-to-br from-gold-500/10 to-noir-900 border border-gold-500/20 rounded-2xl p-6 sm:p-8 text-center">
            <h3 className="font-serif text-2xl text-white mb-3">Prêt à commencer le piano ?</h3>
            <p className="text-noir-400 text-sm mb-6">Premier cours d'essai gratuit — 1 heure via Zoom, sans engagement.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/essai" className="btn-gold">Cours d'essai gratuit</Link>
              <Link href="/blog" className="border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-all text-center">
                Retour au blog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}