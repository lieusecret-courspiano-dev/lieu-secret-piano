'use client'
import { useState } from 'react'
import EleveLayout from '@/components/EleveNav'

const FICHES = [
  {
    id: 'gammes-majeures', categorie: 'Fondamentaux', titre: 'Gammes majeures',
    resume: 'Une gamme majeure suit le schéma : Ton - Ton - Demi-ton - Ton - Ton - Ton - Demi-ton',
    details: [
      'Do majeur : Do Ré Mi Fa Sol La Si Do',
      'Sol majeur : Sol La Si Do Ré Mi Fa# Sol',
      'Ré majeur : Ré Mi Fa# Sol La Si Do# Ré',
      'La majeur : La Si Do# Ré Mi Fa# Sol# La',
      'Fa majeur : Fa Sol La Sib Do Ré Mi Fa',
    ],
    couleur: '#3b82f6',
  },
  {
    id: 'accords-majeurs', categorie: 'Fondamentaux', titre: 'Accords majeurs',
    resume: 'Un accord majeur = fondamentale + tierce majeure (4 demi-tons) + quinte juste (7 demi-tons)',
    details: [
      'Do majeur : Do - Mi - Sol',
      'Ré majeur : Ré - Fa# - La',
      'Mi majeur : Mi - Sol# - Si',
      'Fa majeur : Fa - La - Do',
      'Sol majeur : Sol - Si - Ré',
      'La majeur : La - Do# - Mi',
    ],
    couleur: '#f59e0b',
  },
  {
    id: 'accords-mineurs', categorie: 'Fondamentaux', titre: 'Accords mineurs',
    resume: 'Un accord mineur = fondamentale + tierce mineure (3 demi-tons) + quinte juste (7 demi-tons)',
    details: [
      'La mineur : La - Do - Mi',
      'Ré mineur : Ré - Fa - La',
      'Mi mineur : Mi - Sol - Si',
      'Si mineur : Si - Ré - Fa#',
      'Do mineur : Do - Mib - Sol',
    ],
    couleur: '#8b5cf6',
  },
  {
    id: 'intervalles', categorie: 'Fondamentaux', titre: 'Intervalles',
    resume: 'Un intervalle mesure la distance entre deux notes en demi-tons',
    details: [
      '1 demi-ton = seconde mineure (Do → Do#)',
      '2 demi-tons = seconde majeure (Do → Ré)',
      '3 demi-tons = tierce mineure (Do → Mib)',
      '4 demi-tons = tierce majeure (Do → Mi)',
      '5 demi-tons = quarte juste (Do → Fa)',
      '7 demi-tons = quinte juste (Do → Sol)',
      '12 demi-tons = octave (Do → Do)',
    ],
    couleur: '#34d399',
  },
  {
    id: 'renversements', categorie: 'Compréhension', titre: "Renversements d'accords",
    resume: "Renverser un accord = changer la note la plus basse sans changer les notes",
    details: [
      'Do majeur (état fondamental) : Do - Mi - Sol',
      '1er renversement : Mi - Sol - Do',
      '2ème renversement : Sol - Do - Mi',
      'Notation : C/E = Do majeur avec Mi à la basse',
      'Notation : C/G = Do majeur avec Sol à la basse',
    ],
    couleur: '#f97316',
  },
  {
    id: 'progressions', categorie: 'Compréhension', titre: 'Progressions harmoniques',
    resume: 'Les progressions les plus courantes en musique populaire et gospel',
    details: [
      'I - IV - V : Do - Fa - Sol (très courante)',
      'I - V - vi - IV : Do - Sol - Lam - Fa (pop)',
      'ii - V - I : Rém - Sol - Do (jazz)',
      'I - vi - IV - V : Do - Lam - Fa - Sol',
      'Accords magiques : I - V - vi - iii - IV',
    ],
    couleur: '#ec4899',
  },
  {
    id: 'rythmes', categorie: 'Compréhension', titre: "Rythmes d'accompagnement",
    resume: "Patterns rythmiques pour accompagner à la main gauche",
    details: [
      'Alberti bass : fondamentale - quinte - tierce - quinte',
      'Arpège montant : Do - Mi - Sol - Do',
      'Arpège descendant : Do - Sol - Mi - Do',
      "Block chords : jouer l'accord complet en bloc",
      'Stride : basse alternée avec accord',
    ],
    couleur: '#60a5fa',
  },
  {
    id: 'lecture-notes', categorie: 'Fondamentaux', titre: 'Lecture des notes',
    resume: 'Les notes sur la portée en clé de Sol et clé de Fa',
    details: [
      'Clé de Sol (main droite) : Mi Fa Sol La Si Do Ré Mi Fa',
      'Lignes : Mi - Sol - Si - Ré - Fa (Mon Cher Solfège Donne Fa)',
      'Espaces : Fa - La - Do - Mi',
      'Clé de Fa (main gauche) : Sol La Si Do Ré Mi Fa Sol La',
      'Lignes : Sol - Si - Ré - Fa - La',
    ],
    couleur: '#a78bfa',
  },
]

const CATEGORIES = ['Tous', 'Fondamentaux', 'Compréhension']

export default function FichesPage() {
  const [selected, setSelected] = useState<typeof FICHES[0] | null>(null)
  const [categorie, setCategorie] = useState('Tous')
  const [search, setSearch] = useState('')

  const filtered = FICHES.filter(f =>
    (categorie === 'Tous' || f.categorie === categorie) &&
    (!search || f.titre.toLowerCase().includes(search.toLowerCase()) || f.resume.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-4 md:p-8 pb-24 md:pb-4 md:pb-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-white">Fiches de révision</h1>
          <p className="text-noir-400 text-sm mt-1">Révisions rapides — 30 secondes par fiche</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une fiche..." className="input flex-1" />
          <div className="flex gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategorie(c)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${categorie === c ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          /* ── Fiche détaillée ── */
          <div>
            <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-noir-400 hover:text-white text-sm mb-4 transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              Retour aux fiches
            </button>
            <div className="card" style={{ borderColor: `${selected.couleur}30` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${selected.couleur}15` }}>
                  <svg width="18" height="18" fill="none" stroke={selected.couleur} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: selected.couleur }}>{selected.categorie}</p>
                  <h2 className="font-serif text-xl text-white">{selected.titre}</h2>
                </div>
              </div>
              <div className="bg-noir-800/50 rounded-xl p-4 mb-4">
                <p className="text-white text-sm leading-relaxed font-medium">{selected.resume}</p>
              </div>
              <div className="space-y-2">
                {selected.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-noir-800 last:border-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold" style={{ background: `${selected.couleur}20`, color: selected.couleur }}>{i + 1}</div>
                    <p className="text-noir-300 text-sm">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Grille des fiches ── */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(fiche => (
              <button key={fiche.id} onClick={() => setSelected(fiche)}
                className="card text-left hover:-translate-y-0.5 transition-all group"
                style={{ borderColor: `${fiche.couleur}20` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${fiche.couleur}15` }}>
                    <svg width="14" height="14" fill="none" stroke={fiche.couleur} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: fiche.couleur }}>{fiche.categorie}</span>
                </div>
                <h3 className="text-white font-semibold text-sm mb-2 group-hover:text-gold-400 transition-colors">{fiche.titre}</h3>
                <p className="text-noir-500 text-xs leading-relaxed line-clamp-2">{fiche.resume}</p>
                <p className="text-xs mt-3" style={{ color: fiche.couleur }}>{fiche.details.length} points →</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <p className="text-noir-400">Aucune fiche trouvée</p>
              </div>
            )}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
