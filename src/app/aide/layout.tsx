import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ & Aide — Lieu Secret École de Piano en Ligne',
  description: 'Trouvez les réponses à vos questions sur les cours de piano en ligne via Zoom, l\'espace élève, les packs, les bons cadeaux et les réservations.',
  keywords: [
    'faq cours piano en ligne',
    'aide espace élève piano',
    'questions cours piano zoom',
    'comment réserver cours piano',
    'aide lieu secret piano',
  ],
  openGraph: {
    title: 'FAQ & Aide — Lieu Secret',
    description: 'Réponses à toutes vos questions sur les cours de piano en ligne via Zoom.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/aide',
    siteName: 'Lieu Secret',
  },
  alternates: {
    canonical: 'https://www.lieusecret-courspiano.fr/aide',
  },
}

export default function AideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}