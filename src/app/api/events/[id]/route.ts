import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// PATCH — modifier un événement (admin)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const {
    title, description, type, date_heure,
    duration_minutes, max_spots, spots_remaining,
    price, is_free, is_active, zoom_link, is_featured,
  } = body

  const updateData: Record<string, unknown> = {}
  if (title            !== undefined) updateData.title            = title
  if (description      !== undefined) updateData.description      = description
  if (type             !== undefined) updateData.type             = type
  if (date_heure       !== undefined) updateData.date_heure       = date_heure
  if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes
  if (max_spots        !== undefined) updateData.max_spots        = max_spots
  if (spots_remaining  !== undefined) updateData.spots_remaining  = spots_remaining
  if (price            !== undefined) updateData.price            = parseFloat(price)
  if (is_free          !== undefined) updateData.is_free          = is_free
  if (is_active        !== undefined) updateData.is_active        = is_active
  if (zoom_link        !== undefined) updateData.zoom_link        = zoom_link
  if (is_featured      !== undefined) {
    // Si on active la vedette, retirer des autres d'abord
    if (is_featured === true) {
      await supabaseAdmin
        .from('events')
        .update({ is_featured: false })
        .neq('id', params.id)
    }
    updateData.is_featured = is_featured
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — supprimer un événement (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('events')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}