import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('availability_exceptions')
    .select('*')
    .order('exception_date')
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