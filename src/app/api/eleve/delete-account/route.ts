import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

export async function DELETE(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  await Promise.all([
    supabaseAdmin.from('eleve_sessions').delete().eq('eleve_id', eleve.id),
    supabaseAdmin.from('eleve_progression').delete().eq('eleve_id', eleve.id),
    supabaseAdmin.from('eleve_notifications').delete().eq('eleve_id', eleve.id),
    supabaseAdmin.from('notes_cours').delete().eq('eleve_id', eleve.id),
    supabaseAdmin.from('certificats').delete().eq('eleve_id', eleve.id),
  ])
  await supabaseAdmin.from('eleves').delete().eq('id', eleve.id)
  const res = NextResponse.json({ success: true })
  res.cookies.delete('ls_eleve_session')
  return res
}
