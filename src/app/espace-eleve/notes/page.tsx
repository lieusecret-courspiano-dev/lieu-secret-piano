'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

interface Note { id: string; date_cours: string; resume: string | null; notions: string | null; exercices: string | null; objectifs: string | null; commentaires: string | null; created_at: string }

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Note | null>(null)

  useEffect(() => {
    Promise.all([fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()), fetch('/api/eleve/notes').then(r => r.json())]).then(([me, n]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom); setNotes(Array.isArray(n) ? n : [])
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-6 md:p-8">
        <h1 className="font-serif text-2xl text-white mb-6 animate-fade-in-up">Notes de Cours</h1>
        {notes.length === 0 ? <div className="card text-center py-12"><p className="text-noir-400">Vos notes de cours apparaîtront ici après chaque séance.</p></div> : (
          <div className="grid md:grid-cols-2 gap-4">{notes.map(note => (<div key={note.id} onClick={() => setSelected(note)} className="card cursor-pointer hover:border-gold-500/30 transition-all"><p className="text-gold-400 font-medium text-sm">{new Date(note.date_cours).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>{note.resume && <p className="text-noir-300 text-sm mt-1 line-clamp-2">{note.resume}</p>}{note.objectifs && <p className="text-noir-500 text-xs mt-2 line-clamp-1">Objectifs : {note.objectifs}</p>}</div>))}</div>
        )}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 sticky top-0 bg-noir-900"><h2 className="text-gold-400 font-medium">{new Date(selected.date_cours).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</h2><button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
              <div className="p-6 space-y-4 overflow-y-auto">{[{ label: 'Résumé', value: selected.resume }, { label: 'Notions travaillées', value: selected.notions }, { label: 'Exercices demandés', value: selected.exercices }, { label: 'Objectifs', value: selected.objectifs }, { label: 'Commentaires', value: selected.commentaires }].filter(i => i.value).map((item, i) => (<div key={i}><p className="label mb-1">{item.label}</p><p className="text-noir-200 text-sm whitespace-pre-wrap">{item.value}</p></div>))}</div>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
