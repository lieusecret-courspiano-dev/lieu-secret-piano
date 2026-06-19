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

interface TarifSettings {
  tarif_cours_1h?: string
  tarif_pack_label1?: string; tarif_pack_prix1?: string; tarif_pack_desc1?: string
  tarif_pack_label2?: string; tarif_pack_prix2?: string; tarif_pack_desc2?: string
  tarif_pack_label3?: string; tarif_pack_prix3?: string; tarif_pack_desc3?: string
  tarif_pack_label4?: string; tarif_pack_prix4?: string; tarif_pack_desc4?: string
}

const INCLUS = [
  'Cours via Zoom ou Google Meet',
  'Notes de cours après chaque séance',
  'Ressources pédagogiques',
  'Suivi de progression',
  'Accès à l\'espace élève',
  'Support par messagerie',
]

const COMPARAISON = [
  { feature: 'Cours 100% en ligne', individuel: true, atelier: true, masterclass: true },
  { feature: 'Programme personnalisé', individuel: true, atelier: false, masterclass: false },
  { feature: 'Notes de cours', individuel: true, atelier: false, masterclass: true },
  { feature: 'Suivi de progression', individuel: true, atelier: false, masterclass: false },
  { feature: 'Accès espace élève', individuel: true, atelier: true, masterclass: true },
  { feature: 'Enregistrement', individuel: false, atelier: true, masterclass: true },
  { feature: 'Certificat', individuel: true, atelier: false, masterclass: true },
]

export default function TarifsPage() {
  const [settings, setSettings] = useState<TarifSettings | null>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const s = settings
  const packs = [
    s?.tarif_pack_label1 && { label: s.tarif_pack_label1, prix: s.tarif_pack_prix1 || '', desc: s.tarif_pack_desc1 || '', popular: false },
    s?.tarif_pack_label2 && { label: s.tarif_pack_label2, prix: s.tarif_pack_prix2 || '', desc: s.tarif_pack_desc2 || '', popular: true },
    s?.tarif_pack_label3 && { label: s.tarif_pack_label3, prix: s.tarif_pack_prix3 || '', desc: s.tarif_pack_desc3 || '', popular: false },
    s?.tarif_pack_label4 && { label: s.tarif_pack_label4, prix: s.tarif_pack_prix4 || '', desc: s.tarif_pack_desc4 || '', popular: false },
  ].filter(Boolean) as { label: string; prix: string; desc: string; popular: boolean }[]

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Investissement</span>
            <h1 className="font-serif text-5xl md:text-6xl text-white mt-4 mb-6">
              Tarifs <span className="text-gold-400">transparents</span>
            </h1>
            <p className="text-noir-300 text-lg leading-relaxed">
              Sans engagement, sans frais cachés. Commencez par un cours d'essai gratuit.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cours à l'unité */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="bg-gradient-to-r from-gold-500/10 to-noir-900 border border-gold-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center shrink-0">
                  <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-xl">Cours individuel — 1 heure</h2>
                  <p className="text-noir-400 text-sm mt-1">Cours en tête-à-tête via Zoom ou Google Meet</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {INCLUS.slice(0, 3).map((item, i) => (
                      <span key={i} className="text-xs bg-noir-800 text-noir-300 px-2.5 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-5xl font-bold text-white mb-1">{s?.tarif_cours_1h || '22'}<span className="text-2xl text-noir-400"> €</span></div>
                <div className="text-noir-500 text-sm mb-4">par heure</div>
                <Link href="/reservation" className="btn-gold px-6 py-3">Réserver</Link>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Packs */}
      {packs.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <FadeUp className="text-center mb-10">
              <h2 className="font-serif text-3xl text-white">Packs d'heures</h2>
              <p className="text-noir-400 mt-2 text-sm">Économisez en achetant plusieurs heures à l'avance.</p>
            </FadeUp>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {packs.map((pack, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className={`relative rounded-2xl border p-6 text-center transition-all hover:-translate-y-1 h-full flex flex-col ${
                    pack.popular
                      ? 'bg-gradient-to-b from-gold-500/10 to-noir-900 border-gold-500/40 shadow-xl shadow-gold-500/10'
                      : 'bg-noir-900 border-noir-800 hover:border-noir-700'
                  }`}>
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gold-500 text-noir-950 text-[10px] font-bold px-3 py-1 rounded-full">Populaire</span>
                      </div>
                    )}
                    <div className="text-white font-semibold mb-2">{pack.label}</div>
                    <div className="text-4xl font-bold text-gold-400 my-3">{pack.prix}<span className="text-lg text-noir-400"> €</span></div>
                    {pack.desc && <p className="text-noir-400 text-xs mb-4 flex-1">{pack.desc}</p>}
                    <Link href="/packs" className={`block py-2.5 rounded-xl text-sm font-medium transition-all mt-auto ${
                      pack.popular ? 'btn-gold' : 'border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white'
                    }`}>
                      Acheter ce pack
                    </Link>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ce qui est inclus */}
      <section className="py-16 px-4 bg-noir-900/30">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-10">
            <h2 className="font-serif text-3xl text-white">Tout est inclus</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {INCLUS.map((item, i) => (
              <FadeUp key={i} delay={i * 0.06}>
                <div className="flex items-center gap-3 bg-noir-900 border border-noir-800 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-noir-200 text-sm">{item}</span>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Tableau comparatif */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-10">
            <h2 className="font-serif text-3xl text-white">Comparaison des formules</h2>
          </FadeUp>
          <FadeUp>
            <div className="overflow-x-auto rounded-2xl border border-noir-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-noir-800 bg-noir-900/50">
                    <th className="px-6 py-4 text-left text-noir-400 font-medium">Fonctionnalité</th>
                    <th className="px-4 py-4 text-center text-white font-semibold">Individuel</th>
                    <th className="px-4 py-4 text-center text-white font-semibold">Atelier</th>
                    <th className="px-4 py-4 text-center text-white font-semibold">Masterclass</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARAISON.map((row, i) => (
                    <tr key={i} className="border-b border-noir-800/50 hover:bg-noir-800/20 transition-colors">
                      <td className="px-6 py-3.5 text-noir-300">{row.feature}</td>
                      {(['individuel', 'atelier', 'masterclass'] as const).map(col => (
                        <td key={col} className="px-4 py-3.5 text-center">
                          {row[col]
                            ? <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24" className="mx-auto"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="18" height="18" fill="none" stroke="#404070" strokeWidth="2" viewBox="0 0 24 24" className="mx-auto"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <FadeUp>
          <div className="max-w-xl mx-auto">
            <h2 className="font-serif text-3xl text-white mb-4">Commencez gratuitement</h2>
            <p className="text-noir-400 mb-8">Premier cours d'essai offert — 1 heure, sans engagement.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/essai" className="btn-gold text-base px-8 py-4">Cours d'essai gratuit</Link>
              <Link href="/cadeau" className="border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white px-8 py-4 rounded-2xl text-base transition-all">
                Offrir un bon cadeau
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      <PublicFooter />
    </div>
  )
}