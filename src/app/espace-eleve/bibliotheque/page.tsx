'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

// Bibliothèque de gammes et accords
const GAMMES = [
  { nom: 'Do majeur',    notes: ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'], touches: [0,2,4,5,7,9,11,12] },
  { nom: 'Sol majeur',   notes: ['Sol', 'La', 'Si', 'Do', 'Ré', 'Mi', 'Fa#', 'Sol'], touches: [7,9,11,12,14,16,18,19] },
  { nom: 'Ré majeur',    notes: ['Ré', 'Mi', 'Fa#', 'Sol', 'La', 'Si', 'Do#', 'Ré'], touches: [2,4,6,7,9,11,13,14] },
  { nom: 'La majeur',    notes: ['La', 'Si', 'Do#', 'Ré', 'Mi', 'Fa#', 'Sol#', 'La'], touches: [9,11,13,14,16,18,20,21] },
  { nom: 'Mi majeur',    notes: ['Mi', 'Fa#', 'Sol#', 'La', 'Si', 'Do#', 'Ré#', 'Mi'], touches: [4,6,8,9,11,13,15,16] },
  { nom: 'Fa majeur',    notes: ['Fa', 'Sol', 'La', 'Sib', 'Do', 'Ré', 'Mi', 'Fa'], touches: [5,7,9,10,12,14,16,17] },
  { nom: 'La mineur',    notes: ['La', 'Si', 'Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La'], touches: [9,11,12,14,16,17,19,21] },
  { nom: 'Ré mineur',    notes: ['Ré', 'Mi', 'Fa', 'Sol', 'La', 'Sib', 'Do', 'Ré'], touches: [2,4,5,7,9,10,12,14] },
  { nom: 'Mi mineur',    notes: ['Mi', 'Fa#', 'Sol', 'La', 'Si', 'Do', 'Ré', 'Mi'], touches: [4,6,7,9,11,12,14,16] },
]

const ACCORDS = [
  { nom: 'Do majeur',  symbole: 'C',   notes: ['Do', 'Mi', 'Sol'],       touches: [0,4,7],    couleur: '#3b82f6' },
  { nom: 'Ré majeur',  symbole: 'D',   notes: ['Ré', 'Fa#', 'La'],       touches: [2,6,9],    couleur: '#8b5cf6' },
  { nom: 'Mi majeur',  symbole: 'E',   notes: ['Mi', 'Sol#', 'Si'],       touches: [4,8,11],   couleur: '#ec4899' },
  { nom: 'Fa majeur',  symbole: 'F',   notes: ['Fa', 'La', 'Do'],         touches: [5,9,12],   couleur: '#f59e0b' },
  { nom: 'Sol majeur', symbole: 'G',   notes: ['Sol', 'Si', 'Ré'],        touches: [7,11,14],  couleur: '#10b981' },
  { nom: 'La majeur',  symbole: 'A',   notes: ['La', 'Do#', 'Mi'],        touches: [9,13,16],  couleur: '#ef4444' },
  { nom: 'Si majeur',  symbole: 'B',   notes: ['Si', 'Ré#', 'Fa#'],       touches: [11,15,18], couleur: '#06b6d4' },
  { nom: 'La mineur',  symbole: 'Am',  notes: ['La', 'Do', 'Mi'],         touches: [9,12,16],  couleur: '#6366f1' },
  { nom: 'Ré mineur',  symbole: 'Dm',  notes: ['Ré', 'Fa', 'La'],         touches: [2,5,9],    couleur: '#84cc16' },
  { nom: 'Mi mineur',  symbole: 'Em',  notes: ['Mi', 'Sol', 'Si'],        touches: [4,7,11],   couleur: '#f97316' },
  { nom: 'Do 7',       symbole: 'C7',  notes: ['Do', 'Mi', 'Sol', 'Sib'], touches: [0,4,7,10], couleur: '#3b82f6' },
  { nom: 'Sol 7',      symbole: 'G7',  notes: ['Sol', 'Si', 'Ré', 'Fa'],  touches: [7,11,14,17],couleur: '#10b981' },
]

// Clavier piano SVG — 2 octaves (Do à Si)
// Numérotation : 0=Do 1=Do# 2=Ré 3=Ré# 4=Mi 5=Fa 6=Fa# 7=Sol
//               8=Sol# 9=La 10=La# 11=Si 12=Do 13=Do# 14=Ré 15=Ré#
//               16=Mi 17=Fa 18=Fa# 19=Sol 20=Sol# 21=La 22=La# 23=Si
function MiniPiano({ highlighted }: { highlighted: number[] }) {
  // 14 touches blanches sur 2 octaves : C D E F G A B | C D E F G A B
  const WHITE_NOTES = [0,2,4,5,7,9,11, 12,14,16,17,19,21,23]

  // Touches noires : centrées sur le BORD entre deux touches blanches consécutives.
  // Sur un vrai piano il n'y a PAS de touche noire entre Mi-Fa (blanc[2]-blanc[3])
  // ni entre Si-Do (blanc[6]-blanc[7] et blanc[13]-...).
  // La touche noire est centrée à (index_blanc_gauche + 1) * ww
  // ex : C# est entre blanc[0]=Do et blanc[1]=Ré → centre = 1 * ww
  //      D# est entre blanc[1]=Ré et blanc[2]=Mi → centre = 2 * ww
  //      F# est entre blanc[3]=Fa et blanc[4]=Sol → centre = 4 * ww  (pas 3, car Mi-Fa sans noire)
  //      G# est entre blanc[4]=Sol et blanc[5]=La → centre = 5 * ww
  //      A# est entre blanc[5]=La et blanc[6]=Si  → centre = 6 * ww
  // Octave 2 : même logique décalée de 7
  const BLACK_NOTES = [
    { note: 1,  cx: 1  }, // C#  : bord Do|Ré
    { note: 3,  cx: 2  }, // D#  : bord Ré|Mi
    // Mi-Fa : PAS de touche noire
    { note: 6,  cx: 4  }, // F#  : bord Fa|Sol
    { note: 8,  cx: 5  }, // G#  : bord Sol|La
    { note: 10, cx: 6  }, // A#  : bord La|Si
    // Si-Do : PAS de touche noire
    { note: 13, cx: 8  }, // C#2 : bord Do|Ré
    { note: 15, cx: 9  }, // D#2 : bord Ré|Mi
    // Mi-Fa : PAS de touche noire
    { note: 18, cx: 11 }, // F#2 : bord Fa|Sol
    { note: 20, cx: 12 }, // G#2 : bord Sol|La
    { note: 22, cx: 13 }, // A#2 : bord La|Si
  ]

  const W  = 560
  const H  = 160
  const ww = W / 14        // largeur d'une touche blanche
  const bw = ww * 0.55     // largeur touche noire (légèrement plus étroite)
  const bh = H * 0.62      // hauteur touche noire

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-noir-700" style={{ maxHeight: 180, background: '#0d0d1f' }}>
      <rect width={W} height={H} fill="#0d0d1f" rx="10"/>

      {/* ── Touches blanches (dessinées en premier) ── */}
      {WHITE_NOTES.map((note, i) => {
        const lit = highlighted.includes(note)
        return (
          <g key={`w-${i}`}>
            <rect
              x={i * ww + 1.5}
              y={4}
              width={ww - 3}
              height={H - 8}
              rx={5}
              fill={lit ? '#f59e0b' : '#f2f2f2'}
              stroke={lit ? '#d97706' : '#999999'}
              strokeWidth={1}
            />
            {lit && (
              <circle cx={i * ww + ww / 2} cy={H - 18} r={7} fill="#d97706" opacity={0.85}/>
            )}
          </g>
        )
      })}

      {/* ── Touches noires (dessinées par-dessus) ── */}
      {BLACK_NOTES.map(({ note, cx: cxIdx }) => {
        const lit = highlighted.includes(note)
        const px  = cxIdx * ww   // centre en pixels = index_bord × largeur_touche_blanche
        return (
          <g key={`b-${note}`}>
            <rect
              x={px - bw / 2}
              y={4}
              width={bw}
              height={bh}
              rx={4}
              fill={lit ? '#f59e0b' : '#0e0e20'}
              stroke={lit ? '#d97706' : '#2a2a4a'}
              strokeWidth={1}
            />
            {lit && (
              <circle cx={px} cy={bh - 10} r={5} fill="#d97706" opacity={0.9}/>
            )}
          </g>
        )
      })}

      {/* Séparateur d'octave */}
      <line x1={7 * ww} y1={H - 24} x2={7 * ww} y2={H - 6} stroke="#f59e0b" strokeWidth={1} opacity={0.3}/>
    </svg>
  )
}

export default function BibliothequeePage() {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [tab, setTab] = useState<'gammes' | 'accords'>('accords')
  const [selected, setSelected] = useState<typeof ACCORDS[0] | typeof GAMMES[0] | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()).then(me => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
    })
  }, [router])

  const filteredAccords = ACCORDS.filter(a => a.nom.toLowerCase().includes(search.toLowerCase()) || a.symbole.toLowerCase().includes(search.toLowerCase()))
  const filteredGammes = GAMMES.filter(g => g.nom.toLowerCase().includes(search.toLowerCase()))

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-4 md:p-8 pb-24 md:pb-4 md:pb-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Bibliothèque musicale</h1>
          <p className="text-noir-400 text-sm">Référence des gammes et accords — consultez pendant vos pratiques</p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1 mb-4 w-fit">
          <button onClick={() => setTab('accords')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'accords' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Accords</button>
          <button onClick={() => setTab('gammes')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'gammes' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Gammes</button>
        </div>

        {/* Recherche */}
        <div className="relative mb-6">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Rechercher un ${tab === 'accords' ? 'accord' : 'gamme'}...`} className="input pl-9 w-full max-w-sm" />
        </div>

        {tab === 'accords' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {filteredAccords.map(accord => (
              <button key={accord.symbole} onClick={() => setSelected(selected?.nom === accord.nom ? null : accord)}
                className={`card text-center py-4 transition-all hover:border-gold-500/40 ${selected?.nom === accord.nom ? 'border-gold-500/50 bg-gold-500/5' : ''}`}>
                <div className="text-3xl font-bold mb-1" style={{ color: accord.couleur }}>{accord.symbole}</div>
                <p className="text-white text-sm font-medium">{accord.nom}</p>
                <p className="text-noir-500 text-xs mt-1">{accord.notes.join(' - ')}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            {filteredGammes.map(gamme => (
              <button key={gamme.nom} onClick={() => setSelected(selected?.nom === gamme.nom ? null : gamme)}
                className={`card text-left py-4 transition-all hover:border-gold-500/40 ${selected?.nom === gamme.nom ? 'border-gold-500/50 bg-gold-500/5' : ''}`}>
                <p className="text-white font-semibold text-sm mb-1">{gamme.nom}</p>
                <p className="text-noir-400 text-xs">{gamme.notes.join(' · ')}</p>
              </button>
            ))}
          </div>
        )}

        {/* Panneau détail avec clavier - centré et visible */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-2xl p-5 shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-lg">{'symbole' in selected ? selected.symbole : selected.nom}</p>
                  <p className="text-noir-400 text-sm">{selected.nom}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white p-1">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="flex gap-2 flex-wrap mb-4">
                {selected.notes.map((n, i) => (
                  <span key={i} className="px-2.5 py-1.5 bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs rounded-lg font-medium">{n}</span>
                ))}
              </div>
              <MiniPiano highlighted={selected.touches} />
              <p className="text-noir-600 text-xs mt-2 text-center">Les touches dorées indiquent les notes</p>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}