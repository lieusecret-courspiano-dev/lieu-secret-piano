import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    event_id,
    student_name,
    student_email,
    student_phone,
    student_timezone,
    message,
  } = body

  if (!event_id || !student_name || !student_email) {
    return NextResponse.json({ error: 'Donnees manquantes' }, { status: 400 })
  }

  // Récupérer l'événement
  const { data: event, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', event_id)
    .eq('is_active', true)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Evenement introuvable' }, { status: 404 })
  }

  if (event.is_free) {
    return NextResponse.json({ error: 'Cet evenement est gratuit' }, { status: 400 })
  }

  if (event.max_spots !== null && event.spots_remaining <= 0) {
    return NextResponse.json({ error: 'Plus de places disponibles' }, { status: 409 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'

  // Créer la session Stripe Checkout
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: event.title,
          description: event.description || `Lieu Secret — ${event.title}`,
        },
        unit_amount: Math.round(event.price * 100), // en centimes
      },
      quantity: 1,
    }],
    customer_email: student_email,
    metadata: {
      event_id,
      student_name,
      student_email,
      student_phone:    student_phone || '',
      student_timezone: student_timezone || 'Europe/Paris',
      message:          message || '',
    },
    success_url: `${appUrl}/reservation/confirmation?session_id={CHECKOUT_SESSION_ID}&type=event&email=${encodeURIComponent(student_email)}`,
    cancel_url:  `${appUrl}/?tab=evenements`,
  })

  return NextResponse.json({ url: session.url })
}