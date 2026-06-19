'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

const PRESETS = [
  { label: 'Largo',      bpm: 50  },
  { label: 'Adagio',     bpm: 70  },
  { label: 'Andante',    bpm: 90  },
  { label: 'Moderato',   bpm: 110 },
  { label: 'Allegro',    bpm: 130 },
  { label: 'Vivace',     bpm: 160 },
  { label: 'Presto',     bpm: 190 },
]

const SIGNATURES = ['2/4', '3/4', '4/4', '6/8']

export default function MetronomePage() {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [bpm, setBpm] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [signature, setSignature] = useState('4/4')
  const [accentFirst, setAccentFirst] = useState(true)
  const [tapTimes, setTapTimes] = useState<number[]>([])

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const beatRef = useRef(0)

  const beatsPerMeasure = parseInt(signature.split('/')[0])

  useEffect(() => {
    fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()).then(me => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
    })
  }, [router])

  const playClick = useCallback((isAccent: boolean) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      // Résoudre le problème mobile : reprendre le contexte suspendu
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = isAccent ? 1000 : 800
      gain.gain.setValueAtTime(isAccent ? 0.8 : 0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.08)
    } catch {}
  }, [])

  const tick = useCallback(() => {
    beatRef.current = (beatRef.current % beatsPerMeasure) + 1
    setBeat(beatRef.current)
    playClick(accentFirst && beatRef.current === 1)
  }, [beatsPerMeasure, accentFirst, playClick])

  useEffect(() => {
    if (isPlaying) {
      beatRef.current = 0
      tick()
      intervalRef.current = setInterval(tick, (60 / bpm) * 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setBeat(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, bpm, tick])

  function handleTap() {
    const now = Date.now()
    const newTimes = [...tapTimes, now].slice(-8)
    setTapTimes(newTimes)
    if (newTimes.length >= 2) {
      const intervals = newTimes.slice(1).map((t, i) => t - newTimes[i])
      const avg = intervals.reduce((a, b) => a + b) / intervals.length
      const newBpm = Math.round(60000 / avg)
      if (newBpm >= 20 && newBpm <= 300) setBpm(newBpm)
    }
  }

  const tempo = PRESETS.find(p => Math.abs(p.bpm - bpm) <= 10)?.label || ''

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-lg mx-auto">

        {/* Titre */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Métronome</h1>
          <p className="text-noir-400 text-sm">Travaillez votre régularité rythmique</p>
        </div>

        {/* Affichage BPM */}
        <div className="card border-gold-500/20 text-center mb-6">
          <div className="relative">
            {/* Pendule visuel */}
            <div className="flex justify-center gap-2 mb-4 h-8 items-center">
              {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-100 ${
                  isPlaying && beat === i + 1
                    ? i === 0 && accentFirst ? 'bg-gold-500 scale-125' : 'bg-blue-400 scale-110'
                    : 'bg-noir-700'
                }`} />
              ))}
            </div>

            <div className="text-7xl font-bold text-white mb-1 tabular-nums">{bpm}</div>
            <div className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-1">BPM</div>
            {tempo && <div className="text-noir-500 text-xs">{tempo}</div>}
          </div>
        </div>

        {/* Slider BPM */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-noir-400 text-xs">20</span>
            <span className="text-white text-sm font-medium">Tempo</span>
            <span className="text-noir-400 text-xs">300</span>
          </div>
          <input
            type="range" min="20" max="300" value={bpm}
            onChange={e => setBpm(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #f59e0b ${((bpm - 20) / 280) * 100}%, #2a2a45 ${((bpm - 20) / 280) * 100}%)` }}
          />
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => setBpm(b => Math.max(20, b - 1))} className="w-10 h-10 rounded-xl bg-noir-800 hover:bg-noir-700 text-white font-bold text-lg transition-colors flex items-center justify-center">−</button>
            <input type="number" min="20" max="300" value={bpm} onChange={e => { const v = parseInt(e.target.value); if (v >= 20 && v <= 300) setBpm(v) }}
              className="flex-1 input text-center text-xl font-bold py-2" />
            <button onClick={() => setBpm(b => Math.min(300, b + 1))} className="w-10 h-10 rounded-xl bg-noir-800 hover:bg-noir-700 text-white font-bold text-lg transition-colors flex items-center justify-center">+</button>
          </div>
        </div>

        {/* Presets */}
        <div className="card mb-4">
          <p className="text-noir-400 text-xs font-bold uppercase tracking-wider mb-3">Tempos courants</p>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => setBpm(p.bpm)}
                className={`py-2 rounded-xl text-xs font-medium transition-all border ${Math.abs(bpm - p.bpm) <= 5 ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600 hover:text-white'}`}>
                <div>{p.label}</div>
                <div className="text-[10px] opacity-70">{p.bpm}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Signature + Accent */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card">
            <p className="text-noir-400 text-xs font-bold uppercase tracking-wider mb-2">Mesure</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SIGNATURES.map(s => (
                <button key={s} onClick={() => setSignature(s)}
                  className={`py-2 rounded-xl text-sm font-bold transition-all border ${signature === s ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <p className="text-noir-400 text-xs font-bold uppercase tracking-wider mb-2">Options</p>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <div className={`w-10 h-5 rounded-full transition-colors relative ${accentFirst ? 'bg-gold-500' : 'bg-noir-700'}`} onClick={() => setAccentFirst(v => !v)}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${accentFirst ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-noir-300">Accent temps 1</span>
            </label>
            {/* Tap tempo */}
            <button onClick={handleTap}
              className="w-full py-2 rounded-xl border border-noir-700 text-noir-300 hover:border-gold-500/50 hover:text-white transition-all text-xs font-medium">
              Tap Tempo
            </button>
          </div>
        </div>

        {/* Bouton Play/Stop */}
        <button
          onClick={() => setIsPlaying(v => !v)}
          className={`w-full py-5 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-3 ${
            isPlaying
              ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30'
              : 'bg-gold-500 hover:bg-gold-400 text-noir-950'
          }`}
        >
          {isPlaying ? (
            <>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              Arrêter
            </>
          ) : (
            <>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Démarrer
            </>
          )}
        </button>

        <p className="text-noir-700 text-xs text-center mt-4">
          Activez le son sur votre appareil pour entendre les clics
        </p>
      </div>
    </EleveLayout>
  )
}