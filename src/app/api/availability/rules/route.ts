import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('availability_rules')
    .select('*')
    .order('day_of_week')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { day_of_week, start_time, end_time } = await req.json()
  if (day_of_week === undefined || !start_time || !end_time) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('availability_rules')
    .insert({ day_of_week, start_time, end_time, is_active: true })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, day_of_week, start_time, end_time, is_active } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const fields: Record<string, unknown> = {}
  if (day_of_week !== undefined) fields.day_of_week = day_of_week
  if (start_time !== undefined) fields.start_time = start_time
  if (end_time !== undefined) fields.end_time = end_time
  if (is_active !== undefined) fields.is_active = is_active

  const { data, error } = await supabaseAdmin
    .from('availability_rules')
    .update(fields)
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { error } = await supabaseAdmin.from('availability_rules').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
