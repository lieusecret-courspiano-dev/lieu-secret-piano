import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, createEleveSession } from '@/lib/eleve-auth'
import { checkRateLimit, resetRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limiting: 5 tentatives par IP par 15 minutes
  const ip = getClientIP(req)
  const rl = checkRateLimit(`eleve_login:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.resetIn / 60000)
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
    )
  }

  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  const { data: eleve } = await supabaseAdmin.from('eleves').select('id, email, prenom, nom, password_hash, is_active').eq('email', email.toLowerCase().trim()).single()
  if (!eleve || !eleve.is_active) return NextResponse.json({ error: 'Compte introuvable' }, { status: 401 })
  if (!eleve.password_hash) return NextResponse.json({ error: 'Mot de passe non défini. Vérifiez votre email.' }, { status: 401 })
  if (eleve.password_hash !== hashPassword(password)) return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  resetRateLimit(`eleve_login:${ip}`)
  const token = await createEleveSession(eleve.id)
  const res = NextResponse.json({ success: true, prenom: eleve.prenom })
  res.cookies.set('ls_eleve_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
  return res
}
