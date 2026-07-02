import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend      = new Resend(process.env.RESEND_API_KEY!)
const FROM        = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'

export async function POST(req: NextRequest) {
  const { acheteur_nom, acheteur_email, destinataire_nom, message, montant, formule_label, formule_desc } = await req.json()

  if (!acheteur_nom || !acheteur_email || !destinataire_nom || !montant) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  try {
    // Récupérer les coordonnées bancaires
    const { data: settings } = await supabaseAdmin
      .from('site_settings').select('virement_iban, virement_nom, virement_info').eq('id', 1).single()

    const iban    = settings?.virement_iban || ''
    const nomBenef = settings?.virement_nom || 'Lieu Secret'
    const infoVir  = settings?.virement_info || ''

    // Enregistrer la demande en attente
    await supabaseAdmin.from('gift_cards').insert({
      code:              'PENDING-' + Date.now(),
      montant:           parseFloat(String(montant)),
      montant_restant:   parseFloat(String(montant)),
      acheteur_nom,
      acheteur_email,
      destinataire_nom,
      message:           message || null,
      status:            'pending_virement',
      expires_at:        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    })

    // Email à l'acheteur avec les coordonnées bancaires
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
<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Demande de bon cadeau reçue</h2>
<p style="color:#a0a0c0;font-size:14px;margin:0 0 24px;">Bonjour ${acheteur_nom},</p>
<p style="color:#d0d0e8;font-size:14px;line-height:1.7;margin-bottom:20px;">
  Votre demande de bon cadeau <strong style="color:#f59e0b;">${formule_label || 'Bon cadeau'}</strong> pour <strong style="color:#f59e0b;">${destinataire_nom}</strong> a bien été enregistrée.
</p>
<div style="background:#1a1a2e;border:2px solid #f59e0b;border-radius:12px;padding:24px;margin:24px 0;">
  <p style="margin:0 0 12px;color:#f59e0b;font-size:14px;font-weight:bold;text-align:center;">Coordonnées pour le virement</p>
  ${iban ? `<div style="margin-bottom:10px;"><span style="color:#a0a0c0;font-size:12px;display:block;margin-bottom:2px;">IBAN</span><span style="color:#f0f0f0;font-size:14px;font-family:monospace;">${iban}</span></div>` : ''}
  <div style="margin-bottom:10px;"><span style="color:#a0a0c0;font-size:12px;display:block;margin-bottom:2px;">Bénéficiaire</span><span style="color:#f0f0f0;font-size:14px;">${nomBenef}</span></div>
  <div style="margin-bottom:10px;"><span style="color:#a0a0c0;font-size:12px;display:block;margin-bottom:2px;">Montant</span><span style="color:#f59e0b;font-size:18px;font-weight:bold;">${montant} €</span></div>
  <div><span style="color:#a0a0c0;font-size:12px;display:block;margin-bottom:2px;">Référence à indiquer</span><span style="color:#f0f0f0;font-size:14px;">Bon cadeau ${destinataire_nom}</span></div>
  ${infoVir ? `<p style="margin:12px 0 0;color:#7070a0;font-size:12px;">${infoVir}</p>` : ''}
</div>
<p style="color:#d0d0e8;font-size:14px;line-height:1.7;">
  Dès réception de votre virement, nous vous enverrons le code cadeau par email. Ce code permettra à ${destinataire_nom} de réserver ses cours directement sur notre site.
</p>
<div style="background:#2a2a45;border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:14px;margin-top:16px;">
  <p style="margin:0;color:#a0a0c0;font-size:12px;">Si vous ne recevez pas l'email de confirmation dans les 48h suivant votre virement, pensez à vérifier votre dossier Spam ou contactez-nous.</p>
</div>
<p style="color:#7070a0;font-size:13px;margin-top:24px;">Merci pour votre confiance,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>
</td></tr>
<tr><td style="background:#1a1a2e;padding:20px;text-align:center;border-top:1px solid #3a3a5c;">
<p style="margin:0;font-size:12px;color:#505080;">Lieu Secret — École de Piano en Ligne</p>
</td></tr></table></td></tr></table></body></html>`

    // Email admin
    const adminHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#252540);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">
<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#f59e0b;font-size:20px;margin:0 0 16px;">Nouvelle demande de bon cadeau (virement)</h2>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#a0a0c0;font-size:13px;width:160px;">Acheteur</td><td style="padding:8px 0;color:#f0f0f0;font-size:14px;">${acheteur_nom} (${acheteur_email})</td></tr>
<tr><td style="padding:8px 0;color:#a0a0c0;font-size:13px;">Pour</td><td style="padding:8px 0;color:#f0f0f0;font-size:14px;">${destinataire_nom}</td></tr>
<tr><td style="padding:8px 0;color:#a0a0c0;font-size:13px;">Formule</td><td style="padding:8px 0;color:#f59e0b;font-size:14px;font-weight:bold;">${formule_label || 'Bon cadeau'} — ${montant} €</td></tr>
${message ? `<tr><td style="padding:8px 0;color:#a0a0c0;font-size:13px;">Message</td><td style="padding:8px 0;color:#f0f0f0;font-size:14px;font-style:italic;">"${message}"</td></tr>` : ''}
</table>
<div style="background:#1a1a2e;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:14px;margin-top:16px;">
<p style="margin:0;color:#f59e0b;font-size:13px;font-weight:bold;">Action requise</p>
<p style="margin:6px 0 0;color:#a0a0c0;font-size:12px;">Dès réception du virement de ${montant} €, créez le bon cadeau manuellement dans Admin > Bons cadeaux et envoyez le code à ${acheteur_email}.</p>
</div>
</td></tr></table></td></tr></table></body></html>`

    await Promise.all([
      resend.emails.send({ from: FROM, to: acheteur_email, subject: `Bon cadeau Lieu Secret — Coordonnées de virement`, html: buyerHtml }),
      resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject: `Nouvelle demande bon cadeau virement — ${acheteur_nom} — ${montant} €`, html: adminHtml }),
    ])

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}