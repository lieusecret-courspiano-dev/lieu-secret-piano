'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Instagram, Facebook, Youtube, ChevronRight, CheckCircle, Calendar, Clock, Users, ArrowRight } from 'lucide-react'
import { formatDateLocal, formatTime } from '@/lib/utils'
import { DateTime } from 'luxon'

interface Settings {
  site_title: string
  hero_title: string
  hero_subtitle: string
  contact_email: string
  phone: string
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
}

interface Event {
  id: string
  title: string
  description: string | null
  type: string
  date_heure: string
  duration_minutes: number
  max_spots: number | null
  spots_remaining: number
  price: number
  is_free: boolean
  is_featured: boolean
  zoom_link: string | null
}

export default function AccueilPage() {
  const [settings, setSettings]       = useState<Settings | null>(null)
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [timezone]                    = useState('Europe/Paris')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {})

    fetch('/api/events')
      .then(r => r.json())
      .then((data: Event[]) => {
        if (Array.isArray(data)) {
          const featured = data.find(e => e.is_featured) || null
          setFeaturedEvent(featured)
        }
      })
      .catch(() => {})
  }, [])

  const email     = settings?.contact_email || 'contact@lieusecret-courspiano.fr'
  const instagram = settings?.instagram || ''
  const facebook  = settings?.facebook  || ''
  const youtube   = settings?.youtube   || ''
  const tiktok    = settings?.tiktok    || ''

  const typeLabel: Record<string, string> = {
    cours:      'Cours collectif',
    atelier:    'Atelier',
    evenement:  'Evenement',
    masterclass:'Masterclass',
  }

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100 overflow-x-hidden">

      {/* ── NAVIGATION ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-noir-950/90 backdrop-blur-md border-b border-noir-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</span>
          </div>

          {/* Nav desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#apropos"     className="text-sm text-noir-400 hover:text-gold-400 transition-colors">A propos</a>
            <a href="#offres"      className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Offres</a>
            <a href="#evenement"   className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Evenement</a>
            <a href="#contact"     className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Contact</a>
            <Link href="/" className="btn-gold text-sm px-5 py-2">
              Reserver un cours
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            className="md:hidden text-noir-400 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-noir-900 border-t border-noir-800 px-6 py-4 space-y-3">
            {[
              { href: '#apropos',   label: 'A propos' },
              { href: '#offres',    label: 'Offres' },
              { href: '#evenement', label: 'Evenement' },
              { href: '#contact',   label: 'Contact' },
            ].map(item => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className="block text-sm text-noir-300 hover:text-gold-400 transition-colors py-1">
                {item.label}
              </a>
            ))}
            <Link href="/" className="btn-gold w-full text-center block mt-2" onClick={() => setMenuOpen(false)}>
              Reserver un cours
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Photo de piano en fond */}
        <div className="absolute inset-0">
          <Image
            src="/piano-hero.jpg"
            alt="Touches de piano"
            fill
            className="object-cover object-center opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-noir-950/60 via-noir-950/70 to-noir-950" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Ligne décorative */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-gold-500/40" />
            <span className="text-gold-500/70 text-xs tracking-widest uppercase">Ecole de Piano en Ligne</span>
            <div className="h-px w-16 bg-gold-500/40" />
          </div>

          <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight mb-6">
            {settings?.hero_title || "L'art du piano,"}
            <br />
            <span className="text-gold-400">a votre rythme</span>
          </h1>

          <p className="text-noir-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {settings?.hero_subtitle || 'Cours individuels, ateliers de groupe et masterclass en ligne. Reservez votre creneau en quelques secondes, depuis n\'importe ou dans le monde.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-gold text-base px-8 py-3.5 flex items-center justify-center gap-2">
              <Calendar size={18} />
              Reserver un creneau
            </Link>
            <a href="#offres" className="btn-outline text-base px-8 py-3.5 flex items-center justify-center gap-2">
              Decouvrir les offres
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 mt-16 pt-10 border-t border-noir-800/50">
            {[
              { num: '100%', label: 'En ligne' },
              { num: '1h',   label: 'Cours individuel' },
              { num: 'Monde entier', label: 'Fuseaux horaires' },
              { num: 'Tous niveaux', label: 'Debutant a avance' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-semibold text-gold-400 mb-1">{s.num}</div>
                <div className="text-xs text-noir-500 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-10 bg-gradient-to-b from-gold-500/40 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── EVENEMENT EN VEDETTE ────────────────────────────────── */}
      {featuredEvent && (
        <section id="evenement" className="py-16 px-6 bg-noir-900/50 border-y border-gold-500/15">
          <div className="max-w-4xl mx-auto">
            <div className="text-xs text-gold-500 uppercase tracking-widest mb-6 text-center">
              Evenement a ne pas manquer
            </div>

            <div className="bg-noir-900 border border-gold-500/30 rounded-2xl overflow-hidden">
              {/* Barre dorée en haut */}
              <div className="h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Infos */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs border border-gold-500/30 text-gold-400 rounded-full px-3 py-1">
                        {typeLabel[featuredEvent.type] || featuredEvent.type}
                      </span>
                      {featuredEvent.is_free ? (
                        <span className="text-xs border border-green-500/30 text-green-400 rounded-full px-3 py-1">Gratuit</span>
                      ) : (
                        <span className="text-xs border border-gold-500/30 text-gold-400 rounded-full px-3 py-1">
                          {featuredEvent.price.toFixed(2)} EUR
                        </span>
                      )}
                    </div>

                    <h2 className="font-serif text-3xl text-white mb-3">{featuredEvent.title}</h2>

                    {featuredEvent.description && (
                      <p className="text-noir-300 leading-relaxed mb-6">{featuredEvent.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm text-noir-400">
                        <Calendar size={14} className="text-gold-500 shrink-0" />
                        <span className="capitalize">{formatDateLocal(featuredEvent.date_heure, timezone)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-noir-400">
                        <Clock size={14} className="text-gold-500 shrink-0" />
                        <span>
                          {formatTime(featuredEvent.date_heure, timezone)} —{' '}
                          {formatTime(
                            DateTime.fromISO(featuredEvent.date_heure, { zone: 'utc' })
                              .plus({ minutes: featuredEvent.duration_minutes })
                              .toISO()!,
                            timezone
                          )}
                          {' '}({featuredEvent.duration_minutes} min)
                        </span>
                      </div>
                      {featuredEvent.max_spots !== null && (
                        <div className="flex items-center gap-3 text-sm text-noir-400">
                          <Users size={14} className="text-gold-500 shrink-0" />
                          <span>
                            {featuredEvent.spots_remaining <= 0
                              ? 'Complet'
                              : `${featuredEvent.spots_remaining} place${featuredEvent.spots_remaining > 1 ? 's' : ''} restante${featuredEvent.spots_remaining > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="shrink-0 w-full md:w-64">
                    <div className="bg-noir-800 border border-noir-700 rounded-xl p-6 text-center">
                      <div className="text-2xl font-serif text-gold-400 mb-1">
                        {featuredEvent.is_free ? 'Gratuit' : `${featuredEvent.price.toFixed(2)} EUR`}
                      </div>
                      <div className="text-xs text-noir-500 mb-6">
                        {featuredEvent.is_free ? 'Inscription libre' : 'Par participant'}
                      </div>

                      {featuredEvent.spots_remaining <= 0 && featuredEvent.max_spots !== null ? (
                        <div className="text-sm text-red-400 font-medium">Complet</div>
                      ) : (
                        <Link
                          href={`/?tab=evenements`}
                          className="btn-gold w-full flex items-center justify-center gap-2"
                        >
                          S'inscrire
                          <ArrowRight size={14} />
                        </Link>
                      )}

                      {featuredEvent.spots_remaining > 0 && featuredEvent.spots_remaining <= 3 && featuredEvent.max_spots !== null && (
                        <p className="text-xs text-red-400 mt-3">
                          Plus que {featuredEvent.spots_remaining} place{featuredEvent.spots_remaining > 1 ? 's' : ''} !
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── A PROPOS ───────────────────────────────────────────── */}
      <section id="apropos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">A propos</div>
              <h2 className="font-serif text-4xl text-white mb-6 leading-tight">
                Un espace musical<br />unique et bienveillant
              </h2>
              <p className="text-noir-300 leading-relaxed mb-6">
                Lieu Secret est une ecole de piano en ligne pensee pour tous les niveaux.
                Que vous soyez debutant curieux ou musicien confirme souhaitant progresser,
                nos cours s'adaptent a votre rythme et a vos objectifs.
              </p>
              <p className="text-noir-400 leading-relaxed mb-8">
                Chaque cours est une invitation a explorer la musique dans un cadre
                chaleureux et professionnel. La reservation est simple, rapide,
                et s'adapte a votre fuseau horaire ou que vous soyez dans le monde.
              </p>
              <div className="space-y-3">
                {[
                  'Cours 100% en ligne via Zoom ou Google Meet',
                  'Creneaux flexibles adaptes a votre emploi du temps',
                  'Gestion automatique des fuseaux horaires internationaux',
                  'Confirmation instantanee par email avec fichier calendrier (.ics)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={15} className="text-gold-500 mt-0.5 shrink-0" />
                    <span className="text-noir-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visuel avec photo piano */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-noir-800 aspect-[4/3] relative">
                <Image
                  src="/piano-hero.jpg"
                  alt="Touches de piano"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir-950/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="font-serif text-xl text-gold-400 tracking-widest">LIEU SECRET</div>
                  <div className="text-noir-400 text-xs tracking-widest mt-1">ECOLE DE PIANO EN LIGNE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OFFRES ─────────────────────────────────────────────── */}
      <section id="offres" className="py-24 px-6 bg-noir-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Nos offres</div>
            <h2 className="font-serif text-4xl text-white mb-4">Choisissez votre formule</h2>
            <p className="text-noir-400 max-w-xl mx-auto">
              Des cours adaptes a chaque profil, du debutant au musicien confirme.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title:    'Cours individuel',
                subtitle: 'Sur mesure',
                desc:     'Un cours dedie entierement a vous. Choisissez votre creneau, votre rythme, vos objectifs.',
                features: ['1h de cours en tete-a-tete', 'Creneau flexible', 'Suivi personnalise', 'Lien Zoom envoye par email'],
                cta:      'Reserver un creneau',
                href:     '/',
                highlight: true,
              },
              {
                title:    'Atelier de groupe',
                subtitle: 'Collectif',
                desc:     'Apprenez en groupe dans une ambiance conviviale. Ideal pour progresser ensemble.',
                features: ["Jusqu'a 8 participants", 'Theme defini a l\'avance', 'Echanges et partage', 'Gratuit ou payant'],
                cta:      'Voir les ateliers',
                href:     '/?tab=evenements',
                highlight: false,
              },
              {
                title:    'Masterclass',
                subtitle: 'Perfectionnement',
                desc:     'Poussez votre technique plus loin avec des exercices cibles et des conseils d\'expert.',
                features: ['Niveau intermediaire/avance', 'Technique approfondie', 'Petits groupes (6 max)', 'Enregistrement disponible'],
                cta:      'Voir les masterclass',
                href:     '/?tab=evenements',
                highlight: false,
              },
            ].map((offer, i) => (
              <div key={i} className={`card flex flex-col relative overflow-hidden ${offer.highlight ? 'border-gold-500/40' : ''}`}>
                {offer.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
                )}
                <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">{offer.subtitle}</div>
                <h3 className="font-serif text-xl text-white mb-3">{offer.title}</h3>
                <p className="text-noir-400 text-sm leading-relaxed mb-6">{offer.desc}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {offer.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-noir-300">
                      <span className="text-gold-500 text-xs">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={offer.href} className={offer.highlight ? 'btn-gold w-full text-center' : 'btn-outline w-full text-center'}>
                  {offer.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT CA MARCHE ──────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Simple et rapide</div>
          <h2 className="font-serif text-4xl text-white mb-16">Comment ca marche ?</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Choisissez votre fuseau', desc: "L'application detecte automatiquement votre pays et affiche les horaires adaptes." },
              { step: '02', title: 'Selectionnez un creneau', desc: 'Parcourez les disponibilites et cliquez sur le creneau qui vous convient.' },
              { step: '03', title: 'Remplissez le formulaire', desc: 'Nom, email, message optionnel. 30 secondes maximum.' },
              { step: '04', title: 'Confirmation instantanee', desc: 'Recevez un email avec le fichier .ics pour ajouter le cours a votre agenda.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-gold-500/20 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-xs text-gold-500/40 font-mono mb-3">{s.step}</div>
                  <div className="w-8 h-px bg-gold-500/30 mx-auto mb-4" />
                  <h4 className="text-white font-medium text-sm mb-2">{s.title}</h4>
                  <p className="text-noir-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link href="/" className="btn-gold text-base px-8 py-3.5 inline-flex items-center gap-2">
              <Calendar size={18} />
              Commencer maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-noir-900/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden border border-gold-500/20">
            <Image
              src="/piano-hero.jpg"
              alt="Piano"
              fill
              className="object-cover opacity-10"
            />
            <div className="relative z-10 p-12">
              <div className="h-px w-16 bg-gold-500/40 mx-auto mb-8" />
              <h2 className="font-serif text-4xl text-white mb-4">Pret(e) a commencer ?</h2>
              <p className="text-noir-400 mb-8 max-w-md mx-auto">
                Reservez votre premier cours des maintenant. Aucun engagement, annulation libre.
              </p>
              <Link href="/" className="btn-gold text-base px-10 py-4 inline-flex items-center gap-2">
                <Calendar size={18} />
                Voir les creneaux disponibles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────────── */}
      <section id="contact" className="py-16 px-6 border-t border-noir-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Contact</div>
          <h2 className="font-serif text-3xl text-white mb-8">Une question ?</h2>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-lg mb-8"
          >
            <Mail size={18} />
            {email}
          </a>

          {(instagram || facebook || youtube || tiktok) && (
            <div className="flex justify-center gap-6 mt-6">
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-noir-400 hover:text-gold-400 transition-colors text-sm">
                  <Instagram size={16} /> Instagram
                </a>
              )}
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-noir-400 hover:text-gold-400 transition-colors text-sm">
                  <Facebook size={16} /> Facebook
                </a>
              )}
              {youtube && (
                <a href={youtube} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-noir-400 hover:text-gold-400 transition-colors text-sm">
                  <Youtube size={16} /> YouTube
                </a>
              )}
              {tiktok && (
                <a href={tiktok} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-noir-400 hover:text-gold-400 transition-colors text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
                  TikTok
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-noir-800 bg-noir-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-px h-4 bg-gold-500" />
            <span className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</span>
            <span className="text-noir-600 text-xs">— Ecole de Piano en Ligne</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Reservation</Link>
            <a href="#apropos" className="text-xs text-noir-500 hover:text-gold-400 transition-colors">A propos</a>
            <a href="#contact" className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Contact</a>
            <a href="/admin/login" className="text-xs text-noir-700 hover:text-noir-500 transition-colors">Admin</a>
          </div>
          <p className="text-xs text-noir-700">© {new Date().getFullYear()} Lieu Secret</p>
        </div>
      </footer>

    </div>
  )
}