import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Lieu Secret École de Piano en Ligne',
  description: 'Contactez Lieu Secret pour toute question sur nos cours de piano en ligne via Zoom. Réponse sous 24-48h ouvrées. Cours d\'essai gratuit disponible sur demande.',
  keywords: [
    'contact école piano en ligne',
    'contacter lieu secret',
    'cours piano renseignements',
    'inscription cours piano',
    'demande cours piano zoom',
  ],
  openGraph: {
    title: 'Contact — Lieu Secret',
    description: 'Une question sur nos cours de piano en ligne ? Contactez-nous. Réponse sous 24-48h.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/contact',
    siteName: 'Lieu Secret',
  },
  twitter: {
    card: 'summary',
    title: 'Contact — Lieu Secret',
    description: 'Contactez-nous pour toute question sur nos cours de piano en ligne.',
  },
  alternates: {
    canonical: 'https://www.lieusecret-courspiano.fr/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}