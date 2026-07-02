import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || ''
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const now = new Date()

    // Élèves avec setup_token non null = compte non finalisé, token non expiré
    const { data: eleves } = await supabaseAdmin
      .from('eleves')
      .select('id, email, prenom, setup_token, setup_expires, created_at')
      .not('setup_token', 'is', null)
      .gt('setup_expires', now.toISOString())
      .eq('is_active', true)

    if (!eleves || eleves.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Aucun compte en attente' })
    }

    let sent = 0, skipped = 0

    for (const eleve of eleves) {
      const createdAt = new Date(eleve.created_at)
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      const expiresAt = new Date(eleve.setup_expires)
      const hoursBeforeExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Fenêtres d'envoi : 24h après création, 72h après, 24h avant expiration
      const shouldSend24h   = hoursElapsed >= 23 && hoursElapsed <= 25
      const shouldSend72h   = hoursElapsed >= 71 && hoursElapsed <= 73
      const shouldSendExpiry = hoursBeforeExpiry >= 23 && hoursBeforeExpiry <= 25

      if (!shouldSend24h && !shouldSend72h && !shouldSendExpiry) { skipped++; continue }

      const reminderType = shouldSend24h ? 'setup_24h' : shouldSend72h ? 'setup_72h' : 'setup_expiry'
      const logKey = `${reminderType}_${eleve.id}`

      // Vérifier si déjà envoyé
      const { data: existing } = await supabaseAdmin
        .from('email_logs').select('id').eq('key', logKey).single()
      if (existing) { skipped++; continue }

      const setupUrl = `${APP_URL}/espace-eleve/setup?token=${eleve.setup_token}`

      let subject = '', messageIntro = '', urgencyNote = ''
      if (shouldSend24h) {
        subject = 'Finalisez votre espace élève Lieu Secret'
        messageIntro = "Votre espace élève a été créé hier mais n'est pas encore activé."
        urgencyNote = 'Il vous suffit de cliquer sur le bouton ci-dessous pour définir votre mot de passe.'
      } else if (shouldSend72h) {
        subject = 'Rappel — Votre espace élève vous attend'
        messageIntro = "Votre espace élève Lieu Secret est prêt depuis 3 jours mais n'a pas encore été activé."
        urgencyNote = "Ne manquez pas l'accès à vos ressources pédagogiques, votre progression et vos cours."
      } else {
        subject = 'Dernier rappel — Votre lien expire demain'
        messageIntro = "Votre lien d'activation expire dans moins de 24 heures."
        urgencyNote = "⚠️ Après expiration, contactez votre professeur pour obtenir un nouveau lien."
      }

      try {
        await resend.emails.send({
          from: FROM,
          to: eleve.email,
          subject,
          html: `
<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="color:#f59e0b;font-size:18px;letter-spacing:0.2em;font-weight:bold;">LIEU SECRET</span>
    <p style="color:#a0a0c0;font-size:12px;margin:4px 0 0;">École de Piano en Ligne</p>
  </div>
  <h2 style="color:#f59e0b;text-align:center;">Votre espace élève vous attend</h2>
  <p>Bonjour <strong>${eleve.prenom}</strong>,</p>
  <p>${messageIntro}</p>
  <p style="color:#d0d0e8;">${urgencyNote}</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${setupUrl}" style="display:inline-block;background:#f59e0b;color:#1a1a2e;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">
      Créer mon mot de passe →
    </a>
  </div>
  <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:16px;margin:20px 0;">
    <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;">Dans votre espace élève :</p>
    <ul style="color:#a0a0c0;font-size:13px;margin:0;padding-left:20px;">
      <li>Réservez vos cours directement</li>
      <li>Consultez votre progression et vos compétences</li>
      <li>Accédez à vos ressources pédagogiques</li>
      <li>Téléchargez vos certificats</li>
      <li>Échangez avec votre professeur</li>
    </ul>
  </div>
  <p style="color:#7070a0;font-size:12px;text-align:center;margin-top:24px;">
    Ce lien est personnel et sécurisé. Ne le partagez pas.<br/>
    Vérifiez votre dossier Spam si vous ne trouvez pas nos emails.
  </p>
</div>`,
        })

        await supabaseAdmin.from('email_logs').insert({ key: logKey, type: reminderType })
        sent++
        console.log(`[setup-reminders] ${reminderType} envoyé à ${eleve.email}`)
      } catch (emailErr) {
        console.error(`[setup-reminders] Erreur ${eleve.email}:`, emailErr)
      }
    }

    return NextResponse.json({ success: true, sent, skipped, total: eleves.length, timestamp: now.toISOString() })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
