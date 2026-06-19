import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cours de piano en ligne — Lieu Secret',
  description: 'Cours de piano individuels, ateliers de groupe et masterclass en ligne via Zoom. Pour tous les niveaux, de débutant à avancé. Premier cours d\'essai gratuit.',
  keywords: ['cours de piano en ligne', 'piano individuel', 'atelier piano', 'masterclass piano', 'apprendre piano zoom'],
  openGraph: {
    title: 'Cours de piano en ligne — Lieu Secret',
    description: 'Cours individuels, ateliers et masterclass via Zoom. Pour tous les niveaux.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://www.lieusecret-courspiano.fr/cours' },
}

export default function CoursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}