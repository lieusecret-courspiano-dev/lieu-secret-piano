'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Users, Star, MessageSquare, Settings, LogOut, LayoutDashboard, ClipboardList, Image } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin',               label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/disponibilites', label: 'Disponibilites',  icon: Calendar },
  { href: '/admin/reservations',  label: 'Reservations',    icon: Users },
  { href: '/admin/evenements',    label: 'Evenements',      icon: Star },
  { href: '/admin/disponibilites', label: 'Disponibilites', icon: Calendar },
  { href: '/admin/inscriptions',   label: 'Inscriptions',   icon: ClipboardList },
  { href: '/admin/inscription-form', label: 'Formulaire',      icon: ClipboardList },
  { href: '/admin/medias',           label: 'Medias',          icon: Image },
  { href: '/admin/messages',      label: 'Messages',        icon: MessageSquare },
  { href: '/admin/parametres',    label: 'Parametres',      icon: Settings },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-noir-900 border-r border-noir-800 z-30">
        <div className="px-4 py-5 border-b border-noir-800">
          <div className="text-gold-500 text-xs tracking-widest font-medium">LIEU SECRET</div>
          <div className="text-noir-500 text-xs mt-0.5">Administration</div>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                    : 'text-noir-400 hover:text-white hover:bg-noir-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-noir-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-noir-400 hover:text-red-400 hover:bg-red-900/20 transition-all w-full"
          >
            <LogOut size={16} />
            Deconnexion
          </button>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-xs text-noir-600 hover:text-noir-400 transition-colors mt-1">
            Voir le site
          </Link>
        </div>
      </aside>

      {/* Barre mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-noir-900 border-t border-noir-800 z-30 flex">
        {NAV_ITEMS.slice(0, 6).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                active ? 'text-gold-400' : 'text-noir-500'
              }`}
            >
              <Icon size={16} />
              <span className="mt-0.5 text-[10px]">{label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}