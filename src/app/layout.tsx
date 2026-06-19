import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

const SITE_URL = 'https://www.lieusecret-courspiano.fr'
const SITE_NAME = 'Lieu Secret — École de Piano en Ligne'
const SITE_DESC = 'Apprenez le piano en ligne avec une pédagogie bienveillante et personnalisée. Cours individuels, ateliers de groupe et masterclass pour tous niveaux. Premier cours d\'essai gratuit.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — Lieu Secret`,
  },
  description: SITE_DESC,
  keywords: [
    'cours de piano en ligne', 'école de piano', 'apprendre le piano', 'piano débutant',
    'cours piano individuel', 'atelier piano', 'masterclass piano', 'piano zoom',
    'lieu secret piano', 'cours piano adulte', 'cours piano enfant',
  ],
  authors: [{ name: 'Lieu Secret' }],
  creator: 'Lieu Secret',
  publisher: 'Lieu Secret',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
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
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Lieu Secret — École de Piano en Ligne',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESC,
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lieu Secret',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Lieu Secret',
    'application-name': 'Lieu Secret',
    'msapplication-TileColor': '#1a1a2e',
    'theme-color': '#f59e0b',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
    { media: '(prefers-color-scheme: light)', color: '#f8f5f0' },
  ],
}

// Schema.org JSON-LD
const schemaOrg = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MusicSchool',
      '@id': `${SITE_URL}/#organization`,
      name: 'Lieu Secret',
      description: SITE_DESC,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512x512.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@lieusecret-courspiano.fr',
        contactType: 'customer service',
        availableLanguage: 'French',
      },
      sameAs: [
        'https://www.instagram.com/lieusecret',
        'https://www.youtube.com/@lieusecret',
      ],
      offers: [
        {
          '@type': 'Offer',
          name: 'Cours de piano individuel',
          description: 'Cours de piano individuel en ligne via Zoom',
          price: '22',
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: "Cours d'essai gratuit",
          description: "Premier cours de piano gratuit d'une heure",
          price: '0',
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESC,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/blog?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#252540',
              border: '1px solid #3a3a5c',
              color: '#f0f0f0',
            },
          }}
        />
      </body>
    </html>
  )
}