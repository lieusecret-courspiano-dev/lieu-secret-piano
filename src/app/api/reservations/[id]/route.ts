import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { sendCancellationEmail } from '@/lib/email'
import { formatDateLocal } from '@/lib/utils'
import { generateCancelICS } from '@/lib/ics'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'

// PATCH — modifier le statut d'une réservation (admin)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await req.json()
  const { status } = body

  // Récupérer la réservation avant modification (avec ics_uid pour l'annulation)
  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .select('*, ics_uid')
    .eq('id', params.id)
    .single()

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si annulation par admin → libérer créneau + envoyer email
  if (status === 'cancelled' && reservation) {
    // Libérer le créneau
    // slot libere automatiquement par le moteur de disponibilites
    // Remettre une place pour l'événement
    if (reservation.event_id) {
      const { data: ev } = await supabaseAdmin.from('events').select('spots_remaining, max_spots').eq('id', reservation.event_id).single()
      if (ev && ev.max_spots !== null) {
        await supabaseAdmin.from('events').update({ spots_remaining: ev.spots_remaining + 1 }).eq('id', reservation.event_id)
      }
    }
    // Envoyer email d'annulation
    try {
      const timezone = reservation.student_timezone || 'Europe/Paris'
      let dateLocal  = ''
      if (reservation.slot_start) {
        dateLocal = formatDateLocal(reservation.slot_start, timezone)
      } else if (reservation.event_id) {
        const { data: ev } = await supabaseAdmin.from('events').select('date_heure').eq('id', reservation.event_id).single()
        if (ev) dateLocal = formatDateLocal(ev.date_heure, timezone)
      }
      await sendCancellationEmail({
        studentName:  reservation.student_name,
        studentEmail: reservation.student_email,
        type:         reservation.slot_start ? 'Cours individuel' : (reservation.type || 'Cours'),
        dateLocal,
        cancelledBy:  'admin',
      })

      // Envoyer ICS d'annulation pour supprimer l'événement du calendrier
      if (reservation.slot_start && reservation.slot_end) {
        const icsContent = generateCancelICS({
          studentName: reservation.student_name,
          startISO:    reservation.slot_start,
          endISO:      reservation.slot_end,
          uid:         reservation.ics_uid || undefined,
        })
        await resend.emails.send({
          from: FROM,
          to:   reservation.student_email,
          subject: 'Annulation — Cours de piano Lieu Secret',
          html: `<p>Bonjour ${reservation.student_name},</p><p>Votre cours du ${dateLocal} a été annulé. Votre calendrier sera mis à jour automatiquement.</p><p>Lieu Secret</p>`,
          attachments: [{ filename: 'annulation.ics', content: Buffer.from(icsContent).toString('base64') }],
        }).catch(() => {})
      }
    } catch (emailErr) {
      console.error('Erreur email annulation admin:', emailErr)
    }
  }

  return NextResponse.json(data)
}

// DELETE — supprimer une réservation (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', params.id)
    .single()

  // slot libere automatiquement

  if (reservation?.event_id) {
    const { data: event } = await supabaseAdmin.from('events').select('spots_remaining, max_spots').eq('id', reservation.event_id).single()
    if (event && event.max_spots !== null) {
      await supabaseAdmin.from('events').update({ spots_remaining: event.spots_remaining + 1 }).eq('id', reservation.event_id)
    }
  }

  // Envoyer email d'annulation si reservation existait
  if (reservation) {
    try {
      const timezone = reservation.student_timezone || 'Europe/Paris'
      let dateLocal  = ''
      if (reservation.creneau_id) {
        const { data: cr } = await supabaseAdmin.from('creneaux').select('start_time').eq('id', reservation.creneau_id).single()
        if (cr) dateLocal = formatDateLocal(cr.start_time, timezone)
      }
      await sendCancellationEmail({
        studentName:  reservation.student_name,
        studentEmail: reservation.student_email,
        type:         reservation.creneau_id ? 'Cours individuel' : (reservation.type || 'Cours'),
        dateLocal,
        cancelledBy:  'admin',
      })
    } catch (emailErr) {
      console.error('Erreur email suppression:', emailErr)
    }
  }

  const { error } = await supabaseAdmin.from('reservations').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}