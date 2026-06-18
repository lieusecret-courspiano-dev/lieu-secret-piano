'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Download, Share2 } from 'lucide-react'

export default function PartagerPage() {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [progres, setProgres] = useState(0)
  const [nbCours, setNbCours] = useState(0)
  const [nbBadges, setNbBadges] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/progression').then(r => r.json()),
      fetch('/api/eleve/badges').then(r => r.json()),
      fetch('/api/eleve/streak').then(r => r.json()),
    ]).then(([me, prog, badges, streakData]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setNom(me.nom)
      setProgres(prog?.pourcentage || 0)
      setNbCours(me.cours_passes || 0)
      setNbBadges(Array.isArray(badges) ? badges.length : 0)
      setStreak(streakData?.streak_semaines || 0)
    }).finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (!loading) generateCanvas()
  }, [loading, prenom, progres, nbCours, nbBadges, streak])

  function generateCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 800, H = 450
    canvas.width = W; canvas.height = H

    // Fond dégradé
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#252540')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Bordure dorée
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.strokeRect(12, 12, W - 24, H - 24)

    // Logo
    ctx.fillStyle = '#f59e0b'
    ctx.font = 'bold 14px Arial'
    ctx.letterSpacing = '4px'
    ctx.fillText('LIEU SECRET', 40, 55)
    ctx.fillStyle = '#7070a0'
    ctx.font = '11px Arial'
    ctx.fillText('ÉCOLE DE PIANO EN LIGNE', 40, 72)

    // Ligne décorative
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(40, 85, 60, 2)

    // Nom de l'élève
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 42px Georgia'
    ctx.fillText(`${prenom} ${nom}`, 40, 160)

    // Sous-titre
    ctx.fillStyle = '#a0a0c0'
    ctx.font = '18px Arial'
    ctx.fillText('partage ses progrès musicaux', 40, 190)

    // Stats
    const stats = [
      { label: 'Progression', value: `${progres}%`, color: '#f59e0b' },
      { label: 'Cours suivis', value: String(nbCours), color: '#60a5fa' },
      { label: 'Badges', value: String(nbBadges), color: '#a78bfa' },
      { label: 'Semaines streak', value: String(streak), color: '#fb923c' },
    ]

    stats.forEach((s, i) => {
      const x = 40 + i * 185
      const y = 260

      // Fond stat
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.beginPath()
      ctx.roundRect(x, y, 165, 90, 12)
      ctx.fill()

      ctx.fillStyle = s.color
      ctx.font = 'bold 36px Arial'
      ctx.fillText(s.value, x + 15, y + 50)

      ctx.fillStyle = '#7070a0'
      ctx.font = '13px Arial'
      ctx.fillText(s.label, x + 15, y + 72)
    })

    // Barre de progression
    ctx.fillStyle = '#2a2a45'
    ctx.beginPath()
    ctx.roundRect(40, 380, W - 80, 20, 10)
    ctx.fill()

    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.roundRect(40, 380, Math.max(20, (W - 80) * progres / 100), 20, 10)
    ctx.fill()

    // URL
    ctx.fillStyle = '#505080'
    ctx.font = '12px Arial'
    ctx.fillText('lieusecret-courspiano.fr', W - 220, H - 20)
  }

  async function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `mes-progres-piano-${prenom.toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setMessage('Image téléchargée !')
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleShare() {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob(async blob => {
        if (!blob) return
        const file = new File([blob], 'mes-progres-piano.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Mes progrès au piano — Lieu Secret', text: `Je progresse au piano avec Lieu Secret ! ${progres}% de la formation complétée.` })
        } else {
          handleDownload()
        }
      })
    } catch { handleDownload() }
  }

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Partager mes progrès</h1>
          <p className="text-noir-400 text-sm">Générez une image à partager sur vos réseaux sociaux</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-6">
            {/* Aperçu */}
            <div className="card overflow-hidden">
              <p className="text-noir-400 text-xs font-bold uppercase tracking-wider mb-3">Aperçu</p>
              <canvas ref={canvasRef} className="w-full rounded-xl border border-noir-700" style={{ aspectRatio: '16/9' }} />
            </div>

            {/* Boutons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleDownload} className="btn-gold flex items-center justify-center gap-2 py-3">
                <Download size={18} /> Télécharger
              </button>
              <button onClick={handleShare} className="btn-outline flex items-center justify-center gap-2 py-3">
                <Share2 size={18} /> Partager
              </button>
            </div>

            {message && (
              <div className="card border-green-500/20 bg-green-500/5 text-center py-3">
                <p className="text-green-400 text-sm font-medium">{message}</p>
              </div>
            )}

            {/* Texte suggéré */}
            <div className="card">
              <p className="text-noir-400 text-xs font-bold uppercase tracking-wider mb-3">Texte suggéré pour vos réseaux</p>
              <p className="text-noir-300 text-sm leading-relaxed italic">
                "Je progresse au piano avec Lieu Secret ! {progres}% de la formation complétée, {nbCours} cours suivis et {nbBadges} badges obtenus.  #Piano #LieuSecret #ApprendreLePiano"
              </p>
              <button onClick={() => { navigator.clipboard.writeText(`Je progresse au piano avec Lieu Secret ! ${progres}% de la formation complétée, ${nbCours} cours suivis et ${nbBadges} badges obtenus.  #Piano #LieuSecret #ApprendreLePiano`); setMessage('Texte copié !'); setTimeout(() => setMessage(''), 2000) }}
                className="btn-outline text-xs px-4 py-2 mt-3">
                Copier le texte
              </button>
            </div>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}