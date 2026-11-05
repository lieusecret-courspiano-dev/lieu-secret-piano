import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — liste toutes les zones
export async function GET() {
  const err = await checkAdmin()
  if (err) return err

  const { data, error } = await supabaseAdmin
    .from('location_zones_livraison')
    .select('*')
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — créer une zone
export async function POST(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('location_zones_livraison')
    .insert({
      nom: body.nom,
      distance_min: body.distance_min ?? 0,
      distance_max: body.distance_max ?? null,
      tarif: body.sur_devis ? null : (body.tarif ?? null),
      sur_devis: body.sur_devis ?? false,
      actif: body.actif ?? true,
      position: body.position ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — modifier une zone
export async function PATCH(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Si sur_devis est activé, forcer tarif à null
  if (updates.sur_devis === true) {
    updates.tarif = null
  }

  const { data, error } = await supabaseAdmin
    .from('location_zones_livraison')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — supprimer une zone
export async function DELETE(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Vérifier qu'aucune réservation n'utilise cette zone
  const { data: reservations } = await supabaseAdmin
    .from('location_reservations')
    .select('id')
    .eq('zone_livraison_id', id)
    .in('statut', ['en_attente', 'validee', 'en_cours'])

  if (reservations && reservations.length > 0) {
    return NextResponse.json({
      error: 'Impossible de supprimer cette zone : des réservations actives l\'utilisent.',
    }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('location_zones_livraison')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}