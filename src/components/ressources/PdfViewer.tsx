'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface PdfViewerProps {
  url: string
  apercuPages?: number | null
  nbPages?: number | null
  isPaid?: boolean
}

export default function PdfViewer({ url, apercuPages, nbPages, isPaid = false }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRendered, setTotalRendered] = useState(0)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const maxPages = Math.min(apercuPages || 3, nbPages || 999)
  const displayTotal = nbPages || '?'

  // Utiliser le proxy pour résoudre CORS + sécuriser l'URL
  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}&pages=${maxPages}`

  const loadPdfJs = useCallback(async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib
    
    await new Promise<void>((resolve, reject) => {
      if (document.getElementById('pdfjs-script')) { 
        // Attendre que le script soit chargé
        const check = setInterval(() => {
          if ((window as any).pdfjsLib) { clearInterval(check); resolve() }
        }, 100)
        setTimeout(() => { clearInterval(check); reject(new Error('timeout')) }, 5000)
        return
      }
      const script = document.createElement('script')
      script.id = 'pdfjs-script'
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('PDF.js non chargé'))
      document.head.appendChild(script)
    })
    
    const lib = (window as any).pdfjsLib
    lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    return lib
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        setLoading(true)
        setError(false)

        const lib = await loadPdfJs()
        
        const loadingTask = lib.getDocument({ url: proxyUrl })
        const pdf = await loadingTask.promise
        if (cancelled) return

        // Limiter au nombre de pages d'aperçu
        const limited = Math.min(pdf.numPages, maxPages)
        setTotalRendered(limited)
        setPdfDoc(pdf)
        setLoading(false)
      } catch (err) {
        console.error('PDF load error:', err)
        if (!cancelled) { setError(true); setLoading(false) }
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [proxyUrl, maxPages, loadPdfJs])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage)
        const canvas = canvasRef.current
        if (!canvas) return

        const containerWidth = canvas.parentElement?.clientWidth || 600
        const viewport = page.getViewport({ scale: 1 })
        const scale = containerWidth / viewport.width
        const scaledViewport = page.getViewport({ scale })

        const context = canvas.getContext('2d')
        canvas.height = scaledViewport.height
        canvas.width = scaledViewport.width

        await page.render({ canvasContext: context, viewport: scaledViewport }).promise
      } catch (err) {
        console.error('Render error:', err)
      }
    }

    renderPage()
  }, [pdfDoc, currentPage])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-noir-800 rounded-xl px-4 py-2.5">
          <span className="text-gold-400 text-xs font-semibold">Aperçu gratuit</span>
          <span className="text-noir-600 text-xs">PDF</span>
        </div>
        <div className="rounded-xl bg-noir-900 border border-noir-700 flex items-center justify-center" style={{ height: '380px' }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-noir-400 text-xs">Chargement du document...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-noir-900 border border-noir-700 flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ height: '280px' }}>
        <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-semibold mb-1">Aperçu non disponible</p>
          <p className="text-noir-400 text-xs mb-4">Le document ne peut pas être prévisualisé directement.</p>
        </div>

      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Barre info */}
      <div className="flex items-center justify-between bg-noir-800 rounded-xl px-4 py-2.5">
        <div>
          <span className="text-gold-400 text-xs font-semibold">Aperçu gratuit</span>
          <span className="text-noir-500 text-xs ml-2">
            — page {currentPage} / {totalRendered}
            {displayTotal !== '?' && ` (document complet : ${displayTotal} page${Number(displayTotal) > 1 ? 's' : ''})`}
          </span>
        </div>
        <span className="text-noir-600 text-xs">PDF</span>
      </div>

      {/* Canvas PDF */}
      <div className="rounded-xl overflow-hidden bg-white border border-noir-700 relative" style={{ maxHeight: '440px', overflowY: 'auto' }}>
        <canvas ref={canvasRef} className="w-full block" />
        
        {/* Overlay flou sur le bas pour les docs payants */}
        {isPaid && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-noir-900 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Navigation entre pages */}
      {totalRendered > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg bg-noir-800 text-noir-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-noir-400 text-xs">Page {currentPage} / {totalRendered}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalRendered, p + 1))}
            disabled={currentPage >= totalRendered}
            className="p-2 rounded-lg bg-noir-800 text-noir-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      {/* Message limite aperçu */}
      <div className="bg-gradient-to-r from-gold-500/10 to-noir-900 border border-gold-500/20 rounded-xl p-3 text-center">
        <p className="text-noir-400 text-xs">
          {isPaid
            ? `Aperçu limité à ${totalRendered} page${totalRendered > 1 ? 's' : ''}. Achetez pour accéder au document complet (${displayTotal} pages).`
            : `Aperçu des ${totalRendered} première${totalRendered > 1 ? 's' : ''} page${totalRendered > 1 ? 's' : ''} sur ${displayTotal} au total.`
          }
        </p>
      </div>
    </div>
  )
}
