'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import dynamic from 'next/dynamic'

// Chargement dynamique des sous-pages pour éviter les imports circulaires
const tabs = [
  { id: 'progression', label: 'Progression',  href: '/espace-eleve/progression' },
  { id: 'objectifs',   label: 'Objectifs',     href: '/espace-eleve/objectifs'   },
  { id: 'badges',      label: 'Badges',        href: '/espace-eleve/badges'      },
  { id: 'certificats', label: 'Certificats',   href: '/espace-eleve/certificats' },
  { id: 'historique',  label: 'Mon parcours',  href: '/espace-eleve/historique'  },
]

export default function MaFormationPage() {
  const router = useRouter()

  return (
    <EleveLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="font-serif text-2xl text-white mb-6">Ma formation</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/espace-eleve/progression', label: 'Ma progression', desc: 'Compétences et niveaux', icon: <svg width="24" height="24" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
            { href: '/espace-eleve/objectifs',   label: 'Mes objectifs',  desc: 'Objectifs musicaux',   icon: <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="#f59e0b"/></svg> },
            { href: '/espace-eleve/badges',      label: 'Mes badges',     desc: 'Récompenses obtenues', icon: <svg width="24" height="24" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
            { href: '/espace-eleve/certificats', label: 'Certificats',    desc: 'Diplômes et attestations', icon: <svg width="24" height="24" fill="none" stroke="#fcd34d" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
            { href: '/espace-eleve/historique',  label: 'Mon parcours',   desc: 'Historique complet',   icon: <svg width="24" height="24" fill="none" stroke="#38bdf8" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><polyline points="3 3 3 7 7 7"/></svg> },
          ].map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              className="card hover:border-gold-500/30 transition-all text-left group hover:-translate-y-0.5">
              <div className="mb-3">{item.icon}</div>
              <p className="text-white font-semibold text-sm group-hover:text-gold-400 transition-colors">{item.label}</p>
              <p className="text-noir-500 text-xs mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </EleveLayout>
  )
}
