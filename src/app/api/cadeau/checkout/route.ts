import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'
export async function POST(req: NextRequest) {
  const { acheteur_nom, acheteur_email, destinataire_nom, message, montant } = await req.json()
  if (!acheteur_nom || !acheteur_email || !destinataire_nom || !montant) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  if (montant < 10 || montant > 500) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], mode: 'payment', customer_email: acheteur_email,
      line_items: [{ price_data: { currency: 'eur', unit_amount: Math.round(montant * 100), product_data: { name: `Bon cadeau Lieu Secret — ${montant}€`, description: `Cours de piano pour ${destinataire_nom}` } }, quantity: 1 }],
      metadata: { type: 'cadeau', acheteur_nom, acheteur_email, destinataire_nom, message: message || '', montant: String(montant) },
      success_url: `${APP_URL}/cadeau/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/cadeau`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur Stripe' }, { status: 500 }) }
}
