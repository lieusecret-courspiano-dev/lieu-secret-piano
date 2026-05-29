import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateCancelToken } from '@/lib/cancel'
import { sendCancellationEmail } from '@/lib/email'
import { formatDateLocal } from '@/lib/utils'

// GET — vérifier le token et retourner les infos de la réservation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id    = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id || !token) {
    return NextResponse.json({ error: 'Parametres manquants' }, { status: 400 })
  }

  const expectedToken = generateCancelToken(id)
  if (token !== expectedToken) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*, event:events(title, date_heure)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Reservation introuvable' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// POST — annuler la réservation
export async function POST(req: NextRequest) {
  const { id, token } = await req.json()

  if (!id || !token) {
    return NextResponse.json({ error: 'Parametres manquants' }, { status: 400 })
  }

  const expectedToken = generateCancelToken(id)
  if (token !== expectedToken) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 403 })
  }

  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !reservation) {
    return NextResponse.json({ error: 'Reservation introuvable' }, { status: 404 })
  }

  if (reservation.status === 'cancelled') {
    return NextResponse.json({ error: 'Deja annulee' }, { status: 409 })
  }

  // Annuler la réservation
  await supabaseAdmin
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id)

  // Remettre une place pour l'événement
  if (reservation.event_id) {
    const { data: ev } = await supabaseAdmin
      .from('events')
      .select('spots_remaining, max_spots')
      .eq('id', reservation.event_id)
      .single()

    if (ev && ev.max_spots !== null) {
      await supabaseAdmin
        .from('events')
        .update({ spots_remaining: ev.spots_remaining + 1 })
        .eq('id', reservation.event_id)
    }
  }

  // Envoyer emails d'annulation
  try {
    const timezone = reservation.student_timezone || 'Europe/Paris'
    let dateLocal  = ''

    if (reservation.slot_start) {
      dateLocal = formatDateLocal(reservation.slot_start, timezone)
    } else if (reservation.event_id) {
      const { data: ev } = await supabaseAdmin
        .from('events').select('date_heure').eq('id', reservation.event_id).single()
      if (ev) dateLocal = formatDateLocal(ev.date_heure, timezone)
    }

    await sendCancellationEmail({
      studentName:  reservation.student_name,
      studentEmail: reservation.student_email,
      type:         reservation.slot_start ? 'Cours individuel' : (reservation.type || 'Cours'),
      dateLocal,
      cancelledBy:  'student',
    })
  } catch (emailErr) {
    console.error('Erreur email annulation:', emailErr)
  }

  return NextResponse.json({ success: true })
}