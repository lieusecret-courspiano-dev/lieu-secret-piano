import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = 'Lieu Secret <noreply@lieusecret-courspiano.fr>'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { sujet, message } = await req.json()

  if (!sujet || !message) {
    return NextResponse.json({ error: 'Sujet et message requis.' }, { status: 400 })
  }

  // Récupérer la réservation
  const { data: resa, error } = await supabaseAdmin
    .from('location_reservations')
    .select('id, locataire_nom, locataire_email, article_nom')
    .eq('id', params.id)
    .single()

  if (error || !resa) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 })
  }

  // Envoyer l'email au client
  await resend.emails.send({
    from: FROM,
    to:   resa.locataire_email,
    subject: sujet,
    html: `
      <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:22px;color:#f59e0b;letter-spacing:4px;">LIEU SECRET</div>
          <div style="font-size:11px;color:#7070a0;margin-top:4px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
        </div>
        <h2 style="color:#f59e0b;margin:0 0 8px;">${sujet}</h2>
        <p style="color:#a0a0c0;font-size:13px;margin:0 0 20px;">
          Concernant votre location : <strong style="color:#f0f0f0;">${resa.article_nom}</strong>
        </p>
        <div style="background:#252540;border:1px solid #3a3a5c;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="color:#d0d0e8;font-size:14px;line-height:1.7;white-space:pre-wrap;">${message}</p>
        </div>
        <p style="color:#a0a0c0;font-size:13px;margin-top:20px;">
          Pour toute question, répondez directement à cet email ou contactez-nous à
          <a href="mailto:lieusecret-courspiano@outlook.fr" style="color:#f59e0b;text-decoration:none;">
            lieusecret-courspiano@outlook.fr
          </a>
        </p>
        <p style="color:#505080;font-size:12px;text-align:center;margin-top:24px;">
          Lieu Secret — École de Piano en Ligne
        </p>
      </div>
    `,
  })

  // Sauvegarder la note admin
  await supabaseAdmin
    .from('location_reservations')
    .update({
      note_admin: `[Message envoyé le ${new Date().toLocaleDateString('fr-FR')}]\nSujet: ${sujet}\n${message}`,
    })
    .eq('id', params.id)

  return NextResponse.json({ success: true })
}