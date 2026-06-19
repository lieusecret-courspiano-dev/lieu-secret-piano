import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cours de piano en ligne via Zoom — Lieu Secret',
  description: 'Cours de piano individuels, ateliers de groupe et masterclass en ligne via Zoom. Pédagogie bienveillante pour tous les niveaux, de débutant à avancé. Premier cours d\'essai gratuit.',
  keywords: [
    'cours de piano en ligne',
    'cours piano zoom',
    'piano individuel en ligne',
    'atelier piano en ligne',
    'masterclass piano zoom',
    'apprendre piano en ligne',
    'cours piano débutant',
    'cours piano adulte en ligne',
    'cours piano enfant en ligne',
    'école piano en ligne france',
  ],
  openGraph: {
    title: 'Cours de piano en ligne via Zoom — Lieu Secret',
    description: 'Cours individuels, ateliers et masterclass via Zoom. Pédagogie personnalisée pour tous les niveaux.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/cours',
    siteName: 'Lieu Secret',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cours de piano en ligne via Zoom — Lieu Secret',
    description: 'Cours individuels, ateliers et masterclass via Zoom. Pour tous les niveaux.',
  },
  alternates: {
    canonical: 'https://www.lieusecret-courspiano.fr/cours',
  },
}

export default function CoursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}