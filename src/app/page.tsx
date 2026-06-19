'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import ContactModal from '@/components/ContactModal'

/* ─── Types ─── */
interface Settings {
  hero_title?: string; hero_title2?: string; hero_subtitle?: string
  contact_email?: string; instagram?: string; facebook?: string; youtube?: string; tiktok?: string
  offres_titre?: string; offres_sous_titre?: string
  offre1_titre?: string; offre1_sous?: string; offre1_desc?: string; offre1_btn?: string
  offre1_f1?: string; offre1_f2?: string; offre1_f3?: string; offre1_f4?: string
  offre2_titre?: string; offre2_sous?: string; offre2_desc?: string; offre2_btn?: string
  offre2_f1?: string; offre2_f2?: string; offre2_f3?: string; offre2_f4?: string
  offre3_titre?: string; offre3_sous?: string; offre3_desc?: string; offre3_btn?: string
  offre3_f1?: string; offre3_f2?: string; offre3_f3?: string; offre3_f4?: string
  cta_titre?: string; cta_sous_titre?: string
  stats_label1?: string; stats_label2?: string; stats_label3?: string; stats_label4?: string
  hero_btn1?: string; steps_label?: string; steps_titre?: string
  prof_nom?: string; prof_titre?: string; prof_photo?: string; prof_bio?: string
  prof_vision?: string; prof_pedagogie?: string
  banner_actif?: string; banner_message?: string; banner_type?: string
  tarif_cours_1h?: string
  tarif_pack_label1?: string; tarif_pack_prix1?: string; tarif_pack_desc1?: string
  tarif_pack_label2?: string; tarif_pack_prix2?: string; tarif_pack_desc2?: string
  tarif_pack_label3?: string; tarif_pack_prix3?: string; tarif_pack_desc3?: string
  tarif_pack_label4?: string; tarif_pack_prix4?: string; tarif_pack_desc4?: string
}
interface EventItem {
  id: string; title: string; description: string | null; type: string
  price: number; is_free: boolean; is_featured: boolean
}
interface Temoignage {
  id: string; nom: string; note: number; commentaire: string; est_publie: boolean
}

/* ─── Helpers animation ─── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.7, delay }} className={className}>
      {children}
    </motion.div>
  )
}

function StarRating({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= note ? '#f59e0b' : 'none'} stroke={i <= note ? '#f59e0b' : '#3a3a5c'} strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function PianoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M7 4v8M10 4v5M14 4v8M17 4v5"/>
    </svg>
  )
}

/* ─── Données statiques ─── */
const FAQ_ITEMS = [
  { q: "Quel niveau faut-il pour commencer ?", a: "Aucun niveau requis. Nous accueillons les débutants complets comme les pianistes confirmés. Chaque parcours est adapté à votre niveau et vos objectifs." },
  { q: "Comment se déroulent les cours en ligne ?", a: "Les cours se déroulent via Zoom. Vous recevez le lien par email après réservation. Une connexion internet stable et un clavier ou piano suffisent." },
  { q: "Puis-je annuler ou reporter un cours ?", a: "Oui, vous pouvez annuler ou reporter jusqu'à 24h avant le cours sans frais. Au-delà, le cours est décompté de votre pack." },
  { q: "Quel matériel est nécessaire ?", a: "Un clavier ou piano (au moins 61 touches avec toucher dynamique recommandé), un ordinateur ou tablette avec caméra, et une connexion internet stable." },
  { q: "Comment fonctionne le cours d'essai gratuit ?", a: "Le cours d'essai dure 1 heure et est entièrement gratuit. Il permet de faire connaissance, évaluer votre niveau et définir vos objectifs musicaux." },
  { q: "Les cours sont-ils adaptés aux enfants ?", a: "Oui, nous accueillons les enfants à partir de 7 ans. Les cours sont adaptés à leur rythme d'apprentissage avec une pédagogie ludique et bienveillante." },
]

const STEPS = [
  { n: '01', title: 'Réservez votre essai', desc: "Choisissez un créneau disponible et réservez votre cours d'essai gratuit en quelques clics." },
  { n: '02', title: 'Rencontrez votre prof', desc: 'Lors du premier cours via Zoom, nous évaluons votre niveau et définissons ensemble vos objectifs musicaux.' },
  { n: '03', title: 'Progressez à votre rythme', desc: 'Suivez un programme personnalisé avec des cours réguliers, des ressources et un suivi de progression.' },
  { n: '04', title: 'Obtenez votre certificat', desc: 'Validez vos compétences et recevez un certificat officiel Lieu Secret à chaque étape franchie.' },
]

/* ─── Page principale ─── */
export default function AccueilPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [featuredEvent, setFeaturedEvent] = useState<EventItem | null>(null)
  const [temoignages, setTemoignages] = useState<Temoignage[]>([])
  const [showContact, setShowContact] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { setSettings(d); setSettingsLoaded(true) })
      .catch(() => setSettingsLoaded(true))

    fetch('/api/events')
      .then(r => r.json())
      .then((d: EventItem[]) => {
        if (Array.isArray(d)) setFeaturedEvent(d.find(e => e.is_featured) || null)
      })
      .catch(() => {})

    fetch('/api/temoignages')
      .then(r => r.json())
      .then((d: Temoignage[]) => {
        if (Array.isArray(d)) setTemoignages(d.filter(t => t.est_publie).slice(0, 6))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (temoignages.length < 2) return
    const t = setInterval(() => setTestimonialIdx((i: number) => (i + 1) % temoignages.length), 5000)
    return () => clearInterval(t)
  }, [temoignages.length])

  const s = settings

  const packs = [
    s?.tarif_pack_label1 && { label: s.tarif_pack_label1, prix: s.tarif_pack_prix1 || '', desc: s.tarif_pack_desc1 || '', popular: false },
    s?.tarif_pack_label2 && { label: s.tarif_pack_label2, prix: s.tarif_pack_prix2 || '', desc: s.tarif_pack_desc2 || '', popular: true },
    s?.tarif_pack_label3 && { label: s.tarif_pack_label3, prix: s.tarif_pack_prix3 || '', desc: s.tarif_pack_desc3 || '', popular: false },
    s?.tarif_pack_label4 && { label: s.tarif_pack_label4, prix: s.tarif_pack_prix4 || '', desc: s.tarif_pack_desc4 || '', popular: false },
  ].filter(Boolean) as { label: string; prix: string; desc: string; popular: boolean }[]

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100 overflow-x-hidden">
      <PublicNav settings={s || undefined} />

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/piano-hero.jpg" alt="Piano" fill className="object-cover object-center opacity-25" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-noir-950/40 via-noir-950/60 to-noir-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-noir-950/80 via-transparent to-noir-950/40" />
        </div>

        {/* Particules */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-gold-500/30"
              style={{ left: `${15 + i * 17}%`, top: `${25 + (i % 3) * 20}%` }}
              animate={{ y: [-15, 15, -15], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }} />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-gold-400 text-xs font-medium tracking-widest uppercase">École de Piano en Ligne</span>
          </motion.div>

          {/* Titre — masqué tant que settings non chargés pour éviter le flash */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: settingsLoaded ? 1 : 0, y: settingsLoaded ? 0 : 30 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[1.05] mb-6">
            {s?.hero_title || "L'art du piano,"}
            <br />
            <span className="text-gold-400">{s?.hero_title2 || 'à votre rythme'}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: settingsLoaded ? 1 : 0, y: settingsLoaded ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-noir-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {s?.hero_subtitle || 'Cours individuels, ateliers de groupe et masterclass via Zoom. Une pédagogie bienveillante pour tous les niveaux.'}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: settingsLoaded ? 1 : 0, y: settingsLoaded ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/essai"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-noir-950 font-semibold px-8 py-4 rounded-2xl transition-all duration-200 text-base shadow-2xl shadow-gold-500/30 hover:-translate-y-0.5 w-full sm:w-auto justify-center">
              <PianoIcon size={18} />
              Cours d'essai gratuit
            </Link>
            <Link href="/reservation"
              className="inline-flex items-center gap-2 border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white px-8 py-4 rounded-2xl transition-all duration-200 text-base hover:bg-noir-800/50 w-full sm:w-auto justify-center">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {s?.hero_btn1 || 'Réserver un cours'}
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: settingsLoaded ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { val: '100%', label: s?.stats_label1 || 'En ligne' },
              { val: '1h', label: s?.stats_label2 || 'Cours individuel' },
              { val: 'Monde', label: s?.stats_label3 || 'Entier' },
              { val: 'Tous', label: s?.stats_label4 || 'Niveaux' },
            ].map((stat, i) => (
              <div key={i} className="bg-noir-900/60 backdrop-blur border border-noir-800/60 rounded-2xl px-4 py-4 text-center">
                <div className="text-xl font-bold text-gold-400 mb-1">{stat.val}</div>
                <div className="text-noir-400 text-xs">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-6 h-10 border-2 border-noir-700 rounded-full flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-gold-500 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ══ ÉVÉNEMENT EN VEDETTE ══ */}
      {featuredEvent && (
        <section className="py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <FadeUp>
              <div className="relative bg-gradient-to-r from-gold-500/10 to-noir-900 border border-gold-500/30 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Événement en vedette</span>
                    <h3 className="text-white font-semibold text-base mt-0.5 truncate">{featuredEvent.title}</h3>
                    {featuredEvent.description && <p className="text-noir-400 text-sm mt-1 line-clamp-1">{featuredEvent.description}</p>}
                  </div>
                  <Link href="/reservation?tab=evenements"
                    className="btn-gold text-sm px-5 py-2.5 shrink-0 w-full sm:w-auto text-center">
                    {featuredEvent.is_free ? "Gratuit — S'inscrire" : `${featuredEvent.price} € — Réserver`}
                  </Link>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ══ COMMENT CA MARCHE ══ */}
      <section className="py-20 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-12 sm:mb-16">
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">{s?.steps_label || 'Simple et rapide'}</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mt-3">{s?.steps_titre || 'Comment ça marche ?'}</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="relative group bg-noir-900 border border-noir-800 rounded-2xl p-6 hover:border-gold-500/30 transition-all duration-300 hover:-translate-y-1 h-full">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gold-500/20 to-transparent z-10" />
                  )}
                  <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4 group-hover:bg-gold-500/20 transition-colors">
                    <span className="font-serif text-gold-400 text-base font-bold">{step.n}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">{step.title}</h3>
                  <p className="text-noir-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ OFFRES ══ */}
      <section id="offres" className="py-20 sm:py-24 px-4 bg-noir-900/30">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-12 sm:mb-16">
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Nos formules</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mt-3">{s?.offres_titre || 'Choisissez votre formule'}</h2>
            {s?.offres_sous_titre && <p className="text-noir-400 mt-4 max-w-xl mx-auto text-sm sm:text-base">{s.offres_sous_titre}</p>}
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                titre: s?.offre1_titre || 'Cours individuel', sous: s?.offre1_sous || 'Sur mesure',
                desc: s?.offre1_desc || 'Un cours dédié entièrement à vous, via Zoom.',
                btn: s?.offre1_btn || 'Réserver un créneau', href: '/reservation',
                features: [s?.offre1_f1, s?.offre1_f2, s?.offre1_f3, s?.offre1_f4].filter(Boolean) as string[],
                popular: false,
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v8M10 4v5M14 4v8M17 4v5"/></svg>,
              },
              {
                titre: s?.offre2_titre || 'Atelier de groupe', sous: s?.offre2_sous || 'Collectif',
                desc: s?.offre2_desc || 'Apprenez en groupe dans une ambiance conviviale via Zoom.',
                btn: s?.offre2_btn || 'Voir les ateliers', href: '/reservation?tab=evenements',
                features: [s?.offre2_f1, s?.offre2_f2, s?.offre2_f3, s?.offre2_f4].filter(Boolean) as string[],
                popular: true,
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              },
              {
                titre: s?.offre3_titre || 'Masterclass', sous: s?.offre3_sous || 'Perfectionnement',
                desc: s?.offre3_desc || 'Poussez votre technique plus loin en petit groupe via Zoom.',
                btn: s?.offre3_btn || 'Voir les masterclass', href: '/reservation?tab=evenements',
                features: [s?.offre3_f1, s?.offre3_f2, s?.offre3_f3, s?.offre3_f4].filter(Boolean) as string[],
                popular: false,
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
              },
            ].map((offre, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className={`relative flex flex-col h-full rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  offre.popular
                    ? 'bg-gradient-to-b from-gold-500/10 to-noir-900 border-gold-500/40 shadow-xl shadow-gold-500/10'
                    : 'bg-noir-900 border-noir-800 hover:border-noir-700'
                }`}>
                  {offre.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gold-500 text-noir-950 text-[10px] font-bold px-3 py-1 rounded-full">Populaire</span>
                    </div>
                  )}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${offre.popular ? 'bg-gold-500/20 text-gold-400' : 'bg-noir-800 text-noir-400'}`}>
                    {offre.icon}
                  </div>
                  <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest mb-1 block">{offre.sous}</span>
                  <h3 className="font-serif text-xl sm:text-2xl text-white mb-2">{offre.titre}</h3>
                  <p className="text-noir-400 text-sm mb-5 leading-relaxed">{offre.desc}</p>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {offre.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-noir-300">
                        <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={offre.href}
                    className={`text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                      offre.popular ? 'btn-gold' : 'border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white hover:bg-noir-800'
                    }`}>
                    {offre.btn}
                  </Link>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ VOTRE PROFESSEUR ══ */}
      {(s?.prof_nom || s?.prof_bio) && (
        <section id="apropos" className="py-20 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <FadeIn>
                <div className="relative max-w-sm mx-auto lg:max-w-none">
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-noir-900 border border-noir-800">
                    {s?.prof_photo ? (
                      <Image src={s.prof_photo} alt={s.prof_nom || 'Professeur'} fill className="object-cover" onError={() => {}} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-noir-700">
                        <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span className="text-xs text-noir-600 text-center px-4">Photo à configurer dans les paramètres admin</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-5 -right-5 bg-noir-900 border border-gold-500/30 rounded-2xl p-4 shadow-xl hidden sm:block">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center">
                        <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-white text-xs font-semibold">Pédagogie bienveillante</div>
                        <div className="text-noir-400 text-[10px]">Adaptée à chaque élève</div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeUp delay={0.2}>
                <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Votre professeur</span>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mt-3 mb-2">{s?.prof_nom || 'Votre professeur'}</h2>
                {s?.prof_titre && <p className="text-gold-400 text-sm mb-5">{s.prof_titre}</p>}
                {s?.prof_bio && <p className="text-noir-300 leading-relaxed mb-5 text-sm sm:text-base">{s.prof_bio}</p>}
                {s?.prof_vision && (
                  <div className="bg-noir-900/60 border border-noir-800 rounded-2xl p-5 mb-4">
                    <h4 className="text-gold-400 text-xs font-semibold mb-2 uppercase tracking-wider">Vision</h4>
                    <p className="text-noir-300 text-sm leading-relaxed">{s.prof_vision}</p>
                  </div>
                )}
                {s?.prof_pedagogie && (
                  <div className="bg-noir-900/60 border border-noir-800 rounded-2xl p-5 mb-7">
                    <h4 className="text-gold-400 text-xs font-semibold mb-2 uppercase tracking-wider">Pédagogie</h4>
                    <p className="text-noir-300 text-sm leading-relaxed">{s.prof_pedagogie}</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/essai" className="btn-gold text-center">Cours d'essai gratuit</Link>
                  <button onClick={() => setShowContact(true)}
                    className="border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-all">
                    Nous contacter
                  </button>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>
      )}

      {/* ══ TARIFS ══ */}
      <section id="tarifs" className="py-20 sm:py-24 px-4 bg-noir-900/30">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12 sm:mb-16">
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Investissement</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mt-3">Tarifs transparents</h2>
            <p className="text-noir-400 mt-3 text-sm">Sans engagement, sans frais cachés.</p>
          </FadeUp>

          <FadeUp className="mb-6">
            <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold text-base sm:text-lg">Cours individuel — 1 heure via Zoom</h3>
                <p className="text-noir-400 text-sm mt-1">Cours en tête-à-tête, programme personnalisé</p>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div>
                  <div className="text-3xl font-bold text-white">{s?.tarif_cours_1h || '22'} <span className="text-lg text-noir-400">€</span></div>
                  <div className="text-noir-500 text-xs">par heure</div>
                </div>
                <Link href="/reservation" className="btn-gold ml-auto sm:ml-0">Réserver</Link>
              </div>
            </div>
          </FadeUp>

          {packs.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {packs.map((pack, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className={`relative rounded-2xl border p-4 sm:p-5 text-center transition-all hover:-translate-y-1 h-full flex flex-col ${
                    pack.popular
                      ? 'bg-gradient-to-b from-gold-500/10 to-noir-900 border-gold-500/40 shadow-lg shadow-gold-500/10'
                      : 'bg-noir-900 border-noir-800 hover:border-noir-700'
                  }`}>
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gold-500 text-noir-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Populaire</span>
                      </div>
                    )}
                    <div className="text-white font-semibold text-sm mb-2">{pack.label}</div>
                    <div className="text-2xl sm:text-3xl font-bold text-gold-400 my-2">{pack.prix}<span className="text-sm text-noir-400"> €</span></div>
                    {pack.desc && <p className="text-noir-400 text-xs mb-4 flex-1">{pack.desc}</p>}
                    <Link href="/packs" className={`block py-2 rounded-xl text-xs sm:text-sm font-medium transition-all mt-auto ${
                      pack.popular ? 'btn-gold' : 'border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white'
                    }`}>
                      Acheter
                    </Link>
                  </div>
                </FadeUp>
              ))}
            </div>
          )}

          <FadeUp className="mt-6 text-center">
            <p className="text-noir-500 text-sm">
              Premier cours d'essai gratuit —{' '}
              <Link href="/essai" className="text-gold-400 hover:text-gold-300 underline">Commencer gratuitement</Link>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══ TÉMOIGNAGES ══ */}
      {temoignages.length > 0 && (
        <section className="py-20 sm:py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <FadeUp className="text-center mb-12 sm:mb-16">
              <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Témoignages</span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mt-3">Ce que disent nos élèves</h2>
            </FadeUp>

            <FadeIn className="mb-6">
              <AnimatePresence mode="wait">
                <motion.div key={testimonialIdx}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-gradient-to-br from-noir-900 to-noir-900/50 border border-gold-500/20 rounded-3xl p-7 sm:p-10 text-center">
                  <div className="flex justify-center mb-4">
                    <StarRating note={temoignages[testimonialIdx]?.note || 5} />
                  </div>
                  <blockquote className="text-white text-base sm:text-lg md:text-xl font-serif leading-relaxed mb-5 max-w-2xl mx-auto">
                    "{temoignages[testimonialIdx]?.commentaire}"
                  </blockquote>
                  <div className="text-gold-400 font-semibold text-sm">{temoignages[testimonialIdx]?.nom}</div>
                </motion.div>
              </AnimatePresence>
            </FadeIn>

            {temoignages.length > 1 && (
              <div className="flex justify-center gap-2 mb-10">
                {temoignages.map((_, i) => (
                  <button key={i} onClick={() => setTestimonialIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === testimonialIdx ? 'bg-gold-500 w-6' : 'bg-noir-700 hover:bg-noir-600 w-2'}`} />
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {temoignages.slice(0, 6).map((t, i) => (
                <FadeUp key={t.id} delay={i * 0.08}>
                  <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5 hover:border-noir-700 transition-all h-full flex flex-col">
                    <StarRating note={t.note} />
                    <p className="text-noir-300 text-sm leading-relaxed my-4 flex-1 line-clamp-5">"{t.commentaire}"</p>
                    <div className="text-gold-400 text-sm font-semibold">{t.nom}</div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FAQ ══ */}
      <section className="py-20 sm:py-24 px-4 bg-noir-900/30">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-12 sm:mb-16">
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Questions fréquentes</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mt-3">FAQ</h2>
          </FadeUp>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FadeUp key={i} delay={i * 0.04}>
                <div className={`border rounded-2xl overflow-hidden transition-all ${
                  faqOpen === i ? 'border-gold-500/30 bg-noir-900' : 'border-noir-800 bg-noir-900/50 hover:border-noir-700'
                }`}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left gap-4">
                    <span className={`font-medium text-sm sm:text-base ${faqOpen === i ? 'text-white' : 'text-noir-200'}`}>{item.q}</span>
                    <motion.span animate={{ rotate: faqOpen === i ? 45 : 0 }} transition={{ duration: 0.2 }}
                      className={`shrink-0 ${faqOpen === i ? 'text-gold-400' : 'text-noir-500'}`}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {faqOpen === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                        <div className="px-5 sm:px-6 pb-5 text-noir-400 text-sm leading-relaxed border-t border-noir-800 pt-4">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp className="mt-8 text-center">
            <p className="text-noir-500 text-sm">
              Vous avez d'autres questions ?{' '}
              <button onClick={() => setShowContact(true)} className="text-gold-400 hover:text-gold-300 underline">
                Contactez-nous
              </button>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="py-20 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="relative bg-gradient-to-br from-gold-500/10 via-noir-900 to-noir-900 border border-gold-500/20 rounded-3xl p-8 sm:p-12 md:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_70%)]" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-6 text-gold-400">
                  <PianoIcon size={26} />
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-4">
                  {s?.cta_titre || 'Prêt(e) à commencer ?'}
                </h2>
                <p className="text-noir-300 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                  {s?.cta_sous_titre || "Réservez votre premier cours dès maintenant. Premier cours d'essai offert."}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/essai" className="btn-gold text-base px-8 py-4 w-full sm:w-auto text-center shadow-2xl shadow-gold-500/30">
                    Cours d'essai gratuit
                  </Link>
                  <Link href="/reservation"
                    className="border border-noir-700 hover:border-gold-500/50 text-noir-300 hover:text-white px-8 py-4 rounded-2xl text-base transition-all w-full sm:w-auto text-center">
                    Voir les créneaux
                  </Link>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <PublicFooter settings={s || undefined} />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  )
}