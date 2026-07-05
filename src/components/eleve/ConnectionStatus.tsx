'use client'
import { useState, useEffect } from 'react'

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  setTimeout(() => setShowBanner(false), 3000) }
    const handleOffline = () => { setIsOnline(false); setShowBanner(true) }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Vérifier l'état initial
    if (!navigator.onLine) { setIsOnline(false); setShowBanner(true) }

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
      isOnline
        ? 'bg-green-500/20 border-green-500/40 text-green-300'
        : 'bg-red-500/20 border-red-500/40 text-red-300'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
      {isOnline ? 'Connexion rétablie' : 'Connexion perdue — vérifiez votre réseau'}
    </div>
  )
}
