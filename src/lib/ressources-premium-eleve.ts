import { supabaseAdmin } from './supabase'
import { Resend } from 'resend'

const resend   = new Resend(process.env.RESEND_API_KEY!)
const FROM     = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

/**
 * Après confirmation d'un achat de ressource premium :
 * 1. Si l'email correspond à un élève existant → lier l'achat à son compte
 * 2. Si l'email est inconnu → créer un compte élève + envoyer email de setup
 * 3. Envoyer une notification à l'élève avec son accès dans l'espace élève
 */
export async function linkRessourcePremiumToEleve(params: {
  achat_id:       string
  acheteur_email: string
  acheteur_nom:   string
  ressource_titre: string
  token_acces:    string
}): Promise<{ eleve_id: string; compte_cree: boolean }> {
  const { achat_id, acheteur_email, acheteur_nom, ressource_titre, token_acces } = params
  const email = acheteur_email.toLowerCase().trim()

  // 1. Chercher un élève existant avec cet email
  const { data: eleveExistant } = await supabaseAdmin
    .from('eleves')
    .select('id, prenom, nom, email')
    .eq('email', email)
    .single()

  let eleve_id: string
  let compte_cree = false

  if (eleveExistant) {
    // Élève existant → lier l'achat
    eleve_id = eleveExistant.id

    // Mettre à jour l'achat avec l'eleve_id
    await supabaseAdmin
      .from('ressources_premium_achats')
      .update({ eleve_id })
      .eq('id', achat_id)

    // Notifier l'élève que la ressource est disponible dans son espace
    const accessUrl = `${APP_URL}/ressources-premium/acces/${token_acces}`
    const espaceUrl = `${APP_URL}/espace-eleve/mes-supports`

    await resend.emails.send({
      from: FROM,
      to:   email,
      subject: `Ressource disponible dans votre espace — ${ressource_titre}`,
      html: `
        <div style="background:#1a1a2e;padding:40px 20px;font-family:Georgia,serif;">
          <div style="max-width:600px;margin:0 auto;background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;">
            <div style="background:#1a1a2e;padding:24px;text-align:center;border-bottom:1px solid #f59e0b;">
              <div style="font-size:22px;color:#f59e0b;letter-spacing:3px;">LIEU SECRET</div>
            </div>
            <div style="padding:32px;">
              <h2 style="color:#f59e0b;margin:0 0 16px;">Ressource ajoutée à votre espace !</h2>
              <p style="color:#d0d0e8;">Bonjour ${eleveExistant.prenom},</p>
              <p style="color:#d0d0e8;">
                Votre achat de <strong style="color:#fff;">${ressource_titre}</strong> a été associé à votre compte élève.
                Vous pouvez y accéder directement depuis votre espace élève.
              </p>
              <div style="text-align:center;margin:24px 0;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <a href="${espaceUrl}" style="background:#f59e0b;color:#1a1a2e;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
                  Mon espace élève
                </a>
                <a href="${accessUrl}" style="background:transparent;color:#f59e0b;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;border:1px solid #f59e0b;">
                  Accès direct
                </a>
              </div>
            </div>
          </div>
        </div>`,
    }).catch(() => {})

  } else {
    // Élève inconnu → créer un compte automatiquement
    const prenom = acheteur_nom.split(' ')[0] || acheteur_nom
    const nom    = acheteur_nom.split(' ').slice(1).join(' ') || ''

    // Créer le compte élève
    const { data: nouvelEleve, error: createError } = await supabaseAdmin
      .from('eleves')
      .insert({
        email,
        prenom,
        nom,
        statut: 'en_attente', // En attente de finalisation du compte
      })
      .select()
      .single()

    if (createError || !nouvelEleve) {
      console.error('Erreur création compte élève:', createError)
      // Retourner sans eleve_id si la création échoue
      return { eleve_id: '', compte_cree: false }
    }

    eleve_id     = nouvelEleve.id
    compte_cree  = true

    // Lier l'achat au nouvel élève
    await supabaseAdmin
      .from('ressources_premium_achats')
      .update({ eleve_id })
      .eq('id', achat_id)

    // Générer un token de setup de mot de passe
    const setupToken = Buffer.from(`${email}:${Date.now()}`).toString('base64url')
    await supabaseAdmin
      .from('eleves')
      .update({ reset_token: setupToken, reset_token_expires: new Date(Date.now() + 7 * 24 * 3600000).toISOString() })
      .eq('id', eleve_id)

    const setupUrl  = `${APP_URL}/espace-eleve/setup?token=${setupToken}`
    const accessUrl = `${APP_URL}/ressources-premium/acces/${token_acces}`

    // Email de bienvenue + setup compte + accès ressource
    await resend.emails.send({
      from: FROM,
      to:   email,
      subject: `Bienvenue chez Lieu Secret — Accédez à ${ressource_titre}`,
      html: `
        <div style="background:#1a1a2e;padding:40px 20px;font-family:Georgia,serif;">
          <div style="max-width:600px;margin:0 auto;background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;">
            <div style="background:#1a1a2e;padding:24px;text-align:center;border-bottom:1px solid #f59e0b;">
              <div style="font-size:22px;color:#f59e0b;letter-spacing:3px;">LIEU SECRET</div>
              <div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
            </div>
            <div style="padding:32px;">
              <h2 style="color:#f59e0b;margin:0 0 16px;">Bienvenue, ${prenom} !</h2>
              <p style="color:#d0d0e8;">
                Votre achat de <strong style="color:#fff;">${ressource_titre}</strong> a bien été enregistré.
                Un compte élève a été créé automatiquement pour vous.
              </p>

              <div style="background:#1a1a2e;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:20px;margin:20px 0;">
                <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;">Accéder à votre ressource maintenant</p>
                <a href="${accessUrl}" style="color:#f59e0b;word-break:break-all;font-size:13px;">${accessUrl}</a>
              </div>

              <div style="background:#1a1a2e;border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:20px;margin:20px 0;">
                <p style="color:#a0a0c0;font-weight:bold;margin:0 0 8px;">Finaliser votre espace élève</p>
                <p style="color:#d0d0e8;font-size:13px;margin:0 0 12px;">
                  Créez votre mot de passe pour accéder à votre espace élève complet (progression, notes, certificats...).
                </p>
                <a href="${setupUrl}" style="background:#f59e0b;color:#1a1a2e;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;display:inline-block;">
                  Créer mon mot de passe
                </a>
                <p style="color:#505080;font-size:11px;margin:8px 0 0;">Ce lien est valable 7 jours.</p>
              </div>
            </div>
          </div>
        </div>`,
    }).catch(() => {})
  }

  return { eleve_id, compte_cree }
}