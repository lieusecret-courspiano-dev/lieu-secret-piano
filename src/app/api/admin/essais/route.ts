import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'
export async function GET() {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data } = await supabaseAdmin.from('essais_gratuits').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id, status, notes } = await req.json()
  const { data, error } = await supabaseAdmin.from('essais_gratuits').update({ status, notes, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  await supabaseAdmin.from('essais_gratuits').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
