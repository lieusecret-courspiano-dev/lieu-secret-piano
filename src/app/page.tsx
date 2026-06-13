'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Instagram, Facebook, Youtube, ChevronRight, CheckCircle, Calendar, Clock, Users, ArrowRight, AlertTriangle } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import ContactModal from '@/components/ContactModal'
import { formatDateLocal, formatTime } from '@/lib/utils'
import { DateTime } from 'luxon'

interface Settings {
  site_title: string; hero_title: string; hero_title2: string; hero_subtitle: string
  contact_email: string; phone: string; instagram: string; facebook: string; youtube: string; tiktok: string; whatsapp: string
  apropos_titre: string; apropos_texte1: string; apropos_texte2: string
  apropos_point1: string; apropos_point2: string; apropos_point3: string; apropos_point4: string
  offres_titre: string; offres_sous_titre: string
  offre1_titre: string; offre1_sous: string; offre1_desc: string; offre1_btn: string; offre1_f1: string; offre1_f2: string; offre1_f3: string; offre1_f4: string
  offre2_titre: string; offre2_sous: string; offre2_desc: string; offre2_btn: string; offre2_f1: string; offre2_f2: string; offre2_f3: string; offre2_f4: string
  offre3_titre: string; offre3_sous: string; offre3_desc: string; offre3_btn: string; offre3_f1: string; offre3_f2: string; offre3_f3: string; offre3_f4: string
  cta_titre: string; cta_sous_titre: string
  stats_label1: string; stats_label2: string; stats_label3: string; stats_label4: string
  hero_btn1: string; hero_btn2: string; steps_label: string; steps_titre: string
  prof_nom: string; prof_titre: string; prof_photo: string; prof_bio: string; prof_vision: string; prof_pedagogie: string
  banner_actif: string; banner_message: string; banner_type: string
  tarif_cours_1h: string; tarif_pack_label1: string; tarif_pack_prix1: string; tarif_pack_desc1: string
  tarif_pack_label2: string; tarif_pack_prix2: string; tarif_pack_desc2: string
  tarif_pack_label3: string; tarif_pack_prix3: string; tarif_pack_desc3: string
  tarif_pack_label4: string; tarif_pack_prix4: string; tarif_pack_desc4: string
}

interface EventItem {
  id: string; title: string; description: string | null; type: string; date_heure: string
  duration_minutes: number; max_spots: number | null; spots_remaining: number
  price: number; is_free: boolean; is_featured: boolean; zoom_link: string | null
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
}

function SkeletonBlock({ w = 'w-full', h = 'h-4', className = '' }: { w?: string; h?: string; className?: string }) {
  return <div className={w + ' ' + h + ' bg-noir-800/60 rounded-lg animate-pulse ' + className} />
}

export default function AccueilPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [featuredEvent, setFeaturedEvent] = useState<EventItem | null>(null)
  const [medias, setMedias] = useState([] as { id: string; type: string; titre: string | null; description: string | null; url: string; auteur: string | null }[])
  const [menuOpen, setMenuOpen] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [packModal, setPackModal] = useState<{ label: string; prix: string } | null>(null)
  const [packBuyForm, setPackBuyForm] = useState({ nom: '', email: '' })
  const [packBuyLoading, setPackBuyLoading] = useState(false)
  const [packBuyError, setPackBuyError] = useState('')

  function handleBuyPack(label: string, prix: string) {
    setPackModal({ label, prix })
    setPackBuyForm({ nom: '', email: '' })
    setPackBuyError('')
  }

  async function handlePackCheckout() {
    if (!packBuyForm.nom || !packBuyForm.email) { setPackBuyError('Nom et email requis'); return }
    if (!packModal) return
    setPackBuyLoading(true); setPackBuyError('')
    try {
      const heuresMatch = packModal.label.match(/(\d+)/)
      const heures = heuresMatch ? parseInt(heuresMatch[1]) : 5
      const res = await fetch('/api/pack/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_label: packModal.label, heures, montant: parseFloat(packModal.prix), acheteur_nom: packBuyForm.nom, acheteur_email: packBuyForm.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      window.location.href = data.url
    } catch (e: unknown) { setPackBuyError(e instanceof Error ? e.message : 'Erreur') }
    finally { setPackBuyLoading(false) }
  }
  const timezone = 'Europe/Paris'

  useEffect(() => {
    window.scrollTo(0, 0)
    fetch('/api/settings').then(r => r.json()).then(data => { setSettings(data); setSettingsLoaded(true) }).catch(() => setSettingsLoaded(true))
    fetch('/api/events').then(r => r.json()).then((data: EventItem[]) => { if (Array.isArray(data)) setFeaturedEvent(data.find(e => e.is_featured) || null) }).catch(() => {})
    fetch('/api/medias').then(r => r.json()).then(data => setMedias(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const email    = settings?.contact_email || ''
  const phone    = settings?.phone || ''
  const whatsapp = settings?.whatsapp || ''
  const instagram = settings?.instagram || ''
  const facebook  = settings?.facebook || ''
  const youtube   = settings?.youtube || ''
  const tiktok    = settings?.tiktok || ''

  const typeLabel = { cours: 'Cours collectif', atelier: 'Atelier', evenement: 'Événement', masterclass: 'Masterclass' }

  const bannerActif   = settings?.banner_actif === 'true' || settings?.banner_actif === '1' || (settings?.banner_actif as unknown) === true
  const bannerMessage = settings?.banner_message || ''
  const bannerType    = settings?.banner_type || 'info'
  const showBanner    = settingsLoaded && bannerActif && !!bannerMessage && !bannerDismissed

  // Mémoriser si la bannière a été fermée (par message)
  useEffect(() => {
    if (!bannerMessage) return
    try {
      const dismissed = localStorage.getItem('ls_banner_dismissed')
      // La bannière se réaffiche si le message a changé
      if (dismissed === bannerMessage) setBannerDismissed(true)
      else { setBannerDismissed(false); localStorage.removeItem('ls_banner_dismissed') }
    } catch {}
  }, [bannerMessage])
  const bannerColor   = bannerType === 'urgent' ? 'bg-red-900/90 border-red-500/50 text-red-100' : bannerType === 'success' ? 'bg-green-900/80 border-green-500/40 text-green-100' : 'bg-gold-500/10 border-gold-500/40 text-gold-100'

  const socialLinks = [
    { href: instagram, icon: <Instagram size={15} />, label: 'Instagram' },
    { href: facebook,  icon: <Facebook  size={15} />, label: 'Facebook'  },
    { href: youtube,   icon: <Youtube   size={15} />, label: 'YouTube'   },
    { href: tiktok,    icon: <TikTokIcon size={15} />, label: 'TikTok'  },
  ].filter(s => !!s.href)

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100 overflow-x-hidden">

      {showBanner && (
        <div className={"fixed top-0 left-0 right-0 z-[60] border-b " + bannerColor + " backdrop-blur-sm"}>
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><AlertTriangle size={16} className="shrink-0" /><p className="text-sm font-medium">{bannerMessage}</p></div>
            <button onClick={() => { setBannerDismissed(true); try { localStorage.setItem('ls_banner_dismissed', bannerMessage) } catch {} }} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none" aria-label="Fermer">x</button>
          </div>
        </div>
      )}

      <nav className={"fixed left-0 right-0 z-50 bg-noir-950/90 backdrop-blur-md border-b border-noir-800/50 transition-all duration-200 " + (showBanner ? "top-10" : "top-0")}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              {socialLinks.map(s => <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-noir-400 hover:text-gold-400 transition-colors p-1" title={s.label} aria-label={s.label}>{s.icon}</a>)}
            </div>
            <ThemeToggle />
            <Link href="/reservation" className="btn-gold text-sm px-5 py-2">Réserver un cours</Link>
            <button className="text-noir-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-noir-800" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <div className="space-y-1.5">
                <span className={"block w-6 h-0.5 bg-current transition-all duration-200 " + (menuOpen ? 'rotate-45 translate-y-2' : '')} />
                <span className={"block w-6 h-0.5 bg-current transition-all duration-200 " + (menuOpen ? 'opacity-0' : '')} />
                <span className={"block w-6 h-0.5 bg-current transition-all duration-200 " + (menuOpen ? '-rotate-45 -translate-y-2' : '')} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-noir-900 border-l border-noir-800 overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
              <span className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</span>
              <button onClick={() => setMenuOpen(false)} className="text-noir-400 hover:text-white p-1">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {[
                { href: '#apropos', label: 'À propos', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
                { href: '#professeur', label: 'Votre professeur', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { href: '#offres', label: 'Offres', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
                { href: '#tarifs', label: 'Tarifs', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                { href: '/reservation?tab=evenements', label: 'Événements', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { href: '/inscription', label: 'Inscription', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> },
                { href: '#temoignages', label: 'Témoignages', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                { href: '#contact', label: 'Contact', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                { href: '/cadeau', label: 'Bon cadeau', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
                { href: '/mon-pack', label: 'Mon pack', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
                { href: '/packs', label: 'Acheter un pack', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
                { href: '/espace-eleve/login', label: 'Espace Élève', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
                { href: '/essai', label: "Cours d'essai gratuit", icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
  { href: '/aide', label: 'Aide & FAQ', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              ].map(item => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 text-sm text-noir-300 hover:text-white hover:bg-noir-800/60 transition-all py-2.5 px-3 rounded-xl">
                  <span className="text-noir-500 shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-3 pt-3 mt-2 border-t border-noir-800 flex-wrap">
                  {socialLinks.map(s => <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-noir-400 hover:text-gold-400 transition-colors" onClick={() => setMenuOpen(false)}>{s.icon}<span>{s.label}</span></a>)}
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className={"relative min-h-screen flex items-center justify-center overflow-hidden " + (showBanner ? "pt-32" : "pt-20")}>
        <div className="absolute inset-0">
          <img src="/piano-hero.jpg" alt="Piano" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-noir-950/60 via-noir-950/70 to-noir-950" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {!settingsLoaded ? (
            <div className="space-y-4">
              <div className="h-16 bg-noir-800/50 rounded-2xl animate-pulse mx-auto max-w-2xl" />
              <div className="h-8 bg-noir-800/50 rounded-xl animate-pulse mx-auto max-w-xl" />
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                <span className="text-gold-400 text-xs tracking-widest uppercase animate-fade-in-down">École de Piano en Ligne</span>
              </div>
              <h1 className="font-serif text-5xl md:text-7xl text-white mb-4 leading-tight animate-fade-in-up">
                {settings?.hero_title || 'Réservez votre cours de piano'}
              </h1>
              {settings?.hero_title2 && (
                <h2 className="font-serif text-3xl md:text-5xl text-gold-400 mb-6 leading-tight">
                  {settings.hero_title2}
                </h2>
              )}
              <p className="text-noir-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                {settings?.hero_subtitle || 'Choisissez un créneau et commencez votre aventure musicale'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/essai" className="btn-gold text-base px-8 py-4 flex items-center gap-2">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                  1 heure offerte — Cours d&apos;essai gratuit
                </Link>
                <Link href="/reservation" className="btn-outline text-base px-8 py-4">
                  {settings?.hero_btn1 || 'Réserver un cours'}
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap justify-center gap-6">
                {[settings?.stats_label1 || '100% En ligne', settings?.stats_label2 || '1h Cours individuel', settings?.stats_label3 || 'Monde entier', settings?.stats_label4 || 'Tous niveaux'].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2 text-noir-400 text-sm">
                    <div className="w-1 h-1 rounded-full bg-gold-500" />
                    {stat}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24" opacity="0.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      {/* ── ÉVÉNEMENT EN VEDETTE ── */}
      {featuredEvent && (
        <div className="bg-gold-500/5 border-y border-gold-500/20 py-6 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center shrink-0">
                <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div>
                <div className="text-gold-400 text-xs font-medium uppercase tracking-wider mb-1">Événement en vedette</div>
                <h3 className="text-white font-serif text-lg">{featuredEvent.title}</h3>
                {featuredEvent.description && <p className="text-noir-400 text-sm">{featuredEvent.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-gold-400 text-sm font-medium">{featuredEvent.is_free ? 'Gratuit' : `${featuredEvent.price} €`}</div>
                {featuredEvent.spots_remaining > 0 && <div className="text-noir-400 text-xs">{featuredEvent.spots_remaining} places restantes</div>}
              </div>
              <a href="/reservation?tab=evenements" className="btn-gold text-sm px-5 py-2">
                Réserver
              </a>
            </div>
          </div>
        </div>
      )}

      <section id="apropos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">A propos</div>
              {!settingsLoaded ? <div className="space-y-3"><SkeletonBlock w="w-3/4" h="h-10" /><SkeletonBlock w="w-full" h="h-4" /></div> : (
                <>
                  <h2 className="font-serif text-4xl text-white mb-6 leading-tight">{settings?.apropos_titre}</h2>
                  <p className="text-noir-300 leading-relaxed mb-6">{settings?.apropos_texte1}</p>
                  <p className="text-noir-400 leading-relaxed mb-8">{settings?.apropos_texte2}</p>
                  <div className="space-y-3">
                    {[settings?.apropos_point1, settings?.apropos_point2, settings?.apropos_point3, settings?.apropos_point4].filter(Boolean).map((item, i) => (
                      <div key={i} className="flex items-start gap-3"><CheckCircle size={15} className="text-gold-500 mt-0.5 shrink-0" /><span className="text-noir-300 text-sm">{item}</span></div>
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
                  <div className="text-noir-400 text-xs tracking-widest mt-1">ECOLE DE PIANO EN LIGNE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="professeur" className="py-24 px-6 bg-noir-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Votre professeur</div>
            {!settingsLoaded ? <div className="flex flex-col items-center gap-3"><SkeletonBlock w="w-48" h="h-10" /></div> : (
              <><h2 className="font-serif text-4xl text-white mb-4">{settings?.prof_nom || 'Votre professeur'}</h2>{settings?.prof_titre && <p className="text-gold-400 text-sm tracking-widest uppercase">{settings.prof_titre}</p>}</>
            )}
          </div>
          {!settingsLoaded ? <div className="grid md:grid-cols-2 gap-16"><div className="flex justify-center"><SkeletonBlock w="w-72" h="h-96" className="rounded-2xl" /></div><div className="space-y-4"><SkeletonBlock w="w-full" h="h-4" /></div></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
              <div className="flex justify-center md:justify-start">
                {settings?.prof_photo ? (
                  <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border border-gold-500/20 shadow-2xl">
                    <img src={settings.prof_photo} alt={settings.prof_nom || 'Professeur'} className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-noir-950/40 to-transparent" />
                  </div>
                ) : (
                  <div className="w-full max-w-sm aspect-[3/4] rounded-2xl border border-noir-800 bg-noir-900 flex flex-col items-center justify-center gap-4">
                    <svg width="48" height="48" fill="none" stroke="#f59e0b" strokeWidth="1" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    <p className="text-noir-500 text-xs text-center px-4">Ajoutez votre photo depuis Admin Parametres</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-start space-y-8">
                {settings?.prof_bio && <div><div className="flex items-center gap-3 mb-4"><div className="w-6 h-px bg-gold-500" /><span className="text-gold-500 text-xs tracking-widest uppercase">Biographie</span></div><p className="text-noir-300 leading-relaxed whitespace-pre-line">{settings.prof_bio}</p></div>}
                {settings?.prof_vision && <div><div className="flex items-center gap-3 mb-4"><div className="w-6 h-px bg-gold-500" /><span className="text-gold-500 text-xs tracking-widest uppercase">Vision</span></div><p className="text-noir-300 leading-relaxed whitespace-pre-line">{settings.prof_vision}</p></div>}
                {settings?.prof_pedagogie && <div><div className="flex items-center gap-3 mb-4"><div className="w-6 h-px bg-gold-500" /><span className="text-gold-500 text-xs tracking-widest uppercase">Pedagogie</span></div><p className="text-noir-300 leading-relaxed whitespace-pre-line">{settings.prof_pedagogie}</p></div>}
                {!settings?.prof_bio && !settings?.prof_vision && !settings?.prof_pedagogie && <p className="text-noir-500 text-sm">Completez votre profil depuis Admin Parametres</p>}
                <div className="pt-2"><button onClick={() => setShowContact(true)} className="btn-gold inline-flex items-center gap-2"><Mail size={16} />Nous contacter</button></div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="offres" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Nos offres</div>
            {!settingsLoaded ? <div className="flex flex-col items-center gap-3"><SkeletonBlock w="w-64" h="h-10" /></div> : <><h2 className="font-serif text-4xl text-white mb-4 animate-fade-in-up">{settings?.offres_titre}</h2><p className="text-noir-400 max-w-xl mx-auto">{settings?.offres_sous_titre}</p></>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {!settingsLoaded ? [1,2,3].map(i => <div key={i} className="card"><SkeletonBlock w="w-full" h="h-64" /></div>) : (
              [
                { title: settings?.offre1_titre, subtitle: settings?.offre1_sous, desc: settings?.offre1_desc, features: [settings?.offre1_f1, settings?.offre1_f2, settings?.offre1_f3, settings?.offre1_f4], cta: settings?.offre1_btn, href: '/reservation', highlight: true },
                { title: settings?.offre2_titre, subtitle: settings?.offre2_sous, desc: settings?.offre2_desc, features: [settings?.offre2_f1, settings?.offre2_f2, settings?.offre2_f3, settings?.offre2_f4], cta: settings?.offre2_btn, href: '/reservation?tab=evenements', highlight: false },
                { title: settings?.offre3_titre, subtitle: settings?.offre3_sous, desc: settings?.offre3_desc, features: [settings?.offre3_f1, settings?.offre3_f2, settings?.offre3_f3, settings?.offre3_f4], cta: settings?.offre3_btn, href: '/reservation?tab=evenements', highlight: false },
              ].map((offer, i) => (
                <div key={i} className={"card flex flex-col relative overflow-hidden " + (offer.highlight ? 'border-gold-500/40' : '')}>
                  {offer.highlight && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />}
                  <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">{offer.subtitle}</div>
                  <h3 className="font-serif text-xl text-white mb-3">{offer.title}</h3>
                  <p className="text-noir-400 text-sm leading-relaxed mb-6">{offer.desc}</p>
                  <ul className="space-y-2 mb-8 flex-1">{offer.features.filter(Boolean).map((f, j) => <li key={j} className="flex items-center gap-2 text-sm text-noir-300"><span className="text-gold-500 text-xs">-</span>{f}</li>)}</ul>
                  <Link href={offer.href!} className={offer.highlight ? 'btn-gold w-full text-center' : 'btn-outline w-full text-center'}>{offer.cta}</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-noir-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">{settings?.steps_label || 'Simple et rapide'}</div>
          <h2 className="font-serif text-4xl text-white mb-16">{settings?.steps_titre || 'Comment ca marche ?'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Choisissez votre fuseau', desc: "L application detecte automatiquement votre pays et affiche les horaires adaptes." },
              { step: '02', title: 'Sélectionnez un créneau', desc: 'Parcourez les disponibilités et cliquez sur le créneau qui vous convient.' },
              { step: '03', title: 'Remplissez le formulaire', desc: 'Nom, email, message optionnel. 30 secondes maximum.' },
              { step: '04', title: 'Confirmation instantanee', desc: 'Recevez un email avec le fichier .ics pour ajouter le cours a votre agenda.' },
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
          <div className="mt-12"><Link href="/reservation" className="btn-gold text-base px-8 py-3.5 inline-flex items-center gap-2"><Calendar size={18} />{settings?.hero_btn1 || 'Commencer maintenant'}</Link></div>
        </div>
      </section>

      <section id="tarifs" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Tarifs</div>
            <h2 className="font-serif text-4xl text-white mb-4">Investissez dans votre passion</h2>
            <p className="text-noir-400 max-w-xl mx-auto">Des formules adaptees a votre rythme et vos objectifs.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card border-gold-500/40 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
              <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">A l unite</div>
              <h3 className="font-serif text-xl text-white mb-2">Cours individuel</h3>
              <div className="text-3xl font-bold text-gold-400 mb-1">{settings?.tarif_cours_1h || '22'} EUR</div>
              <div className="text-noir-500 text-xs mb-4">par heure</div>
              <p className="text-noir-400 text-sm leading-relaxed mb-4 flex-1">Cours en tete-a-tete, adapte a votre niveau et vos objectifs.</p>
              <Link href="/reservation" className="btn-gold w-full text-center block">Réserver un cours</Link>
            </div>
            {settings?.tarif_pack_label1 && settings?.tarif_pack_prix1 && (
              <div className="card flex flex-col">
                <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">Pack</div>
                <h3 className="font-serif text-xl text-white mb-2">{settings.tarif_pack_label1}</h3>
                <div className="text-3xl font-bold text-gold-400 mb-1">{settings.tarif_pack_prix1} EUR</div>
                <div className="text-noir-500 text-xs mb-4">forfait</div>
                {settings.tarif_pack_desc1 && <p className="text-noir-400 text-sm leading-relaxed mb-6 flex-1">{settings.tarif_pack_desc1}</p>}
                <button onClick={() => handleBuyPack(settings.tarif_pack_label1 || '', settings.tarif_pack_prix1 || '0')} className="btn-gold w-full text-center mb-2">Acheter ce pack</button>
                <button onClick={() => setShowContact(true)} className="btn-outline w-full text-center text-xs">Nous contacter</button>
              </div>
            )}
            {settings?.tarif_pack_label2 && settings?.tarif_pack_prix2 && (
              <div className="card flex flex-col">
                <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">Pack</div>
                <h3 className="font-serif text-xl text-white mb-2">{settings.tarif_pack_label2}</h3>
                <div className="text-3xl font-bold text-gold-400 mb-1">{settings.tarif_pack_prix2} EUR</div>
                <div className="text-noir-500 text-xs mb-4">forfait</div>
                {settings.tarif_pack_desc2 && <p className="text-noir-400 text-sm leading-relaxed mb-6 flex-1">{settings.tarif_pack_desc2}</p>}
                <button onClick={() => handleBuyPack(settings.tarif_pack_label2 || '', settings.tarif_pack_prix2 || '0')} className="btn-gold w-full text-center mb-2">Acheter ce pack</button>
                <button onClick={() => setShowContact(true)} className="btn-outline w-full text-center text-xs">Nous contacter</button>
              </div>
            )}
            {settings?.tarif_pack_label3 && settings?.tarif_pack_prix3 && (
              <div className="card flex flex-col">
                <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">Pack</div>
                <h3 className="font-serif text-xl text-white mb-2">{settings.tarif_pack_label3}</h3>
                <div className="text-3xl font-bold text-gold-400 mb-1">{settings.tarif_pack_prix3} EUR</div>
                <div className="text-noir-500 text-xs mb-4">forfait</div>
                {settings.tarif_pack_desc3 && <p className="text-noir-400 text-sm leading-relaxed mb-6 flex-1">{settings.tarif_pack_desc3}</p>}
                <button onClick={() => handleBuyPack(settings.tarif_pack_label3 || '', settings.tarif_pack_prix3 || '0')} className="btn-gold w-full text-center mb-2">Acheter ce pack</button>
                <button onClick={() => setShowContact(true)} className="btn-outline w-full text-center text-xs">Nous contacter</button>
              </div>
            )}
            {settings?.tarif_pack_label4 && settings?.tarif_pack_prix4 && (
              <div className="card flex flex-col">
                <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">Pack</div>
                <h3 className="font-serif text-xl text-white mb-2">{settings.tarif_pack_label4}</h3>
                <div className="text-3xl font-bold text-gold-400 mb-1">{settings.tarif_pack_prix4} EUR</div>
                <div className="text-noir-500 text-xs mb-4">forfait</div>
                {settings.tarif_pack_desc4 && <p className="text-noir-400 text-sm leading-relaxed mb-4 flex-1">{settings.tarif_pack_desc4}</p>}
                <button onClick={() => handleBuyPack(settings.tarif_pack_label4 || '', settings.tarif_pack_prix4 || '0')} className="btn-gold w-full text-center mb-2">Acheter ce pack</button>
                <button onClick={() => setShowContact(true)} className="btn-outline w-full text-center text-xs">Nous contacter</button>
              </div>
            )}
            <div className="card flex flex-col">
              <div className="text-xs text-gold-500 uppercase tracking-widest mb-1">Cadeau</div>
              <h3 className="font-serif text-xl text-white mb-2">Bon cadeau</h3>
              <div className="text-3xl font-bold text-gold-400 mb-1">Libre</div>
              <div className="text-noir-500 text-xs mb-4">montant au choix</div>
              <p className="text-noir-400 text-sm leading-relaxed mb-6 flex-1">Offrez un cours de piano a quelqu un que vous aimez.</p>
              <Link href="/cadeau" className="btn-outline w-full text-center">Offrir un bon</Link>
            </div>
          </div>

        </div>
      </section>

      <section id="temoignages" className="py-24 px-6 bg-noir-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Témoignages & Médias</div>
            <h2 className="font-serif text-4xl text-white mb-4">Ce que disent nos eleves</h2>
            <p className="text-noir-400 max-w-xl mx-auto">Decouvrez les retours de nos eleves et nos contenus musicaux.</p>
          </div>
          {medias.length === 0 ? (
            <div className="text-center py-12 text-noir-500">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4"><svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
              <p className="text-sm">Les temoignages et medias seront bientot disponibles.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {medias.filter(m => m.type === 'temoignage').length > 0 && (
                <div>
                  <div className="text-gold-500 text-xs tracking-widest uppercase mb-6 text-center">Témoignages</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {medias.filter(m => m.type === 'temoignage').map(m => {
                      // Extraire la note depuis le titre (ex: "Témoignage — Note: 5/5")
                      const noteMatch = m.titre?.match(/Note[:\s]+(\d)/i)
                      const note = noteMatch ? parseInt(noteMatch[1]) : 5
                      return (
                        <div key={m.id} className="card">
                          {/* Étoiles */}
                          <div className="flex gap-0.5 mb-3">
                            {[1,2,3,4,5].map(n => (
                              <svg key={n} width="16" height="16" viewBox="0 0 24 24" fill={n <= note ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            ))}
                          </div>
                          <p className="text-noir-300 text-sm leading-relaxed mb-4 italic">&ldquo;{m.description || m.url}&rdquo;</p>
                          {m.auteur && <p className="text-gold-400 text-sm font-medium">{m.auteur}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {medias.filter(m => m.type === 'video').length > 0 && (
                <div>
                  <div className="text-gold-500 text-xs tracking-widest uppercase mb-6 text-center">Videos</div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {medias.filter(m => m.type === 'video').map(m => {
                      const ytMatch = m.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
                      const embedUrl = ytMatch ? 'https://www.youtube.com/embed/' + ytMatch[1] : m.url
                      return <div key={m.id}><div className="aspect-video rounded-xl overflow-hidden border border-noir-800"><iframe src={embedUrl} className="w-full h-full" allowFullScreen title={m.titre || 'Video'} /></div>{m.titre && <p className="text-noir-300 text-sm mt-2">{m.titre}</p>}</div>
                    })}
                  </div>
                </div>
              )}
              {medias.filter(m => m.type === 'photo').length > 0 && (
                <div>
                  <div className="text-gold-500 text-xs tracking-widest uppercase mb-6 text-center">Photos</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {medias.filter(m => m.type === 'photo').map(m => <div key={m.id} className="aspect-square rounded-xl overflow-hidden border border-noir-800"><img src={m.url} alt={m.titre || ''} className="w-full h-full object-cover" /></div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden border border-gold-500/20">
            <Image src="/piano-hero.jpg" alt="Piano" fill className="object-cover opacity-10" />
            <div className="relative z-10 p-12">
              <div className="h-px w-16 bg-gold-500/40 mx-auto mb-8" />
              <h2 className="font-serif text-4xl text-white mb-4 animate-fade-in-up">{settings?.cta_titre || 'Pret(e) a commencer ?'}</h2>
              <p className="text-noir-400 mb-6 max-w-md mx-auto">{settings?.cta_sous_titre || 'Reservez votre premier cours des maintenant.'}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {whatsapp ? (
                  <a href={"https://wa.me/" + whatsapp.replace(/[^0-9]/g, "")} target="_blank" rel="noopener noreferrer" className="btn-gold text-base px-10 py-4 inline-flex items-center gap-2"><WhatsAppIcon size={18} />Nous contacter sur WhatsApp</a>
                ) : (
                  <button onClick={() => setShowContact(true)} className="btn-gold text-base px-10 py-4 inline-flex items-center gap-2"><Mail size={18} />Nous contacter</button>
                )}
                <Link href="/cadeau" className="btn-outline text-base px-10 py-4 inline-flex items-center gap-2">Offrir un bon cadeau</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 px-6 border-t border-noir-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-gold-500 text-xs tracking-widest uppercase mb-4">Contact</div>
          <h2 className="font-serif text-3xl text-white mb-8">Une question ?</h2>
          <div className="flex flex-col items-center gap-3 mb-8">
            {email    && <a href={"mailto:" + email} className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-lg"><Mail size={18} /> {email}</a>}
            {phone    && <a href={"tel:" + phone}    className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors">{phone}</a>}
            {whatsapp && <a href={"https://wa.me/" + whatsapp.replace(/[^0-9]/g, "")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors text-sm"><WhatsAppIcon size={16} /> WhatsApp</a>}
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

      <footer className="border-t border-noir-800 bg-noir-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-px h-4 bg-gold-500" />
            <span className="font-serif text-gold-400 tracking-widest text-sm">LIEU SECRET</span>
            <span className="text-noir-600 text-xs">— École de Piano en Ligne</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/reservation"  className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Reservation</Link>
            <a href="#apropos"         className="text-xs text-noir-500 hover:text-gold-400 transition-colors">A propos</a>
            <a href="#professeur"      className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Votre professeur</a>
            <a href="#tarifs"          className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Tarifs</a>
            <a href="#temoignages"     className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Témoignages</a>
            <a href="#contact"         className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Contact</a>
            <Link href="/cadeau"       className="text-xs text-gold-500 hover:text-gold-300 transition-colors">Bon cadeau</Link>
            <Link href="/mon-pack"     className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Mon pack</Link>
            <Link href="/packs"          className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Acheter un pack</Link>
            <Link href="/espace-eleve/login" className="text-xs text-gold-500 hover:text-gold-300 transition-colors font-medium">Espace Élève</Link>
            <Link href="/aide"           className="text-xs text-noir-500 hover:text-gold-400 transition-colors">Aide & FAQ</Link>
            <a href="/admin/login"     className="text-xs text-noir-700 hover:text-noir-500 transition-colors">Admin</a>
          </div>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map(s => <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-noir-500 hover:text-gold-400 transition-colors" title={s.label} aria-label={s.label}>{s.icon}</a>)}
            </div>
          )}
          <p className="text-xs text-noir-700">Copyright {new Date().getFullYear()} Lieu Secret</p>
        </div>
      </footer>

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}

      {/* Modale achat pack */}
      {packModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-serif text-xl">Acheter {packModal.label}</h2>
              <button onClick={() => setPackModal(null)} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-4 text-center">
              <div className="text-3xl font-bold text-gold-400">{packModal.prix} €</div>
              <div className="text-noir-400 text-sm mt-1">{packModal.label}</div>
            </div>
            <div className="space-y-3 mb-4">
              <div><label className="label mb-1 block">Votre nom *</label><input value={packBuyForm.nom} onChange={e => setPackBuyForm(f => ({ ...f, nom: e.target.value }))} placeholder="Prénom Nom" className="input w-full" /></div>
              <div><label className="label mb-1 block">Votre email *</label><input type="email" value={packBuyForm.email} onChange={e => setPackBuyForm(f => ({ ...f, email: e.target.value }))} placeholder="vous@exemple.com" className="input w-full" /></div>
            </div>
            {packBuyError && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{packBuyError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setPackModal(null)} className="btn-outline flex-1">Annuler</button>
              <button onClick={handlePackCheckout} className="btn-gold flex-1" disabled={packBuyLoading}>
                {packBuyLoading ? 'Redirection...' : `Payer ${packModal.prix} €`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
