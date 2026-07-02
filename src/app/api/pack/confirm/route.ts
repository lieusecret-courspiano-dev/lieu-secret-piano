import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const resend  = new Resend(process.env.RESEND_API_KEY!)
const FROM    = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'

export const dynamic = 'force-dynamic'

function generatePackCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PK-'
  for (let i = 0; i < 8; i++) { if (i === 4) code += '-'; code += chars[Math.floor(Math.random() * chars.length)] }
  return code
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Session manquante' }, { status: 400 })

  try {
    const { data: existing } = await supabaseAdmin.from('course_packs').select('code, heures_total, heures_restantes').eq('stripe_session_id', sessionId).single()
    if (existing) return NextResponse.json({ success: true, code: existing.code, heures: existing.heures_total, heures_restantes: existing.heures_restantes })

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })

    const meta    = session.metadata || {}
    const code    = generatePackCode()
    const heures  = parseInt(meta.heures || '5')
    const montant = parseFloat(meta.montant || '0')
    const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    await supabaseAdmin.from('course_packs').insert({
      code,
      pack_label:       meta.pack_label,
      heures_total:     heures,
      heures_restantes: heures,
      montant,
      acheteur_nom:     meta.acheteur_nom,
      acheteur_email:   meta.acheteur_email,
      stripe_session_id: sessionId,
      status:           'active',
      payment_method:   'stripe',
      date_paiement:    new Date().toISOString().split('T')[0],
      expires_at:       expiresAt.toISOString(),
    })

    const expiresDate = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

    // Email de confirmation
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#252540);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">
<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>
<div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;"> Votre pack de cours est activé !</h2>
<p style="color:#a0a0c0;font-size:14px;margin:0 0 24px;">Bonjour ${meta.acheteur_nom},</p>
<p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Votre <strong style="color:#f59e0b;">${meta.pack_label}</strong> a bien été enregistré.</p>
<div style="background:#1a1a2e;border:2px solid #f59e0b;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
  <p style="margin:0 0 8px;color:#a0a0c0;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Code de votre pack</p>
  <div style="font-size:32px;color:#f59e0b;font-weight:bold;letter-spacing:6px;font-family:monospace;">${code}</div>
  <p style="margin:12px 0 4px;color:#f0f0f0;font-size:16px;font-weight:bold;">${heures} heures de cours</p>
  <p style="margin:0;color:#7070a0;font-size:12px;">Valable jusqu'au ${expiresDate}</p>
</div>
<div style="background:#2a2a45;border-radius:8px;padding:16px;margin:20px 0;">
  <p style="margin:0 0 8px;color:#f59e0b;font-size:13px;font-weight:bold;">Comment utiliser votre pack ?</p>
  <ol style="margin:0;padding-left:20px;color:#a0a0c0;font-size:13px;line-height:1.8;">
    <li>Rendez-vous sur <a href="${APP_URL}/reservation" style="color:#f59e0b;">${APP_URL}/reservation</a></li>
    <li>Saisissez votre code d'accès élève</li>
    <li>Choisissez un créneau disponible</li>
    <li>Dans la modale, sélectionnez "Pack de cours" et saisissez le code <strong style="color:#f0f0f0;">${code}</strong></li>
    <li>1 heure sera débitée de votre pack à chaque réservation</li>
  </ol>
</div>
<p style="color:#7070a0;font-size:13px;margin-top:24px;">À très bientôt,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>
</td></tr>
<tr><td style="background:#1a1a2e;padding:20px;text-align:center;border-top:1px solid #3a3a5c;">
<p style="margin:0;font-size:12px;color:#505080;">Lieu Secret — École de Piano en Ligne</p>
</td></tr></table></td></tr></table></body></html>`

    await resend.emails.send({
      from: FROM, to: meta.acheteur_email,
      subject: `Votre ${meta.pack_label} Lieu Secret - Code : ${code}`,
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#252540);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">
<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>
<div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ECOLE DE PIANO EN LIGNE</div>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Votre pack de cours est active !</h2>
<p style="color:#a0a0c0;font-size:14px;margin:0 0 24px;">Bonjour ${meta.acheteur_nom},</p>
<p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Votre <strong style="color:#f59e0b;">${meta.pack_label}</strong> a bien ete enregistre.</p>
<div style="background:#1a1a2e;border:2px solid #f59e0b;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
  <p style="margin:0 0 8px;color:#a0a0c0;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Code de votre pack</p>
  <div style="font-size:32px;color:#f59e0b;font-weight:bold;letter-spacing:6px;font-family:monospace;">${code}</div>
  <p style="margin:12px 0 4px;color:#f0f0f0;font-size:18px;font-weight:bold;">${heures} heures de cours</p>
  <p style="margin:0;color:#7070a0;font-size:12px;">Valable jusqu au ${expiresDate}</p>
</div>
<div style="background:#2a2a45;border-radius:8px;padding:16px;margin:20px 0;">
  <p style="margin:0 0 8px;color:#f59e0b;font-size:13px;font-weight:bold;">Comment utiliser votre pack ?</p>
  <ol style="margin:0;padding-left:20px;color:#a0a0c0;font-size:13px;line-height:1.8;">
    <li>Rendez-vous sur <a href="${APP_URL}/reservation" style="color:#f59e0b;">${APP_URL}/reservation</a></li>
    <li>Saisissez votre code d acces eleve</li>
    <li>Choisissez un creneau disponible</li>
    <li>Dans la modale, selectionnez Pack de cours et saisissez le code <strong style="color:#f0f0f0;">${code}</strong></li>
    <li>1 heure sera debitee de votre pack a chaque reservation</li>
  </ol>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
  <td width="48%" style="text-align:center;padding-right:8px;">
    <a href="${APP_URL}/mon-pack" style="display:block;background:#f59e0b;color:#1a1a2e;font-size:14px;font-weight:bold;padding:14px 20px;border-radius:8px;text-decoration:none;">Consulter mes heures</a>
  </td>
  <td width="4%"></td>
  <td width="48%" style="text-align:center;padding-left:8px;">
    <a href="${APP_URL}/reservation" style="display:block;background:transparent;color:#f59e0b;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:8px;text-decoration:none;border:2px solid #f59e0b;">Reserver un cours</a>
  </td>
</tr>
</table>
<div style="background:#2a2a45;border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:14px;margin-top:16px;">
  <p style="margin:0;color:#a0a0c0;font-size:12px;">Si vous ne recevez pas cet email dans votre boite de reception, pensez a verifier votre dossier Spam.</p>
</div>
<p style="color:#7070a0;font-size:13px;margin-top:24px;">A tres bientot,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>
</td></tr>
<tr><td style="background:#1a1a2e;padding:20px;text-align:center;border-top:1px solid #3a3a5c;">
<p style="margin:0;font-size:12px;color:#505080;">Lieu Secret — Ecole de Piano en Ligne</p>
</td></tr></table></td></tr></table></body></html>`,
    })

    return NextResponse.json({ success: true, code, heures, pack_label: meta.pack_label })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}