import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend   = new Resend(process.env.RESEND_API_KEY!)
const FROM     = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { achat_id } = await req.json()
  if (!achat_id) return NextResponse.json({ error: 'achat_id requis' }, { status: 400 })

  // Récupérer l'achat
  const { data: achat } = await supabaseAdmin
    .from('ressources_premium_achats')
    .select('*, ressources_premium(titre, youtube_url, zoom_url, fichier_url, type)')
    .eq('id', achat_id).single()

  if (!achat) return NextResponse.json({ error: 'Achat introuvable' }, { status: 404 })
  if (achat.statut === 'confirme') return NextResponse.json({ error: 'Déjà confirmé' }, { status: 400 })

  // Confirmer l'achat
  await supabaseAdmin
    .from('ressources_premium_achats')
    .update({ statut: 'confirme', confirmed_at: new Date().toISOString() })
    .eq('id', achat_id)

  // Envoyer email d'accès
  const accessUrl = `${SITE_URL}/ressources-premium/acces/${achat.token_acces}`
  const ressource = achat.ressources_premium as { titre: string }

  await resend.emails.send({
    from: FROM, to: achat.acheteur_email,
    subject: `Accès confirmé — ${ressource.titre}`,
    html: `
      <div style="background:#1a1a2e;padding:40px 20px;font-family:Georgia,serif;">
        <div style="max-width:600px;margin:0 auto;background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;">
          <div style="background:#1a1a2e;padding:24px;text-align:center;border-bottom:1px solid #f59e0b;">
            <div style="font-size:22px;color:#f59e0b;letter-spacing:3px;">LIEU SECRET</div>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#f59e0b;margin:0 0 16px;">Paiement confirmé — Accès débloqué !</h2>
            <p style="color:#d0d0e8;">Bonjour ${achat.acheteur_nom},</p>
            <p style="color:#d0d0e8;">Votre paiement a été confirmé. Votre accès à <strong style="color:#fff;">${ressource.titre}</strong> est maintenant disponible.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${accessUrl}" style="background:#f59e0b;color:#1a1a2e;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;">
                Accéder à ma ressource
              </a>
            </div>
            <p style="color:#7070a0;font-size:12px;">Lien permanent : <a href="${accessUrl}" style="color:#f59e0b;">${accessUrl}</a></p>
          </div>
        </div>
      </div>`,
  }).catch(() => {})

  return NextResponse.json({ success: true, token: achat.token_acces })
}