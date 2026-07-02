'use client'
import Link from 'next/link'

interface NiveauGlobalProps {
  progPct: number
  nbCours: number
  badges: number
  quizReussis: number
  heuresPratique?: number
}

const NIVEAUX = [
  { min: 0,  max: 10,  label: 'Découverte',    color: '#6b7280', desc: 'Premiers pas au piano' },
  { min: 10, max: 25,  label: 'Débutant',       color: '#3b82f6', desc: 'Les bases se mettent en place' },
  { min: 25, max: 40,  label: 'Initié',         color: '#8b5cf6', desc: 'La pratique devient régulière' },
  { min: 40, max: 55,  label: 'Intermédiaire',  color: '#f59e0b', desc: 'Bonne maîtrise des fondamentaux' },
  { min: 55, max: 70,  label: 'Confirmé',       color: '#f97316', desc: 'Autonomie musicale croissante' },
  { min: 70, max: 85,  label: 'Avancé',         color: '#ef4444', desc: 'Maîtrise technique solide' },
  { min: 85, max: 95,  label: 'Expert',         color: '#ec4899', desc: 'Niveau de performance élevé' },
  { min: 95, max: 101, label: 'Maître',         color: '#f59e0b', desc: 'Excellence musicale' },
]

export function NiveauGlobal({ progPct, nbCours, badges, quizReussis, heuresPratique = 0 }: NiveauGlobalProps) {
  // Score composite: progression (50%) + cours (20%) + badges (15%) + quiz (15%)
  const coursScore  = Math.min(nbCours * 2, 20)
  const badgeScore  = Math.min(badges * 3, 15)
  const quizScore   = Math.min(quizReussis * 2, 15)
  const score = Math.round(progPct * 0.5 + coursScore + badgeScore + quizScore)
  const capped = Math.min(score, 100)

  const niveau = NIVEAUX.find(n => capped >= n.min && capped < n.max) || NIVEAUX[0]
  const nextNiveau = NIVEAUX[NIVEAUX.indexOf(niveau) + 1]
  const progressInLevel = nextNiveau
    ? ((capped - niveau.min) / (nextNiveau.min - niveau.min)) * 100
    : 100

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Mon niveau
        </h2>
        <Link href="/espace-eleve/progression" className="text-xs text-gold-400 hover:text-gold-300">Détails →</Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2"
          style={{ background: `${niveau.color}15`, borderColor: `${niveau.color}40` }}>
          <span className="font-serif font-bold text-lg" style={{ color: niveau.color }}>
            {NIVEAUX.indexOf(niveau) + 1}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base" style={{ color: niveau.color }}>{niveau.label}</p>
          <p className="text-noir-500 text-xs">{niveau.desc}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-white font-bold text-xl">{capped}</p>
          <p className="text-noir-600 text-xs">/ 100</p>
        </div>
      </div>

      {/* Barre de progression dans le niveau */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-noir-600 mb-1">
          <span>{niveau.label}</span>
          {nextNiveau && <span>{nextNiveau.label}</span>}
        </div>
        <div className="h-2 bg-noir-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressInLevel}%`, background: niveau.color }} />
        </div>
      </div>

      {/* Composantes du score */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: 'Compétences', value: `${progPct}%`, icon: '📈' },
          { label: 'Cours', value: nbCours, icon: '🎹' },
          { label: 'Badges', value: badges, icon: '🏅' },
        ].map(s => (
          <div key={s.label} className="bg-noir-800/50 rounded-xl p-2 text-center">
            <p className="text-white font-bold text-sm">{s.value}</p>
            <p className="text-noir-500 text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
