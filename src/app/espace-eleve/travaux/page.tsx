'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { CheckCircle, Circle, Clock, AlertTriangle, BookOpen } from 'lucide-react'

interface TravailEleve {
  id: string
  termine: boolean
  termine_at: string | null
  travaux_a_faire: {
    id: string
    titre: string
    description: string | null
    consignes: string | null
    ressource_url: string | null
    echeance: string | null
    created_at: string
  }
}

function getEcheanceStatus(echeance: string | null, termine: boolean) {
  if (!echeance || termine) return null
  const today = new Date()
  const due = new Date(echeance)
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: `En retard de ${Math.abs(diffDays)}j`, color: 'text-red-400', icon: <AlertTriangle size={12} /> }
  if (diffDays === 0) return { label: "Aujourd'hui", color: 'text-orange-400', icon: <Clock size={12} /> }
  if (diffDays <= 3) return { label: `Dans ${diffDays}j`, color: 'text-orange-400', icon: <Clock size={12} /> }
  return { label: `Dans ${diffDays}j`, color: 'text-noir-400', icon: <Clock size={12} /> }
}

export default function TravauxPage() {
  const router = useRouter()
  const [travaux, setTravaux] = useState<TravailEleve[]>([])
  const [prenom, setPrenom] = useState('')
  const [nbMedias, setNbMedias] = useState(0)
  const [nbRessources, setNbRessources] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'tous' | 'a_faire' | 'termines'>('a_faire')
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/travaux').then(r => r.json()),
      fetch('/api/partitions').then(r => r.json()),
      fetch('/api/eleve/ressources').then(r => r.json()),
    ]).then(([me, tw, medias, res]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setTravaux(Array.isArray(tw) ? tw : [])
      setNbMedias(Array.isArray(medias) ? medias.length : 0)
      setNbRessources(Array.isArray(res) ? res.length : 0)
    }).finally(() => setLoading(false))
  }, [router])

  async function toggleTermine(t: TravailEleve) {
    setToggling(t.id)
    const res = await fetch('/api/eleve/travaux', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ travail_eleve_id: t.id, termine: !t.termine }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTravaux(prev => prev.map(tw => tw.id === t.id ? { ...tw, termine: updated.termine, termine_at: updated.termine_at } : tw))
    }
    setToggling(null)
  }

  const filtered = travaux.filter(t => {
    if (filter === 'a_faire') return !t.termine
    if (filter === 'termines') return t.termine
    return true
  })

  const nbAFaire = travaux.filter(t => !t.termine).length
  const nbTermines = travaux.filter(t => t.termine).length
  const nbEnRetard = travaux.filter(t => {
    if (t.termine || !t.travaux_a_faire.echeance) return false
    return new Date(t.travaux_a_faire.echeance) < new Date()
  }).length

  return (
    <EleveLayout prenom={prenom} nbNotifs={0} nbMedias={nbMedias} nbRessources={nbRessources} nbTravaux={nbAFaire}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">

        {/* Titre */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Travail à faire</h1>
          <p className="text-noir-400 text-sm">Exercices et travaux assignés par votre professeur</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-gold-400">{nbAFaire}</p>
            <p className="text-xs text-noir-400 mt-0.5">À faire</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-green-400">{nbTermines}</p>
            <p className="text-xs text-noir-400 mt-0.5">Terminés</p>
          </div>
          <div className="card text-center py-3">
            <p className={`text-2xl font-bold ${nbEnRetard > 0 ? 'text-red-400' : 'text-noir-500'}`}>{nbEnRetard}</p>
            <p className="text-xs text-noir-400 mt-0.5">En retard</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1 mb-6 w-fit">
          {([['a_faire', 'À faire'], ['termines', 'Terminés'], ['tous', 'Tous']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === val ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="text-noir-600 mx-auto mb-4" />
            <p className="text-noir-400 text-lg font-medium">
              {filter === 'a_faire' ? 'Aucun travail en attente' : filter === 'termines' ? 'Aucun travail terminé' : 'Aucun travail assigné'}
            </p>
            <p className="text-noir-600 text-sm mt-1">Votre professeur vous assignera des exercices ici.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => {
              const tw = t.travaux_a_faire
              const echeanceStatus = getEcheanceStatus(tw.echeance, t.termine)
              const isToggling = toggling === t.id

              return (
                <div key={t.id} className={`card transition-all ${t.termine ? 'opacity-60' : 'hover:border-gold-500/30'}`}>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTermine(t)}
                      disabled={isToggling}
                      className="mt-0.5 shrink-0 transition-all hover:scale-110"
                      aria-label={t.termine ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
                    >
                      {isToggling ? (
                        <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                      ) : t.termine ? (
                        <CheckCircle size={22} className="text-green-400" />
                      ) : (
                        <Circle size={22} className="text-noir-500 hover:text-gold-400" />
                      )}
                    </button>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3 className={`font-semibold text-base leading-tight ${t.termine ? 'line-through text-noir-500' : 'text-white'}`}>
                          {tw.titre}
                        </h3>
                        {echeanceStatus && (
                          <span className={`flex items-center gap-1 text-xs font-medium shrink-0 ${echeanceStatus.color}`}>
                            {echeanceStatus.icon} {echeanceStatus.label}
                          </span>
                        )}
                      </div>

                      {tw.description && (
                        <p className="text-noir-400 text-sm mt-1 leading-relaxed">{tw.description}</p>
                      )}

                      {tw.consignes && (
                        <div className="mt-2 bg-noir-800/60 rounded-lg px-3 py-2">
                          <p className="text-xs text-gold-400 font-medium uppercase tracking-wider mb-1">Consignes</p>
                          <p className="text-noir-300 text-sm whitespace-pre-line">{tw.consignes}</p>
                        </div>
                      )}

                      {tw.ressource_url && (
                        <a href={tw.ressource_url} target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          Ressource jointe
                        </a>
                      )}

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-noir-600">
                          Assigné le {new Date(tw.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {tw.echeance && (
                          <span className="text-xs text-noir-600">
                            Échéance : {new Date(tw.echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                        {t.termine && t.termine_at && (
                          <span className="text-xs text-green-500">
                            Terminé le {new Date(t.termine_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}