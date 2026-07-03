import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ls_eleve_session')?.value

  if (token) {
    // Supprimer la session courante
    await supabaseAdmin.from('eleve_sessions').delete().eq('token', token)
  }

  // Nettoyer les sessions expirées (maintenance légère)
  await supabaseAdmin
    .from('eleve_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())

  const res = NextResponse.json({ success: true })
  res.cookies.set('ls_eleve_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}