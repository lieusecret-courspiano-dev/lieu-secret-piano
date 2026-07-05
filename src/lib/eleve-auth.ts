import { supabaseAdmin } from './supabase'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const SESSION_COOKIE = 'ls_eleve_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + (process.env.ADMIN_PASSWORD || 'salt') + 'eleve_salt').digest('hex')
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createEleveSession(eleveId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)
  await supabaseAdmin.from('eleve_sessions').insert({ eleve_id: eleveId, token, expires_at: expiresAt.toISOString() })
  return token
}

export async function getEleveFromSession(): Promise<{ id: string; email: string; prenom: string; nom: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const { data: session } = await supabaseAdmin
      .from('eleve_sessions')
      .select('eleve_id, expires_at')
      .eq('token', token)
      .single()

    if (!session) return null

    const now = new Date()
    const expiresAt = new Date(session.expires_at)

    // Session expirée → invalide
    if (expiresAt < now) {
      await supabaseAdmin.from('eleve_sessions').delete().eq('token', token)
      return null
    }

    // Renouveler la session si elle expire dans moins de 3 jours
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    if (expiresAt < threeDaysFromNow) {
      const newExpiry = new Date(now.getTime() + SESSION_DURATION)
      await supabaseAdmin
        .from('eleve_sessions')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('token', token)
    }

    const { data: eleve } = await supabaseAdmin
      .from('eleves')
      .select('id, email, prenom, nom')
      .eq('id', session.eleve_id)
      .eq('is_active', true)
      .single()

    return eleve || null
  } catch { return null }
}

export async function findOrCreateEleve(email: string, prenom: string, nom: string): Promise<{ id: string; isNew: boolean }> {
  const { data: existing } = await supabaseAdmin.from('eleves').select('id').eq('email', email.toLowerCase().trim()).single()
  if (existing) return { id: existing.id, isNew: false }
  const setupToken = generateToken()
  const setupExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const { data: newEleve } = await supabaseAdmin.from('eleves').insert({ email: email.toLowerCase().trim(), prenom: prenom.trim(), nom: nom.trim(), setup_token: setupToken, setup_expires: setupExpires.toISOString() }).select('id').single()
  if (!newEleve) throw new Error('Erreur création compte élève')
  return { id: newEleve.id, isNew: true }
}

export async function sendEleveWelcomeEmail(email: string, prenom: string, setupToken: string): Promise<void> {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const FROM = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
  const setupUrl = `${baseUrl}/espace-eleve/setup?token=${setupToken}`
  
  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenue chez Lieu Secret — Créez votre mot de passe',
    html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
      <h2 style="color:#f59e0b;text-align:center;">Bienvenue, ${prenom} !</h2>
      <p>Votre espace élève Lieu Secret a été créé par votre professeur.</p>
      <p>Cliquez ci-dessous pour définir votre mot de passe et accéder à votre espace personnel :</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${setupUrl}" style="display:inline-block;background:#f59e0b;color:#1a1a2e;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Créer mon mot de passe</a>
      </div>
      <p style="color:#a0a0c0;font-size:13px;">Dans votre espace élève, vous pourrez :</p>
      <ul style="color:#a0a0c0;font-size:13px;">
        <li>Réserver vos cours directement</li>
        <li>Consulter votre progression</li>
        <li>Accéder à vos ressources pédagogiques</li>
        <li>Télécharger vos certificats</li>
      </ul>
      <p style="color:#7070a0;font-size:12px;text-align:center;margin-top:24px;">Ce lien est valable 7 jours. Vérifiez votre dossier Spam si vous ne le trouvez pas.</p>
    </div>`,
  })
  
  if (result.error) {
    console.error('[sendEleveWelcomeEmail] Erreur Resend:', result.error)
    throw new Error(`Erreur envoi email: ${result.error.message}`)
  }
  console.log(`[sendEleveWelcomeEmail] Email envoyé à ${email}`)
}
