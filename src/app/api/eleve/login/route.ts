import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, createEleveSession } from '@/lib/eleve-auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  const { data: eleve } = await supabaseAdmin.from('eleves').select('id, email, prenom, nom, password_hash, is_active').eq('email', email.toLowerCase().trim()).single()
  if (!eleve || !eleve.is_active) return NextResponse.json({ error: 'Compte introuvable' }, { status: 401 })
  if (!eleve.password_hash) return NextResponse.json({ error: 'Mot de passe non défini. Vérifiez votre email.' }, { status: 401 })
  if (eleve.password_hash !== hashPassword(password)) return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  const token = await createEleveSession(eleve.id)
  const res = NextResponse.json({ success: true, prenom: eleve.prenom })
  res.cookies.set('ls_eleve_session', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' })
  return res
}
