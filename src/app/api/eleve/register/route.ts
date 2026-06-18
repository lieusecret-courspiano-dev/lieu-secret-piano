import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, createEleveSession } from '@/lib/eleve-auth'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { email, password, prenom, nom } = await req.json()
  if (!email || !password || !prenom || !nom) return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum)' }, { status: 400 })
  const { data: existing } = await supabaseAdmin.from('eleves').select('id, password_hash').eq('email', email.toLowerCase().trim()).single()
  if (existing) {
    if (existing.password_hash) return NextResponse.json({ error: 'Un compte existe déjà avec cet email. Connectez-vous.' }, { status: 409 })
    await supabaseAdmin.from('eleves').update({ prenom: prenom.trim(), nom: nom.trim(), password_hash: hashPassword(password), setup_token: null, setup_expires: null }).eq('id', existing.id)
    const token = await createEleveSession(existing.id)
    const res = NextResponse.json({ success: true, prenom })
    res.cookies.set('ls_eleve_session', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' })
    return res
  }
  const { data: newEleve, error } = await supabaseAdmin.from('eleves').insert({ email: email.toLowerCase().trim(), prenom: prenom.trim(), nom: nom.trim(), password_hash: hashPassword(password), is_active: true }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const token = await createEleveSession(newEleve.id)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
    await resend.emails.send({ from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>', to: email, subject: 'Bienvenue dans votre espace élève — Lieu Secret', html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;">Bienvenue, ${prenom} !</h2><p>Votre espace élève Lieu Secret a été créé avec succès.</p><a href="${baseUrl}/espace-eleve/dashboard" style="display:inline-block;background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Accéder à mon espace</a></div>` })
  } catch {}
  const res = NextResponse.json({ success: true, prenom })
  res.cookies.set('ls_eleve_session', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' })
  return res
}
