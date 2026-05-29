import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEventConfirmation, sendAdminNotification } from '@/lib/email'
import { getSiteSettings } from '@/lib/settings'
import { formatDateLocal } from '@/lib/utils'
import { DateTime } from 'luxon'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata!

    const event_id        = metadata.event_id
    const student_name    = metadata.student_name
    const student_email   = metadata.student_email
    const student_phone   = metadata.student_phone || null
    const student_timezone = metadata.student_timezone || 'Europe/Paris'
    const message         = metadata.message || null

    try {
      // Récupérer l'événement
      const { data: ev } = await supabaseAdmin
        .from('events').select('*').eq('id', event_id).single()

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
        student_phone,
        student_timezone,
        message,
        type:              ev.type,
        status:            'confirmed',
        payment_method:    'stripe',
        amount:            ev.price,
        stripe_session_id: session.id,
      })

      // Enregistrer le paiement (optionnel)
      try {
        await supabaseAdmin.from('payments').insert({
          event_id,
          stripe_session_id:        session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount:   ev.price,
          currency: 'eur',
          status:   'paid',
        })
      } catch {
        // table payments optionnelle
      }

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
      await sendAdminNotification({
        studentName:  student_name,
        studentEmail: student_email,
        type:         ev.title,
        dateLocal,
        timezone:     student_timezone,
        zoomLink,
        message,
      })

    } catch (err) {
      console.error('Erreur traitement webhook:', err)
    }
  }

  return NextResponse.json({ received: true })
}