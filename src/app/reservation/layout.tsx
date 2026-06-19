import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Réserver un cours de piano en ligne — Lieu Secret',
  description: 'Réservez votre cours de piano en ligne via Zoom. Choisissez votre créneau, votre mode de paiement et confirmez votre réservation en quelques clics.',
  keywords: [
    'réserver cours piano en ligne',
    'réservation piano zoom',
    'créneau cours piano',
    'booking cours piano',
  ],
  openGraph: {
    title: 'Réserver un cours de piano — Lieu Secret',
    description: 'Choisissez votre créneau et réservez votre cours de piano en ligne via Zoom.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.lieusecret-courspiano.fr/reservation',
    siteName: 'Lieu Secret',
  },
  robots: {
    index: false, // Page transactionnelle — non indexée
    follow: true,
  },
}

export default function ReservationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}