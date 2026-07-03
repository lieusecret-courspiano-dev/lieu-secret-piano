import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const showAll = searchParams.get('all') === 'true'
  const today = new Date().toISOString().split('T')[0]

  let query = supabaseAdmin
    .from('availability_exceptions')
    .select('*')
    .order('exception_date')

  // Par défaut: seulement les exceptions d'aujourd'hui et futures
  // ?all=true pour voir toutes (y compris passées)
  if (!showAll) {
    query = query.gte('exception_date', today)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { exception_date, type, start_time, end_time, reason } = await req.json()
  if (!exception_date || !type) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('availability_exceptions')
    .insert({ exception_date, type, start_time: start_time || null, end_time: end_time || null, reason: reason || null })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, exception_date, type, start_time, end_time, reason } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const fields: Record<string, unknown> = {}
  if (exception_date !== undefined) fields.exception_date = exception_date
  if (type !== undefined) fields.type = type
  if (start_time !== undefined) fields.start_time = start_time || null
  if (end_time !== undefined) fields.end_time = end_time || null
  if (reason !== undefined) fields.reason = reason || null

  const { data, error } = await supabaseAdmin
    .from('availability_exceptions')
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

  const { error } = await supabaseAdmin.from('availability_exceptions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
