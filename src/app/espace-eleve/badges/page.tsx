'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

interface Badge { id: string; badge_key: string; badge_nom: string; badge_desc: string | null; badge_icon: string | null; obtenu_at: string }

// Tous les badges possibles (obtenus ou non)
const ALL_BADGES = [
  { key: 'premier_cours',    nom: 'Premier cours',         desc: 'Vous avez réservé votre premier cours',          icon: 'SVG_premier_cours', categorie: 'Parcours' },
  { key: 'premier_journal',  nom: 'Premier pas',           desc: 'Première entrée dans le journal de pratique',    icon: 'SVG_premier_journal', categorie: 'Pratique' },
  { key: 'pratique_10h',     nom: '10 heures de pratique', desc: 'Vous avez pratiqué 10 heures au total',          icon: 'SVG_pratique_10h', categorie: 'Pratique' },
  { key: 'pratique_50h',     nom: '50 heures de pratique', desc: 'Vous avez pratiqué 50 heures au total',          icon: 'SVG_pratique_50h', categorie: 'Pratique' },
  { key: 'pratique_100h',    nom: '100 heures de pratique',desc: 'Vous avez pratiqué 100 heures au total',         icon: 'SVG_pratique_100h', categorie: 'Pratique' },
  { key: 'streak_4',         nom: 'Régularité 1 mois',     desc: '4 semaines consécutives de pratique',            icon: 'SVG_streak_4', categorie: 'Régularité' },
  { key: 'streak_12',        nom: 'Régularité 3 mois',     desc: '12 semaines consécutives de pratique',           icon: 'SVG_streak_12', categorie: 'Régularité' },
  { key: 'cert_fondamentaux',nom: 'Fondamentaux',          desc: 'Certificat Fondamentaux du piano obtenu',        icon: 'SVG_cert_fondamentaux', categorie: 'Certificats' },
  { key: 'cert_comprehension',nom: 'Compréhension',        desc: 'Certificat Compréhension et autonomie obtenu',   icon: 'SVG_cert_comprehension', categorie: 'Certificats' },
  { key: 'cert_expression',  nom: 'Expression',            desc: 'Certificat Expression et maîtrise obtenu',       icon: 'SVG_cert_expression', categorie: 'Certificats' },
  { key: 'diplome_final',    nom: 'Diplôme final',         desc: 'Formation complète Lieu Secret validée',         icon: 'SVG_diplome_final', categorie: 'Certificats' },
  { key: 'premier_objectif', nom: 'Visionnaire',           desc: 'Premier objectif musical défini',                icon: 'SVG_premier_objectif', categorie: 'Objectifs' },
  { key: 'objectif_atteint', nom: 'Accomplissement',       desc: 'Premier objectif musical atteint',               icon: 'SVG_objectif_atteint', categorie: 'Objectifs' },
  { key: 'premier_enreg',    nom: 'Première prise',        desc: 'Premier enregistrement envoyé au professeur',    icon: 'SVG_premier_enreg', categorie: 'Engagement' },
  { key: 'premier_message',  nom: 'Communicant',           desc: 'Premier message envoyé au professeur',           icon: 'SVG_premier_message', categorie: 'Engagement' },
  { key: 'quiz_fondamentaux', nom: 'Quiz Fondamentaux',     desc: 'Vous avez réussi un quiz de niveau Fondamentaux', icon: 'SVG_quiz_fondamentaux', categorie: 'Quiz' },
  { key: 'quiz_comprehension',nom: 'Quiz Compréhension',    desc: 'Vous avez réussi un quiz de niveau Compréhension',icon: 'SVG_quiz_comprehension', categorie: 'Quiz' },
  { key: 'quiz_expression',   nom: 'Quiz Expression',       desc: 'Vous avez réussi un quiz de niveau Expression',   icon: 'SVG_quiz_expression', categorie: 'Quiz' },
]

const CATEGORIES = ['Tous', 'Parcours', 'Pratique', 'Régularité', 'Certificats', 'Objectifs', 'Engagement']


const BADGE_ICONS: Record<string, React.ReactNode> = {
  premier_cours:     <svg width="32" height="32" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg>,
  premier_journal:   <svg width="32" height="32" fill="none" stroke="#fbbf24" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  pratique_10h:      <svg width="32" height="32" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  pratique_50h:      <svg width="32" height="32" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  pratique_100h:     <svg width="32" height="32" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  streak_4:          <svg width="32" height="32" fill="none" stroke="#fb923c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  streak_12:         <svg width="32" height="32" fill="none" stroke="#fbbf24" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  cert_fondamentaux: <svg width="32" height="32" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  cert_comprehension:<svg width="32" height="32" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  cert_expression:   <svg width="32" height="32" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  diplome_final:     <svg width="32" height="32" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 20h20M5 20l-2-9 5 4 4-8 4 8 5-4-2 9"/></svg>,
  premier_objectif:  <svg width="32" height="32" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="#34d399"/></svg>,
  objectif_atteint:  <svg width="32" height="32" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  premier_enreg:     <svg width="32" height="32" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  premier_message:   <svg width="32" height="32" fill="none" stroke="#34d399" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  quiz_fondamentaux: <svg width="32" height="32" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg>,
  quiz_comprehension: <svg width="32" height="32" fill="none" stroke="#a78bfa" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  quiz_expression:   <svg width="32" height="32" fill="none" stroke="#fbbf24" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

function BadgeIcon({ badgeKey, obtained }: { badgeKey: string; obtained: boolean }) {
  const icon = BADGE_ICONS[badgeKey]
  if (!icon) return <svg width="32" height="32" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
  return <span className={obtained ? '' : 'grayscale opacity-50'}>{icon}</span>
}

export default function BadgesPage() {
  const router = useRouter()
  const [badges, setBadges] = useState<Badge[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('Tous')

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/badges').then(r => r.json()),
    ]).then(([me, data]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setBadges(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [router])

  const obtenuKeys = new Set(badges.map(b => b.badge_key))
  const filtered = ALL_BADGES.filter(b => filterCat === 'Tous' || b.categorie === filterCat)
  const nbObtenus = ALL_BADGES.filter(b => obtenuKeys.has(b.key)).length
  const pct = Math.round((nbObtenus / ALL_BADGES.length) * 100)

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Mes badges</h1>
          <p className="text-noir-400 text-sm">Récompenses obtenues au fil de votre parcours musical</p>
        </div>

        {/* Progression globale */}
        <div className="card border-gold-500/20 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold">Collection de badges</p>
              <p className="text-noir-400 text-sm">{nbObtenus} / {ALL_BADGES.length} badges obtenus</p>
            </div>
            <span className="text-3xl font-bold text-gold-400">{pct}%</span>
          </div>
          <div className="w-full bg-noir-800 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full bg-gold-500 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-1 flex-wrap bg-noir-800 border border-noir-700 rounded-xl p-1 mb-6 w-fit">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCat === cat ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {filtered.map(b => {
              const obtained = obtenuKeys.has(b.key)
              const obtainedBadge = badges.find(x => x.badge_key === b.key)
              return (
                <div key={b.key} className={`card text-center py-5 transition-all ${obtained ? 'border-gold-500/30 bg-gold-500/5' : 'opacity-40'}`}>
                  <div className={`mb-3 flex justify-center ${obtained ? '' : 'opacity-30'}`}>
                    <BadgeIcon badgeKey={b.key} obtained={obtained} />
                  </div>
                  <p className={`font-semibold text-sm mb-1 ${obtained ? 'text-white' : 'text-noir-500'}`}>{b.nom}</p>
                  <p className="text-noir-500 text-xs leading-relaxed">{b.desc}</p>
                  {obtained && obtainedBadge && (
                    <p className="text-gold-400 text-[10px] mt-2 font-medium">
                      {new Date(obtainedBadge.obtenu_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {!obtained && (
                    <p className="text-noir-700 text-[10px] mt-2">Non obtenu</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}