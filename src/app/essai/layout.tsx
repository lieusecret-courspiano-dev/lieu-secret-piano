import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cours d\'essai gratuit — Lieu Secret Piano',
  description: 'Réservez votre cours d\'essai gratuit d\'une heure. Cours de piano individuel via Zoom, sans engagement. Évaluez votre niveau et définissez vos objectifs.',
  keywords: ['cours essai piano gratuit', 'premier cours piano', 'essai piano en ligne', 'cours piano offert'],
  openGraph: {
    title: 'Cours d\'essai gratuit — Lieu Secret',
    description: '1 heure de cours de piano offerte, sans engagement. Via Zoom.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://www.lieusecret-courspiano.fr/essai' },
}

export default function EssaiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}