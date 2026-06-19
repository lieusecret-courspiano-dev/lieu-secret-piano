import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs cours de piano — Lieu Secret',
  description: 'Tarifs transparents pour les cours de piano en ligne. Cours à l\'unité, packs d\'heures et cours d\'essai gratuit. Sans engagement, sans frais cachés.',
  keywords: ['tarifs cours piano', 'prix cours piano en ligne', 'pack heures piano', 'cours piano pas cher'],
  openGraph: {
    title: 'Tarifs cours de piano — Lieu Secret',
    description: 'Tarifs transparents, sans engagement. Cours à l\'unité ou packs d\'heures.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://www.lieusecret-courspiano.fr/tarifs' },
}

export default function TarifsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}