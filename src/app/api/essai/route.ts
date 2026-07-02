import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
export const dynamic = 'force-dynamic'
const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  try {
    const { nom, email, phone, niveau, message, timezone } = await req.json()
    if (!nom || !email) return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 })
    const { data: existing } = await supabaseAdmin.from('essais_gratuits').select('id').eq('email', email.toLowerCase()).single()
    if (existing) return NextResponse.json({ error: 'Vous avez déjà demandé un cours d\'essai. Contactez-nous si besoin.' }, { status: 409 })
    const { data, error } = await supabaseAdmin.from('essais_gratuits').insert({
      nom, email: email.toLowerCase(), phone: phone || null,
      niveau: niveau || 'debutant', message: message || null,
      timezone: timezone || 'Europe/Paris', status: 'pending',
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    try {
      await resend.emails.send({ from: FROM, to: email, subject: "Votre cours d'essai gratuit — Lieu Secret",
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;text-align:center;">Demande reçue !</h2><p>Bonjour ${nom},</p><p>Votre demande de cours d'essai gratuit a bien été enregistrée. Nous vous contacterons très prochainement pour convenir d'un créneau.</p><div style="background:#252540;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;"><p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;">Récapitulatif</p><p style="margin:4px 0;">Nom : ${nom}</p><p style="margin:4px 0;">Niveau : ${niveau || 'Débutant'}</p>${message ? `<p style="margin:4px 0;">Message : ${message}</p>` : ''}</div><p>Le cours d'essai dure 30 minutes et est entièrement gratuit, sans engagement.</p><p style="color:#7070a0;font-size:12px;">Vérifiez votre dossier Spam si vous ne recevez pas de réponse.</p></div>` })
      await resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject: `Nouvelle demande d'essai gratuit — ${nom}`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;">Nouvelle demande d'essai gratuit</h2><p>Nom : <strong>${nom}</strong></p><p>Email : <strong>${email}</strong></p>${phone ? `<p>Téléphone : ${phone}</p>` : ''}<p>Niveau : ${niveau || 'Débutant'}</p><p>Fuseau : ${timezone || 'Europe/Paris'}</p>${message ? `<p>Message : ${message}</p>` : ''}<div style="text-align:center;margin:20px 0;"><a href="${APP_URL}/admin/essais" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Gérer les demandes</a></div></div>` })
    } catch (emailErr) { console.error('Email essai error:', emailErr) }
    return NextResponse.json({ success: true, id: data.id })
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 }) }
}
