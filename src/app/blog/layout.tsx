import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog piano — Conseils et inspirations — Lieu Secret',
  description: 'Articles, conseils pédagogiques et ressources pour progresser au piano. Techniques, matériel, pédagogie et inspirations musicales.',
  keywords: ['blog piano', 'conseils piano', 'apprendre piano adulte', 'technique piano', 'pédagogie piano'],
  openGraph: {
    title: 'Blog piano — Lieu Secret',
    description: 'Conseils, techniques et inspirations pour progresser au piano.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://www.lieusecret-courspiano.fr/blog' },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}