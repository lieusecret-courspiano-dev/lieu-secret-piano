'use client'
import { useState, useMemo } from 'react'

interface Eleve { id: string; prenom: string; nom: string; email: string }

interface EleveSearchSelectProps {
  eleves: Eleve[]
  selected: string[]
  onChange: (ids: string[]) => void
  label?: string
}

export function EleveSearchSelect({ eleves, selected, onChange, label = 'Élèves concernés' }: EleveSearchSelectProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    eleves.filter(e =>
      !search ||
      `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(search.toLowerCase())
    ), [eleves, search]
  )

  const allSelected = eleves.length > 0 && eleves.every(e => selected.includes(e.id))

  function toggleAll() {
    if (allSelected) onChange([])
    else onChange(eleves.map(e => e.id))
  }

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label">{label} ({selected.length}/{eleves.length})</label>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-noir-400 hover:text-white">
          <input type="checkbox" checked={allSelected} onChange={toggleAll}
            className="rounded border-noir-600" />
          Tous
        </label>
      </div>
      <div className="relative mb-2">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-500 pointer-events-none" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un élève..."
          className="input w-full pl-8 text-sm py-2"
        />
      </div>
      <div className="space-y-1 max-h-44 overflow-y-auto border border-noir-700 rounded-xl p-2 bg-noir-900/50">
        {filtered.length === 0 ? (
          <p className="text-noir-500 text-xs text-center py-3">Aucun élève trouvé</p>
        ) : filtered.map(el => (
          <label key={el.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-noir-800 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(el.id)}
              onChange={() => toggle(el.id)}
              className="rounded border-noir-600 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm group-hover:text-gold-400 transition-colors">{el.prenom} {el.nom}</span>
              <span className="text-noir-500 text-xs ml-2 truncate">{el.email}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
