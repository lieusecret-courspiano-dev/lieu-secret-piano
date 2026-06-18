'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { BookOpen, ChevronRight } from 'lucide-react'

interface Note {
  id: string; date_cours: string; resume: string | null; notions: string | null
  exercices: string | null; objectifs: string | null; commentaires: string | null
  created_at: string; updated_at?: string | null
}

const SECTIONS = [
  { key: 'resume',       label: 'Résumé du cours',       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  { key: 'notions',      label: 'Notions travaillées',    color: 'text-gold-400',   bg: 'bg-gold-500/10 border-gold-500/20' },
  { key: 'exercices',    label: 'Exercices demandés',     color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  { key: 'objectifs',    label: 'Objectifs de la semaine',color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'commentaires', label: 'Commentaires',           color: 'text-noir-300',   bg: 'bg-noir-800/60 border-noir-700' },
]

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [prenom, setPrenom] = useState('')
  const [nbMedias, setNbMedias] = useState(0)
  const [nbRessources, setNbRessources] = useState(0)
  const [nbTravaux, setNbTravaux] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Note | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/notes').then(r => r.json()),
      fetch('/api/partitions').then(r => r.json()),
      fetch('/api/eleve/ressources').then(r => r.json()),
      fetch('/api/eleve/travaux').then(r => r.json()),
    ]).then(([me, n, medias, res, travaux]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setNotes(Array.isArray(n) ? n : [])
      setNbMedias(Array.isArray(medias) ? medias.length : 0)
      setNbRessources(Array.isArray(res) ? res.length : 0)
      setNbTravaux(Array.isArray(travaux) ? travaux.filter((t: { termine: boolean }) => !t.termine).length : 0)
    }).finally(() => setLoading(false))
  }, [router])

  const filtered = notes.filter(n =>
    !search ||
    (n.resume || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.notions || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.objectifs || '').toLowerCase().includes(search.toLowerCase()) ||
    new Date(n.date_cours).toLocaleDateString('fr-FR').includes(search)
  )

  // Grouper par mois
  const grouped: Record<string, Note[]> = {}
  for (const note of filtered) {
    const key = new Date(note.date_cours).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(note)
  }

  return (
    <EleveLayout prenom={prenom} nbNotifs={0} nbMedias={nbMedias} nbRessources={nbRessources} nbTravaux={nbTravaux}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">

        {/* Titre */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Notes de cours</h1>
          <p className="text-noir-400 text-sm">Retrouvez toutes vos notes de cours classées par date</p>
        </div>

        {/* Recherche */}
        {notes.length > 0 && (
          <div className="relative mb-6">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans vos notes..." className="input pl-9 w-full max-w-sm" />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : notes.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="text-noir-600 mx-auto mb-4" />
            <p className="text-noir-400 text-lg font-medium">Aucune note pour le moment</p>
            <p className="text-noir-600 text-sm mt-1">Vos notes de cours apparaîtront ici après chaque séance.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([month, monthNotes]) => (
              <div key={month}>
                {/* En-tête du mois */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                  <h2 className="text-gold-400 text-sm font-bold uppercase tracking-widest capitalize">{month}</h2>
                  <div className="flex-1 h-px bg-noir-800" />
                  <span className="text-xs text-noir-600">{monthNotes.length} cours</span>
                </div>

                {/* Notes du mois */}
                <div className="space-y-2 ml-4">
                  {monthNotes.map(note => {
                    const hasContent = note.resume || note.notions || note.exercices || note.objectifs || note.commentaires
                    return (
                      <button
                        key={note.id}
                        onClick={() => setSelected(note)}
                        className="w-full card hover:border-gold-500/40 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-semibold text-sm capitalize">
                              {new Date(note.date_cours).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
                            </p>
                            {note.resume && (
                              <p className="text-noir-400 text-xs mt-0.5 line-clamp-1">{note.resume}</p>
                            )}
                            {!hasContent && (
                              <p className="text-noir-600 text-xs mt-0.5 italic">Note sans contenu</p>
                            )}
                            {/* Tags des sections remplies */}
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {SECTIONS.filter(s => note[s.key as keyof Note]).map(s => (
                                <span key={s.key} className={`text-xs px-1.5 py-0.5 rounded border ${s.bg} ${s.color}`}>
                                  {s.label.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-noir-600 group-hover:text-gold-400 transition-colors shrink-0" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modale détail note — style bloc-notes */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-t-2xl sm:rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col" style={{maxWidth:'560px'}}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 shrink-0">
                <div>
                  <p className="text-gold-400 font-bold capitalize">
                    {new Date(selected.date_cours).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  {selected.updated_at && selected.updated_at !== selected.created_at && (
                    <p className="text-noir-600 text-xs mt-0.5">
                      Modifié le {new Date(selected.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white p-1.5 rounded-lg hover:bg-noir-800 transition-colors">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Contenu — style bloc-notes */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {SECTIONS.filter(s => selected[s.key as keyof Note]).map(section => (
                  <div key={section.key} className={`rounded-xl border p-4 ${section.bg}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${section.color}`}>{section.label}</p>
                    <p className="text-noir-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {selected[section.key as keyof Note] as string}
                    </p>
                  </div>
                ))}
                {!SECTIONS.some(s => selected[s.key as keyof Note]) && (
                  <p className="text-noir-500 text-center py-8">Cette note ne contient pas encore de contenu.</p>
                )}
              </div>

              <div className="px-6 py-4 border-t border-noir-800 shrink-0">
                <button onClick={() => setSelected(null)} className="btn-outline w-full">Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}