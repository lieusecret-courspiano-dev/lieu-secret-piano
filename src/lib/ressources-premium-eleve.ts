import { supabaseAdmin } from './supabase'
import { Resend } from 'resend'

const resend   = new Resend(process.env.RESEND_API_KEY!)
const FROM     = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

/**
 * Après confirmation d'un achat de ressource premium :
 * - Si email connu (élève existant) → lier l'achat + notifier dans l'espace élève
 * - Si email inconnu → envoyer accès par email + invitation optionnelle (sans créer de compte)
 */
export async function linkRessourcePremiumToEleve(params: {
  achat_id:        string
  acheteur_email:  string
  acheteur_nom:    string
  ressource_titre: string
  token_acces:     string
}): Promise<{ eleve_id: string; compte_cree: boolean }> {
  const { achat_id, acheteur_email, acheteur_nom, ressource_titre, token_acces } = params
  const email  = acheteur_email.toLowerCase().trim()
  const prenom = acheteur_nom.split(' ')[0] || acheteur_nom

  const accessUrl     = `${APP_URL}/ressources-premium/acces/${token_acces}`
  const espaceUrl     = `${APP_URL}/espace-eleve/mes-supports`
  const inscriptionUrl = `${APP_URL}/inscription`

  // Chercher un élève existant avec cet email
  const { data: eleveExistant } = await supabaseAdmin
    .from('eleves')
    .select('id, prenom, nom, email')
    .eq('email', email)
    .single()

  if (eleveExistant) {
    // ── Élève existant → lier l'achat ──────────────────────────────────────
    await supabaseAdmin
      .from('ressources_premium_achats')
      .update({ eleve_id: eleveExistant.id })
      .eq('id', achat_id)

    // Notifier l'élève que la ressource est disponible dans son espace
    const html = [
      '<div style="background:#1a1a2e;padding:40px 20px;font-family:Georgia,serif;">',
      '<div style="max-width:600px;margin:0 auto;background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;">',
      '<div style="background:#1a1a2e;padding:24px;text-align:center;border-bottom:1px solid #f59e0b;">',
      '<div style="font-size:22px;color:#f59e0b;letter-spacing:3px;">LIEU SECRET</div>',
      '</div>',
      '<div style="padding:32px;">',
      '<h2 style="color:#f59e0b;margin:0 0 16px;">Ressource ajoutée à votre espace !</h2>',
      `<p style="color:#d0d0e8;">Bonjour ${eleveExistant.prenom},</p>`,
      `<p style="color:#d0d0e8;">Votre achat de <strong style="color:#fff;">${ressource_titre}</strong> a été associé à votre compte élève.</p>`,
      '<div style="text-align:center;margin:24px 0;">',
      `<a href="${espaceUrl}" style="background:#f59e0b;color:#1a1a2e;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;margin-right:8px;">Mon espace élève</a>`,
      `<a href="${accessUrl}" style="background:transparent;color:#f59e0b;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;border:1px solid #f59e0b;">Accès direct</a>`,
      '</div>',
      '</div></div></div>',
    ].join('')

    await resend.emails.send({
      from: FROM, to: email,
      subject: `Ressource disponible dans votre espace — ${ressource_titre}`,
      html,
    }).catch(() => {})

    return { eleve_id: eleveExistant.id, compte_cree: false }

  } else {
    // ── Email inconnu → accès direct sans création de compte ───────────────
    // Pas de création automatique — l'acheteur n'est pas forcément un élève

    const html = [
      '<div style="background:#1a1a2e;padding:40px 20px;font-family:Georgia,serif;">',
      '<div style="max-width:600px;margin:0 auto;background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;">',
      '<div style="background:#1a1a2e;padding:24px;text-align:center;border-bottom:1px solid #f59e0b;">',
      '<div style="font-size:22px;color:#f59e0b;letter-spacing:3px;">LIEU SECRET</div>',
      '<div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>',
      '</div>',
      '<div style="padding:32px;">',
      '<h2 style="color:#f59e0b;margin:0 0 16px;">Votre accès est prêt !</h2>',
      `<p style="color:#d0d0e8;">Bonjour ${prenom},</p>`,
      `<p style="color:#d0d0e8;">Votre achat de <strong style="color:#fff;">${ressource_titre}</strong> a bien été confirmé.</p>`,
      '<div style="text-align:center;margin:24px 0;">',
      `<a href="${accessUrl}" style="background:#f59e0b;color:#1a1a2e;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;">Accéder à ma ressource</a>`,
      '</div>',
      `<p style="color:#7070a0;font-size:12px;margin-bottom:20px;">Lien permanent : <a href="${accessUrl}" style="color:#f59e0b;">${accessUrl}</a><br/>Conservez cet email — ce lien vous donnera toujours accès à votre ressource.</p>`,
      '<div style="background:#1a1a2e;border:1px solid rgba(245,158,11,0.15);border-radius:8px;padding:16px;margin-top:16px;">',
      '<p style="color:#a0a0c0;font-size:13px;margin:0 0 8px;">Vous souhaitez suivre des cours de piano en ligne ?</p>',
      `<a href="${inscriptionUrl}" style="color:#f59e0b;font-size:13px;text-decoration:underline;">Découvrir l'espace élève Lieu Secret →</a>`,
      '</div>',
      '</div></div></div>',
    ].join('')

    await resend.emails.send({
      from: FROM, to: email,
      subject: `Votre accès — ${ressource_titre}`,
      html,
    }).catch(() => {})

    return { eleve_id: '', compte_cree: false }
  }
}