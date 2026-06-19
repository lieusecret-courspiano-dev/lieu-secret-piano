'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Calendar, Users, Star, MessageSquare, Settings, LogOut,
  LayoutDashboard, ClipboardList, Image, Gift, Mail, BookOpen,
  TrendingUp, CheckSquare, Music, Mic, HelpCircle, Library
} from 'lucide-react'
import { GlobalSearch } from '@/components/admin/ui/SearchBar'

const NAV_GROUPS = [
  {
    label: 'Tableau de bord',
    items: [
      { href: '/admin',           label: 'Activité',        icon: LayoutDashboard },
      { href: '/admin/dashboard', label: 'Finances',        icon: TrendingUp      },
    ],
  },
  {
    label: 'Cours & Réservations',
    items: [
      { href: '/admin/disponibilites',   label: 'Disponibilités',  icon: Calendar     },
      { href: '/admin/reservations',     label: 'Réservations',    icon: Users        },
      { href: '/admin/evenements',       label: 'Événements',      icon: Star         },
      { href: '/admin/essais',           label: 'Cours d\'essai',  icon: Star         },
    ],
  },
  {
    label: 'Élèves',
    items: [
      { href: '/admin/eleves',           label: 'Espace Élèves',   icon: Users        },
      { href: '/admin/travaux',          label: 'Travaux à faire', icon: CheckSquare  },
      { href: '/admin/eleve-messages',   label: 'Messages élèves', icon: MessageSquare },
      { href: '/admin/eleve-medias',     label: 'Enregistrements', icon: Mic, badge: true },
      { href: '/admin/inscriptions',     label: 'Inscriptions',    icon: ClipboardList},
      { href: '/admin/inscription-form', label: 'Formulaire',      icon: ClipboardList},
    ],
  },
  {
    label: 'Contenu',
    items: [
      { href: '/admin/blog',             label: 'Blog',                 icon: BookOpen     },
      { href: '/admin/ressources-admin', label: 'Ressources',           icon: BookOpen     },
      { href: '/admin/partitions',       label: 'Médiathèque',          icon: Music        },
      { href: '/admin/medias',           label: 'Médias & Avis',        icon: Image        },
      { href: '/admin/quiz',             label: 'Quiz pédagogiques',    icon: HelpCircle   },
      { href: '/admin/supports',         label: 'Bibliothèque pédag.',  icon: Library      },
    ],
  },
  {
    label: 'Packs & Paiements',
    items: [
      { href: '/admin/packs',            label: 'Packs de cours',  icon: BookOpen     },
      { href: '/admin/cadeaux',          label: 'Bons cadeaux',    icon: Gift         },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/admin/newsletter',       label: 'Newsletter',      icon: Mail         },
      { href: '/admin/emails',           label: 'Emails envoyés',  icon: Mail         },
      { href: '/admin/messages',         label: 'Messages',        icon: MessageSquare},
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/parametres',       label: 'Paramètres',      icon: Settings     },
    ],
  },
]

// Tous les items à plat pour la barre mobile
const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items)

export default function AdminNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [nbEnregNonLus, setNbEnregNonLus] = useState(0)

  useEffect(() => {
    fetch('/api/admin/eleve-medias').then(r => r.ok ? r.json() : []).then(data => {
      setNbEnregNonLus(Array.isArray(data) ? data.filter((m: { lu_admin: boolean }) => !m.lu_admin).length : 0)
    }).catch(() => {})
  }, [])

  // Écouter les mises à jour du badge enregistrements depuis la page admin
  useEffect(() => {
    function handleEnregAdminUpdate(e: Event) {
      const detail = (e as CustomEvent).detail
      if (typeof detail?.count === 'number') setNbEnregNonLus(detail.count)
    }
    window.addEventListener('enreg-admin-count-update', handleEnregAdminUpdate)
    return () => window.removeEventListener('enreg-admin-count-update', handleEnregAdminUpdate)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Forcer un rechargement complet pour vider le cache Next.js
    window.location.href = '/admin/login'
  }

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-noir-800/60 sticky top-0 h-screen overflow-y-auto bg-noir-950">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-noir-800/60 shrink-0">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-sm text-gold-400 tracking-widest">LIEU SECRET</span>
          </Link>
          <p className="text-[10px] text-noir-600 mt-1 ml-4">Administration</p>
          <div className="mt-3">
            <GlobalSearch />
          </div>
        </div>

        {/* Navigation groupée */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-noir-700 uppercase tracking-widest px-3 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
                  return (
                    <Link key={href} href={href} prefetch={true}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        active
                          ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                          : 'text-noir-400 hover:text-white hover:bg-noir-800/60 border border-transparent'
                      }`}>
                      <Icon size={16} className="shrink-0" />
                      <span className="font-medium flex-1">{label}</span>
                      {href === '/admin/eleve-medias' && nbEnregNonLus > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{nbEnregNonLus}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="px-2 py-3 border-t border-noir-800/60 shrink-0">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-noir-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent">
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Barre de navigation mobile (bottom) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-noir-900/95 backdrop-blur-sm border-t border-noir-800">
        <div className="flex items-center justify-around px-1 py-1.5">
          {[
            { href: '/admin',              label: 'Accueil',    icon: LayoutDashboard },
            { href: '/admin/reservations', label: 'Réserv.',    icon: Calendar        },
            { href: '/admin/eleves',       label: 'Élèves',     icon: Users           },
            { href: '/admin/packs',        label: 'Packs',      icon: BookOpen        },
            { href: '/admin/parametres',   label: 'Config.',    icon: Settings        },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[52px] ${
                  active ? 'text-gold-400' : 'text-noir-500 hover:text-noir-300'
                }`}>
                <Icon size={18} />
                <span className="text-[9px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}