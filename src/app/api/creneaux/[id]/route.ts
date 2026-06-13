import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// PATCH — modifier un créneau (admin)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { start_time, end_time, is_available, notes, zoom_link } = body

  const updateData: Record<string, unknown> = {}
  if (start_time    !== undefined) updateData.start_time    = start_time
  if (end_time      !== undefined) updateData.end_time      = end_time
  if (is_available  !== undefined) updateData.is_available  = is_available
  if (notes         !== undefined) updateData.notes         = notes
  if (zoom_link     !== undefined) updateData.zoom_link     = zoom_link

  const { data, error } = await supabaseAdmin
    .from('creneaux')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — supprimer un créneau (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('creneaux')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}