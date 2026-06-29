import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const achats = searchParams.get('achats')

  if (achats) {
    const { data } = await supabaseAdmin
      .from('supports_achats')
      .select('*, eleves(prenom, nom, email), supports_pedagogiques(titre, prix)')
      .order('created_at', { ascending: false })
    return NextResponse.json(data || [])
  }

  const { data } = await supabaseAdmin
    .from('supports_pedagogiques')
    .select('*, supports_achats(count)')
    .order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json()
  if (!body.titre?.trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('supports_pedagogiques').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id, ...fields } = await req.json()
  const { data, error } = await supabaseAdmin.from('supports_pedagogiques').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('supports_pedagogiques').delete().eq('id', id)
  return NextResponse.json({ success: true })
}