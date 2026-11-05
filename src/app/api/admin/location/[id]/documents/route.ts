import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — liste les documents d'une réservation
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const err = await checkAdmin()
  if (err) return err

  const { data, error } = await supabaseAdmin
    .from('location_documents')
    .select('*')
    .eq('reservation_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// PATCH — valider ou refuser un document
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const err = await checkAdmin()
  if (err) return err

  const { doc_id, valide, note_admin } = await req.json()

  if (!doc_id) return NextResponse.json({ error: 'doc_id manquant.' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (valide !== undefined) updates.valide = valide
  if (note_admin !== undefined) updates.note_admin = note_admin

  const { data, error } = await supabaseAdmin
    .from('location_documents')
    .update(updates)
    .eq('id', doc_id)
    .eq('reservation_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}