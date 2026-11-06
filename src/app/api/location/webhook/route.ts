import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const resend  = new Resend(process.env.RESEND_API_KEY!)
const FROM    = 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_LOCATION!
    )
  } catch (err: unknown) {
    console.error('Webhook signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Vérifier que c'est bien une session de location
    if (session.metadata?.type !== 'location') {
      return NextResponse.json({ received: true })
    }

    const reservationId = session.metadata?.reservation_id
    if (!reservationId) {
      return NextResponse.json({ error: 'reservation_id manquant' }, { status: 400 })
    }

    // Récupérer la réservation
    const { data: resa } = await supabaseAdmin
      .from('location_reservations')
      .select('*')
      .eq('id', reservationId)
      .single()

    if (!resa) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    // Mettre à jour le statut de paiement
    await supabaseAdmin
      .from('location_reservations')
      .update({
        paiement_statut: 'complet',
        statut: 'validee',
        stripe_session_id: session.id,
      })
      .eq('id', reservationId)

    // Email de confirmation au client
    resend.emails.send({
      from: FROM,
      to:   resa.locataire_email,
      subject: `Paiement confirmé — Location ${resa.article_nom}`,
      html: `
        <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:22px;color:#f59e0b;letter-spacing:4px;">LIEU SECRET</div>
          </div>
          <h2 style="color:#22c55e;margin:0 0 16px;">Paiement confirmé !</h2>
          <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Bonjour ${resa.locataire_nom},</p>
          <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">
            Votre paiement de <strong style="color:#f59e0b;">${resa.montant_total.toFixed(2).replace('.', ',')} €</strong>
            pour la location de <strong style="color:#f0f0f0;">${resa.article_nom}</strong> a bien été reçu.
          </p>
          <div style="background:#252540;border:1px solid #3a3a5c;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="color:#a0a0c0;font-size:12px;margin:0 0 8px;font-weight:bold;text-transform:uppercase;">Récapitulatif</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:4px 0;color:#a0a0c0;font-size:13px;">Article</td><td style="padding:4px 0;color:#f0f0f0;font-size:13px;text-align:right;">${resa.article_nom}</td></tr>
              <tr><td style="padding:4px 0;color:#a0a0c0;font-size:13px;">Période</td><td style="padding:4px 0;color:#f0f0f0;font-size:13px;text-align:right;">${new Date(resa.date_debut).toLocaleDateString('fr-FR')} → ${new Date(resa.date_fin).toLocaleDateString('fr-FR')}</td></tr>
              <tr><td style="padding:4px 0;color:#a0a0c0;font-size:13px;">Montant payé</td><td style="padding:4px 0;color:#f59e0b;font-size:13px;font-weight:bold;text-align:right;">${resa.montant_total.toFixed(2).replace('.', ',')} €</td></tr>
            </table>
          </div>
          <p style="color:#a0a0c0;font-size:13px;">Nous vous contacterons pour organiser la remise du matériel.</p>
        </div>
      `,
    }).catch(console.error)

    // Email notification admin
    resend.emails.send({
      from: FROM,
      to:   ADMIN_EMAIL,
      subject: `[Location] Paiement Stripe reçu — ${resa.article_nom}`,
      html: `
        <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#22c55e;">Paiement Stripe confirmé</h2>
          <p><strong>Article :</strong> ${resa.article_nom}</p>
          <p><strong>Client :</strong> ${resa.locataire_nom} (${resa.locataire_email})</p>
          <p><strong>Montant :</strong> ${resa.montant_total.toFixed(2).replace('.', ',')} €</p>
          <p><strong>Session Stripe :</strong> ${session.id}</p>
          <a href="https://www.lieusecret-courspiano.fr/admin/location/${reservationId}"
            style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">
            Voir la réservation →
          </a>
        </div>
      `,
    }).catch(console.error)
  }

  return NextResponse.json({ received: true })
}