'use client'
import SubNav from '@/components/eleve/SubNav'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { DateTime } from 'luxon'

interface Reservation { id: string; slot_start: string; slot_end: string; status: string; type: string }
interface Note { id: string; date_cours: string; resume: string | null; notions: string | null }
interface Badge { badge_nom: string; badge_icon: string | null; obtenu_at: string }
interface Certificat { nom_certificat: string; numero: string; created_at: string }

interface TimelineItem {
  date: string
  type: 'cours' | 'note' | 'badge' | 'certificat' | 'inscription'
  titre: string
  sous_titre?: string
  icon: string
  color: string
}

export default function HistoriquePage() {
  const router = useRouter()
  const [items, setItems] = useState<TimelineItem[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/reservations').then(r => r.json()),
      fetch('/api/eleve/notes').then(r => r.json()),
      fetch('/api/eleve/badges').then(r => r.json()),
      fetch('/api/eleve/certificats').then(r => r.json()),
    ]).then(([me, reservations, notes, badges, certificats]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)

      const timeline: TimelineItem[] = []

      // Cours
      ;(Array.isArray(reservations) ? reservations : []).filter((r: Reservation) => r.status === 'confirmed' && new Date(r.slot_start) < new Date()).forEach((r: Reservation) => {
        timeline.push({
          date: r.slot_start,
          type: 'cours',
          titre: 'Cours de piano',
          sous_titre: DateTime.fromISO(r.slot_start, { zone: 'utc' }).setZone('Europe/Paris').toFormat('HH:mm'),
          icon: 'piano',
          color: 'border-blue-500/30 bg-blue-500/5',
        })
      })

      // Notes de cours
      ;(Array.isArray(notes) ? notes : []).forEach((n: Note) => {
        if (n.resume) {
          timeline.push({
            date: n.date_cours,
            type: 'note',
            titre: 'Note de cours',
            sous_titre: n.resume.substring(0, 60) + (n.resume.length > 60 ? '...' : ''),
            icon: 'note',
            color: 'border-yellow-500/30 bg-yellow-500/5',
          })
        }
      })

      // Badges
      ;(Array.isArray(badges) ? badges : []).forEach((b: Badge) => {
        timeline.push({
          date: b.obtenu_at,
          type: 'badge',
          titre: `Badge : ${b.badge_nom}`,
          icon: 'badge',
          color: 'border-gold-500/30 bg-gold-500/5',
        })
      })

      // Certificats
      ;(Array.isArray(certificats) ? certificats : []).forEach((c: Certificat) => {
        timeline.push({
          date: c.created_at,
          type: 'certificat',
          titre: `Certificat : ${c.nom_certificat}`,
          sous_titre: c.numero,
          icon: 'cert',
          color: 'border-green-500/30 bg-green-500/5',
        })
      })

      // Trier par date décroissante
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setItems(timeline)
    }).finally(() => setLoading(false))
  }, [router])

  const FILTERS = [
    { value: 'tous', label: 'Tout' },
    { value: 'cours', label: 'Cours' },
    { value: 'note', label: 'Notes' },
    { value: 'badge', label: 'Badges' },
    { value: 'certificat', label: 'Certificats' },
  ]

  const filtered = filter === 'tous' ? items : items.filter(i => i.type === filter)

  // Grouper par mois
  const grouped: Record<string, TimelineItem[]> = {}
  for (const item of filtered) {
    const key = new Date(item.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-4 md:p-8 pb-24 md:pb-4 md:pb-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Mon parcours</h1>
        <SubNav items={[{href:'/espace-eleve/progression',label:'Progression'},{href:'/espace-eleve/objectifs',label:'Objectifs'},{href:'/espace-eleve/badges',label:'Badges'},{href:'/espace-eleve/historique',label:'Parcours'}]} />
          <p className="text-noir-400 text-sm">L'historique complet de votre aventure musicale</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Cours suivis', value: items.filter(i => i.type === 'cours').length, color: 'text-blue-400' },
            { label: 'Notes de cours', value: items.filter(i => i.type === 'note').length, color: 'text-yellow-400' },
            { label: 'Badges', value: items.filter(i => i.type === 'badge').length, color: 'text-gold-400' },
            { label: 'Certificats', value: items.filter(i => i.type === 'certificat').length, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-noir-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1 mb-6 w-fit flex-wrap">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.value ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-noir-400 text-lg">Aucun élément dans votre historique</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([month, monthItems]) => (
              <div key={month}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-gold-500 shrink-0" />
                  <h2 className="text-gold-400 text-sm font-bold uppercase tracking-widest capitalize">{month}</h2>
                  <div className="flex-1 h-px bg-noir-800" />
                  <span className="text-xs text-noir-600">{monthItems.length} événement{monthItems.length > 1 ? 's' : ''}</span>
                </div>

                <div className="relative ml-1.5">
                  {/* Ligne verticale */}
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-noir-800" />

                  <div className="space-y-3 pl-6">
                    {monthItems.map((item, i) => (
                      <div key={i} className="relative">
                        {/* Point sur la timeline */}
                        <div className="absolute -left-6 top-3 w-3 h-3 rounded-full bg-noir-900 border-2 border-noir-700 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                        </div>

                        <div className={`card border ${item.color} transition-all hover:border-gold-500/40`}>
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 w-8 h-8 flex items-center justify-center">
                              {item.icon === 'piano' && <svg width="22" height="22" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="13"/><line x1="12" y1="3" x2="12" y2="13"/><line x1="17" y1="3" x2="17" y2="13"/></svg>}
                              {item.icon === 'note' && <svg width="22" height="22" fill="none" stroke="#fbbf24" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                              {item.icon === 'badge' && <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>}
                              {item.icon === 'cert' && <svg width="22" height="22" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-semibold text-sm">{item.titre}</p>
                              {item.sous_titre && <p className="text-noir-400 text-xs mt-0.5">{item.sous_titre}</p>}
                              <p className="text-noir-600 text-xs mt-1">
                                {new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                {item.type === 'cours' && item.sous_titre && ` à ${item.sous_titre}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}