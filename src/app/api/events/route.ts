import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — événements actifs (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all')

  const isAdmin = all === 'true' ? await validateAdminSession() : false

  const { data, error } = isAdmin
    ? await supabaseAdmin
        .from('events')
        .select('*')
        .order('date_heure', { ascending: true })
    : await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('date_heure', new Date().toISOString())
        .order('date_heure', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — créer un événement (admin)
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const {
    title, description, type, date_heure,
    duration_minutes, max_spots, price, is_free, zoom_link, is_featured,
  } = body

  if (!title || !date_heure) {
    return NextResponse.json({ error: 'title et date_heure sont requis' }, { status: 400 })
  }

  const spots = max_spots ? parseInt(max_spots) : null

  // Si on met en vedette, retirer la vedette des autres
  if (is_featured) {
    await supabaseAdmin
      .from('events')
      .update({ is_featured: false })
      .eq('is_featured', true)
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .insert({
      title,
      description:      description || null,
      type:             type || 'evenement',
      date_heure,
      duration_minutes: duration_minutes || 60,
      max_spots:        spots,
      spots_remaining:  spots,
      price:            parseFloat(price) || 0,
      is_free:          is_free ?? true,
      is_active:        true,
      is_featured:      is_featured ?? false,
      zoom_link:        zoom_link || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}