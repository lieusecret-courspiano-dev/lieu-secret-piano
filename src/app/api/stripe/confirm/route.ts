import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEventConfirmation, sendAdminNotification } from '@/lib/email'
import { getSiteSettings } from '@/lib/settings'
import { generateCoursICS, generateEventICS } from '@/lib/ics'
import { formatDateLocal } from '@/lib/utils'
import { DateTime } from 'luxon'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id manquant' }, { status: 400 })
  }

  try {
    // Récupérer la session Stripe
    const session  = await stripe.checkout.sessions.retrieve(sessionId)
    const metadata = session.metadata!

    const event_id         = metadata.event_id
    const student_name     = metadata.student_name
    const student_email    = metadata.student_email
    const student_timezone = metadata.student_timezone || 'Europe/Paris'
    const message          = metadata.message || null

    if (!event_id || !student_name || !student_email) {
      return NextResponse.json({ error: 'Donnees manquantes' }, { status: 400 })
    }

    // Vérifier si la réservation existe déjà (éviter les doublons)
    const { data: existing } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single()

    if (existing) {
      // Réservation déjà créée — juste retourner les infos
      const { data: ev } = await supabaseAdmin.from('events').select('*').eq('id', event_id).single()
      return NextResponse.json({
        success:      true,
        already_done: true,
        student_name,
        student_email,
        event_title:  ev?.title || '',
      })
    }

    // Récupérer l'événement
    const { data: ev } = await supabaseAdmin.from('events').select('*').eq('id', event_id).single()
    if (!ev) return NextResponse.json({ error: 'Evenement introuvable' }, { status: 404 })

    // Décrémenter les places
    if (ev.max_spots !== null) {
      await supabaseAdmin
        .from('events')
        .update({ spots_remaining: Math.max(0, ev.spots_remaining - 1) })
        .eq('id', event_id)
    }

    // Créer la réservation
    await supabaseAdmin.from('reservations').insert({
      event_id,
      student_name,
      student_email,
      student_phone:     metadata.student_phone || null,
      student_timezone,
      message,
      type:              ev.type,
      status:            'confirmed',
      payment_method:    'stripe',
      amount:            ev.price,
      stripe_session_id: sessionId,
    })

    // Enregistrer le paiement
    try {
      await supabaseAdmin.from('payments').insert({
        event_id,
        stripe_session_id:        sessionId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount:   ev.price,
        currency: 'eur',
        status:   'paid',
      })
    } catch {}

    // Envoyer les emails
    const siteSettings = await getSiteSettings()
    const zoomByType: Record<string, string> = {
      cours:       siteSettings.zoom_cours       || '',
      atelier:     siteSettings.zoom_atelier     || '',
      masterclass: siteSettings.zoom_masterclass || '',
      evenement:   siteSettings.zoom_evenement   || '',
    }
    const zoomLink = ev.zoom_link || zoomByType[ev.type] || null

    const endISO = DateTime.fromISO(ev.date_heure, { zone: 'utc' })
      .plus({ minutes: ev.duration_minutes })
      .toISO()!

    await sendEventConfirmation({
      studentName:  student_name,
      studentEmail: student_email,
      eventTitle:   ev.title,
      startISO:     ev.date_heure,
      endISO,
      timezone:     student_timezone,
      isPaid:       true,
      amount:       ev.price,
      zoomLink,
    })

    const dateLocal = formatDateLocal(ev.date_heure, student_timezone)
    const adminICS  = generateEventICS({
      studentName: student_name,
      eventTitle:  ev.title,
      startISO:    ev.date_heure,
      endISO,
      zoomLink:    zoomLink ?? undefined,
    })

    await sendAdminNotification({
      studentName:  student_name,
      studentEmail: student_email,
      type:         ev.title,
      dateLocal,
      timezone:     student_timezone,
      zoomLink,
      message,
      icsContent:   adminICS,
    })

    return NextResponse.json({
      success:      true,
      student_name,
      student_email,
      event_title:  ev.title,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('Erreur confirm Stripe:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}