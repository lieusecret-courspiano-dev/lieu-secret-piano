'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

function TikTokIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
}

interface Settings {
  contact_email?: string; instagram?: string; facebook?: string; youtube?: string; tiktok?: string
}

const FOOTER_LINKS = {
  'Navigation': [
    { href: '/', label: 'Accueil' },
    { href: '/cours', label: 'Cours de piano' },
    { href: '/tarifs', label: 'Tarifs' },
    { href: '/essai', label: "Cours d'essai gratuit" },
    { href: '/blog', label: 'Blog' },
  ],
  'Espace': [
    { href: '/espace-eleve/login', label: 'Espace élève' },
    { href: '/reservation', label: 'Réserver un cours' },
    { href: '/packs', label: 'Acheter un pack' },
    { href: '/cadeau', label: 'Bon cadeau' },
    { href: '/inscription', label: 'Inscription' },
  ],
  'Informations': [
    { href: '/contact', label: 'Contact' },
    { href: '/aide', label: 'FAQ & Aide' },
    { href: '/mentions-legales', label: 'Mentions légales' },
    { href: '/confidentialite', label: 'Confidentialité' },
  ],
}

export default function PublicFooter({ settings }: { settings?: Settings }) {
  const [footerEmail, setFooterEmail] = useState('')
  const [footerSubscribed, setFooterSubscribed] = useState(false)
  const [footerSubscribing, setFooterSubscribing] = useState(false)

  async function handleFooterSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!footerEmail) return
    setFooterSubscribing(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: footerEmail, source: 'footer' }),
      })
      if (res.ok) { setFooterSubscribed(true); setFooterEmail('') }
    } catch {}
    setFooterSubscribing(false)
  }
  const socialLinks = [
    settings?.instagram && { href: settings.instagram, label: 'Instagram', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
    settings?.youtube && { href: settings.youtube, label: 'YouTube', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
    settings?.tiktok && { href: settings.tiktok, label: 'TikTok', icon: <TikTokIcon size={18} /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[]

  return (
    <footer className="bg-noir-950 border-t border-noir-800/60 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <div>
                <span className="font-serif text-white text-xl tracking-widest block">LIEU SECRET</span>
                <span className="text-gold-500/60 text-[9px] tracking-[0.2em] uppercase">École de Piano en Ligne</span>
              </div>
            </Link>
            <p className="text-noir-400 text-sm leading-relaxed mb-6 max-w-xs">
              Apprenez le piano en ligne avec une pédagogie bienveillante et personnalisée. Cours individuels, ateliers et masterclass pour tous niveaux.
            </p>
            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3">
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-noir-900 border border-noir-800 flex items-center justify-center text-noir-400 hover:text-gold-400 hover:border-gold-500/30 transition-all"
                  aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`}
                className="mt-4 flex items-center gap-2 text-sm text-noir-400 hover:text-gold-400 transition-colors">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                {settings.contact_email}
              </a>
            )}
          </div>

          {/* Liens */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">{title}</h3>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="text-noir-400 hover:text-gold-400 text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="bg-noir-900/50 border border-noir-800/60 rounded-2xl p-6 mb-10">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Restez informé</h3>
              <p className="text-noir-400 text-sm">Recevez nos conseils, actualités et offres exclusives.</p>
            </div>
            {footerSubscribed ? (
              <p className="text-green-400 text-sm font-medium">Inscription confirmée ! Vérifiez votre boîte mail.</p>
            ) : (
              <form className="flex gap-2 w-full md:w-auto" onSubmit={handleFooterSubscribe}>
                <input type="email" value={footerEmail} onChange={e => setFooterEmail(e.target.value)}
                  placeholder="votre@email.com" className="input flex-1 md:w-64 text-sm" required />
                <button type="submit" disabled={footerSubscribing} className="btn-gold text-sm px-5 py-2.5 shrink-0">
                  {footerSubscribing ? '...' : "S'abonner"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-noir-800/60">
          <p className="text-noir-600 text-xs">
            © {new Date().getFullYear()} Lieu Secret — École de Piano en Ligne. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/mentions-legales" className="text-noir-600 hover:text-noir-400 text-xs transition-colors">Mentions légales</Link>
            <Link href="/confidentialite" className="text-noir-600 hover:text-noir-400 text-xs transition-colors">Confidentialité</Link>
            <Link href="/admin" className="text-noir-700 hover:text-noir-500 text-xs transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}