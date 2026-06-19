import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Réserver un cours de piano — Lieu Secret',
  description: 'Réservez votre cours de piano en ligne. Choisissez votre créneau, votre mode de paiement et confirmez votre réservation en quelques clics.',
  keywords: ['réserver cours piano', 'réservation piano en ligne', 'créneau piano zoom'],
  openGraph: {
    title: 'Réserver un cours de piano — Lieu Secret',
    description: 'Choisissez votre créneau et réservez votre cours de piano en ligne.',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: { index: false, follow: true }, // Page de réservation non indexée
}

export default function ReservationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}