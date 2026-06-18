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

export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const body = await req.json()
  if (!body.titre?.trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('eleve_objectifs').insert({ ...body, eleve_id: eleve.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Badge "Visionnaire" — premier objectif défini
  try {
    const { count } = await supabaseAdmin.from('eleve_objectifs').select('*', { count: 'exact', head: true }).eq('eleve_id', eleve.id)
    if ((count || 0) === 1) {
      const { attribuerBadge, BADGES } = await import('@/lib/badges')
      await attribuerBadge(eleve.id, BADGES.PREMIER_OBJECTIF)
    }
  } catch {}
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id, ...fields } = await req.json()
  const { data, error } = await supabaseAdmin.from('eleve_objectifs').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).eq('eleve_id', eleve.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Badge "Accomplissement" — premier objectif atteint
  if (fields.statut === 'atteint') {
    try {
      const { attribuerBadge, BADGES } = await import('@/lib/badges')
      await attribuerBadge(eleve.id, BADGES.OBJECTIF_ATTEINT)
    } catch {}
  }
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('eleve_objectifs').delete().eq('id', id).eq('eleve_id', eleve.id)
  return NextResponse.json({ success: true })
}