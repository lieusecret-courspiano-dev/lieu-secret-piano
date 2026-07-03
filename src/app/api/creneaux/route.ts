import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — créneaux disponibles (public) ou tous (admin)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from  = searchParams.get('from')
  const to    = searchParams.get('to')
  const all   = searchParams.get('all')

  const isAdmin = all === 'true' ? await validateAdminSession() : false

  let query = isAdmin
    ? supabaseAdmin.from('creneaux').select('*').order('start_time', { ascending: true })
    : supabase.from('creneaux').select('*').eq('is_available', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

  if (from) query = query.gte('start_time', from)
  if (to)   query = query.lte('start_time', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — créer un créneau (admin)
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { start_time, end_time, notes, zoom_link } = body

  if (!start_time || !end_time) {
    return NextResponse.json({ error: 'start_time et end_time sont requis' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('creneaux')
    .insert({
      start_time,
      end_time,
      notes:     notes || null,
      zoom_link: zoom_link || null,
      is_available: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}