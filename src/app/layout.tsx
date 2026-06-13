import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lieu Secret — École de Piano en Ligne',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  description: 'Réservez vos cours de piano individuels, ateliers et événements musicaux avec Lieu Secret.',
  keywords: 'piano, cours de piano, école de piano, ateliers piano, musique en ligne',
  openGraph: {
    title: 'Lieu Secret — École de Piano en Ligne',
    description: 'Réservez vos cours de piano individuels, ateliers et événements musicaux.',
    type: 'website',
    locale: 'fr_FR',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid #f59e0b',
              color: '#e8e8e8',
            },
          }}
        />
      </body>
    </html>
  )
}