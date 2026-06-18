import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin.from('eleve_notifications').select('*').eq('eleve_id', eleve.id).order('created_at', { ascending: false }).limit(50)
  return NextResponse.json(data || [])
}

export async function PATCH(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('eleve_notifications').update({ lu: true }).eq('id', id).eq('eleve_id', eleve.id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
  await supabaseAdmin.from('eleve_notifications').delete().eq('id', id).eq('eleve_id', eleve.id)
  return NextResponse.json({ success: true })
}
