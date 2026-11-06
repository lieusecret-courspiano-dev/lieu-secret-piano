import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — récupérer l'état des lieux d'une réservation
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const err = await checkAdmin()
  if (err) return err

  const { data, error } = await supabaseAdmin
    .from('location_etat_lieux')
    .select('*')
    .eq('reservation_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST — créer ou mettre à jour l'état des lieux
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()
  const { type, elements, observations } = body

  if (!type || !['remise', 'retour'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide (remise ou retour)' }, { status: 400 })
  }

  // Vérifier si un état des lieux de ce type existe déjà
  const { data: existing } = await supabaseAdmin
    .from('location_etat_lieux')
    .select('id')
    .eq('reservation_id', params.id)
    .eq('type', type)
    .single()

  if (existing) {
    // Mettre à jour
    const { data, error } = await supabaseAdmin
      .from('location_etat_lieux')
      .update({ elements: elements || [], observations: observations || null })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Créer
  const { data, error } = await supabaseAdmin
    .from('location_etat_lieux')
    .insert({
      reservation_id: params.id,
      type,
      elements: elements || [],
      observations: observations || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — signer l'état des lieux
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const err = await checkAdmin()
  if (err) return err

  const { etat_lieux_id, signe_loueur, signe_locataire, signature_locataire } = await req.json()

  if (!etat_lieux_id) return NextResponse.json({ error: 'etat_lieux_id manquant' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (signe_loueur !== undefined) updates.signe_loueur = signe_loueur
  if (signe_locataire !== undefined) {
    updates.signe_locataire = signe_locataire
    updates.signature_locataire = signature_locataire || null
    updates.date_signature = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('location_etat_lieux')
    .update(updates)
    .eq('id', etat_lieux_id)
    .eq('reservation_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}