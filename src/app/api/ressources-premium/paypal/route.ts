import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createPayPalOrder } from '@/lib/paypal'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  const { ressource_id, acheteur_nom, acheteur_email } = await req.json()

  if (!ressource_id || !acheteur_nom || !acheteur_email) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Récupérer la ressource
  const { data: ressource } = await supabaseAdmin
    .from('ressources_premium')
    .select('id, titre, prix, est_gratuit, est_publie')
    .eq('id', ressource_id)
    .eq('est_publie', true)
    .single()

  if (!ressource) return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 })
  if (ressource.est_gratuit || ressource.prix <= 0) {
    return NextResponse.json({ error: 'Cette ressource est gratuite' }, { status: 400 })
  }

  // Créer l'achat en attente
  const { data: achat, error: achatError } = await supabaseAdmin
    .from('ressources_premium_achats')
    .insert({
      ressource_id,
      acheteur_email: acheteur_email.toLowerCase().trim(),
      acheteur_nom,
      montant: ressource.prix,
      payment_method: 'paypal',
      statut: 'en_attente',
    })
    .select()
    .single()

  if (achatError || !achat) {
    return NextResponse.json({ error: 'Erreur création achat' }, { status: 500 })
  }

  try {
    const order = await createPayPalOrder({
      amount:      ressource.prix,
      currency:    'EUR',
      description: `${ressource.titre} — Lieu Secret`,
      customId:    achat.id,
      returnUrl:   `${APP_URL}/api/ressources-premium/paypal/capture?achat_id=${achat.id}&token=${achat.token_acces}`,
      cancelUrl:   `${APP_URL}/ressources-premium/${ressource_id}`,
    })

    // Stocker l'order ID PayPal
    await supabaseAdmin
      .from('ressources_premium_achats')
      .update({ paypal_order_id: order.id })
      .eq('id', achat.id)

    return NextResponse.json({ approvalUrl: order.approveUrl })
  } catch (err: unknown) {
    await supabaseAdmin.from('ressources_premium_achats').delete().eq('id', achat.id)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur PayPal' }, { status: 500 })
  }
}