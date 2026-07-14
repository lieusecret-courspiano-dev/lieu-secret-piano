'use client'
import { useEffect, useRef, useState } from 'react'

interface PdfViewerProps {
  url: string
  apercuPages?: number | null
  nbPages?: number | null
}

export default function PdfViewer({ url, apercuPages, nbPages }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const maxPages = apercuPages || 3
  const displayTotal = nbPages || '?'

  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        setLoading(true)
        setError(false)

        // Charger pdfjs-dist depuis CDN
        const pdfjsLib = (window as any).pdfjsLib
        if (!pdfjsLib) {
          // Charger le script si pas encore chargé
          await new Promise<void>((resolve, reject) => {
            if (document.getElementById('pdfjs-script')) { resolve(); return }
            const script = document.createElement('script')
            script.id = 'pdfjs-script'
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('PDF.js non chargé'))
            document.head.appendChild(script)
          })
        }

        const lib = (window as any).pdfjsLib
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

        const loadingTask = lib.getDocument({
          url,
          withCredentials: false,
        })
        const pdf = await loadingTask.promise
        if (cancelled) return

        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setLoading(false)
      } catch (err) {
        console.error('PDF load error:', err)
        if (!cancelled) { setError(true); setLoading(false) }
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [url])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage)
        const canvas = canvasRef.current
        if (!canvas) return

        const viewport = page.getViewport({ scale: 1.5 })
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({ canvasContext: context, viewport }).promise
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
        <div className="rounded-xl bg-noir-900 border border-noir-700 flex items-center justify-center" style={{ height: '400px' }}>
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
      <div className="space-y-3">
        <div className="rounded-xl bg-noir-900 border border-noir-700 flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ height: '300px' }}>
          <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-1">Aperçu non disponible</p>
            <p className="text-noir-400 text-xs mb-4">Le document ne peut pas être prévisualisé directement.</p>
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn-gold text-xs px-5 py-2">
            Ouvrir le PDF
          </a>
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
          <span className="text-noir-500 text-xs ml-2">— page {currentPage} sur {Math.min(maxPages, totalPages)} (document : {displayTotal} page{Number(displayTotal) > 1 ? 's' : ''})</span>
        </div>
        <span className="text-noir-600 text-xs">PDF</span>
      </div>

      {/* Canvas PDF */}
      <div className="rounded-xl overflow-hidden bg-white border border-noir-700" style={{ maxHeight: '460px', overflowY: 'auto' }}>
        <canvas ref={canvasRef} className="w-full" style={{ display: 'block' }} />
      </div>

      {/* Navigation entre pages */}
      {Math.min(maxPages, totalPages) > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg bg-noir-800 text-noir-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-noir-400 text-xs">Page {currentPage} / {Math.min(maxPages, totalPages)}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(Math.min(maxPages, totalPages), p + 1))}
            disabled={currentPage >= Math.min(maxPages, totalPages)}
            className="p-2 rounded-lg bg-noir-800 text-noir-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      {/* Message limite aperçu */}
      <div className="bg-gradient-to-r from-gold-500/10 to-noir-900 border border-gold-500/20 rounded-xl p-4 text-center">
        <p className="text-noir-400 text-xs">
          Aperçu limité aux {Math.min(maxPages, totalPages)} première{Math.min(maxPages, totalPages) > 1 ? 's' : ''} page{Math.min(maxPages, totalPages) > 1 ? 's' : ''}.
          {displayTotal !== '?' && ` Ce document contient ${displayTotal} page${Number(displayTotal) > 1 ? 's' : ''} au total.`}
        </p>
      </div>
    </div>
  )
}
