'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Instagram, Facebook, Youtube, ChevronRight, CheckCircle, Calendar, Clock, Users, ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import ContactModal from '@/components/ContactModal'
import { formatDateLocal, formatTime } from '@/lib/utils'
import { DateTime } from 'luxon'

interface Settings {
  site_title: string
  hero_title: string
  hero_title2: string
  hero_subtitle: string
  contact_email: string
  phone: string
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  whatsapp: string
  apropos_titre: string
  apropos_texte1: string
  apropos_texte2: string
  apropos_point1: string
  apropos_point2: string
  apropos_point3: string
  apropos_point4: string
  offres_titre: string
  offres_sous_titre: string
  offre1_titre: string
  offre1_sous: string
  offre1_desc: string
  offre1_btn: string
  offre1_f1: string
  offre1_f2: string
  offre1_f3: string
  offre1_f4: string
  offre2_titre: string
  offre2_sous: string
  offre2_desc: string
  offre2_btn: string
  offre2_f1: string
  offre2_f2: string
  offre2_f3: string
  offre2_f4: string
  offre3_titre: string
  offre3_sous: string
  offre3_desc: string
  offre3_btn: string
  offre3_f1: string
  offre3_f2: string
  offre3_f3: string
  offre3_f4: string
  cta_titre: string
  cta_sous_titre: string
  stats_label1: string
  stats_label2: string
  stats_label3: string
  stats_label4: string
  hero_btn1: string
  hero_btn2: string
  steps_label: string
  steps_titre: string
  // Professeur
  prof_nom: string
  prof_titre: string
  prof_photo: string
  prof_bio: string
  prof_parcours: string
  prof_pedagogie: string
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

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  )
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Skeleton loader ────────────────────────────────────────
function SkeletonBlock({ w = 'w-full', h = 'h-4', className = '' }: { w?: string; h?: string; className?: string }) {
  return <div className={`${w} ${h} bg-noir-800/60 rounded-lg animate-pulse ${className}`} />
}

export default function AccueilPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null)
  const [medias, setMedias] = useState([] as { id: string; type: string; titre: string | null; description: string | null; url: string; auteur: string | null }[])
  const [menuOpen, setMenuOpen] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const timezone = 'Europe/Paris'

  useEffect(() => {
    window.scrollTo(0, 0)
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => { setSettings(data); setSettingsLoaded(true) })
      .catch(() => setSettingsLoaded(true))
    fetch('/api/events')
      .then(r => r.json())
      .then((data: Event[]) => {
        if (Array.isArray(data)) setFeaturedEvent(data.find(e => e.is_featured) || null)
      })
      .catch(() => {})
    fetch('/api/medias')
      .then(r => r.json())
      .then(data => setMedias(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const email    = settings?.contact_email || ''
  const phone    = settings?.phone     || ''
  const whatsapp = settings?.whatsapp  || ''
  const instagram = settings?.instagram || ''
  const facebook  = settings?.facebook  || ''
  const youtube   = settings?.youtube   || ''
  const tiktok    = settings?.tiktok    || ''

  const typeLabel: Record<string, string> = {
    cours:       'Cours collectif',
    atelier:     'Atelier',
    evenement:   'Événement',
    masterclass: 'Masterclass',
  }

  const socialLinks = [
    { href: instagram, icon: <Instagram size={15} />, label: 'Instagram' },
    { href: facebook,  icon: <Facebook  size={15} />, label: 'Facebook'  },
    { href: youtube,   icon: <Youtube   size={15} />, label: 'YouTube'   },
    { href: tiktok,    icon: <TikTokIcon size={15} />, label: 'TikTok'  },
  ].filter(s => !!s.href)

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
          <div className="hidden md:flex items-center gap-6">
            <a href="#apropos"       className="text-sm text-noir-400 hover:text-gold-400 transition-colors">À propos</a>
            <a href="#professeur"    className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Votre professeur</a>
            <a href="#offres"        className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Offres</a>
            <a href="/reservation?tab=evenements" className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Événements</a>
            <a href="/inscription"   className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Inscription</a>
            <a href="#temoignages"   className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Témoignages</a>
            <a href="#contact"       className="text-sm text-noir-400 hover:text-gold-400 transition-colors">Contact</a>
            <div className="flex items-center gap-2 border-l border-noir-800 pl-4">
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="text-noir-400 hover:text-gold-400 transition-colors p-1" title={s.label} aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
            <ThemeToggle />
            <Link href="/reservation" className="btn-gold text-sm px-5 py-2">Réserver un cours</Link>
          </div>

          {/* Burger mobile */}
          <button className="md:hidden text-noir-400 hover:text-white transition-colors" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden bg-noir-900 border-t border-noir-800 px-6 py-4 space-y-3">
            {[
              { href: '#apropos',                    label: 'À propos' },
              { href: '#professeur',                 label: 'Votre professeur' },
              { href: '#offres',                     label: 'Offres' },
              { href: '/reservation?tab=evenements', label: 'Événements' },
              { href: '/inscription',                label: 'Inscription' },
              { href: '#temoignages',                label: 'Témoignages & Médias' },
              { href: '#contact',                    label: 'Contact' },
            ].map(item => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className="block text-sm text-noir-300 hover:text-gold-400 transition-colors py-1">
                {item.label}
              </a>
            ))}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4 pt-2 border-t border-noir-800">
                {socialLinks.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-noir-400 hover:text-gold-400 transition-colors"
                    onClick={() => setMenuOpen(false)}>
                    {s.icon}<span>{s.label}</span>
                  </a>
                ))}
              </div>
            )}
            <div className="py-2"><ThemeToggle /></div>
            <Link href="/reservation" className="btn-gold w-full text-center block mt-2" onClick={() => setMenuOpen(false)}>
              Réserver un cours
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/piano-hero.jpg" alt="Touches de piano" fill className="object-cover object-center opacity-20" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-noir-950/60 via-noir-950/70 to-noir-950" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-gold-500/40" />
            <span className="text-gold-500/70 text-xs tracking-widest uppercase">École de Piano en Ligne</span>
            <div className="h-px w-16 bg-gold-500/40" />
          </div>

          {/* Skeleton ou contenu réel */}
          {!settingsLoaded ? (
            <div className="space-y-6 flex flex-col items-center">
              <SkeletonBlock w="w-96" h="h-14" />
              <SkeletonBlock w="w-72" h="h-14" />
              <SkeletonBlock w="w-2/3" h="h-5" className="mt-2" />
              <SkeletonBlock w="w-1/2" h="h-5" />
              <div className="flex gap-4 mt-4">
                <SkeletonBlock w="w-44" h="h-12" />
                <SkeletonBlock w="w-44" h="h-12" />
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight mb-6">
                {settings?.hero_title}
                <br />
                <span className="text-gold-400">{settings?.hero_title2}</span>
              </h1>
              <p className="text-noir-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                {settings?.hero_subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/reservation" className="btn-gold text-base px-8 py-3.5 flex items-center justify-center gap-2">
                  <Calendar size={18} />
                  {settings?.hero_btn1}
                </Link>
                <a href="#offres" className="btn-outline text-base px-8 py-3.5 flex items-center justify-center gap-2">
                  {settings?.hero_btn2}
                  <ChevronRight size={16} />
                </a>
              </div>
            </>
          )}

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 mt-16 pt-10 border-t border-noir-800/50">
            {!settingsLoaded ? (
              [1,2,3,4].map(i => (
                <div key={i} className="text-center space-y-2">
                  <SkeletonBlock w="w-16" h="h-6" />
                  <SkeletonBlock w="w-20" h="h-3" />
                </div>
              ))
            ) : (
              [
                settings?.stats_label1,
                settings?.stats_label2,
                settings?.stats_label3,
                settings?.stats_label4,
              ].filter(Boolean).map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-semibold text-gold-400 mb-1">{s!.split(' ')[0]}</div>
                  <div className="text-xs text-noir-500 uppercase tracking-wider">{s!.split(' ').slice(1).join(' ')}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-10 bg-gradient-to-b from-gold-500/40 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── BANNIÈRE ÉVÉNEMENT EN VEDETTE ─────────────────────── */}
      {featuredEvent && (
        <section id="evenement" className="py-16 px-6 bg-noir-900/50 border-y border-gold-500/15">
          <div className="max-w-4xl mx-auto">
            <div className="text-xs text-gold-500 uppercase tracking-widest mb-6 text-center">
              Événement à ne pas manquer
            </div>
            <div className="bg-noir-900 border border-gold-500/30 rounded-2xl overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs border border-gold-500/30 text-gold-400 rounded-full px-3 py-1">
                        {typeLabel[featuredEvent.type] || featuredEvent.type}
                      </span>
                      {featuredEvent.is_free ? (
                        <span className="text-xs border border-green-500/30 text-green-400 rounded-full px-3 py-1">Gratuit</span>
                      ) : (
                        <span className="text-xs border border-gold-500/30 text-gold-400 rounded-full px-3 py-1">{featuredEvent.price.toFixed(2)} EUR</span>
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
                              .plus({ minutes: featuredEvent.duration_minutes }).toISO()!,
                            timezone
                          )}{' '}({featuredEvent.duration_minutes} min)
                        </span>
                      </div>
                      {featuredEvent.max_spots !== null && (
                        <div className="flex items-center gap-3 text-sm text-noir-400">
                          <Users size={14} className="text-gold-500 shrink-0" />
                          <span>
                            {featuredEvent.spots_remaining <= 0 ? 'Complet'
                              : `${featuredEvent.spots_remaining} place${featuredEvent.spots_remaining > 1 ? 's' : ''} restante${featuredEvent.spots_remaining > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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
                        <a href="/reservation?tab=evenements" className="btn-gold w-full flex items-center justify-center gap-2">
                          S&apos;inscrire <ArrowRight size={14} />
                        </a>
                      )}
                      {featuredEvent.spots_remaining > 0 && featuredEvent.spots_remaining <= 3 && featuredEvent.max_spots !== null && (
                        <p className="text-xs text-red-400 mt-3">Plus que {featuredEvent.spots_remaining} place{featuredEvent.spots_remaining > 1 ? 's' : ''} !</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── À PROPOS ──────────────────────────────────────────── */}
      <section id="apropos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">À propos</div>
              {!settingsLoaded ? (
                <div className="space-y-3">
                  <SkeletonBlock w="w-3/4" h="h-10" />
                  <SkeletonBlock w="w-full" h="h-4" />
                  <SkeletonBlock w="w-5/6" h="h-4" />
                </div>
              ) : (
                <>
                  <h2 className="font-serif text-4xl text-white mb-6 leading-tight">{settings?.apropos_titre}</h2>
                  <p className="text-noir-300 leading-relaxed mb-6">{settings?.apropos_texte1}</p>
                  <p className="text-noir-400 leading-relaxed mb-8">{settings?.apropos_texte2}</p>
                  <div className="space-y-3">
                    {[settings?.apropos_point1, settings?.apropos_point2, settings?.apropos_point3, settings?.apropos_point4]
                      .filter(Boolean).map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle size={15} className="text-gold-500 mt-0.5 shrink-0" />
                          <span className="text-noir-300 text-sm">{item}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-noir-800 aspect-[4/3] relative">
                <Image src="/piano-hero.jpg" alt="Piano" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-noir-950/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="font-serif text-xl text-gold-400 tracking-widest">LIEU SECRET</div>
                  <div className="text-noir-400 text-xs tracking-widest mt-1">ÉCOLE DE PIANO EN LIGNE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VOTRE PROFESSEUR ──────────────────────────────────── */}
      <section id="professeur" className="py-24 px-6 bg-noir-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Votre professeur</div>
            {!settingsLoaded ? (
              <div className="flex flex-col items-center gap-3">
                <SkeletonBlock w="w-48" h="h-10" />
                <SkeletonBlock w="w-64" h="h-4" />
              </div>
            ) : (
              <>
                <h2 className="font-serif text-4xl text-white mb-4">{settings?.prof_nom || 'Votre professeur'}</h2>
                {settings?.prof_titre && <p className="text-gold-400 text-sm tracking-widest uppercase">{settings.prof_titre}</p>}
              </>
            )}
          </div>

          {!settingsLoaded ? (
            <div className="grid md:grid-cols-2 gap-16 items-start">
              <div className="flex justify-center">
                <SkeletonBlock w="w-72" h="h-96" className="rounded-2xl" />
              </div>
              <div className="space-y-4">
                <SkeletonBlock w="w-full" h="h-4" />
                <SkeletonBlock w="w-5/6" h="h-4" />
                <SkeletonBlock w="w-full" h="h-4" />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-16 items-start">
              {/* Photo */}
              <div className="flex justify-center">
                {settings?.prof_photo ? (
                  <div className="relative w-72 h-96 rounded-2xl overflow-hidden border border-gold-500/20 shadow-2xl">
                    <img src={settings.prof_photo} alt={settings.prof_nom || 'Professeur'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-noir-950/60 to-transparent" />
                  </div>
                ) : (
                  <div className="w-72 h-96 rounded-2xl border border-noir-800 bg-noir-900 flex flex-col items-center justify-center gap-4">
                    <svg width="48" height="48" fill="none" stroke="#f59e0b" strokeWidth="1" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    <p className="text-noir-500 text-xs text-center px-4">Ajoutez votre photo depuis l&apos;espace admin → Paramètres</p>
                  </div>
                )}
              </div>

              {/* Textes */}
              <div className="space-y-8">
                {settings?.prof_bio && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-px bg-gold-500" />
                      <span className="text-gold-500 text-xs tracking-widest uppercase">Biographie</span>
                    </div>
                    <p className="text-noir-300 leading-relaxed whitespace-pre-line">{settings.prof_bio}</p>
                  </div>
                )}
                {settings?.prof_parcours && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-px bg-gold-500" />
                      <span className="text-gold-500 text-xs tracking-widest uppercase">Parcours</span>
                    </div>
                    <p className="text-noir-300 leading-relaxed whitespace-pre-line">{settings.prof_parcours}</p>
                  </div>
                )}
                {settings?.prof_pedagogie && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-px bg-gold-500" />
                      <span className="text-gold-500 text-xs tracking-widest uppercase">Pédagogie</span>
                    </div>
                    <p className="text-noir-300 leading-relaxed whitespace-pre-line">{settings.prof_pedagogie}</p>
                  </div>
                )}
                {!settings?.prof_bio && !settings?.prof_parcours && !settings?.prof_pedagogie && (
                  <div className="text-center py-8">
                    <p className="text-noir-500 text-sm">Complétez votre profil depuis l&apos;espace admin → Paramètres</p>
                  </div>
                )}
                <div className="pt-4">
                  <Link href="/reservation" className="btn-gold inline-flex items-center gap-2">
                    <Calendar size={16} />
                    Réserver un cours
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── OFFRES ────────────────────────────────────────────── */}
      <section id="offres" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Nos offres</div>
            {!settingsLoaded ? (
              <div className="flex flex-col items-center gap-3">
                <SkeletonBlock w="w-64" h="h-10" />
                <SkeletonBlock w="w-80" h="h-4" />
              </div>
            ) : (
              <>
                <h2 className="font-serif text-4xl text-white mb-4">{settings?.offres_titre}</h2>
                <p className="text-noir-400 max-w-xl mx-auto">{settings?.offres_sous_titre}</p>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {!settingsLoaded ? (
              [1,2,3].map(i => <div key={i} className="card"><SkeletonBlock w="w-full" h="h-64" /></div>)
            ) : (
              [
                {
                  title: settings?.offre1_titre, subtitle: settings?.offre1_sous, desc: settings?.offre1_desc,
                  features: [settings?.offre1_f1, settings?.offre1_f2, settings?.offre1_f3, settings?.offre1_f4],
                  cta: settings?.offre1_btn, href: '/reservation', highlight: true,
                },
                {
                  title: settings?.offre2_titre, subtitle: settings?.offre2_sous, desc: settings?.offre2_desc,
                  features: [settings?.offre2_f1, settings?.offre2_f2, settings?.offre2_f3, settings?.offre2_f4],
                  cta: settings?.offre2_btn, href: '/reservation?tab=evenements', highlight: false,
                },
                {
                  title: settings?.offre3_titre, subtitle: settings?.offre3_sous, desc: settings?.offre3_desc,
                  features: [settings?.offre3_f1, settings?.offre3_f2, settings?.offre3_f3, settings?.offre3_f4],
                  cta: settings?.offre3_btn, href: '/reservation?tab=evenements', highlight: false,
                },
              ].map((offer, i) => (
                <div key={i} className={`card flex flex-col relative overflow-hidden ${offer.highlight ? 'border-gold-500/40' : ''}`}>
                  {offer.highlight && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />}
                  <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">{offer.subtitle}</div>
                  <h3 className="font-serif text-xl text-white mb-3">{offer.title}</h3>
                  <p className="text-noir-400 text-sm leading-relaxed mb-6">{offer.desc}</p>
                  <ul className="space-y-2 mb-8 flex-1">
                    {offer.features.filter(Boolean).map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-noir-300">
                        <span className="text-gold-500 text-xs">—</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link href={offer.href!} className={offer.highlight ? 'btn-gold w-full text-center' : 'btn-outline w-full text-center'}>
                    {offer.cta}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-noir-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">{settings?.steps_label || 'Simple et rapide'}</div>
          <h2 className="font-serif text-4xl text-white mb-16">{settings?.steps_titre || 'Comment ça marche ?'}</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Choisissez votre fuseau', desc: "L'application détecte automatiquement votre pays et affiche les horaires adaptés." },
              { step: '02', title: 'Sélectionnez un créneau', desc: 'Parcourez les disponibilités et cliquez sur le créneau qui vous convient.' },
              { step: '03', title: 'Remplissez le formulaire', desc: 'Nom, email, message optionnel. 30 secondes maximum.' },
              { step: '04', title: 'Confirmation instantanée', desc: 'Recevez un email avec le fichier .ics pour ajouter le cours à votre agenda.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                {i < 3 && <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-gold-500/20 to-transparent z-0" />}
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
            <Link href="/reservation" className="btn-gold text-base px-8 py-3.5 inline-flex items-center gap-2">
              <Calendar size={18} />{settings?.hero_btn1 || 'Commencer maintenant'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES & MÉDIAS ──────────────────────────────── */}
      <section id="temoignages" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Témoignages & Médias</div>
            <h2 className="font-serif text-4xl text-white mb-4">Ce que disent nos élèves</h2>
            <p className="text-noir-400 max-w-xl mx-auto">Découvrez les retours de nos élèves et nos contenus musicaux.</p>
          </div>
          {medias.length === 0 ? (
            <div className="text-center py-12 text-noir-500">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <p className="text-sm">Les témoignages et médias seront bientôt disponibles.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {medias.filter(m => m.type === 'temoignage').length > 0 && (
                <div>
                  <div className="text-gold-500 text-xs tracking-widest uppercase mb-6 text-center">Témoignages</div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {medias.filter(m => m.type === 'temoignage').map(m => (
                      <div key={m.id} className="card">
                        <p className="text-noir-300 text-sm leading-relaxed mb-4 italic">&ldquo;{m.description || m.url}&rdquo;</p>
                        {m.auteur && <p className="text-gold-400 text-sm font-medium">{m.auteur}</p>}
                        {m.titre  && <p className="text-noir-500 text-xs">{m.titre}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {medias.filter(m => m.type === 'video').length > 0 && (
                <div>
                  <div className="text-gold-500 text-xs tracking-widest uppercase mb-6 text-center">Vidéos</div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {medias.filter(m => m.type === 'video').map(m => {
                      const ytMatch  = m.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
                      const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : m.url
                      return (
                        <div key={m.id}>
                          <div className="aspect-video rounded-xl overflow-hidden border border-noir-800">
                            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={m.titre || 'Vidéo'} />
                          </div>
                          {m.titre && <p className="text-noir-300 text-sm mt-2">{m.titre}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {medias.filter(m => m.type === 'photo').length > 0 && (
                <div>
                  <div className="text-gold-500 text-xs tracking-widest uppercase mb-6 text-center">Photos</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {medias.filter(m => m.type === 'photo').map(m => (
                      <div key={m.id} className="aspect-square rounded-xl overflow-hidden border border-noir-800">
                        <img src={m.url} alt={m.titre || ''} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-noir-900/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden border border-gold-500/20">
            <Image src="/piano-hero.jpg" alt="Piano" fill className="object-cover opacity-10" />
            <div className="relative z-10 p-12">
              <div className="h-px w-16 bg-gold-500/40 mx-auto mb-8" />
              <h2 className="font-serif text-4xl text-white mb-4">{settings?.cta_titre || 'Prêt(e) à commencer ?'}</h2>
              <p className="text-noir-400 mb-8 max-w-md mx-auto">{settings?.cta_sous_titre || 'Réservez votre premier cours dès maintenant.'}</p>
              {whatsapp ? (
                <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn-gold text-base px-10 py-4 inline-flex items-center gap-2">
                  <WhatsAppIcon size={18} />Nous contacter sur WhatsApp
                </a>
              ) : (
                <button onClick={() => setShowContact(true)} className="btn-gold text-base px-10 py-4 inline-flex items-center gap-2">
                  <Mail size={18} />Nous contacter
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────────── */}
      <section id="contact" className="py-16 px-6 border-t border-noir-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Contact</div>
          <h2 className="font-serif text-3xl text-white mb-8">Une question ?</h2>
          <div className="flex flex-col items-center gap-3 mb-8">
            {email    && <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-lg"><Mail size={18} /> {email}</a>}
            {phone    && <a href={`tel:${phone}`}    className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors">{phone}</a>}
            {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors text-sm"><WhatsAppIcon size={16} /> WhatsApp</a>}
          </div>
          {(instagram || facebook || youtube || tiktok) && (
            <div className="flex justify-center flex-wrap gap-6 mt-6">
              {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-noir-400 hover:text-gold-400 transition-colors text-sm"><Instagram size={16} /> Instagram</a>}
              {facebook  && <a href={facebook}  target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-noir-400 hover:text-gold-400 transition-colors text-sm"><Facebook  size={16} /> Facebook</a>}
              {youtube   && <a href={youtube}   target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-noir-400 hover:text-gold-400 transition-colors text-sm"><Youtube   size={16} /> YouTube</a>}
              {tiktok    && <a href={tiktok}    target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-noir-400 hover:text-gold-400 transition-colors text-sm"><TikTokIcon size={16} /> TikTok</a>}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-noir-800 bg-noir-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-px h-4 bg-gold-500" />
            <span className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</span>
            <span className="text-noir-600 text-xs">— École de Piano en Ligne</span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/reservation"  className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Réservation</Link>
            <a href="#apropos"         className="text-xs text-noir-500 hover:text-gold-400 transition-colors">À propos</a>
            <a href="#professeur"      className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Votre professeur</a>
            <a href="#temoignages"     className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Témoignages</a>
            <a href="#contact"         className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Contact</a>
            <a href="/admin/login"     className="text-xs text-noir-700 hover:text-noir-500 transition-colors">Admin</a>
          </div>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="text-noir-500 hover:text-gold-400 transition-colors" title={s.label} aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          )}
          <p className="text-xs text-noir-700">© {new Date().getFullYear()} Lieu Secret</p>
        </div>
      </footer>

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  )
}