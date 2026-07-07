'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import SubNavDecouverte from '@/components/eleve/SubNavDecouverte'

interface Morceau {
  id: string; titre: string; compositeur: string | null
  tonalite: string | null; niveau: string | null; statut: string; notes: string | null
}

export default function PlaylistPage() {
  const router = useRouter()
  const [morceaux, setMorceaux] = useState<Morceau[]>([])
  const [playlist, setPlaylist] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timer, setTimer] = useState(0)
  const [running, setRunning] = useState(false)
  const [targetMin, setTargetMin] = useState(10)
  const [loading, setLoading] = useState(true)
  const [sessionActive, setSessionActive] = useState(false)

  useEffect(() => {
    fetch('/api/eleve/repertoire')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setMorceaux(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [running])

  function formatTime(s: number) {
    const m = Math.floor(s / 60); const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function toggleMorceau(id: string) {
    setPlaylist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function startSession() {
    if (playlist.length === 0) return
    setSessionActive(true); setCurrentIdx(0); setTimer(0); setRunning(true)
  }

  function nextMorceau() {
    if (currentIdx < playlist.length - 1) { setCurrentIdx(i => i + 1); setTimer(0) }
    else { setRunning(false) }
  }

  function endSession() {
    setRunning(false); setSessionActive(false)
    const totalMin = Math.round(playlist.length * targetMin)
    router.push(`/espace-eleve/journal?duree=${totalMin}&morceaux=${playlist.map(id => morceaux.find(m => m.id === id)?.titre).filter(Boolean).join(', ')}`)
  }

  const currentMorceau = sessionActive ? morceaux.find(m => m.id === playlist[currentIdx]) : null
  const progress = targetMin > 0 ? Math.min((timer / (targetMin * 60)) * 100, 100) : 0

  if (loading) return <EleveLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div></EleveLayout>

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-4 md:p-8 pb-24 md:pb-4 md:pb-8 max-w-2xl mx-auto">
        <SubNavDecouverte />
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-white">Playlist de pratique</h1>
          <p className="text-noir-400 text-sm mt-1">Organisez votre session de travail</p>
        </div>

        {sessionActive && currentMorceau ? (
          /* ── Session active ── */
          <div className="space-y-4">
            <div className="card border-gold-500/30 bg-gold-500/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest">En cours</p>
                <p className="text-noir-400 text-xs">{currentIdx + 1} / {playlist.length}</p>
              </div>
              <h2 className="font-serif text-xl text-white mb-1">{currentMorceau.titre}</h2>
              {currentMorceau.compositeur && <p className="text-noir-400 text-sm">{currentMorceau.compositeur}</p>}
              {currentMorceau.notes && <p className="text-noir-500 text-xs mt-2 italic">{currentMorceau.notes}</p>}

              {/* Timer */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-mono text-3xl font-bold">{formatTime(timer)}</p>
                  <p className="text-noir-500 text-xs">Objectif : {targetMin} min</p>
                </div>
                <div className="h-2 bg-noir-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setRunning(r => !r)} className="btn-outline flex-1">
                  {running ? 'Pause' : 'Reprendre'}
                </button>
                {currentIdx < playlist.length - 1 ? (
                  <button onClick={nextMorceau} className="btn-gold flex-1">Morceau suivant →</button>
                ) : (
                  <button onClick={endSession} className="btn-gold flex-1">Terminer la session</button>
                )}
              </div>
            </div>

            {/* Liste restante */}
            <div className="space-y-2">
              {playlist.slice(currentIdx + 1).map((id, i) => {
                const m = morceaux.find(x => x.id === id)
                if (!m) return null
                return (
                  <div key={id} className="card opacity-50 flex items-center gap-3">
                    <span className="text-noir-600 text-xs w-5">{currentIdx + i + 2}</span>
                    <p className="text-white text-sm">{m.titre}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* ── Sélection ── */
          <div className="space-y-4">
            {/* Durée par morceau */}
            <div className="card">
              <label className="label mb-2 block">Durée par morceau</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 30].map(m => (
                  <button key={m} onClick={() => setTargetMin(m)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${targetMin === m ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
                    {m}min
                  </button>
                ))}
              </div>
            </div>

            {/* Sélection morceaux */}
            <div>
              <p className="label mb-3 block">Sélectionnez vos morceaux ({playlist.length} sélectionné{playlist.length > 1 ? 's' : ''})</p>
              {morceaux.length === 0 ? (
                <div className="card text-center py-4 md:py-8">
                  <p className="text-noir-400 text-sm">Aucun morceau dans votre répertoire</p>
                  <a href="/espace-eleve/repertoire" className="btn-gold text-xs px-4 py-2 mt-3 inline-block">Ajouter des morceaux</a>
                </div>
              ) : (
                <div className="space-y-2">
                  {morceaux.map(m => (
                    <button key={m.id} onClick={() => toggleMorceau(m.id)}
                      className={`w-full text-left card flex items-center gap-3 transition-all ${playlist.includes(m.id) ? 'border-gold-500/30 bg-gold-500/5' : 'hover:border-noir-700'}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${playlist.includes(m.id) ? 'bg-gold-500 border-gold-500' : 'border-noir-600'}`}>
                        {playlist.includes(m.id) && <svg width="10" height="10" fill="none" stroke="#1a1a2e" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{m.titre}</p>
                        {m.compositeur && <p className="text-noir-500 text-xs">{m.compositeur}</p>}
                      </div>
                      {m.statut === 'en_cours' && <span className="text-xs text-blue-400 shrink-0">En cours</span>}
                      {m.statut === 'maitrise' && <span className="text-xs text-green-400 shrink-0">Maîtrisé</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {playlist.length > 0 && (
              <div className="sticky bottom-24 md:bottom-4">
                <button onClick={startSession} className="btn-gold w-full text-base py-3 shadow-2xl shadow-gold-500/20">
                  Démarrer la session · {playlist.length} morceau{playlist.length > 1 ? 'x' : ''} · ~{playlist.length * targetMin} min
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
