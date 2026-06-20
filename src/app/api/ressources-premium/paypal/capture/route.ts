import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { capturePayPalOrder } from '@/lib/paypal'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend   = new Resend(process.env.RESEND_API_KEY!)
const FROM     = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
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

    // Envoyer email d'accès
    const ressource = achat.ressources_premium as { titre: string }
    const accessUrl = `${APP_URL}/ressources-premium/acces/${achat.token_acces}`

    await resend.emails.send({
      from: FROM,
      to:   achat.acheteur_email,
      subject: `Accès confirmé — ${ressource.titre}`,
      html: `
        <div style="background:#1a1a2e;padding:40px 20px;font-family:Georgia,serif;">
          <div style="max-width:600px;margin:0 auto;background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;">
            <div style="background:#1a1a2e;padding:24px;text-align:center;border-bottom:1px solid #f59e0b;">
              <div style="font-size:22px;color:#f59e0b;letter-spacing:3px;">LIEU SECRET</div>
            </div>
            <div style="padding:32px;">
              <h2 style="color:#f59e0b;margin:0 0 16px;">Paiement PayPal confirmé !</h2>
              <p style="color:#d0d0e8;">Bonjour ${achat.acheteur_nom},</p>
              <p style="color:#d0d0e8;">Votre accès à <strong style="color:#fff;">${ressource.titre}</strong> est maintenant disponible.</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${accessUrl}" style="background:#f59e0b;color:#1a1a2e;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;">
                  Accéder à ma ressource
                </a>
              </div>
              <p style="color:#7070a0;font-size:12px;">Lien permanent : <a href="${accessUrl}" style="color:#f59e0b;">${accessUrl}</a></p>
            </div>
          </div>
        </div>`,
    }).catch(() => {})

    return NextResponse.redirect(`${APP_URL}/ressources-premium/acces/${achat.token_acces}?paypal=success`)
  } catch (err) {
    console.error('PayPal capture ressource error:', err)
    return NextResponse.redirect(`${APP_URL}/ressources-premium?error=payment_failed`)
  }
}