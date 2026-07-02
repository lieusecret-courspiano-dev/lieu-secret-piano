import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LS-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  code += '-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { confirm_virement, ...updateFields } = body

  if (confirm_virement) {
    const { data: current } = await supabaseAdmin.from('gift_cards').select('*').eq('id', params.id).single()
    if (!current) return NextResponse.json({ error: 'Bon cadeau introuvable' }, { status: 404 })

    let code = generateGiftCode()
    for (let i = 0; i < 5; i++) {
      const { data: ex } = await supabaseAdmin.from('gift_cards').select('id').eq('code', code).single()
      if (!ex) break
      code = generateGiftCode()
    }

    const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const { data, error } = await supabaseAdmin.from('gift_cards').update({
      code, status: 'active', expires_at: expiresAt.toISOString()
    }).eq('id', params.id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Email client avec code LS
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      const expireDate = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: current.acheteur_email,
        subject: `Votre bon cadeau Lieu Secret — Code : ${code}`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;text-align:center;">Votre bon cadeau est activé !</h2>
          <p>Bonjour ${current.acheteur_nom},</p>
          <p>Votre paiement a été reçu. Voici le bon cadeau pour <strong style="color:#f59e0b;">${current.destinataire_nom}</strong>.</p>
          <div style="background:#f59e0b20;border:2px solid #f59e0b;border-radius:16px;padding:24px;text-align:center;margin:20px 0;">
            <p style="color:#a0a0c0;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Code bon cadeau</p>
            <p style="font-family:monospace;font-size:32px;font-weight:900;color:#f59e0b;letter-spacing:6px;margin:0;">${code}</p>
            <p style="color:#a0a0c0;font-size:12px;margin:8px 0 0;">Valable jusqu'au ${expireDate}</p>
          </div>
          <div style="background:#1a1a2e;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#f59e0b;font-size:13px;font-weight:bold;margin:0 0 8px;">Comment utiliser ce bon cadeau ?</p>
            <ol style="color:#d0d0e8;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
              <li>Rendez-vous sur <a href="${baseUrl}/reservation" style="color:#f59e0b;">${baseUrl}/reservation</a></li>
              <li>Choisissez un créneau disponible</li>
              <li>Sélectionnez "Bon cadeau" et saisissez le code <strong style="color:#f59e0b;">${code}</strong></li>
            </ol>
          </div>
          <p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas cet email.</p>
        </div>`,
      })
    } catch (emailErr) { console.error('Email cadeau confirm error:', emailErr) }

    return NextResponse.json(data)
  }

  const { data, error } = await supabaseAdmin.from('gift_cards').update(updateFields).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { error } = await supabaseAdmin.from('gift_cards').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
