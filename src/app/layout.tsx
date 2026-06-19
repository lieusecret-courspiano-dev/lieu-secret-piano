import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

const SITE_URL  = 'https://www.lieusecret-courspiano.fr'
const SITE_NAME = 'Lieu Secret — École de Piano en Ligne'
const SITE_DESC = 'Apprenez le piano en ligne via Zoom avec une pédagogie bienveillante et personnalisée. Cours individuels, ateliers de groupe et masterclass pour tous niveaux. Premier cours d\'essai gratuit.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s — Lieu Secret',
  },
  description: SITE_DESC,
  keywords: [
    'cours de piano en ligne',
    'école de piano en ligne',
    'apprendre le piano',
    'piano débutant',
    'cours piano individuel',
    'cours piano zoom',
    'atelier piano en ligne',
    'masterclass piano',
    'piano zoom',
    'lieu secret piano',
    'cours piano adulte',
    'cours piano enfant',
    'cours piano tous niveaux',
    'réserver cours piano',
    'cours piano gratuit essai',
  ],
  authors: [{ name: 'Lieu Secret' }],
  creator: 'Lieu Secret',
  publisher: 'Lieu Secret',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        alt: 'Lieu Secret — École de Piano en Ligne via Zoom',
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
    languages: {
      'fr-FR': SITE_URL,
    },
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
    { media: '(prefers-color-scheme: dark)',  color: '#1a1a2e' },
    { media: '(prefers-color-scheme: light)', color: '#f8f5f0' },
  ],
}

// Schema.org JSON-LD enrichi
const schemaOrg = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MusicSchool',
      '@id': `${SITE_URL}/#organization`,
      name: 'Lieu Secret',
      alternateName: 'Lieu Secret Piano',
      description: SITE_DESC,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'lieusecret-courspiano@outlook.fr',
        contactType: 'customer service',
        availableLanguage: 'French',
        contactOption: 'TollFree',
      },
      sameAs: [
        'https://www.instagram.com/lieusecret',
        'https://www.youtube.com/@lieusecret',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Cours de piano en ligne',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Cours de piano individuel via Zoom',
            description: 'Cours de piano individuel en ligne via Zoom, programme personnalisé pour tous niveaux',
            price: '22',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            deliveryLeadTime: { '@type': 'QuantitativeValue', value: 1, unitCode: 'DAY' },
          },
          {
            '@type': 'Offer',
            name: "Cours d'essai gratuit",
            description: "Premier cours de piano gratuit d'une heure via Zoom, sans engagement",
            price: '0',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
          },
        ],
      },
      courseMode: 'online',
      educationalLevel: 'Beginner to Advanced',
      teaches: 'Piano',
      inLanguage: 'fr',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESC,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'fr',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESC,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'fr',
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Comment se déroulent les cours de piano en ligne ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les cours se déroulent via Zoom. Vous recevez le lien par email après réservation. Une connexion internet stable et un clavier ou piano suffisent.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quel niveau faut-il pour commencer ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Aucun niveau requis. Nous accueillons les débutants complets comme les pianistes confirmés. Chaque parcours est adapté à votre niveau et vos objectifs.',
          },
        },
        {
          '@type': 'Question',
          name: 'Le cours d\'essai est-il vraiment gratuit ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, le cours d\'essai dure 1 heure et est entièrement gratuit, sans engagement. Il se déroule via Zoom.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quel matériel est nécessaire pour les cours de piano en ligne ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Un clavier ou piano (au moins 61 touches avec toucher dynamique recommandé), un ordinateur ou tablette avec caméra, et une connexion internet stable.',
          },
        },
      ],
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