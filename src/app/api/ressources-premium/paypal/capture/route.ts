import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { capturePayPalOrder } from '@/lib/paypal'

export const dynamic = 'force-dynamic'

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function GET(req: NextRequest) {
  const achat_id = req.nextUrl.searchParams.get('achat_id')
  const token    = req.nextUrl.searchParams.get('token')
  const orderID  = req.nextUrl.searchParams.get('token') // PayPal passe le token dans l'URL

  if (!achat_id) {
    return NextResponse.redirect(`${APP_URL}/ressources-premium?error=missing_params`)
  }

  // Récupérer l'achat
  const { data: achat } = await supabaseAdmin
    .from('ressources_premium_achats')
    .select('*, ressources_premium(titre)')
    .eq('id', achat_id)
    .single()

  if (!achat) return NextResponse.redirect(`${APP_URL}/ressources-premium?error=not_found`)
  if (achat.statut === 'confirme') {
    return NextResponse.redirect(`${APP_URL}/ressources-premium/acces/${achat.token_acces}`)
  }

  try {
    // Capturer le paiement PayPal
    if (achat.paypal_order_id) {
      await capturePayPalOrder(achat.paypal_order_id)
    }

    // Confirmer l'achat
    await supabaseAdmin
      .from('ressources_premium_achats')
      .update({ statut: 'confirme', confirmed_at: new Date().toISOString() })
      .eq('id', achat_id)

    

    return NextResponse.redirect(`${APP_URL}/ressources-premium/acces/${achat.token_acces}?paypal=success`)
  } catch (err) {
    console.error('PayPal capture ressource error:', err)
    return NextResponse.redirect(`${APP_URL}/ressources-premium?error=payment_failed`)
  }
}