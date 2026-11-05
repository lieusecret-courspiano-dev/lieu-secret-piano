import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  try {
    const { reservation_id, montant } = await req.json()

    if (!reservation_id || !montant) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    // Récupérer la réservation
    const { data: resa, error } = await supabaseAdmin
      .from('location_reservations')
      .select('id, article_nom, locataire_email, locataire_nom, est_acompte')
      .eq('id', reservation_id)
      .single()

    if (error || !resa) {
      return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 })
    }

    const description = resa.est_acompte
      ? `Acompte 50% — Location ${resa.article_nom}`
      : `Location ${resa.article_nom}`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: resa.locataire_email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(montant * 100),
          product_data: {
            name: description,
            description: `Lieu Secret — Location de matériel musical`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        type: 'location',
        reservation_id,
        locataire_nom: resa.locataire_nom,
      },
      success_url: `${APP_URL}/location/confirmation?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservation_id}`,
      cancel_url:  `${APP_URL}/location`,
    })

    // Mettre à jour la réservation avec l'ID de session Stripe
    await supabaseAdmin
      .from('location_reservations')
      .update({ stripe_session_id: session.id })
      .eq('id', reservation_id)

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('Stripe location error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur Stripe',
    }, { status: 500 })
  }
}