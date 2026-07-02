'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <div className={`transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  )
}
