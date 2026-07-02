'use client'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

const ITEMS = [
  {
    href: '/espace-eleve/defis',
    label: 'Défis de la semaine',
    desc: 'Relevez vos défis hebdomadaires',
    color: '#fb923c',
    icon: <svg width="24" height="24" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  },
  {
    href: '/espace-eleve/fiches',
    label: 'Fiches de révision',
    desc: 'Gammes, accords, intervalles...',
    color: '#34d399',
    icon: <svg width="24" height="24" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    href: '/espace-eleve/playlist',
    label: 'Playlist de pratique',
    desc: 'Organisez votre session de travail',
    color: '#f59e0b',
    icon: <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  },
  {
    href: '/espace-eleve/bibliotheque',
    label: 'Gammes & Accords',
    desc: 'Clavier interactif et référence',
    color: '#60a5fa',
    icon: <svg width="24" height="24" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg>,
  },
  {
    href: '/espace-eleve/metronome',
    label: 'Métronome',
    desc: 'Travaillez votre tempo',
    color: '#60a5fa',
    icon: <svg width="24" height="24" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 22 20 2 20"/><line x1="12" y1="9" x2="16" y2="17"/><circle cx="12" cy="17" r="1" fill="#60a5fa"/></svg>,
  },
  {
    href: '/espace-eleve/parrainage',
    label: 'Parrainage',
    desc: 'Invitez vos amis et gagnez des heures',
    color: '#4ade80',
    icon: <svg width="24" height="24" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
]

export default function DecouvertePage() {
  const router = useRouter()
  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-white">Découverte</h1>
          <p className="text-noir-400 text-sm mt-1">Outils et ressources complémentaires</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ITEMS.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              className="card text-left hover:-translate-y-0.5 transition-all group"
              style={{ borderColor: `${item.color}20` }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}15` }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm group-hover:text-gold-400 transition-colors">{item.label}</p>
                  <p className="text-noir-500 text-xs">{item.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </EleveLayout>
  )
}
