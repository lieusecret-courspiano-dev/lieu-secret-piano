import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET() {
  const { data } = await supabase.from('booking_settings').select('*').eq('id', 1).single()
  return NextResponse.json(data || {
    slot_duration_min: 60, buffer_min: 15, min_notice_hours: 10,
    max_days_ahead: 60, slot_increment_min: 60, timezone: 'Europe/Paris'
  })
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('booking_settings')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}