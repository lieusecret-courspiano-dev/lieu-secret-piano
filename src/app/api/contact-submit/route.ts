import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json()
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Sauvegarder dans la table messages (existante)
    const messageContent = Object.entries(answers)
      .map(([label, val]) => `${label}: ${val}`)
      .join('\n')

    // Trouver l'email dans les réponses (chercher différentes variantes)
    const emailKey = Object.keys(answers).find(k =>
      k.toLowerCase().includes('email') || k.toLowerCase().includes('e-mail') || k.toLowerCase().includes('mail')
    )
    const nameKey = Object.keys(answers).find(k =>
      k.toLowerCase().includes('nom') || k.toLowerCase().includes('prénom') || k.toLowerCase().includes('prenom')
    )

    const email = emailKey ? String(answers[emailKey]) : 'contact@formulaire.fr'
    const name = nameKey ? String(answers[nameKey]) : 'Visiteur'

    // Sauvegarder dans la table messages
    await supabaseAdmin.from('messages').insert({
      name,
      email,
      subject: 'Formulaire de contact',
      message: messageContent,
    })

    // Envoyer les emails (admin + confirmation expéditeur)
    try {
      const { getSiteSettings } = await import('@/lib/settings')
      const settings = await getSiteSettings()
      const adminEmail = settings.contact_email || 'contact@lieusecret-courspiano.fr'
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

      const rows = Object.entries(answers).map(([label, val]) =>
        `<tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;white-space:nowrap;">${label}</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${val}</td></tr>`
      ).join('')

      // Email à l'admin
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: adminEmail,
        subject: `Nouveau message de contact — Lieu Secret`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;margin:0 0 16px;">Nouveau message de contact</h2>
          <p style="color:#a0a0c0;font-size:13px;margin:0 0 20px;">Reçu le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <table style="width:100%;border-collapse:collapse;background:#252540;border-radius:8px;overflow:hidden;">${rows}</table>
          <div style="text-align:center;margin:24px 0;">
            <a href="${baseUrl}/admin/messages" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir dans l'admin</a>
          </div>
        </div>`,
      }).catch(console.error)

      // Email de confirmation à l'expéditeur (si email trouvé)
      if (email && email !== 'contact@formulaire.fr') {
        const firstName = name.split(' ')[0] || name
        await resend.emails.send({
          from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
          to: email,
          subject: 'Votre message a bien été reçu — Lieu Secret',
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:22px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>
              <div style="font-size:11px;color:#7070a0;margin-top:4px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
            </div>
            <h2 style="color:#f59e0b;margin:0 0 16px;">Message bien reçu !</h2>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Bonjour ${firstName},</p>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">
              Merci pour votre message. Nous l'avons bien reçu et nous vous répondrons dans les plus brefs délais.
            </p>
            <div style="background:#252540;border:1px solid #3a3a5c;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="color:#a0a0c0;font-size:12px;margin:0 0 8px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Récapitulatif de votre message</p>
              <table style="width:100%;border-collapse:collapse;">${rows}</table>
            </div>
            <p style="color:#a0a0c0;font-size:13px;line-height:1.6;">
              En attendant notre réponse, n'hésitez pas à consulter notre site pour en savoir plus sur nos cours de piano en ligne.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${baseUrl}" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Visiter le site</a>
            </div>
            <p style="color:#505080;font-size:12px;text-align:center;margin-top:24px;">
              Vérifiez votre dossier Spam si vous ne recevez pas de réponse.<br/>
              <a href="mailto:${adminEmail}" style="color:#f59e0b;text-decoration:none;">${adminEmail}</a>
            </p>
          </div>`,
        }).catch(console.error)
      }
    } catch (emailErr) { console.error('Email error:', emailErr) }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Contact submit error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 })
  }
}
