import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { capturePayPalOrder } from '@/lib/paypal'
import { linkRessourcePremiumToEleve } from '@/lib/ressources-premium-eleve'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function GET(req: NextRequest) {
  const ressource_id  = req.nextUrl.searchParams.get('ressource_id')
  const acheteur_nom  = req.nextUrl.searchParams.get('acheteur_nom')
  const acheteur_email = req.nextUrl.searchParams.get('acheteur_email')
  const token         = req.nextUrl.searchParams.get('token') // PayPal order token

  if (!ressource_id || !acheteur_nom || !acheteur_email) {
    return NextResponse.redirect(`${APP_URL}/ressources-premium?error=missing_params`)
  }

  // Récupérer la ressource
  const { data: ressource } = await supabaseAdmin
    .from('ressources_premium')
    .select('id, titre, prix')
    .eq('id', ressource_id)
    .single()

  if (!ressource) return NextResponse.redirect(`${APP_URL}/ressources-premium?error=not_found`)

  try {
    // Capturer le paiement PayPal
    if (token) {
      await capturePayPalOrder(token)
    }

    // Créer l'achat MAINTENANT (après paiement confirmé)
    const { data: achat, error: achatError } = await supabaseAdmin
      .from('ressources_premium_achats')
      .insert({
        ressource_id,
        acheteur_email: acheteur_email.toLowerCase().trim(),
        acheteur_nom,
        montant: ressource.prix,
        payment_method: 'paypal',
        statut: 'confirme',
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (achatError || !achat) {
      console.error('Erreur création achat PayPal:', achatError)
      return NextResponse.redirect(`${APP_URL}/ressources-premium?error=payment_failed`)
    }

    // Lier à l'élève et envoyer email d'accès
    await linkRessourcePremiumToEleve({
      achat_id:        achat.id,
      acheteur_email:  achat.acheteur_email,
      acheteur_nom:    achat.acheteur_nom,
      ressource_titre: ressource.titre,
      token_acces:     achat.token_acces,
    }).catch(() => {})

    return NextResponse.redirect(`${APP_URL}/ressources-premium/acces/${achat.token_acces}?paypal=success`)
  } catch (err) {
    console.error('PayPal capture ressource error:', err)
    return NextResponse.redirect(`${APP_URL}/ressources-premium?error=payment_failed`)
  }
}