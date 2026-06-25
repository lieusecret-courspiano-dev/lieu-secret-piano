import { getPasswordError } from '@/lib/password-strength'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, generateToken } from '@/lib/eleve-auth'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  // Rate limiting: 3 tentatives par IP par 30 minutes
  const ip = getClientIP(req)
  const rl = checkRateLimit(`reset:${ip}`, 3, 30 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 })
  }

  const { email, token, password } = await req.json()
  if (email && !token) {
    const { data: eleve } = await supabaseAdmin.from('eleves').select('id, prenom').eq('email', email.toLowerCase()).single()
    if (!eleve) return NextResponse.json({ success: true })
    const resetToken = generateToken()
    const resetExpires = new Date(Date.now() + 2 * 60 * 60 * 1000)
    await supabaseAdmin.from('eleves').update({ reset_token: resetToken, reset_expires: resetExpires.toISOString() }).eq('id', eleve.id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!)
      await resend.emails.send({ from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>', to: email, subject: 'Réinitialisation de votre mot de passe — Lieu Secret', html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;">Réinitialisation du mot de passe</h2><p>Bonjour ${eleve.prenom},</p><a href="${baseUrl}/espace-eleve/reset?token=${resetToken}" style="display:inline-block;background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Réinitialiser mon mot de passe</a><p style="color:#7070a0;font-size:12px;">Ce lien est valable 2 heures.</p></div>` })
    } catch {}
    return NextResponse.json({ success: true })
  }
  if (token && password) {
    const pwErr = getPasswordError(password)
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 })
    const { data: eleve } = await supabaseAdmin.from('eleves').select('id, reset_expires').eq('reset_token', token).single()
    if (!eleve || new Date(eleve.reset_expires) < new Date()) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
    await supabaseAdmin.from('eleves').update({ password_hash: hashPassword(password), reset_token: null, reset_expires: null }).eq('id', eleve.id)
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
}
