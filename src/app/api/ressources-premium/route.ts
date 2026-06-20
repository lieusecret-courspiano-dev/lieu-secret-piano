import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend    = new Resend(process.env.RESEND_API_KEY!)
const FROM      = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'
const SITE_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

// GET — catalogue public
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const { data, error } = await supabaseAdmin
      .from('ressources_premium')
      .select('id, titre, description, type, prix, est_gratuit, image_url, duree_minutes, nb_places, date_coaching, niveau, tags, position')
      .eq('id', id).eq('est_publie', true).single()
    if (error || !data) return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 })
    return NextResponse.json(data)
  }

  const { data } = await supabaseAdmin
    .from('ressources_premium')
    .select('id, titre, description, type, prix, est_gratuit, image_url, duree_minutes, nb_places, date_coaching, niveau, tags, position')
    .eq('est_publie', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

// POST — créer un achat
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ressource_id, acheteur_email, acheteur_nom, payment_method } = body

  if (!ressource_id || !acheteur_email || !acheteur_nom) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Récupérer la ressource
  const { data: ressource } = await supabaseAdmin
    .from('ressources_premium')
    .select('*').eq('id', ressource_id).eq('est_publie', true).single()

  if (!ressource) return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 })

  const montant = ressource.est_gratuit ? 0 : ressource.prix
  const statut  = (ressource.est_gratuit || payment_method === 'gratuit') ? 'confirme' : 'en_attente'

  // Créer l'achat
  const { data: achat, error } = await supabaseAdmin
    .from('ressources_premium_achats')
    .insert({ ressource_id, acheteur_email, acheteur_nom, montant, payment_method: payment_method || 'virement', statut })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si gratuit ou déjà confirmé → envoyer accès immédiatement
  if (statut === 'confirme') {
    await sendAccessEmail(achat, ressource)
  } else if (payment_method === 'virement') {
    // Envoyer instructions virement
    await sendVirementInstructions(achat, ressource)
  }

  return NextResponse.json({ success: true, achat_id: achat.id, statut, token: achat.token_acces })
}

async function sendAccessEmail(achat: { acheteur_nom: string; acheteur_email: string; token_acces: string }, ressource: { titre: string }) {
  const accessUrl = `${SITE_URL}/ressources-premium/acces/${achat.token_acces}`
  await resend.emails.send({
    from: FROM, to: achat.acheteur_email,
    subject: `Accès à votre ressource — ${ressource.titre}`,
    html: `
      <div style="background:#1a1a2e;padding:40px 20px;font-family:Georgia,serif;">
        <div style="max-width:600px;margin:0 auto;background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;">
          <div style="background:#1a1a2e;padding:24px;text-align:center;border-bottom:1px solid #f59e0b;">
            <div style="font-size:22px;color:#f59e0b;letter-spacing:3px;">LIEU SECRET</div>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#f59e0b;margin:0 0 16px;">Votre accès est prêt !</h2>
            <p style="color:#d0d0e8;">Bonjour ${achat.acheteur_nom},</p>
            <p style="color:#d0d0e8;">Votre accès à <strong style="color:#fff;">${ressource.titre}</strong> est maintenant disponible.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${accessUrl}" style="background:#f59e0b;color:#1a1a2e;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;">
                Accéder à ma ressource
              </a>
            </div>
            <p style="color:#7070a0;font-size:12px;">Lien d'accès : <a href="${accessUrl}" style="color:#f59e0b;">${accessUrl}</a></p>
          </div>
        </div>
      </div>`,
  }).catch(() => {})
}

async function sendVirementInstructions(achat: { acheteur_nom: string; acheteur_email: string; id: string }, ressource: { titre: string; prix: number }) {
  const { data: settings } = await supabaseAdmin.from('site_settings').select('virement_iban, virement_nom, contact_email').eq('id', 1).single()
  const iban = settings?.virement_iban || 'À récupérer dans les paramètres'
  const nom  = settings?.virement_nom  || 'Lieu Secret'

  await Promise.all([
    resend.emails.send({
      from: FROM, to: achat.acheteur_email,
      subject: `Commande reçue — ${ressource.titre}`,
      html: `<div style="background:#1a1a2e;padding:40px 20px;font-family:Georgia,serif;"><div style="max-width:600px;margin:0 auto;background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;"><div style="background:#1a1a2e;padding:24px;text-align:center;border-bottom:1px solid #f59e0b;"><div style="font-size:22px;color:#f59e0b;letter-spacing:3px;">LIEU SECRET</div></div><div style="padding:32px;"><h2 style="color:#f59e0b;margin:0 0 16px;">Commande reçue</h2><p style="color:#d0d0e8;">Bonjour ${achat.acheteur_nom},</p><p style="color:#d0d0e8;">Votre commande pour <strong style="color:#fff;">${ressource.titre}</strong> a bien été reçue.</p><div style="background:#1a1a2e;border:1px solid rgba(245,158,11,0.3);border-radius:6px;padding:16px;margin:16px 0;"><p style="color:#f59e0b;margin:0 0 8px;font-weight:bold;">Coordonnées bancaires</p><p style="color:#d0d0e8;margin:4px 0;">IBAN : <strong>${iban}</strong></p><p style="color:#d0d0e8;margin:4px 0;">Bénéficiaire : <strong>${nom}</strong></p><p style="color:#d0d0e8;margin:4px 0;">Montant : <strong>${ressource.prix} €</strong></p><p style="color:#d0d0e8;margin:4px 0;">Référence : <strong>RP-${achat.id.slice(0,8).toUpperCase()}</strong></p></div><p style="color:#a0a0c0;font-size:13px;">Dès réception du virement, vous recevrez votre lien d'accès.</p></div></div></div>`,
    }),
    resend.emails.send({
      from: FROM, to: ADMIN_EMAIL,
      subject: `Nouvelle commande virement — ${ressource.titre} — ${achat.acheteur_nom}`,
      html: `<p>Nouvelle commande par virement :<br>Ressource : ${ressource.titre}<br>Client : ${achat.acheteur_nom} (${achat.acheteur_email})<br>Montant : ${ressource.prix} €<br>Référence : RP-${achat.id.slice(0,8).toUpperCase()}</p>`,
    }),
  ]).catch(() => {})
}