import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend     = new Resend(process.env.RESEND_API_KEY!)
const FROM       = 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'
const BASE_URL   = 'https://www.lieusecret-courspiano.fr'

export const dynamic = 'force-dynamic'

function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function GET(req: NextRequest) {
  // Vérifier le token cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const today     = new Date()
  const todayStr  = today.toISOString().split('T')[0]

  // Demain et après-demain pour les rappels
  const demain    = new Date(today); demain.setDate(demain.getDate() + 1)
  const demainStr = demain.toISOString().split('T')[0]

  const j3        = new Date(today); j3.setDate(j3.getDate() + 3)
  const j3Str     = j3.toISOString().split('T')[0]

  let emailsEnvoyes = 0

  try {
    // 1. Rappel remise J-1 (remise prévue demain)
    const { data: remiseDemain } = await supabaseAdmin
      .from('location_reservations')
      .select('*')
      .eq('date_debut', demainStr)
      .eq('statut', 'validee')

    for (const resa of remiseDemain || []) {
      await resend.emails.send({
        from: FROM,
        to:   resa.locataire_email,
        subject: `Rappel — Remise de votre ${resa.article_nom} demain`,
        html: `
          <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:22px;color:#f59e0b;letter-spacing:4px;">LIEU SECRET</div>
            </div>
            <h2 style="color:#f59e0b;">Rappel — Remise de matériel demain</h2>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Bonjour ${resa.locataire_nom},</p>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">
              Nous vous rappelons que la remise de votre <strong style="color:#f0f0f0;">${resa.article_nom}</strong>
              est prévue <strong style="color:#f59e0b;">demain, le ${fDate(resa.date_debut)}</strong>.
            </p>
            <div style="background:#252540;border:1px solid #3a3a5c;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="color:#a0a0c0;font-size:12px;margin:0 0 8px;font-weight:bold;text-transform:uppercase;">Détails</p>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:4px 0;color:#a0a0c0;font-size:13px;">Article</td><td style="padding:4px 0;color:#f0f0f0;font-size:13px;text-align:right;">${resa.article_nom}</td></tr>
                <tr><td style="padding:4px 0;color:#a0a0c0;font-size:13px;">Date de remise</td><td style="padding:4px 0;color:#f59e0b;font-size:13px;text-align:right;">${fDate(resa.date_debut)}</td></tr>
                <tr><td style="padding:4px 0;color:#a0a0c0;font-size:13px;">Date de retour</td><td style="padding:4px 0;color:#f0f0f0;font-size:13px;text-align:right;">${fDate(resa.date_fin)}</td></tr>
                <tr><td style="padding:4px 0;color:#a0a0c0;font-size:13px;">Mode de remise</td><td style="padding:4px 0;color:#f0f0f0;font-size:13px;text-align:right;">${resa.mode_remise === 'livraison' ? 'Livraison à domicile' : 'Retrait à Saint-Étienne'}</td></tr>
              </table>
            </div>
            <p style="color:#a0a0c0;font-size:13px;">
              Pour toute question : <a href="mailto:${ADMIN_EMAIL}" style="color:#f59e0b;">${ADMIN_EMAIL}</a>
            </p>
          </div>
        `,
      }).catch(console.error)
      emailsEnvoyes++
    }

    // Notifier l'admin des remises du lendemain
    if ((remiseDemain || []).length > 0) {
      await resend.emails.send({
        from: FROM,
        to:   ADMIN_EMAIL,
        subject: `[Location] ${remiseDemain!.length} remise(s) prévue(s) demain`,
        html: `
          <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;">${remiseDemain!.length} remise(s) prévue(s) demain</h2>
            ${remiseDemain!.map(r => `
              <div style="background:#252540;border:1px solid #3a3a5c;border-radius:8px;padding:12px;margin:8px 0;">
                <p style="margin:0;color:#f0f0f0;font-weight:bold;">${r.article_nom}</p>
                <p style="margin:4px 0 0;color:#a0a0c0;font-size:13px;">${r.locataire_nom} — ${r.locataire_email}</p>
                <p style="margin:4px 0 0;color:#a0a0c0;font-size:13px;">${r.mode_remise === 'livraison' ? 'Livraison' : 'Retrait'}</p>
                <a href="${BASE_URL}/admin/location/${r.id}" style="color:#f59e0b;font-size:12px;">Voir →</a>
              </div>
            `).join('')}
          </div>
        `,
      }).catch(console.error)
    }

    // 2. Rappel retour J-3 (retour prévu dans 3 jours)
    const { data: retourJ3 } = await supabaseAdmin
      .from('location_reservations')
      .select('*')
      .eq('date_fin', j3Str)
      .eq('statut', 'en_cours')

    for (const resa of retourJ3 || []) {
      await resend.emails.send({
        from: FROM,
        to:   resa.locataire_email,
        subject: `Rappel — Retour de votre ${resa.article_nom} dans 3 jours`,
        html: `
          <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:22px;color:#f59e0b;letter-spacing:4px;">LIEU SECRET</div>
            </div>
            <h2 style="color:#f59e0b;">Rappel — Retour de matériel dans 3 jours</h2>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Bonjour ${resa.locataire_nom},</p>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">
              Nous vous rappelons que le retour de votre <strong style="color:#f0f0f0;">${resa.article_nom}</strong>
              est prévu le <strong style="color:#f59e0b;">${fDate(resa.date_fin)}</strong>, soit dans 3 jours.
            </p>
            <div style="background:#2a1a1a;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="color:#ef4444;font-size:13px;font-weight:bold;margin:0 0 6px;">Important</p>
              <p style="color:#fca5a5;font-size:13px;margin:0;">
                Tout retard sera facturé <strong>10 € par jour commencé</strong>.
                Merci de nous contacter si vous avez besoin de prolonger la location.
              </p>
            </div>
            <p style="color:#a0a0c0;font-size:13px;">
              Pour prolonger ou toute question : <a href="mailto:${ADMIN_EMAIL}" style="color:#f59e0b;">${ADMIN_EMAIL}</a>
            </p>
          </div>
        `,
      }).catch(console.error)
      emailsEnvoyes++
    }

    // 3. Détection des retards (date_fin dépassée, statut en_cours)
    const { data: retards } = await supabaseAdmin
      .from('location_reservations')
      .select('*')
      .lt('date_fin', todayStr)
      .eq('statut', 'en_cours')

    for (const resa of retards || []) {
      const dateFinDate = new Date(resa.date_fin)
      const nbJoursRetard = Math.floor((today.getTime() - dateFinDate.getTime()) / (1000 * 60 * 60 * 24))
      const penalite = nbJoursRetard * 10

      // Mettre à jour les pénalités
      await supabaseAdmin
        .from('location_reservations')
        .update({
          nb_jours_retard: nbJoursRetard,
          penalites_retard: penalite,
          statut: 'litige',
        })
        .eq('id', resa.id)

      // Email au client
      await resend.emails.send({
        from: FROM,
        to:   resa.locataire_email,
        subject: `URGENT — Retard de retour : ${resa.article_nom} (${nbJoursRetard} jour(s))`,
        html: `
          <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#ef4444;">Retard de retour — Action requise</h2>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Bonjour ${resa.locataire_nom},</p>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">
              La date de retour de votre <strong>${resa.article_nom}</strong> était le
              <strong style="color:#ef4444;">${fDate(resa.date_fin)}</strong>.
              Vous accusez un retard de <strong style="color:#ef4444;">${nbJoursRetard} jour(s)</strong>.
            </p>
            <div style="background:#2a1a1a;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="color:#ef4444;font-weight:bold;margin:0 0 8px;">Pénalités de retard</p>
              <p style="color:#fca5a5;font-size:14px;margin:0;">
                ${nbJoursRetard} jour(s) × 10 € = <strong>${penalite} €</strong>
              </p>
            </div>
            <p style="color:#d0d0e8;font-size:14px;">
              Veuillez nous contacter immédiatement pour organiser le retour du matériel.
            </p>
            <p style="color:#a0a0c0;font-size:13px;">
              <a href="mailto:${ADMIN_EMAIL}" style="color:#f59e0b;">${ADMIN_EMAIL}</a>
            </p>
          </div>
        `,
      }).catch(console.error)

      // Email admin
      await resend.emails.send({
        from: FROM,
        to:   ADMIN_EMAIL,
        subject: `[RETARD] ${resa.article_nom} — ${nbJoursRetard} jour(s) — ${penalite}€`,
        html: `
          <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#ef4444;">Retard de retour détecté</h2>
            <p><strong>Article :</strong> ${resa.article_nom}</p>
            <p><strong>Client :</strong> ${resa.locataire_nom} (${resa.locataire_email})</p>
            <p><strong>Date de retour prévue :</strong> ${fDate(resa.date_fin)}</p>
            <p><strong>Retard :</strong> ${nbJoursRetard} jour(s)</p>
            <p><strong>Pénalités :</strong> ${penalite} €</p>
            <a href="${BASE_URL}/admin/location/${resa.id}"
              style="background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">
              Gérer le litige →
            </a>
          </div>
        `,
      }).catch(console.error)

      emailsEnvoyes++
    }

    return NextResponse.json({
      success: true,
      emails_envoyes: emailsEnvoyes,
      remises_demain: (remiseDemain || []).length,
      retours_j3: (retourJ3 || []).length,
      retards: (retards || []).length,
    })
  } catch (e: unknown) {
    console.error('Erreur cron location-rappels:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}