'use client'
import { useState, useMemo } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchKeys?: string[]
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data, columns, searchable = true, searchKeys = [], pageSize = 20,
  loading = false, emptyMessage = 'Aucune donnée', onRowClick, actions
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    let d = [...data]
    if (search && searchKeys.length > 0) {
      d = d.filter(row => searchKeys.some(k => String(row[k] || '').toLowerCase().includes(search.toLowerCase())))
    }
    if (sortKey) {
      d.sort((a, b) => {
        const av = String(a[sortKey] || ''), bv = String(b[sortKey] || '')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }
    return d
  }, [data, search, searchKeys, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="flex flex-col gap-3">
      {searchable && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-500" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9 text-sm" placeholder="Rechercher..." />
          </div>
          <span className="text-noir-500 text-xs">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-noir-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-noir-800 bg-noir-900/50">
              {columns.map(col => (
                <th key={col.key}
                  className={`px-4 py-3 text-left text-xs font-bold text-noir-400 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-white select-none' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && toggleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {sortDir === 'asc' ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-bold text-noir-400 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-noir-800/50">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-noir-800 rounded animate-pulse" />
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3"><div className="h-4 w-16 bg-noir-800 rounded animate-pulse ml-auto" /></td>}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-noir-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={i}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-noir-800/50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-noir-800/30' : ''}`}>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-noir-200">
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-noir-500">
            Page {page} / {totalPages} · {filtered.length} entrées
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-2 py-1 rounded text-xs text-noir-400 hover:text-white disabled:opacity-30 transition-colors">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 rounded text-xs text-noir-400 hover:text-white disabled:opacity-30 transition-colors">‹</button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white hover:bg-noir-800'}`}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2 py-1 rounded text-xs text-noir-400 hover:text-white disabled:opacity-30 transition-colors">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="px-2 py-1 rounded text-xs text-noir-400 hover:text-white disabled:opacity-30 transition-colors">»</button>
          </div>
        </div>
      )}
    </div>
  )
}