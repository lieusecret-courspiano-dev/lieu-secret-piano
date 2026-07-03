import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bon cadeau cours de piano — Lieu Secret',
  description: 'Offrez un bon cadeau pour des cours de piano en ligne via Zoom. Idée cadeau originale pour Noël, anniversaire ou fête. Livraison immédiate par email.',
  keywords: [
    'bon cadeau cours piano',
    'offrir cours piano',
    'cadeau piano en ligne',
    'bon cadeau piano zoom',
    'idée cadeau piano',
    'offrir cours musique',
    'bon cadeau école piano',
  ],
  openGraph: {
    title: 'Bon cadeau cours de piano — Lieu Secret',
    description: 'Offrez des cours de piano en ligne via Zoom. Livraison immédiate par email.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/cadeau',
    siteName: 'Lieu Secret',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bon cadeau cours de piano — Lieu Secret',
    description: 'Offrez des cours de piano en ligne. Livraison immédiate par email.',
  },
  alternates: {
    canonical: 'https://www.lieusecret-courspiano.fr/cadeau',
  },
}

export default function CadeauLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}