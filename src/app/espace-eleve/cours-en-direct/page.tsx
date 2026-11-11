'use client'
import { useState, useEffect } from 'react'
import { Video, ExternalLink, Calendar, Clock } from 'lucide-react'

interface ProchainCours {
  id: string
  slot_start: string
  kmeet_url: string | null
  type: string
  status: string
}

export default function CoursEnDirectPage() {
  const [cours, setCours] = useState<ProchainCours | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/eleve/prochain-cours')
      .then(r => r.json())
      .then(d => { setCours(d?.cours || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function fDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
  }
  function fHeure(d: string) {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Cours en direct</h1>
        <p className="text-noir-400 text-sm mt-1">Rejoignez votre cours via Kmeet</p>
      </div>

      {cours ? (
        <div className="space-y-4">
          {/* Carte cours */}
          <div className="card border-gold-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                <Video size={22} className="text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">Cours disponible</span>
                </div>
                <h2 className="text-white font-semibold text-lg capitalize mb-2">
                  {cours.type === 'cours' ? 'Cours individuel de piano' : cours.type}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-noir-300 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gold-400" />
                    {fDate(cours.slot_start)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gold-400" />
                    {fHeure(cours.slot_start)}
                  </span>
                </div>

                {cours.kmeet_url ? (
                  <a href={cours.kmeet_url} target="_blank" rel="noopener noreferrer"
                    className="btn-gold inline-flex items-center gap-2 px-6 py-3 text-base">
                    <Video size={18} /> Rejoindre le cours
                    <ExternalLink size={14} className="opacity-70" />
                  </a>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <p className="text-amber-400 text-sm">
                      Le lien du cours sera envoyé par email avant le cours.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {cours.kmeet_url && (
              <div className="mt-4 pt-4 border-t border-noir-800">
                <p className="text-noir-500 text-xs mb-1">Lien direct :</p>
                <a href={cours.kmeet_url} target="_blank" rel="noopener noreferrer"
                  className="text-gold-400 hover:text-gold-300 text-xs transition-colors break-all">
                  {cours.kmeet_url}
                </a>
              </div>
            )}
          </div>

          {/* Conseils */}
          <div className="card">
            <h3 className="text-white font-semibold mb-3 text-sm">Avant de rejoindre</h3>
            <ul className="space-y-2">
              {[
                'Utilisez Chrome ou Firefox pour une meilleure expérience',
                'Testez votre caméra et microphone à l\'avance',
                'Rejoignez 2-3 minutes avant l\'heure prévue',
                'Entrez votre prénom pour que votre professeur vous identifie',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-noir-400">
                  <span className="text-gold-500 shrink-0 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="card text-center py-16">
          <Video size={48} className="text-noir-700 mx-auto mb-4" />
          <h2 className="text-white font-semibold text-lg mb-2">Aucun cours à venir</h2>
          <p className="text-noir-400 text-sm mb-6">
            Vous n'avez pas de cours prévu prochainement.
          </p>
          <a href="/espace-eleve/reserver" className="btn-gold inline-block px-6 py-3">
            Réserver un cours
          </a>
        </div>
      )}
    </div>
  )
}
