import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { reservation_id, session_id } = body

    if (!reservation_id) {
      return NextResponse.json({ error: 'reservation_id manquant' }, { status: 400 })
    }

    const { data: resa, error } = await supabaseAdmin
      .from('location_reservations')
      .select('id, statut, paiement_statut, stripe_session_id')
      .eq('id', reservation_id)
      .single()

    if (error || !resa) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    if (session_id && resa.stripe_session_id && resa.stripe_session_id !== session_id) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 400 })
    }

    await supabaseAdmin
      .from('location_reservations')
      .update({ paiement_statut: 'complet', statut: 'validee' })
      .eq('id', reservation_id)

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('Erreur confirmation paiement location:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}