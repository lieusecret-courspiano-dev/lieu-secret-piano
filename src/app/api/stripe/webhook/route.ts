import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
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
    const metaType = metadata.type || 'evenement'

    // ── Support pédagogique ──────────────────────────────────
    if (metaType === 'support') {
      const support_id = metadata.support_id
      const eleve_id   = metadata.eleve_id
      const eleve_email = metadata.eleve_email
      const montant    = parseFloat(metadata.montant || '0')

      try {
        await supabaseAdmin.from('supports_achats').insert({
          support_id, eleve_id,
          acheteur_email: eleve_email,
          montant, payment_method: 'stripe', statut: 'actif',
          stripe_session_id: session.id,
        })

        const { data: support } = await supabaseAdmin.from('supports_pedagogiques').select('titre').eq('id', support_id).single()
        const { data: eleve }   = await supabaseAdmin.from('eleves').select('prenom, nom').eq('id', eleve_id).single()
        const siteSettings = await getSiteSettings()
        const resend = new Resend(process.env.RESEND_API_KEY!)

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
          to: eleve_email,
          subject: `Votre support est disponible — ${support?.titre}`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;">Paiement confirmé !</h2>
            <p>Bonjour ${eleve?.prenom || ''},</p>
            <p>Votre accès à <strong style="color:#f59e0b;">${support?.titre}</strong> est maintenant actif.</p>
            <div style="text-align:center;margin:20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'}/espace-eleve/mes-supports" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Accéder à mon support</a>
            </div>
          </div>`,
        }).catch(console.error)

        // Notifier admin
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
          to: siteSettings.contact_email || 'lieusecret-courspiano@outlook.fr',
          subject: `Achat support : ${support?.titre} — ${eleve?.prenom} ${eleve?.nom}`,
          html: `<p>${eleve?.prenom} ${eleve?.nom} (${eleve_email}) a acheté <strong>${support?.titre}</strong> (${montant} €) via Stripe.</p>`,
        }).catch(console.error)

      } catch (err) { console.error('Erreur support Stripe:', err) }
      return NextResponse.json({ received: true })
    }

    // ── Ressource Premium ──────────────────────────────────────────────────
    if (metaType === 'ressource_premium') {
      const achat_id      = metadata.achat_id
      const token_acces   = metadata.token_acces
      const acheteur_nom  = metadata.acheteur_nom
      const acheteur_email = metadata.acheteur_email

      try {
        // Confirmer l'achat
        await supabaseAdmin
          .from('ressources_premium_achats')
          .update({ statut: 'confirme', confirmed_at: new Date().toISOString(), stripe_session_id: session.id })
          .eq('id', achat_id)

        // Récupérer le titre de la ressource
        const { data: achat } = await supabaseAdmin
          .from('ressources_premium_achats')
          .select('ressources_premium(titre)')
          .eq('id', achat_id)
          .single()

        
      } catch (err) { console.error('Erreur ressource premium Stripe:', err) }
      return NextResponse.json({ received: true })
    }

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