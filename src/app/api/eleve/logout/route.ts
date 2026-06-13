import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const token = cookieStore.get('ls_eleve_session')?.value
  if (token) await supabaseAdmin.from('eleve_sessions').delete().eq('token', token)
  const res = NextResponse.json({ success: true })
  res.cookies.delete('ls_eleve_session')
  return res
}
