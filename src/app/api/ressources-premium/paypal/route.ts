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

  // NE PAS créer l'achat ici — il sera créé dans la capture après approbation PayPal
  // On encode les infos dans l'URL de retour
  const returnParams = new URLSearchParams({
    ressource_id,
    acheteur_nom,
    acheteur_email: acheteur_email.toLowerCase().trim(),
  })

  try {
    const order = await createPayPalOrder({
      amount:      ressource.prix,
      currency:    'EUR',
      description: `${ressource.titre} — Lieu Secret`,
      customId:    `rp_${ressource_id}`,
      returnUrl:   `${APP_URL}/api/ressources-premium/paypal/capture?${returnParams.toString()}`,
      cancelUrl:   `${APP_URL}/ressources-premium/${ressource_id}`,
    })

    return NextResponse.json({ approvalUrl: order.approveUrl })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur PayPal' }, { status: 500 })
  }
}