import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin
    .from('eleve_repertoire').select('*').eq('eleve_id', eleve.id)
    .order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const body = await req.json()
  if (!body.titre?.trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('eleve_repertoire')
    .insert({ ...body, eleve_id: eleve.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('eleve_repertoire')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id).eq('eleve_id', eleve.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('eleve_repertoire').delete().eq('id', id).eq('eleve_id', eleve.id)
  return NextResponse.json({ success: true })
}