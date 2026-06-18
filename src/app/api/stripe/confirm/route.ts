import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCoursConfirmation, sendEventConfirmation, sendAdminNotification } from '@/lib/email'
import { getSiteSettings } from '@/lib/settings'
import { generateCoursICS, generateEventICS } from '@/lib/ics'
import { formatDateLocal } from '@/lib/utils'
import { DateTime } from 'luxon'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })


// Appliquer les crédits de parrainage en attente pour un email donné
async function applyPendingParrainageCredits(packId: string, email: string) {
  try {
    const { data: credits } = await supabaseAdmin
      .from('parrainage_credits')
      .select('*')
      .eq('parrain_email', email.toLowerCase())
      .eq('status', 'pending')
    
    if (!credits || credits.length === 0) return
    
    const totalHeures = credits.reduce((s: number, c: {heures: number}) => s + c.heures, 0)
    
    // Récupérer le pack actuel
    const { data: pack } = await supabaseAdmin
      .from('course_packs')
      .select('heures_restantes')
      .eq('id', packId)
      .single()
    
    if (!pack) return
    
    // Créditer les heures
    await supabaseAdmin.from('course_packs').update({
      heures_restantes: pack.heures_restantes + totalHeures
    }).eq('id', packId)
    
    // Enregistrer dans l'historique
    for (const credit of credits) {
      await supabaseAdmin.from('pack_history').insert({
        pack_id: packId, type: 'parrainage', delta: credit.heures,
        note: `${credit.raison} (crédit appliqué à l'activation du pack)`
      })
      // Marquer le crédit comme appliqué
      await supabaseAdmin.from('parrainage_credits').update({
        status: 'applied', pack_id: packId, applied_at: new Date().toISOString()
      }).eq('id', credit.id)
    }
    
    console.log(`[parrainage] ${totalHeures}h de crédits en attente appliqués au pack ${packId} pour ${email}`)
  } catch (err) { console.error('Erreur application crédits parrainage:', err) }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'session_id manquant' }, { status: 400 })

  try {
    const session  = await stripe.checkout.sessions.retrieve(sessionId)
    const metadata = session.metadata!
    const type     = metadata.type || 'event'

    // Vérifier si déjà traité
    const { data: existing } = await supabaseAdmin
      .from('reservations').select('id').eq('stripe_session_id', sessionId).single()

    if (existing) {
      return NextResponse.json({ success: true, already_done: true, student_name: metadata.student_name, student_email: metadata.student_email })
    }

    // Pour les packs, les métadonnées utilisent acheteur_nom/acheteur_email
    const student_name     = metadata.student_name || metadata.acheteur_nom
    const student_email    = metadata.student_email || metadata.acheteur_email
    const student_timezone = metadata.student_timezone || 'Europe/Paris'
    const message          = metadata.message || null
    const gift_code        = metadata.gift_code || null

    if (!student_name || !student_email) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const siteSettings = await getSiteSettings()

    // ── Achat pack par CB ──────────────────────────────────────
    if (type === 'pack') {
      const pack_label   = metadata.pack_label   || 'Pack de cours'
      const heures_total = parseInt(metadata.heures_total || metadata.heures || '5')
      const montant      = parseFloat(metadata.montant || '100')

      const genPKCode = (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let c = 'PK-'
        for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)]
        c += '-'
        for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)]
        return c
      }

      let packCode = genPKCode()
      for (let i = 0; i < 5; i++) {
        const { data: ex } = await supabaseAdmin.from('course_packs').select('id').eq('code', packCode).single()
        if (!ex) break
        packCode = genPKCode()
      }

      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const { data: newPack, error: packErr } = await supabaseAdmin.from('course_packs').insert({
        code: packCode, pack_label, heures_total, heures_restantes: heures_total,
        heures_utilisees: 0, montant, acheteur_nom: student_name, acheteur_email: student_email,
        stripe_session_id: sessionId, status: 'active', payment_method: 'stripe',
        expires_at: expiresAt.toISOString(),
      }).select().single()

      if (packErr) return NextResponse.json({ error: packErr.message }, { status: 500 })

      // Lier au compte élève (par eleve_id direct ou par email)
      try {
        const eleveIdMeta = metadata.eleve_id
        if (eleveIdMeta && newPack) {
          await supabaseAdmin.from('course_packs').update({ eleve_id: eleveIdMeta }).eq('id', newPack.id)
        } else {
          const { data: eleveLink } = await supabaseAdmin.from('eleves').select('id').eq('email', student_email.toLowerCase()).single()
          if (eleveLink && newPack) await supabaseAdmin.from('course_packs').update({ eleve_id: eleveLink.id }).eq('id', newPack.id)
        }
      } catch {}
      
      // Appliquer les crédits de parrainage en attente
      if (newPack) await applyPendingParrainageCredits(newPack.id, student_email)

      // Enregistrer dans l'historique
      try {
        await supabaseAdmin.from('pack_history').insert({ pack_id: newPack.id, type: 'achat', delta: heures_total, note: `Achat ${pack_label} via Stripe` })
      } catch {}

      // Email client avec code PK
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
        const expireDate = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        await sendAdminNotification({ studentName: student_name, studentEmail: student_email, type: `Pack ${pack_label} — Code : ${packCode}`, dateLocal: new Date().toLocaleDateString('fr-FR'), timezone: 'Europe/Paris', zoomLink: null, message: null, icsContent: null })
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY!)
        await resend.emails.send({
          from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
          to: student_email,
          subject: `Votre ${pack_label} est activé — Code : ${packCode}`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;text-align:center;">Votre pack est activé !</h2><p>Bonjour ${student_name},</p><div style="background:#f59e0b20;border:2px solid #f59e0b;border-radius:16px;padding:24px;text-align:center;margin:20px 0;"><p style="color:#a0a0c0;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Votre code pack</p><p style="font-family:monospace;font-size:32px;font-weight:900;color:#f59e0b;letter-spacing:6px;margin:0;">${packCode}</p><p style="color:#a0a0c0;font-size:12px;margin:8px 0 0;">${heures_total} heures — Valable jusqu'au ${expireDate}</p></div><div style="text-align:center;margin:20px 0;"><a href="${baseUrl}/mon-pack" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Consulter mes heures</a></div><p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas cet email.</p></div>`,
        })
      } catch (emailErr) { console.error('Email pack CB error:', emailErr) }

      return NextResponse.json({ success: true, student_name, student_email, pack_code: packCode })
    }

    // ── Cours individuel payé par CB ──────────────────────
    if (type === 'cours') {
      const slot_start = metadata.slot_start
      const slot_end   = metadata.slot_end
      if (!slot_start || !slot_end) return NextResponse.json({ error: 'Créneau manquant' }, { status: 400 })

      const amount = parseFloat(siteSettings.tarif_cours_1h || '22')

      // Créer la réservation
      const { data: reservation } = await supabaseAdmin.from('reservations').insert({
        slot_start,
        slot_end,
        student_name,
        student_email,
        student_phone:     metadata.student_phone || null,
        student_timezone,
        message,
        type:              'cours',
        status:            'confirmed',
        payment_method:    'stripe',
        amount,
        stripe_session_id: sessionId,
        gift_code,
      }).select().single()

      // Déduire le bon cadeau si utilisé
      if (gift_code && reservation) {
        const { data: card } = await supabaseAdmin.from('gift_cards').select('id, montant_restant').eq('code', gift_code.toUpperCase()).eq('status', 'active').single()
        if (card) {
          const newMontant = Math.max(0, card.montant_restant - amount)
          await supabaseAdmin.from('gift_cards').update({ montant_restant: newMontant, status: newMontant <= 0 ? 'used' : 'active', reservation_id: reservation.id }).eq('id', card.id)
        }
      }

      // Envoyer les emails
      const zoomLink = siteSettings.zoom_cours || null
      await sendCoursConfirmation({
        studentName:  student_name,
        studentEmail: student_email,
        startISO:     slot_start,
        endISO:       slot_end,
        timezone:     student_timezone,
        zoomLink,
        message,
      })

      const dateLocal = formatDateLocal(slot_start, student_timezone)
      const adminICS  = generateCoursICS({ studentName: student_name, startISO: slot_start, endISO: slot_end, zoomLink: zoomLink ?? undefined })
      await sendAdminNotification({ studentName: student_name, studentEmail: student_email, type: 'Cours individuel (CB)', dateLocal, timezone: student_timezone, zoomLink, message, icsContent: adminICS })

      return NextResponse.json({ success: true, student_name, student_email })
    }

    // ── Événement payant ──────────────────────────────────
    const event_id = metadata.event_id
    if (!event_id) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

    const { data: ev } = await supabaseAdmin.from('events').select('*').eq('id', event_id).single()
    if (!ev) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

    if (ev.max_spots !== null) {
      await supabaseAdmin.from('events').update({ spots_remaining: Math.max(0, ev.spots_remaining - 1) }).eq('id', event_id)
    }

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
      gift_code,
    })

    try {
      await supabaseAdmin.from('payments').insert({
        event_id, stripe_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: ev.price, currency: 'eur', status: 'paid',
      })
    } catch {}

    const zoomByType: Record<string, string> = {
      cours: siteSettings.zoom_cours || '', atelier: siteSettings.zoom_atelier || '',
      masterclass: siteSettings.zoom_masterclass || '', evenement: siteSettings.zoom_evenement || '',
    }
    const zoomLink = ev.zoom_link || zoomByType[ev.type] || null
    const endISO   = DateTime.fromISO(ev.date_heure, { zone: 'utc' }).plus({ minutes: ev.duration_minutes }).toISO()!

    await sendEventConfirmation({
      studentName: student_name, studentEmail: student_email, eventTitle: ev.title,
      startISO: ev.date_heure, endISO, timezone: student_timezone,
      isPaid: true, amount: ev.price, zoomLink,
    })

    const dateLocal = formatDateLocal(ev.date_heure, student_timezone)
    const adminICS  = generateEventICS({ studentName: student_name, eventTitle: ev.title, startISO: ev.date_heure, endISO, zoomLink: zoomLink ?? undefined })
    await sendAdminNotification({ studentName: student_name, studentEmail: student_email, type: ev.title, dateLocal, timezone: student_timezone, zoomLink, message, icsContent: adminICS })

    return NextResponse.json({ success: true, student_name, student_email, event_title: ev.title })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('Erreur confirm Stripe:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}