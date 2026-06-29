'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  type: string
  label: string
  sub?: string
  href: string
  icon?: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (!open) return (
    <button onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
      className="flex items-center gap-2 bg-noir-800 border border-noir-700 rounded-xl px-3 py-2 text-noir-500 hover:border-noir-600 transition-all text-sm">
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span className="hidden md:block">Rechercher...</span>
      <kbd className="hidden md:block text-xs bg-noir-700 px-1.5 py-0.5 rounded">⌘K</kbd>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-noir-800">
          <svg width="16" height="16" fill="none" stroke="#707070" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-noir-500 outline-none text-sm"
            placeholder="Rechercher élèves, réservations, packs..." />
          {loading && <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />}
          <kbd className="text-xs bg-noir-800 text-noir-500 px-1.5 py-0.5 rounded">Esc</kbd>
        </div>
        {results.length > 0 ? (
          <div className="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => (
              <button key={i} onClick={() => { router.push(r.href); setOpen(false); setQuery('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-noir-800 transition-colors text-left">
                <span className="text-lg">{r.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{r.label}</p>
                  {r.sub && <p className="text-noir-500 text-xs truncate">{r.sub}</p>}
                </div>
                <span className="text-xs text-noir-600 bg-noir-800 px-2 py-0.5 rounded-full shrink-0">{r.type}</span>
              </button>
            ))}
          </div>
        ) : query.length >= 2 && !loading ? (
          <div className="py-8 text-center text-noir-500 text-sm">Aucun résultat pour "{query}"</div>
        ) : (
          <div className="py-4 px-4">
            <p className="text-xs text-noir-600 mb-2">Accès rapide</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: 'Élèves', href: '/admin/eleves', icon: '👥' },
                { label: 'Réservations', href: '/admin/reservations', icon: '📅' },
                { label: 'Packs', href: '/admin/packs', icon: '📦' },
                { label: 'Quiz', href: '/admin/quiz', icon: '❓' },
              ].map(item => (
                <button key={item.href} onClick={() => { router.push(item.href); setOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-noir-800 transition-colors text-left">
                  <span>{item.icon}</span>
                  <span className="text-noir-300 text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}