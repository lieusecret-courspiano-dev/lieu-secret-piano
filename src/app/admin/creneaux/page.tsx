'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCreneaux() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/disponibilites')
  }, [router])

  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-noir-400 text-sm">Redirection vers Disponibilites...</p>
      </div>
    </div>
  )
}