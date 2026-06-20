import { NextRequest, NextResponse } from 'next/server'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateCancelICS } from '@/lib/ics'
import { sendCancellationEmail } from '@/lib/email'
import { Resend } from 'resend'
import { formatDateLocal } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'

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
    .select('id, student_name, student_email, slot_start, slot_end, student_timezone, status, ics_uid, pack_code')
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

  // Remettre l'heure sur le pack si la réservation utilisait un code PK
  if (reservation.pack_code) {
    try {
      const { data: pack } = await supabaseAdmin
        .from('course_packs')
        .select('id, heures_restantes, heures_total, status')
        .eq('code', reservation.pack_code.toUpperCase())
        .single()
      if (pack) {
        const newHeures = Math.min(pack.heures_total, pack.heures_restantes + 1)
        await supabaseAdmin
          .from('course_packs')
          .update({ heures_restantes: newHeures, status: newHeures > 0 ? 'active' : pack.status })
          .eq('id', pack.id)
        await supabaseAdmin.from('pack_history').insert({
          pack_id: pack.id, type: 'annulation', delta: 1,
          note: `Remise suite à annulation du cours du ${reservation.slot_start ? new Date(reservation.slot_start).toLocaleDateString('fr-FR') : 'cours'}`,
        })
      }
    } catch (packErr) { console.error('Erreur remise heures pack:', packErr) }
  }

  // Envoyer emails d'annulation (élève + admin) avec ICS joint aux deux
  try {
    const timezone  = reservation.student_timezone || 'Europe/Paris'
    const dateLocal = reservation.slot_start ? formatDateLocal(reservation.slot_start, timezone) : ''

    // Générer l'ICS d'annulation
    const icsContent = reservation.slot_start ? generateCancelICS({
      studentName: reservation.student_name,
      startISO:    reservation.slot_start,
      endISO:      reservation.slot_end || reservation.slot_start,
      uid:         reservation.ics_uid || undefined,
    }) : null

    // Emails bidirectionnels avec ICS joint
    await sendCancellationEmail({
      studentName:  reservation.student_name,
      studentEmail: reservation.student_email,
      type:         'Cours individuel',
      dateLocal,
      cancelledBy:  'student',
      icsContent,
    }).catch(() => {})
  } catch {}

  return NextResponse.json({ success: true, message: 'Réservation annulée avec succès.' })
}