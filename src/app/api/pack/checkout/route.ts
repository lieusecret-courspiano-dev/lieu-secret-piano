import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  const { pack_label, heures, montant, acheteur_nom, acheteur_email } = await req.json()

  if (!pack_label || !heures || !montant || !acheteur_nom || !acheteur_email) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'payment',
      customer_email:       acheteur_email,
      line_items: [{
        price_data: {
          currency:     'eur',
          unit_amount:  Math.round(montant * 100),
          product_data: {
            name:        `${pack_label} — Lieu Secret`,
            description: `${heures} heures de cours de piano en ligne`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        type:          'pack',
        pack_label,
        heures:        String(heures),
        montant:       String(montant),
        acheteur_nom,
        acheteur_email,
      },
      success_url: `${APP_URL}/pack/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/#tarifs`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur Stripe' }, { status: 500 })
  }
}
export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { pack_label, heures, montant, acheteur_nom, acheteur_email, eleve_id } = body

    if (!pack_label || !heures || !montant || !acheteur_nom || !acheteur_email) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    // Générer un code temporaire court
    const tmpCode = 'PK-' + Math.random().toString(36).substring(2,6).toUpperCase() + '-' + Math.random().toString(36).substring(2,6).toUpperCase()

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const { data: pack, error } = await supabaseAdmin.from('course_packs').insert({
      code:             tmpCode,
      pack_label,
      heures_total:     parseInt(String(heures)),
      heures_restantes: parseInt(String(heures)),
      heures_utilisees: 0,
      montant:          parseFloat(String(montant)),
      acheteur_nom,
      acheteur_email,
      eleve_id:         eleve_id || null,
      status:           'pending_virement',
      payment_method:   'virement',
      expires_at:       expiresAt.toISOString(),
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Email client avec coordonnées bancaires
    try {
      const { getSiteSettings } = await import('@/lib/settings')
      const settings = await getSiteSettings()
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: acheteur_email,
        subject: `Demande de pack reçue — ${pack_label} — Lieu Secret`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;">Demande de pack reçue</h2>
          <p>Bonjour ${acheteur_nom},</p>
          <p>Votre demande de <strong style="color:#f59e0b;">${pack_label}</strong> (${heures}h — ${montant} €) a bien été enregistrée.</p>
          ${settings.virement_iban ? `<div style="background:#252540;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;">Coordonnées bancaires</p>
            <p style="margin:4px 0;">Bénéficiaire : ${settings.virement_nom || 'Lieu Secret'}</p>
            <p style="margin:4px 0;">IBAN : <strong style="color:#f59e0b;">${settings.virement_iban}</strong></p>
            ${settings.virement_info ? `<p style="margin:4px 0;">Référence : ${settings.virement_info}</p>` : ''}
            <p style="margin:4px 0;">Montant : <strong>${montant} €</strong></p>
          </div>` : ''}
          <p>Dès réception de votre virement, votre pack sera activé et vous recevrez votre code PK par email.</p>
          <div style="text-align:center;margin:20px 0;"><a href="${baseUrl}/mon-pack" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Consulter mon pack</a></div>
          <p style="color:#7070a0;font-size:12px;">Vérifiez votre dossier Spam si vous ne recevez pas de réponse.</p>
        </div>`,
      })

      // Email admin
      const adminEmail = settings.contact_email || process.env.ADMIN_EMAIL_FROM || process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'
      const adminUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: adminEmail,
        subject: `Nouvelle demande de pack par virement — ${acheteur_nom} — ${pack_label}`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;">Nouvelle demande de pack par virement</h2>
          <p>Un client vient de demander un pack par virement bancaire.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:6px 0;color:#a0a0c0;">Client</td><td style="padding:6px 0;"><strong>${acheteur_nom}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#a0a0c0;">Email</td><td style="padding:6px 0;">${acheteur_email}</td></tr>
            <tr><td style="padding:6px 0;color:#a0a0c0;">Pack</td><td style="padding:6px 0;"><strong style="color:#f59e0b;">${pack_label}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#a0a0c0;">Heures</td><td style="padding:6px 0;">${heures}h</td></tr>
            <tr><td style="padding:6px 0;color:#a0a0c0;">Montant</td><td style="padding:6px 0;"><strong>${montant} €</strong></td></tr>
          </table>
          <p>Rendez-vous dans votre espace admin pour confirmer le paiement une fois le virement reçu.</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${adminUrl}/admin/packs" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Gérer les packs en attente</a>
          </div>
        </div>`,
      })
    } catch (emailErr) { console.error('Email pack virement error:', emailErr) }

    // Lier au compte élève si existe
    try {
      const { data: eleve } = await supabaseAdmin.from('eleves').select('id').eq('email', acheteur_email.toLowerCase()).single()
      if (eleve) {
        await supabaseAdmin.from('course_packs').update({ eleve_id: eleve.id }).eq('id', pack.id)
      }
    } catch {}

    return NextResponse.json({ success: true, pack_id: pack.id })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
