'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'

interface Badge { id: string; badge_key: string; badge_nom: string; badge_desc: string | null; badge_icon: string | null; obtenu_at: string }

const ALL_BADGES = [
  { key: 'premier_cours',     nom: 'Premier cours',          desc: 'Vous avez réservé votre premier cours',           icon: '🎹', categorie: 'Parcours' },
  { key: 'premier_journal',   nom: 'Premier pas',            desc: 'Première entrée dans le journal de pratique',     icon: '📝', categorie: 'Pratique' },
  { key: 'pratique_10h',      nom: '10h de pratique',        desc: 'Vous avez pratiqué 10 heures au total',           icon: '⏱️', categorie: 'Pratique' },
  { key: 'pratique_50h',      nom: '50h de pratique',        desc: 'Vous avez pratiqué 50 heures au total',           icon: '🎯', categorie: 'Pratique' },
  { key: 'pratique_100h',     nom: '100h de pratique',       desc: 'Vous avez pratiqué 100 heures au total',          icon: '🏆', categorie: 'Pratique' },
  { key: 'streak_4',          nom: 'Régularité 1 mois',      desc: '4 semaines consécutives de pratique',             icon: '🔥', categorie: 'Régularité' },
  { key: 'streak_12',         nom: 'Régularité 3 mois',      desc: '12 semaines consécutives de pratique',            icon: '⚡', categorie: 'Régularité' },
  { key: 'cert_fondamentaux', nom: 'Fondamentaux',           desc: 'Certificat Fondamentaux du piano obtenu',         icon: '🎓', categorie: 'Certificats' },
  { key: 'cert_comprehension',nom: 'Compréhension',          desc: 'Certificat Compréhension et autonomie obtenu',    icon: '🎵', categorie: 'Certificats' },
  { key: 'cert_expression',   nom: 'Expression',             desc: 'Certificat Expression et maîtrise obtenu',        icon: '🌟', categorie: 'Certificats' },
  { key: 'diplome_final',     nom: 'Diplôme final',          desc: 'Formation complète Lieu Secret validée',          icon: '🏅', categorie: 'Certificats' },
  { key: 'premier_objectif',  nom: 'Visionnaire',            desc: 'Premier objectif musical défini',                 icon: '🎯', categorie: 'Objectifs' },
  { key: 'objectif_atteint',  nom: 'Accomplissement',        desc: 'Premier objectif musical atteint',                icon: '✅', categorie: 'Objectifs' },
  { key: 'premier_enreg',     nom: 'Première prise',         desc: 'Premier enregistrement envoyé au professeur',     icon: '🎙️', categorie: 'Engagement' },
  { key: 'premier_message',   nom: 'Communicant',            desc: 'Premier message envoyé au professeur',            icon: '💬', categorie: 'Engagement' },
  { key: 'quiz_fondamentaux', nom: 'Quiz Fondamentaux',      desc: 'Vous avez réussi un quiz de niveau Fondamentaux', icon: '🎹', categorie: 'Quiz' },
  { key: 'quiz_comprehension',nom: 'Quiz Compréhension',     desc: 'Vous avez réussi un quiz de niveau Compréhension',icon: '🎵', categorie: 'Quiz' },
  { key: 'quiz_expression',   nom: 'Quiz Expression',        desc: 'Vous avez réussi un quiz de niveau Expression',   icon: '🏆', categorie: 'Quiz' },
]

const CATEGORIES = ['Tous', 'Parcours', 'Pratique', 'Régularité', 'Certificats', 'Objectifs', 'Engagement', 'Quiz']

const CAT_COLORS: Record<string, string> = {
  Parcours: '#60a5fa', Pratique: '#34d399', Régularité: '#fb923c',
  Certificats: '#f59e0b', Objectifs: '#a78bfa', Engagement: '#f472b6', Quiz: '#38bdf8',
}

export default function BadgesPage() {
  const router = useRouter()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/eleve/badges')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setBadges(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  const obtenuKeys = new Set(badges.map(b => b.badge_key))
  const nbObtenus = badges.length
  const pct = Math.round((nbObtenus / ALL_BADGES.length) * 100)

  const filtered = ALL_BADGES.filter(b => {
    if (filter === 'Tous') return true
    if (filter === 'Obtenus') return obtenuKeys.has(b.key)
    return b.categorie === filter
  })

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => <SkeletonCard key={i} className="h-36" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-serif text-white mb-1">Mes badges</h1>
          <p className="text-noir-400 text-sm">{nbObtenus} / {ALL_BADGES.length} badges obtenus</p>
        </div>

        {/* Score */}
        <div className="card mb-6 flex items-center gap-6">
          <div className="w-20 h-20 relative shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#111" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gold-400 font-bold text-sm">{pct}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">{nbObtenus} badge{nbObtenus > 1 ? 's' : ''}</p>
            <p className="text-noir-400 text-sm">{ALL_BADGES.length - nbObtenus} à débloquer</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.entries(CAT_COLORS).map(([cat, color]) => {
                const nb = badges.filter(b => ALL_BADGES.find(a => a.key === b.badge_key)?.categorie === cat).length
                if (nb === 0) return null
                return (
                  <span key={cat} className="text-xs px-2 py-0.5 rounded-full border"
                    style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
                    {nb} {cat}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[...CATEGORIES, 'Obtenus'].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === cat
                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                  : 'border-noir-700 text-noir-400 hover:border-noir-600'
              }`}>
              {cat}
              {cat === 'Obtenus' && <span className="ml-1 text-gold-500">{nbObtenus}</span>}
            </button>
          ))}
        </div>

        {/* Grille badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(b => {
            const obtained = obtenuKeys.has(b.key)
            const obtainedBadge = badges.find(x => x.badge_key === b.key)
            const color = CAT_COLORS[b.categorie] || '#f59e0b'

            return (
              <div key={b.key}
                className={`card flex flex-col items-center text-center gap-3 py-5 transition-all ${
                  obtained
                    ? 'border-gold-500/20 bg-gold-500/5 hover:border-gold-500/40'
                    : 'opacity-50 grayscale'
                }`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                  obtained ? '' : 'bg-noir-800'
                }`}
                  style={obtained ? { background: `${color}20`, border: `1px solid ${color}40` } : {}}>
                  {b.icon}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${obtained ? 'text-white' : 'text-noir-500'}`}>{b.nom}</p>
                  <p className="text-noir-500 text-xs mt-0.5 line-clamp-2">{b.desc}</p>
                  {obtained && obtainedBadge && (
                    <p className="text-xs mt-1.5" style={{ color }}>
                      {new Date(obtainedBadge.obtenu_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {!obtained && (
                    <p className="text-noir-700 text-xs mt-1.5">🔒 À débloquer</p>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full border"
                  style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
                  {b.categorie}
                </span>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏅</p>
            <p className="text-white font-medium">Aucun badge dans cette catégorie</p>
            <p className="text-noir-400 text-sm mt-1">Continuez à pratiquer pour en débloquer !</p>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}