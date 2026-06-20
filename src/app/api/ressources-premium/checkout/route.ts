import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  const { ressource_id, acheteur_nom, acheteur_email } = await req.json()

  if (!ressource_id || !acheteur_nom || !acheteur_email) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Récupérer la ressource
  const { data: ressource } = await supabaseAdmin
    .from('ressources_premium')
    .select('id, titre, description, prix, est_gratuit, est_publie')
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
      payment_method: 'stripe',
      statut: 'en_attente',
    })
    .select()
    .single()

  if (achatError || !achat) {
    return NextResponse.json({ error: 'Erreur création achat' }, { status: 500 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: acheteur_email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(ressource.prix * 100),
          product_data: {
            name: `${ressource.titre} — Lieu Secret`,
            description: ressource.description?.slice(0, 200) || 'Ressource Premium Lieu Secret',
          },
        },
        quantity: 1,
      }],
      metadata: {
        type:           'ressource_premium',
        ressource_id,
        achat_id:       achat.id,
        acheteur_nom,
        acheteur_email: acheteur_email.toLowerCase().trim(),
        token_acces:    achat.token_acces,
      },
      success_url: `${APP_URL}/ressources-premium/acces/${achat.token_acces}?stripe=success`,
      cancel_url:  `${APP_URL}/ressources-premium/${ressource_id}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    // Supprimer l'achat en cas d'erreur Stripe
    await supabaseAdmin.from('ressources_premium_achats').delete().eq('id', achat.id)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur Stripe' }, { status: 500 })
  }
}