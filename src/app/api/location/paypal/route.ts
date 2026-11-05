import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createPayPalOrder } from '@/lib/paypal'

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

    const order = await createPayPalOrder({
      amount:      montant,
      currency:    'EUR',
      description,
      customId:    reservation_id,
      returnUrl:   `${APP_URL}/location/confirmation?paypal=success&reservation_id=${reservation_id}`,
      cancelUrl:   `${APP_URL}/location`,
    })

    // Mettre à jour la réservation avec l'ID PayPal
    await supabaseAdmin
      .from('location_reservations')
      .update({ paypal_order_id: order.id })
      .eq('id', reservation_id)

    return NextResponse.json({ url: order.approveUrl })
  } catch (err: unknown) {
    console.error('PayPal location error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur PayPal',
    }, { status: 500 })
  }
}