'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/ThemeProvider'

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  )
}

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/cours', label: 'Cours' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/essai', label: "Essai gratuit", highlight: true },
  { href: '/inscription', label: 'Inscription' },
  { href: '/cadeau', label: 'Bon cadeau' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

interface Settings {
  instagram?: string; facebook?: string; youtube?: string; tiktok?: string
  banner_actif?: string; banner_message?: string; banner_type?: string
}

export default function PublicNav({ settings }: { settings?: Settings }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const socialLinks = [
    settings?.instagram && {
      href: settings.instagram, label: 'Instagram',
      icon: <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
    },
    settings?.youtube && {
      href: settings.youtube, label: 'YouTube',
      icon: <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
    },
    settings?.tiktok && {
      href: settings.tiktok, label: 'TikTok',
      icon: <TikTokIcon size={15} />,
    },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[]

  const bannerActive = settings?.banner_actif === 'true' && settings?.banner_message
  const bannerColor = settings?.banner_type === 'urgent'
    ? 'bg-red-600' : settings?.banner_type === 'success'
    ? 'bg-green-600' : 'bg-gold-600'

  return (
    <>
      {/* Bannière */}
      {bannerActive && (
        <div role="alert" className={`${bannerColor} text-white text-center text-sm py-2 px-4 font-medium z-50 relative`}>
          {settings!.banner_message}
        </div>
      )}

      {/* Navbar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${bannerActive ? 'top-9' : 'top-0'} ${
          scrolled
            ? 'bg-noir-950/95 backdrop-blur-xl border-b border-noir-800/60 shadow-2xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label="Lieu Secret — Accueil">
              <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" aria-hidden="true">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <div>
                <span className="font-serif text-white text-lg tracking-widest leading-none block">LIEU SECRET</span>
                <span className="text-gold-500/70 text-[9px] tracking-[0.2em] uppercase">École de Piano</span>
              </div>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center" aria-label="Navigation principale">
              {NAV_LINKS.map(link => {
                const active = pathname === link.href
                if (link.highlight) return (
                  <Link key={link.href} href={link.href}
                    className="mx-1 px-3 py-1.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold hover:bg-gold-500/20 transition-all whitespace-nowrap"
                    aria-current={active ? 'page' : undefined}>
                    {link.label}
                  </Link>
                )
                return (
                  <Link key={link.href} href={link.href}
                    className={`relative px-2.5 py-2 text-xs font-medium transition-colors rounded-xl whitespace-nowrap ${active ? 'text-white' : 'text-noir-400 hover:text-white'}`}
                    aria-current={active ? 'page' : undefined}>
                    {active && (
                      <motion.span layoutId="nav-pill"
                        className="absolute inset-0 bg-noir-800 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                    )}
                    <span className="relative">{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Actions desktop */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="text-noir-500 hover:text-gold-400 transition-colors p-1.5 rounded-lg hover:bg-noir-800"
                  aria-label={`Suivez-nous sur ${s.label}`}>
                  {s.icon}
                </a>
              ))}
              {socialLinks.length > 0 && <div className="w-px h-5 bg-noir-800" aria-hidden="true" />}
              <ThemeToggle />
              <Link href="/espace-eleve/login"
                className="text-xs text-noir-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-noir-800 whitespace-nowrap">
                Connexion
              </Link>
              <Link href="/reservation"
                className="btn-gold text-xs px-4 py-2 shadow-lg shadow-gold-500/20 whitespace-nowrap">
                Réserver
              </Link>
            </div>

            {/* Burger mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-xl text-noir-400 hover:text-white hover:bg-noir-800 transition-colors"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu">
              <div className="w-5 h-4 flex flex-col justify-between" aria-hidden="true">
                <motion.span animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }} className="block h-0.5 bg-current rounded-full" />
                <motion.span animate={{ opacity: menuOpen ? 0 : 1 }} className="block h-0.5 bg-current rounded-full" />
                <motion.span animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }} className="block h-0.5 bg-current rounded-full" />
              </div>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden overflow-hidden bg-noir-950/98 backdrop-blur-xl border-t border-noir-800/60">
              <nav className="px-4 py-4 space-y-1" aria-label="Navigation mobile">
                {NAV_LINKS.map((link, i) => (
                  <motion.div key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <Link href={link.href}
                      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        link.highlight
                          ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                          : pathname === link.href
                          ? 'bg-noir-800 text-white'
                          : 'text-noir-300 hover:text-white hover:bg-noir-800'
                      }`}
                      aria-current={pathname === link.href ? 'page' : undefined}>
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {socialLinks.length > 0 && (
                  <div className="pt-3 border-t border-noir-800 flex items-center gap-3 flex-wrap">
                    {socialLinks.map(s => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-noir-400 hover:text-gold-400 transition-colors"
                        aria-label={`Suivez-nous sur ${s.label}`}>
                        {s.icon} <span>{s.label}</span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <ThemeToggle />
                  <Link href="/espace-eleve/login" className="text-sm text-noir-400 hover:text-white transition-colors">
                    Connexion
                  </Link>
                  <Link href="/reservation" className="btn-gold text-sm px-4 py-2 flex-1 text-center">
                    Réserver
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}