import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Lieu Secret École de Piano',
  description: 'Contactez Lieu Secret pour toute question sur nos cours de piano en ligne. Réponse sous 24-48h. Cours d\'essai gratuit disponible.',
  keywords: ['contact école piano', 'cours piano contact', 'lieu secret contact'],
  openGraph: {
    title: 'Contact — Lieu Secret',
    description: 'Une question ? Contactez-nous. Réponse sous 24-48h.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: { canonical: 'https://www.lieusecret-courspiano.fr/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}