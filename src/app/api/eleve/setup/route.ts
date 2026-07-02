import { getPasswordError } from '@/lib/password-strength'
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, createEleveSession } from '@/lib/eleve-auth'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 })
  const pwErr = getPasswordError(password)
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 })
  const { data: eleve } = await supabaseAdmin.from('eleves').select('id, setup_token, setup_expires').eq('setup_token', token).single()
  if (!eleve) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
  if (new Date(eleve.setup_expires) < new Date()) return NextResponse.json({ error: 'Lien expiré. Contactez votre professeur.' }, { status: 400 })
  await supabaseAdmin.from('eleves').update({ password_hash: hashPassword(password), setup_token: null, setup_expires: null }).eq('id', eleve.id)
  const sessionToken = await createEleveSession(eleve.id)
  const res = NextResponse.json({ success: true })
  res.cookies.set('ls_eleve_session', sessionToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' })
  return res
}
