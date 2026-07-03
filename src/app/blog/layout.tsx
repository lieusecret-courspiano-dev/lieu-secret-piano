import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog piano — Conseils, techniques et inspirations — Lieu Secret',
  description: 'Articles et conseils pour progresser au piano : techniques, choix du matériel, pédagogie, pratique quotidienne. Ressources gratuites pour pianistes de tous niveaux.',
  keywords: [
    'blog piano',
    'conseils piano débutant',
    'apprendre piano adulte',
    'technique piano',
    'pédagogie piano',
    'choisir clavier piano',
    'progresser piano en ligne',
    'exercices piano',
    'théorie musicale piano',
    'ressources piano gratuites',
  ],
  openGraph: {
    title: 'Blog piano — Lieu Secret',
    description: 'Conseils, techniques et ressources gratuites pour progresser au piano. Articles pour tous les niveaux.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/blog',
    siteName: 'Lieu Secret',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog piano — Lieu Secret',
    description: 'Conseils et ressources gratuites pour progresser au piano.',
  },
  alternates: {
    canonical: 'https://www.lieusecret-courspiano.fr/blog',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}