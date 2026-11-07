'use client'
import { useState, useEffect, useRef } from 'react'
import { Video, ExternalLink, Mic, MicOff, Camera, CameraOff, PhoneOff, Maximize2 } from 'lucide-react'

interface ProchainCours {
  id: string
  slot_start: string
  kmeet_url: string | null
  type: string
  status: string
}

export default function CoursEnDirectPage() {
  const [prochainCours, setProchainCours] = useState<ProchainCours | null>(null)
  const [loading, setLoading] = useState(true)
  const [enCours, setEnCours] = useState(false)
  const [pleinEcran, setPleinEcran] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/eleve/prochain-cours')
      .then(r => r.json())
      .then(d => {
        setProchainCours(d?.cours || null)
        setLoading(false)
      })
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

  function rejoindre() {
    if (prochainCours?.kmeet_url) {
      setEnCours(true)
    }
  }

  function quitter() {
    setEnCours(false)
    setPleinEcran(false)
  }

  function togglePleinEcran() {
    if (!pleinEcran) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setPleinEcran(!pleinEcran)
  }

  // Ouvrir dans un nouvel onglet si iframe bloquée
  function ouvrirNouvelOnglet() {
    if (prochainCours?.kmeet_url) {
      window.open(prochainCours.kmeet_url, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Cours en direct</h1>
        <p className="text-noir-400 text-sm mt-1">Rejoignez votre cours via Kmeet</p>
      </div>

      {/* Cours en cours — iframe Kmeet */}
      {enCours && prochainCours?.kmeet_url ? (
        <div ref={containerRef} className="relative">
          <div className="bg-noir-900 rounded-2xl overflow-hidden border border-noir-800" style={{ height: '600px' }}>
            <iframe
              ref={iframeRef}
              src={prochainCours.kmeet_url}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Cours Kmeet"
            />
          </div>

          {/* Barre de contrôle */}
          <div className="flex items-center justify-between mt-3 px-2">
            <p className="text-noir-400 text-sm">
              Cours en cours — {fHeure(prochainCours.slot_start)}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={ouvrirNouvelOnglet}
                className="flex items-center gap-1.5 text-xs text-noir-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-noir-700 hover:border-noir-600">
                <ExternalLink size={12} /> Ouvrir dans un onglet
              </button>
              <button onClick={togglePleinEcran}
                className="flex items-center gap-1.5 text-xs text-noir-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-noir-700 hover:border-noir-600">
                <Maximize2 size={12} /> Plein écran
              </button>
              <button onClick={quitter}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10">
                <PhoneOff size={12} /> Quitter
              </button>
            </div>
          </div>

          {/* Note si iframe bloquée */}
          <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
            <span className="text-amber-400 text-xs">💡</span>
            <p className="text-amber-400/80 text-xs">
              Si la vidéo ne s'affiche pas, cliquez sur <strong>"Ouvrir dans un onglet"</strong> pour rejoindre le cours dans une nouvelle fenêtre.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Prochain cours */}
          {prochainCours ? (
            <div className="card border-gold-500/20 mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-sm font-medium">Cours disponible</span>
                  </div>
                  <h2 className="text-white font-semibold text-lg capitalize">
                    {prochainCours.type === 'cours' ? 'Cours individuel' : prochainCours.type}
                  </h2>
                  <p className="text-noir-300 text-sm mt-1">
                    {fDate(prochainCours.slot_start)} à {fHeure(prochainCours.slot_start)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {prochainCours.kmeet_url ? (
                    <>
                      <button onClick={rejoindre}
                        className="btn-gold flex items-center gap-2 px-6 py-3">
                        <Video size={18} /> Rejoindre le cours
                      </button>
                      <button onClick={ouvrirNouvelOnglet}
                        className="btn-outline text-sm flex items-center gap-2 justify-center">
                        <ExternalLink size={14} /> Ouvrir dans un onglet
                      </button>
                    </>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <p className="text-amber-400 text-sm">
                        Le lien du cours n'est pas encore disponible.
                        Vous le recevrez par email avant le cours.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {prochainCours.kmeet_url && (
                <div className="mt-4 pt-4 border-t border-noir-800">
                  <p className="text-noir-500 text-xs mb-1">Lien direct :</p>
                  <a href={prochainCours.kmeet_url} target="_blank" rel="noopener noreferrer"
                    className="text-gold-400 hover:text-gold-300 text-sm transition-colors break-all">
                    {prochainCours.kmeet_url}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-16 mb-6">
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

          {/* Guide d'utilisation */}
          <div className="card">
            <h3 className="text-white font-semibold mb-4">Comment rejoindre votre cours ?</h3>
            <ol className="space-y-3">
              {[
                { n: '1', text: 'Cliquez sur "Rejoindre le cours" quelques minutes avant l\'heure prévue' },
                { n: '2', text: 'Autorisez l\'accès à votre caméra et microphone quand le navigateur le demande' },
                { n: '3', text: 'Entrez votre prénom pour que votre professeur vous identifie' },
                { n: '4', text: 'Attendez que votre professeur rejoigne la salle' },
              ].map(step => (
                <li key={step.n} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step.n}
                  </span>
                  <p className="text-noir-300 text-sm">{step.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-4 pt-4 border-t border-noir-800">
              <p className="text-noir-500 text-xs">
                💡 <strong className="text-noir-400">Conseil :</strong> Utilisez Chrome ou Firefox pour une meilleure expérience.
                Testez votre caméra et micro avant le cours.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}