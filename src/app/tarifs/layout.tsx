import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs cours de piano en ligne — Lieu Secret',
  description: 'Tarifs transparents pour les cours de piano en ligne via Zoom. Cours individuel à 22 €/h, packs d\'heures et cours d\'essai gratuit. Sans engagement, sans frais cachés.',
  keywords: [
    'tarifs cours piano en ligne',
    'prix cours piano zoom',
    'pack heures piano',
    'cours piano 22 euros',
    'abonnement cours piano',
    'tarif école piano en ligne',
    'cours piano sans engagement',
  ],
  openGraph: {
    title: 'Tarifs cours de piano en ligne — Lieu Secret',
    description: 'Cours individuel à 22 €/h via Zoom. Packs d\'heures disponibles. Premier cours d\'essai gratuit.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/tarifs',
    siteName: 'Lieu Secret',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs cours de piano en ligne — Lieu Secret',
    description: 'Cours individuel à 22 €/h via Zoom. Packs d\'heures. Essai gratuit.',
  },
  alternates: {
    canonical: 'https://www.lieusecret-courspiano.fr/tarifs',
  },
}

export default function TarifsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}