'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = (localStorage.getItem('ls_theme') as Theme) || 'dark'
    setTheme(saved)
    applyTheme(saved)

    // Écouter les changements de préférence système
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const current = (localStorage.getItem('ls_theme') as Theme) || 'dark'
      if (current === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function applyTheme(t: Theme) {
    const root = document.documentElement
    if (t === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else if (t === 'dark') {
      root.classList.remove('light')
      root.classList.remove('dark')
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.remove('light')
      } else {
        root.classList.add('light')
      }
    }
  }

  function changeTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem('ls_theme', t)
    applyTheme(t)
  }

  if (!mounted) return null

  return (
    <div className="flex items-center gap-1 bg-noir-800 border border-noir-700 rounded-lg p-1 theme-toggle">
      {/* Clair */}
      <button
        onClick={() => changeTheme('light')}
        className={`p-1.5 rounded transition-colors text-xs ${theme === 'light' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}
        title="Mode clair"
        aria-label="Mode clair"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>
      {/* Sombre */}
      <button
        onClick={() => changeTheme('dark')}
        className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}
        title="Mode sombre"
        aria-label="Mode sombre"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
      {/* Système */}
      <button
        onClick={() => changeTheme('system')}
        className={`p-1.5 rounded transition-colors ${theme === 'system' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}
        title="Selon le système"
        aria-label="Selon le système"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </button>
    </div>
  )
}