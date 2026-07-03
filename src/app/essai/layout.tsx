import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cours d\'essai gratuit — 1h de piano offerte via Zoom — Lieu Secret',
  description: 'Réservez votre cours d\'essai gratuit d\'une heure via Zoom. Sans engagement, sans carte bancaire. Évaluez votre niveau, définissez vos objectifs et découvrez notre pédagogie.',
  keywords: [
    'cours essai piano gratuit',
    'premier cours piano gratuit',
    'essai piano en ligne zoom',
    'cours piano offert',
    'cours piano sans engagement',
    'découvrir cours piano',
    'test cours piano en ligne',
    '1h piano gratuit',
  ],
  openGraph: {
    title: 'Cours d\'essai gratuit — 1h de piano offerte via Zoom — Lieu Secret',
    description: '1 heure de cours de piano offerte via Zoom. Sans engagement, sans carte bancaire. Réservez maintenant.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/essai',
    siteName: 'Lieu Secret',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cours d\'essai gratuit — 1h de piano offerte — Lieu Secret',
    description: '1h de cours de piano gratuit via Zoom. Sans engagement.',
  },
  alternates: {
    canonical: 'https://www.lieusecret-courspiano.fr/essai',
  },
}

export default function EssaiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}