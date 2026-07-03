import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acheter un pack de cours de piano — Lieu Secret',
  description: 'Achetez un pack d\'heures de cours de piano en ligne via Zoom. Économisez sur vos cours avec nos packs 5h, 10h et plus. Paiement sécurisé par carte ou virement.',
  keywords: [
    'pack cours piano en ligne',
    'acheter heures piano',
    'pack piano zoom',
    'abonnement piano en ligne',
    'pack heures cours piano',
    'cours piano en lot',
  ],
  openGraph: {
    title: 'Packs de cours de piano — Lieu Secret',
    description: 'Économisez sur vos cours de piano en ligne avec nos packs d\'heures. Via Zoom.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/packs',
    siteName: 'Lieu Secret',
  },
  twitter: {
    card: 'summary',
    title: 'Packs de cours de piano — Lieu Secret',
    description: 'Packs d\'heures de cours de piano en ligne via Zoom.',
  },
  alternates: {
    canonical: 'https://www.lieusecret-courspiano.fr/packs',
  },
}

export default function PacksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}