import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { sendCoursConfirmation, sendEventConfirmation, sendAdminNotification } from '@/lib/email'
import { formatDateLocal } from '@/lib/utils'
import { getSiteSettings } from '@/lib/settings'
import { generateCancelUrl } from '@/lib/cancel'
import { generateCoursICS, generateEventICS } from '@/lib/ics'
import { DateTime } from 'luxon'

// GET — liste des réservations (admin)
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*, event:events(id, title, type, date_heure)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — créer une réservation (public)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    slot_start,
    slot_end,
    event_id,
    student_name,
    student_email,
    student_phone,
    student_timezone,
    message,
    type,
    payment_method,
    stripe_session_id,
  } = body

  if (!student_name || !student_email) {
    return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 })
  }
  if (!slot_start && !event_id) {
    return NextResponse.json({ error: 'Un creneau ou un evenement est requis' }, { status: 400 })
  }

  const timezone = student_timezone || 'Europe/Paris'

  // Vérifier qu'il n'y a pas déjà une réservation pour ce créneau
  if (slot_start) {
    const { data: existing } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('slot_start', slot_start)
      .eq('status', 'confirmed')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ce creneau est deja reserve' }, { status: 409 })
    }
  }

  // Événement : décrémenter les places
  if (event_id) {
    const { data: event, error: eErr } = await supabaseAdmin
      .from('events').select('*').eq('id', event_id).eq('is_active', true).single()

    if (eErr || !event) {
      return NextResponse.json({ error: 'Evenement introuvable' }, { status: 404 })
    }
    if (event.max_spots !== null && event.spots_remaining <= 0) {
      return NextResponse.json({ error: 'Plus de places disponibles' }, { status: 409 })
    }
    if (event.max_spots !== null) {
      await supabaseAdmin.from('events').update({ spots_remaining: event.spots_remaining - 1 }).eq('id', event_id)
    }
  }

  // Calculer le montant
  let amount = 0
  if (event_id) {
    const { data: ev } = await supabaseAdmin.from('events').select('price, is_free').eq('id', event_id).single()
    if (ev && !ev.is_free) amount = ev.price
  }

  // Créer la réservation
  const { data: reservation, error: rErr } = await supabaseAdmin
    .from('reservations')
    .insert({
      slot_start:        slot_start || null,
      slot_end:          slot_end   || null,
      event_id:          event_id   || null,
      student_name,
      student_email,
      student_phone:     student_phone || null,
      student_timezone:  timezone,
      message:           message || null,
      type:              type || 'cours',
      status:            'confirmed',
      payment_method:    payment_method || 'gratuit',
      amount,
      stripe_session_id: stripe_session_id || null,
    })
    .select()
    .single()

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  // Envoyer les emails
  try {
    const siteSettings = await getSiteSettings()

    if (slot_start && slot_end) {
      const zoomLink = siteSettings.zoom_cours || null
      await sendCoursConfirmation({
        studentName:  student_name,
        studentEmail: student_email,
        startISO:     slot_start,
        endISO:       slot_end,
        timezone,
        zoomLink,
        message,
        cancelUrl:    generateCancelUrl(reservation.id),
      })

      const dateLocal = formatDateLocal(slot_start, timezone)
      const adminICS  = generateCoursICS({ studentName: student_name, startISO: slot_start, endISO: slot_end, zoomLink: zoomLink ?? undefined })
      await sendAdminNotification({
        studentName: student_name, studentEmail: student_email,
        type: 'Cours individuel', dateLocal, timezone, zoomLink, message, icsContent: adminICS,
      })
    }

    if (event_id) {
      const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', event_id).single()
      if (event) {
        const zoomByType: Record<string, string> = {
          cours: siteSettings.zoom_cours || '', atelier: siteSettings.zoom_atelier || '',
          masterclass: siteSettings.zoom_masterclass || '', evenement: siteSettings.zoom_evenement || '',
        }
        const zoomLink = event.zoom_link || zoomByType[event.type] || null
        const endISO   = DateTime.fromISO(event.date_heure, { zone: 'utc' }).plus({ minutes: event.duration_minutes }).toISO()!

        await sendEventConfirmation({
          studentName: student_name, studentEmail: student_email, eventTitle: event.title,
          startISO: event.date_heure, endISO, timezone, isPaid: !event.is_free,
          amount: event.price, zoomLink, cancelUrl: generateCancelUrl(reservation.id),
        })

        const dateLocal = formatDateLocal(event.date_heure, timezone)
        const adminICS  = generateEventICS({ studentName: student_name, eventTitle: event.title, startISO: event.date_heure, endISO, zoomLink: zoomLink ?? undefined })
        await sendAdminNotification({
          studentName: student_name, studentEmail: student_email, type: event.title,
          dateLocal, timezone, zoomLink, message, icsContent: adminICS,
        })
      }
    }
  } catch (emailErr) {
    console.error('Email error:', emailErr)
  }

  return NextResponse.json(reservation, { status: 201 })
}