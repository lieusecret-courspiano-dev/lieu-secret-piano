import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin.from('eleve_objectifs').select('*').eq('eleve_id', eleve.id).order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}





export async function DELETE(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('eleve_objectifs').delete().eq('id', id).eq('eleve_id', eleve.id)
  return NextResponse.json({ success: true })
}
