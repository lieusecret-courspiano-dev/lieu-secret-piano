'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'
import { EmptyState } from '@/components/eleve/EmptyState'

interface Note {
  id: string
  titre: string | null
  contenu?: string
  resume?: string | null
  notions?: string | null
  exercices?: string | null
  objectifs?: string | null
  commentaires?: string | null
  date_cours: string | null
  created_at: string
}

function getNoteContent(note: Note): string {
  if (note.contenu) return note.contenu
  const parts = []
  if (note.resume) parts.push(`📝 Résumé\n${note.resume}`)
  if (note.notions) parts.push(`🎵 Notions travaillées\n${note.notions}`)
  if (note.exercices) parts.push(`🎯 Exercices\n${note.exercices}`)
  if (note.objectifs) parts.push(`⭐ Objectifs\n${note.objectifs}`)
  if (note.commentaires) parts.push(`💬 Commentaires\n${note.commentaires}`)
  return parts.join('\n\n') || 'Aucun contenu'
}

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Note | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/eleve/notes')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) { setNotes(d); if (d.length > 0) setSelected(d[0]) } })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  const filtered = notes.filter(n =>
    !search ||
    (n.titre || '').toLowerCase().includes(search.toLowerCase()) ||
    getNoteContent(n).toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 grid md:grid-cols-3 gap-4">
        <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-20" />)}</div>
        <div className="md:col-span-2"><SkeletonCard className="h-96" /></div>
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-serif text-white mb-1">Notes de cours</h1>
          <p className="text-noir-400 text-sm">{notes.length} note{notes.length > 1 ? 's' : ''} de votre professeur</p>
        </div>

        {notes.length === 0 ? (
          <EmptyState
            icon={<svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
            title="Aucune note de cours"
            description="Votre professeur ajoutera des notes après chaque cours"
          />
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {/* Liste */}
            <div className="space-y-2">
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input w-full mb-3" placeholder="Rechercher..." />
              {filtered.map(note => (
                <button key={note.id} onClick={() => setSelected(note)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selected?.id === note.id
                      ? 'bg-gold-500/10 border-gold-500/30'
                      : 'bg-noir-900 border-noir-800 hover:border-noir-700'
                  }`}>
                  <p className={`text-sm font-medium truncate ${selected?.id === note.id ? 'text-gold-400' : 'text-white'}`}>
                    {note.titre || 'Note sans titre'}
                  </p>
                  {note.date_cours && (
                    <p className="text-noir-500 text-xs mt-0.5">
                      {new Date(note.date_cours).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <p className="text-noir-600 text-xs mt-1 line-clamp-2">{getNoteContent(note)}</p>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-noir-500 text-sm text-center py-4">Aucun résultat</p>
              )}
            </div>

            {/* Contenu */}
            <div className="md:col-span-2">
              {selected ? (
                <div className="card h-full">
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-noir-800">
                    <div>
                      <h2 className="text-white font-bold text-lg">{selected.titre || 'Note sans titre'}</h2>
                      {selected.date_cours && (
                        <p className="text-noir-400 text-sm mt-0.5">
                          Cours du {new Date(selected.date_cours).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-noir-600">
                      {new Date(selected.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-noir-300 leading-relaxed whitespace-pre-wrap">{getNoteContent(selected)}</p>
                  </div>
                </div>
              ) : (
                <div className="card flex items-center justify-center h-64">
                  <p className="text-noir-500 text-sm">Sélectionnez une note</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}