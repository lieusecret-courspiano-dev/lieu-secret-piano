'use client'
import { useState, useRef } from 'react'
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

const COURS_TYPES = [
  {
    titre: 'Cours individuel', sous: '1h — En tête-à-tête via Zoom',
    desc: 'Un cours entièrement dédié à votre progression. Le professeur adapte chaque séance à votre niveau, vos objectifs et votre rythme d\'apprentissage.',
    features: ['Programme 100% personnalisé', 'Suivi de progression détaillé', 'Notes de cours après chaque séance', 'Ressources pédagogiques incluses', 'Lien Zoom envoyé par email', 'Enregistrement disponible sur demande'],
    cta: 'Réserver un créneau', href: '/reservation',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v8M10 4v5M14 4v8M17 4v5"/></svg>,
  },
  {
    titre: 'Atelier de groupe', sous: "Jusqu'à 8 participants via Zoom",
    desc: 'Apprenez en groupe dans une ambiance conviviale et stimulante. Chaque atelier est centré sur un thème musical précis pour progresser ensemble.',
    features: ['Thème défini à l\'avance', 'Échanges et partage entre élèves', 'Ambiance conviviale et motivante', 'Tarif accessible', 'Gratuit ou payant selon l\'atelier', 'Replay disponible'],
    cta: 'Voir les ateliers', href: '/reservation?tab=evenements',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    titre: 'Masterclass', sous: 'Perfectionnement — 6 max via Zoom',
    desc: 'Poussez votre technique plus loin avec des sessions intensives en petit groupe. Idéal pour les pianistes intermédiaires et avancés.',
    features: ['Niveau intermédiaire/avancé', 'Technique approfondie', 'Petits groupes (6 participants max)', 'Enregistrement disponible', 'Feedback personnalisé', 'Certificat de participation'],
    cta: 'Voir les masterclass', href: '/reservation?tab=evenements',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  },
]

const NIVEAUX = [
  { titre: 'Débutant', desc: 'Vous n\'avez jamais touché un piano ou vous débutez tout juste. Nous partons de zéro avec patience et bienveillance.', competences: ['Découverte du clavier', 'Posture et position des mains', 'Premiers accords', 'Lecture rythmique de base'] },
  { titre: 'Intermédiaire', desc: 'Vous connaissez les bases et souhaitez approfondir votre technique et votre répertoire musical.', competences: ['Renversements d\'accords', 'Progressions harmoniques', 'Accompagnement à l\'oreille', 'Jeu avec métronome'] },
  { titre: 'Avancé', desc: 'Vous maîtrisez les fondamentaux et cherchez à perfectionner votre expression musicale et votre créativité.', competences: ['Harmonie avancée', 'Improvisation', 'Arrangements', 'Développement du style personnel'] },
]

export default function CoursPage() {
  const [activeNiveau, setActiveNiveau] = useState(0)

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Nos cours</span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mt-4 mb-6">
              Apprenez le piano<br /><span className="text-gold-400">à votre façon</span>
            </h1>
            <p className="text-noir-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              Cours individuels, ateliers collectifs ou masterclass via Zoom — choisissez la formule qui correspond à vos objectifs.
            </p>
            <Link href="/essai" className="btn-gold text-base px-8 py-4 shadow-xl shadow-gold-500/20 inline-block">
              Commencer par un cours d'essai gratuit
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Types de cours */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {COURS_TYPES.map((cours, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6 sm:p-7 hover:border-noir-700 transition-all hover:-translate-y-1 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4 text-gold-400">
                    {cours.icon}
                  </div>
                  <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest mb-2 block">{cours.sous}</span>
                  <h2 className="font-serif text-xl sm:text-2xl text-white mb-3">{cours.titre}</h2>
                  <p className="text-noir-400 text-sm leading-relaxed mb-6">{cours.desc}</p>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {cours.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-noir-300">
                        <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={cours.href} className="btn-gold text-center text-sm">{cours.cta}</Link>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Niveaux */}
      <section className="py-16 sm:py-20 px-4 bg-noir-900/30">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-10 sm:mb-12">
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Niveaux</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white mt-3">Pour tous les niveaux</h2>
          </FadeUp>
          <div className="flex gap-2 justify-center mb-8 flex-wrap">
            {NIVEAUX.map((n, i) => (
              <button key={i} onClick={() => setActiveNiveau(i)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeNiveau === i ? 'bg-gold-500 text-noir-950' : 'bg-noir-900 border border-noir-800 text-noir-400 hover:text-white'
                }`}>
                {n.titre}
              </button>
            ))}
          </div>
          <motion.div key={activeNiveau} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="bg-noir-900 border border-gold-500/20 rounded-2xl p-6 sm:p-8">
            <h3 className="font-serif text-xl sm:text-2xl text-white mb-3">{NIVEAUX[activeNiveau].titre}</h3>
            <p className="text-noir-300 mb-6 text-sm sm:text-base">{NIVEAUX[activeNiveau].desc}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {NIVEAUX[activeNiveau].competences.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-noir-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  {c}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Zoom info */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <svg width="22" height="22" fill="none" stroke="#3b82f6" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Tous les cours se déroulent via Zoom</h3>
                <p className="text-noir-400 text-sm">Après votre réservation, vous recevez automatiquement le lien Zoom par email. Aucune installation complexe requise.</p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4 text-center">
        <FadeUp>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">Prêt à commencer ?</h2>
          <p className="text-noir-400 mb-8 text-sm sm:text-base">Premier cours d'essai gratuit — sans engagement.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/essai" className="btn-gold text-base px-8 py-4">Cours d'essai gratuit</Link>
            <Link href="/tarifs" className="border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white px-8 py-4 rounded-2xl text-base transition-all">
              Voir les tarifs
            </Link>
          </div>
        </FadeUp>
      </section>

      <PublicFooter />
    </div>
  )
}