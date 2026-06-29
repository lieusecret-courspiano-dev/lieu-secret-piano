'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'

interface Badge { id: string; badge_key: string; badge_nom: string; badge_desc: string | null; badge_icon: string | null; obtenu_at: string }

const ALL_BADGES = [
  { key: 'premier_cours',     nom: 'Premier cours',          desc: 'Vous avez réservé votre premier cours',           icon: 'piano',    categorie: 'Parcours' },
  { key: 'premier_journal',   nom: 'Premier pas',            desc: 'Première entrée dans le journal de pratique',     icon: 'journal',  categorie: 'Pratique' },
  { key: 'pratique_10h',      nom: '10h de pratique',        desc: 'Vous avez pratiqué 10 heures au total',           icon: 'clock',    categorie: 'Pratique' },
  { key: 'pratique_50h',      nom: '50h de pratique',        desc: 'Vous avez pratiqué 50 heures au total',           icon: 'target',   categorie: 'Pratique' },
  { key: 'pratique_100h',     nom: '100h de pratique',       desc: 'Vous avez pratiqué 100 heures au total',          icon: 'trophy',   categorie: 'Pratique' },
  { key: 'streak_4',          nom: 'Régularité 1 mois',      desc: '4 semaines consécutives de pratique',             icon: 'flame',    categorie: 'Régularité' },
  { key: 'streak_12',         nom: 'Régularité 3 mois',      desc: '12 semaines consécutives de pratique',            icon: 'bolt',     categorie: 'Régularité' },
  { key: 'cert_fondamentaux', nom: 'Fondamentaux',           desc: 'Certificat Fondamentaux du piano obtenu',         icon: 'diploma',  categorie: 'Certificats' },
  { key: 'cert_comprehension',nom: 'Compréhension',          desc: 'Certificat Compréhension et autonomie obtenu',    icon: 'music',    categorie: 'Certificats' },
  { key: 'cert_expression',   nom: 'Expression',             desc: 'Certificat Expression et maîtrise obtenu',        icon: 'star',     categorie: 'Certificats' },
  { key: 'diplome_final',     nom: 'Diplôme final',          desc: 'Formation complète Lieu Secret validée',          icon: 'medal',    categorie: 'Certificats' },
  { key: 'premier_objectif',  nom: 'Visionnaire',            desc: 'Premier objectif musical défini',                 icon: 'target',   categorie: 'Objectifs' },
  { key: 'objectif_atteint',  nom: 'Accomplissement',        desc: 'Premier objectif musical atteint',                icon: 'check',    categorie: 'Objectifs' },
  { key: 'premier_enreg',     nom: 'Première prise',         desc: 'Premier enregistrement envoyé au professeur',     icon: 'mic',      categorie: 'Engagement' },
  { key: 'premier_message',   nom: 'Communicant',            desc: 'Premier message envoyé au professeur',            icon: 'chat',     categorie: 'Engagement' },
  { key: 'quiz_fondamentaux', nom: 'Quiz Fondamentaux',      desc: 'Vous avez réussi un quiz de niveau Fondamentaux', icon: 'piano',    categorie: 'Quiz' },
  { key: 'quiz_comprehension',nom: 'Quiz Compréhension',     desc: 'Vous avez réussi un quiz de niveau Compréhension',icon: 'music',    categorie: 'Quiz' },
  { key: 'quiz_expression',   nom: 'Quiz Expression',        desc: 'Vous avez réussi un quiz de niveau Expression',   icon: 'trophy',   categorie: 'Quiz' },
]

const CATEGORIES = ['Tous', 'Parcours', 'Pratique', 'Régularité', 'Certificats', 'Objectifs', 'Engagement', 'Quiz']


function BadgeIcon({ icon, color = '#f59e0b', size = 28 }: { icon: string; color?: string; size?: number }) {
  const s = size
  const props = { width: s, height: s, fill: 'none', stroke: color, strokeWidth: 1.5 }
  switch (icon) {
    case 'piano':   return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v8M10 4v5M14 4v8M17 4v5"/></svg>
    case 'journal': return <svg {...props} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    case 'clock':   return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    case 'target':  return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    case 'trophy':  return <svg {...props} viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
    case 'flame':   return <svg {...props} viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
    case 'bolt':    return <svg {...props} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    case 'diploma': return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
    case 'music':   return <svg {...props} viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
    case 'star':    return <svg {...props} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    case 'medal':   return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
    case 'check':   return <svg {...props} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
    case 'mic':     return <svg {...props} viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
    case 'chat':    return <svg {...props} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    default:        return <svg {...props} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  }
}

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
          <div className="w-16 h-16 md:w-20 md:h-20 relative shrink-0">
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
                  <BadgeIcon icon={b.icon} color={color} />
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
                    <p className="text-noir-700 text-xs mt-1.5 flex items-center gap-1"><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> À débloquer</p>
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
            <div className="flex justify-center mb-3"><svg width="40" height="40" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div>
            <p className="text-white font-medium">Aucun badge dans cette catégorie</p>
            <p className="text-noir-400 text-sm mt-1">Continuez à pratiquer pour en débloquer !</p>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}