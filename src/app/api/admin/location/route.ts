export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — liste toutes les réservations
export async function GET(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut')

  let query = supabaseAdmin
    .from('location_reservations')
    .select('*')
    .order('created_at', { ascending: false })

  if (statut) query = query.eq('statut', statut)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — mettre à jour le statut ou les infos d'une réservation
export async function PATCH(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('location_reservations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}