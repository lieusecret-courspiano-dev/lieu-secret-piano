import { NextRequest, NextResponse } from 'next/server'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const reservationId = params.id
  if (!reservationId) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  // Vérifier que la réservation appartient à cet élève
  const { data: reservation, error: fetchError } = await supabaseAdmin
    .from('reservations')
    .select('id, student_email, slot_start, status')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (reservation.student_email !== eleve.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  if (reservation.status === 'cancelled') {
    return NextResponse.json({ error: 'Réservation déjà annulée' }, { status: 400 })
  }

  // Vérifier la règle des 15h
  const slotStart = new Date(reservation.slot_start)
  const heuresAvant = (slotStart.getTime() - Date.now()) / 3600000

  if (heuresAvant < 15) {
    return NextResponse.json({
      error: 'Annulation impossible : le cours est dans moins de 15 heures.'
    }, { status: 400 })
  }

  // Annuler la réservation
  const { error: updateError } = await supabaseAdmin
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Remettre le créneau disponible si applicable
  if (reservation.slot_start) {
    await supabaseAdmin
      .from('creneaux')
      .update({ is_available: true })
      .eq('start_time', reservation.slot_start)
      .eq('is_available', false)
  }

  return NextResponse.json({ success: true, message: 'Réservation annulée avec succès.' })
}