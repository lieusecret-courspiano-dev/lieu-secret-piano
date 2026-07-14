'use client'
import { useEffect, useRef, useState } from 'react'

interface PdfThumbnailProps {
  url: string
  titre: string
  nbPages?: number | null
}

export default function PdfThumbnail({ url, titre, nbPages }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}&pages=1`

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        // Charger PDF.js depuis CDN si pas encore chargé
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            if (document.getElementById('pdfjs-script')) {
              const check = setInterval(() => {
                if ((window as any).pdfjsLib) { clearInterval(check); resolve() }
              }, 100)
              setTimeout(() => { clearInterval(check); reject() }, 5000)
              return
            }
            const script = document.createElement('script')
            script.id = 'pdfjs-script'
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
            script.onload = () => resolve()
            script.onerror = () => reject()
            document.head.appendChild(script)
          })
        }

        const lib = (window as any).pdfjsLib
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

        const pdf = await lib.getDocument({ url: proxyUrl }).promise
        if (cancelled) return

        const page = await pdf.getPage(1)
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return

        // Adapter à la taille de la carte (aspect-video = 16:9)
        const viewport = page.getViewport({ scale: 1 })
        const targetWidth = canvas.parentElement?.clientWidth || 320
        const scale = targetWidth / viewport.width
        const scaledViewport = page.getViewport({ scale })

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height

        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
        if (!cancelled) setLoaded(true)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    render()
    return () => { cancelled = true }
  }, [proxyUrl])

  if (error) {
    // Fallback : placeholder élégant
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-4 text-center w-full h-full bg-gradient-to-br from-noir-800 to-noir-900">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
          <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div>
          <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{titre}</p>
          {nbPages && <p className="text-gold-500/70 text-xs mt-1">{nbPages} page{nbPages > 1 ? 's' : ''} · PDF</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      {/* Spinner pendant le chargement */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-noir-900">
          <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        style={{ display: loaded ? 'block' : 'none', objectFit: 'cover' }}
      />
      {/* Badge pages */}
      {loaded && nbPages && (
        <div className="absolute bottom-2 right-2 bg-noir-950/80 backdrop-blur text-gold-400 text-xs px-2 py-0.5 rounded-full">
          {nbPages} p.
        </div>
      )}
    </div>
  )
}
