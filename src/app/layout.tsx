import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lieu Secret — École de Piano en Ligne',
  description: 'Réservez vos cours de piano individuels, ateliers et événements musicaux avec Lieu Secret.',
  keywords: 'piano, cours de piano, école de piano, ateliers piano, musique en ligne',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lieu Secret',
    startupImage: '/icons/icon-512x512.png',
  },
  openGraph: {
    title: 'Lieu Secret — École de Piano en Ligne',
    description: 'Réservez vos cours de piano individuels, ateliers et événements musicaux.',
    type: 'website',
    locale: 'fr_FR',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Lieu Secret',
    'application-name': 'Lieu Secret',
    'msapplication-TileColor': '#1a1a2e',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'theme-color': '#f59e0b',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#1a1a2e' },
    { media: '(prefers-color-scheme: light)', color: '#f8f5f0' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* PWA - iOS splash screens */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
      </head>
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