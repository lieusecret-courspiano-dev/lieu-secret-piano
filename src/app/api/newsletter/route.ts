import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend    = new Resend(process.env.RESEND_API_KEY!)
const FROM      = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'

export async function POST(req: NextRequest) {
  try {
    const { email, source = 'site' } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    // Vérifier si déjà inscrit
    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, email, actif')
      .eq('email', emailLower)
      .single()

    if (existing) {
      if (existing.actif) {
        return NextResponse.json({ message: 'Vous êtes déjà inscrit à la newsletter.' }, { status: 200 })
      }
      // Réactiver si désabonné
      await supabaseAdmin
        .from('newsletter_subscribers')
        .update({ actif: true, updated_at: new Date().toISOString() })
        .eq('email', emailLower)
    } else {
      // Nouvel abonné
      const { error } = await supabaseAdmin
        .from('newsletter_subscribers')
        .insert({ email: emailLower, source, actif: true })

      if (error) {
        console.error('Newsletter insert error:', error)
        return NextResponse.json({ error: 'Erreur lors de l\'inscription.' }, { status: 500 })
      }
    }

    // Email de confirmation à l'abonné
    await resend.emails.send({
      from: FROM,
      to: emailLower,
      subject: 'Bienvenue dans la newsletter Lieu Secret',
      html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#252540);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">
<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>
<div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#ffffff;font-size:22px;margin:0 0 16px;">Merci pour votre inscription !</h2>
<p style="color:#d0d0e8;font-size:15px;line-height:1.7;margin:0 0 16px;">
Vous êtes maintenant inscrit(e) à la newsletter de <strong style="color:#f59e0b;">Lieu Secret</strong>.
</p>
<p style="color:#d0d0e8;font-size:15px;line-height:1.7;margin:0 0 24px;">
Vous recevrez nos meilleurs conseils pour progresser au piano, nos actualités et nos offres exclusives directement dans votre boîte mail.
</p>
<div style="background:#1a1a2e;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:20px;margin-bottom:24px;">
<p style="margin:0;color:#a0a0c0;font-size:13px;">Vous souhaitez commencer le piano ?</p>
<a href="https://www.lieusecret-courspiano.fr/essai" style="display:inline-block;margin-top:12px;background:#f59e0b;color:#1a1a2e;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
Réserver un cours d'essai gratuit
</a>
</div>
<p style="color:#7070a0;font-size:12px;margin:0;">
Pour vous désabonner, répondez à cet email avec "Désabonnement".
</p>
</td></tr>
<tr><td style="background:#1a1a2e;padding:20px;text-align:center;border-top:1px solid #3a3a5c;">
<p style="margin:0;font-size:12px;color:#505080;">Lieu Secret — École de Piano en Ligne<br/>
<a href="mailto:lieusecret-courspiano@outlook.fr" style="color:#f59e0b;text-decoration:none;">lieusecret-courspiano@outlook.fr</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`,
    }).catch(() => {}) // Ne pas bloquer si l'email échoue

    // Notification admin
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Nouvelle inscription newsletter — ${emailLower}`,
      html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="padding:24px 32px;border-bottom:1px solid #3a3a5c;">
<div style="font-size:18px;color:#f59e0b;letter-spacing:2px;">LIEU SECRET — Admin</div>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#ffffff;font-size:18px;margin:0 0 16px;">Nouvelle inscription newsletter</h2>
<p style="color:#d0d0e8;font-size:15px;margin:0 0 8px;"><strong style="color:#f59e0b;">Email :</strong> ${emailLower}</p>
<p style="color:#d0d0e8;font-size:15px;margin:0 0 8px;"><strong style="color:#f59e0b;">Source :</strong> ${source}</p>
<p style="color:#d0d0e8;font-size:15px;margin:0;"><strong style="color:#f59e0b;">Date :</strong> ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Inscription confirmée ! Vérifiez votre boîte mail.' })

  } catch (err) {
    console.error('Newsletter error:', err)
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 })
  }
}

// GET — liste des abonnés (admin)
export async function GET(req: NextRequest) {
  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('id, email, source, actif, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}