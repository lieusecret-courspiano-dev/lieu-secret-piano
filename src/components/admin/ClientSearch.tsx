'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, User, UserCheck } from 'lucide-react'

interface ClientResult {
  id: string
  nom: string
  email: string
  telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  source: 'eleve' | 'facture'
}

interface ClientSearchProps {
  onSelect: (client: ClientResult) => void
  placeholder?: string
}

export default function ClientSearch({ onSelect, placeholder = 'Rechercher un client...' }: ClientSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) { setResults([]); setShowResults(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/comptabilite/clients/search?q=${encodeURIComponent(value)}`, {
          credentials: 'include',
        })
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
        setShowResults(true)
      } catch {}
      setLoading(false)
    }, 300)
  }

  function handleSelect(client: ClientResult) {
    setQuery(client.nom || client.email)
    setShowResults(false)
    onSelect(client)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-500" />
        <input
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="input w-full pl-9 text-sm"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-noir-900 border border-noir-700 rounded-xl shadow-xl overflow-hidden">
          {results.map((client, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(client)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-noir-800 transition-colors border-b border-noir-800 last:border-0 text-left"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                client.source === 'eleve'
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : 'bg-noir-800 border border-noir-700'
              }`}>
                {client.source === 'eleve'
                  ? <UserCheck size={14} className="text-blue-400" />
                  : <User size={14} className="text-noir-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{client.nom || client.email}</p>
                <p className="text-noir-400 text-xs truncate">{client.email}</p>
                {(client.telephone || client.ville) && (
                  <p className="text-noir-600 text-xs truncate">
                    {[client.telephone, client.ville].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {client.source === 'eleve' && (
                <span className="text-xs text-blue-400 shrink-0">Élève</span>
              )}
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-noir-900 border border-noir-700 rounded-xl shadow-xl p-3 text-center">
          <p className="text-noir-500 text-sm">Aucun client trouvé pour "{query}"</p>
          <p className="text-noir-600 text-xs mt-1">Vous pouvez saisir manuellement les informations</p>
        </div>
      )}
    </div>
  )
}