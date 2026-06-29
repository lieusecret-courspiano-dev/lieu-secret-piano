import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { Resend } from 'resend'

const resend      = new Resend(process.env.RESEND_API_KEY!)
const FROM        = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LS-'
  for (let i = 0; i < 8; i++) { if (i === 4) code += '-'; code += chars[Math.floor(Math.random() * chars.length)] }
  return code
}

export async function GET() {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data, error } = await supabaseAdmin.from('gift_cards').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { acheteur_nom, acheteur_email, destinataire_nom, message, montant } = await req.json()
  if (!acheteur_nom || !acheteur_email || !destinataire_nom || !montant) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const code = generateGiftCode()
  const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const { data, error } = await supabaseAdmin.from('gift_cards').insert({
    code, montant: parseFloat(String(montant)), montant_restant: parseFloat(String(montant)),
    acheteur_nom, acheteur_email, destinataire_nom, message: message || null,
    status: 'active', expires_at: expiresAt.toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const expiresDate = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  try {
    await resend.emails.send({
      from: FROM, to: acheteur_email,
      subject: 'Votre bon cadeau Lieu Secret — Code : ' + code,
      html: '<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;"><tr><td style="background:linear-gradient(135deg,#1a1a2e,#252540);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;"><div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div><div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ECOLE DE PIANO EN LIGNE</div></td></tr><tr><td style="padding:32px;"><h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Votre bon cadeau est pret !</h2><p style="color:#a0a0c0;font-size:14px;margin:0 0 24px;">Bonjour ' + acheteur_nom + ',</p><p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Votre bon cadeau pour <strong style="color:#f59e0b;">' + destinataire_nom + '</strong> a bien ete cree.</p><div style="background:#1a1a2e;border:2px solid #f59e0b;border-radius:12px;padding:28px;text-align:center;margin:24px 0;"><p style="margin:0 0 8px;color:#a0a0c0;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Code cadeau</p><div style="font-size:32px;color:#f59e0b;font-weight:bold;letter-spacing:6px;font-family:monospace;">' + code + '</div><p style="margin:12px 0 0;color:#7070a0;font-size:12px;">Valeur : ' + montant + ' EUR — Valable jusqu au ' + expiresDate + '</p></div>' + (message ? '<div style="background:#2a2a45;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:4px;margin:16px 0;"><p style="margin:0;color:#d0d0e8;font-size:14px;font-style:italic;">"' + message + '"</p></div>' : '') + '<div style="background:#2a2a45;border-radius:8px;padding:16px;margin:20px 0;"><p style="margin:0 0 8px;color:#f59e0b;font-size:13px;font-weight:bold;">Comment utiliser ce bon ?</p><ol style="margin:0;padding-left:20px;color:#a0a0c0;font-size:13px;line-height:1.8;"><li>Rendez-vous sur <a href="' + APP_URL + '/reservation" style="color:#f59e0b;">' + APP_URL + '/reservation</a></li><li>Lors de la reservation, saisissez le code cadeau</li><li>Le montant est deduit automatiquement</li></ol></div><p style="color:#7070a0;font-size:13px;margin-top:24px;">Merci pour votre confiance,<br/><span style="color:#f59e0b;">Lieu Secret</span></p></td></tr></table></td></tr></table></body></html>',
    })
  } catch (emailErr) { console.error('Email cadeau admin:', emailErr) }

  return NextResponse.json(data, { status: 201 })
}
