'use client'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

export default function MesRessourcesPage() {
  const router = useRouter()

  return (
    <EleveLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="font-serif text-2xl text-white mb-6">Mes ressources</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: '/espace-eleve/ressources',  label: 'Ressources pédagogiques', desc: 'Documents, exercices, liens', icon: <svg width="24" height="24" fill="none" stroke="#38bdf8" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
            { href: '/espace-eleve/partitions',  label: 'Médiathèque',             desc: 'Partitions, audios, vidéos', icon: <svg width="24" height="24" fill="none" stroke="#c084fc" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
            { href: '/espace-eleve/mes-supports',label: 'Mes supports',            desc: 'Supports achetés',          icon: <svg width="24" height="24" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/></svg> },
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
