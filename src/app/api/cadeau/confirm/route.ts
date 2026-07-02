import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { generateGiftCardPDF } from '@/lib/pdf'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const resend  = new Resend(process.env.RESEND_API_KEY!)
const FROM    = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'

export const dynamic = 'force-dynamic'

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LS-'
  for (let i = 0; i < 8; i++) { if (i === 4) code += '-'; code += chars[Math.floor(Math.random() * chars.length)] }
  return code
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Session manquante' }, { status: 400 })

  try {
    const { data: existing } = await supabaseAdmin.from('gift_cards').select('code').eq('stripe_session_id', sessionId).single()
    if (existing) return NextResponse.json({ success: true, code: existing.code })

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })

    const meta = session.metadata || {}
    const code = generateGiftCode()
    const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    await supabaseAdmin.from('gift_cards').insert({
      code,
      montant:           parseFloat(meta.montant || '0'),
      montant_restant:   parseFloat(meta.montant || '0'),
      acheteur_nom:      meta.acheteur_nom,
      acheteur_email:    meta.acheteur_email,
      destinataire_nom:  meta.destinataire_nom,
      message:           meta.message || null,
      stripe_session_id: sessionId,
      status:            'active',
      expires_at:        expiresAt.toISOString(),
    })

    // Générer le vrai PDF
    const pdfBuffer = await generateGiftCardPDF({
      code,
      montant:          parseFloat(meta.montant || '0'),
      acheteur_nom:     meta.acheteur_nom,
      destinataire_nom: meta.destinataire_nom,
      message:          meta.message || '',
      expires_at:       expiresAt.toISOString(),
    })

    const pdfAttachment = {
      filename:     `bon-cadeau-lieu-secret-${code}.pdf`,
      content:      pdfBuffer.toString('base64'),
      content_type: 'application/pdf',
    }

    // Email à l'acheteur
    const buyerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#252540);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">
<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>
<div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;"> Votre bon cadeau est prêt !</h2>
<p style="color:#a0a0c0;font-size:14px;margin:0 0 24px;">Bonjour ${meta.acheteur_nom},</p>
<p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Votre bon cadeau pour <strong style="color:#f59e0b;">${meta.destinataire_nom}</strong> a bien été enregistré.</p>
<div style="background:#1a1a2e;border:2px solid #f59e0b;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
  <p style="margin:0 0 8px;color:#a0a0c0;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Code cadeau</p>
  <div style="font-size:32px;color:#f59e0b;font-weight:bold;letter-spacing:6px;font-family:monospace;">${code}</div>
  <p style="margin:12px 0 0;color:#7070a0;font-size:12px;">Valeur : ${meta.montant} € — Valable 1 an</p>
</div>
${meta.message ? `<div style="background:#2a2a45;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:4px;margin:16px 0;"><p style="margin:0;color:#d0d0e8;font-size:14px;font-style:italic;">"${meta.message}"</p></div>` : ''}
<div style="background:#2a2a45;border-radius:8px;padding:16px;margin:20px 0;">
  <p style="margin:0 0 8px;color:#f59e0b;font-size:13px;font-weight:bold;">Comment utiliser ce bon ?</p>
  <ol style="margin:0;padding-left:20px;color:#a0a0c0;font-size:13px;line-height:1.8;">
    <li>Transmettez ce code à <strong style="color:#f0f0f0;">${meta.destinataire_nom}</strong></li>
    <li>Il/elle se rend sur <a href="${APP_URL}/reservation" style="color:#f59e0b;">${APP_URL}/reservation</a></li>
    <li>Lors de la réservation, il/elle saisit le code cadeau</li>
    <li>Le montant est déduit automatiquement</li>
  </ol>
</div>
<div style="background:#2a2a45;border:1px solid #3a3a5c;border-radius:8px;padding:14px;margin-top:16px;">
  <p style="margin:0;color:#a0a0c0;font-size:12px;"> Le bon cadeau est joint en PDF à cet email — vous pouvez l'imprimer ou le transférer.</p>
</div>
<p style="color:#7070a0;font-size:13px;margin-top:24px;">Merci pour votre confiance,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>
</td></tr>
<tr><td style="background:#1a1a2e;padding:20px;text-align:center;border-top:1px solid #3a3a5c;">
<p style="margin:0;font-size:12px;color:#505080;">Lieu Secret — École de Piano en Ligne</p>
</td></tr></table></td></tr></table></body></html>`

    await resend.emails.send({
      from:        FROM,
      to:          meta.acheteur_email,
      subject:     ` Votre bon cadeau Lieu Secret — Code : ${code}`,
      html:        buyerHtml,
      attachments: [pdfAttachment],
    })

    return NextResponse.json({ success: true, code })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur'
    console.error('Erreur confirmation cadeau:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}