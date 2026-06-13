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
    gift_code,
    pack_code,
    achete_pack,
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
    if (event.max_spots !== null) {
      // Compter les réservations confirmées pour cet événement
      const { count: confirmedCount } = await supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .in('status', ['confirmed', 'pending_virement'])
      
      const placesRestantes = event.max_spots - (confirmedCount || 0)
      if (placesRestantes <= 0) {
        return NextResponse.json({ error: 'Plus de places disponibles' }, { status: 409 })
      }
    }
  }

  // Calculer le montant
  let amount = 0
  if (event_id) {
    const { data: ev } = await supabaseAdmin.from('events').select('price, is_free').eq('id', event_id).single()
    if (ev && !ev.is_free) amount = ev.price
  }
  // Pour les cours avec pack : tarif horaire = montant_pack / heures_total
  if (pack_code && slot_start) {
    try {
      const { data: pack } = await supabaseAdmin
        .from('course_packs')
        .select('montant, heures_total')
        .eq('code', pack_code.trim().toUpperCase())
        .single()
      if (pack && pack.heures_total > 0) {
        amount = Math.round((pack.montant / pack.heures_total) * 100) / 100
      }
    } catch {}
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
      status:            (payment_method === 'virement') ? 'pending_virement' : 'confirmed',
      payment_method:    payment_method || 'gratuit',
      amount,
      stripe_session_id: stripe_session_id || null,
      gift_code:         gift_code || null,
      pack_code:         pack_code || null,
    })
    .select()
    .single()

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  // Mettre à jour spots_remaining après création réussie — recalcul depuis le vrai count
  if (event_id && reservation) {
    try {
      const { data: evFresh } = await supabaseAdmin.from('events').select('max_spots').eq('id', event_id).single()
      if (evFresh && evFresh.max_spots !== null) {
        // Compter toutes les réservations confirmées/en attente pour cet événement
        const { count: totalCount } = await supabaseAdmin
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event_id)
          .in('status', ['confirmed', 'pending_virement'])
        const newSpotsRemaining = Math.max(0, evFresh.max_spots - (totalCount || 0))
        await supabaseAdmin.from('events').update({ spots_remaining: newSpotsRemaining }).eq('id', event_id)
      }
    } catch (e) { console.error('spots update error:', e) }
  }

  // ── Déduire 1h du pack si deja_paye ou pack ──
  if ((payment_method === 'deja_paye' || payment_method === 'pack') && pack_code && slot_start) {
    try {
      const { data: pack } = await supabaseAdmin
        .from('course_packs')
        .select('id, heures_utilisees, heures_restantes')
        .eq('code', pack_code.trim().toUpperCase())
        .eq('status', 'active')
        .single()
      if (pack) {
        const newUsed = (pack.heures_utilisees || 0) + 1
        const newRest = Math.max(0, (pack.heures_restantes || 0) - 1)
        await supabaseAdmin.from('course_packs').update({
          heures_utilisees: newUsed,
          heures_restantes: newRest,
          status: newRest === 0 ? 'exhausted' : 'active',
        }).eq('id', pack.id)
        // Enregistrer dans l'historique
        try {
          const dateStr = slot_start ? new Date(slot_start).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')
          await supabaseAdmin.from('pack_history').insert({
            pack_id: pack.id,
            type: 'cours',
            delta: -1,
            note: `Cours réservé — ${dateStr}`,
          })
        } catch (histErr) { console.error('pack_history error:', histErr) }
      }
    } catch (e) { console.error('Pack deduction error:', e) }
  }

  // ── Déduire le bon cadeau si utilisé ──
  if (gift_code && reservation) {
    try {
      const { data: card } = await supabaseAdmin
        .from('gift_cards')
        .select('id, montant, montant_restant, status')
        .eq('code', gift_code.trim().toUpperCase())
        .eq('status', 'active')
        .single()

      if (card) {
        const { data: sett } = await supabaseAdmin.from('site_settings').select('tarif_cours_1h').eq('id', 1).single()
        const tarifCours = parseFloat(sett?.tarif_cours_1h || '22') || 22
        const montantADeduire = Math.min(card.montant_restant, tarifCours)
        const newMontant = Math.max(0, parseFloat((card.montant_restant - montantADeduire).toFixed(2)))
        await supabaseAdmin.from('gift_cards').update({
          montant_restant: newMontant,
          status: newMontant <= 0 ? 'used' : 'active',
          reservation_id: reservation.id,
        }).eq('id', card.id)
      }
    } catch (giftErr) { console.error('Gift deduction error:', giftErr) }
  }

  // Envoyer les emails
  try {
    const siteSettings = await getSiteSettings()

    if (slot_start && slot_end) {
      const zoomLink = siteSettings.zoom_cours || null
      // Récupérer les coordonnées bancaires si virement
      let virementIban = null, virementNom = null, virementInfo = null
      if (payment_method === 'virement') {
        const { data: sett } = await supabaseAdmin.from('site_settings').select('virement_iban, virement_nom, virement_info').eq('id', 1).single()
        virementIban = sett?.virement_iban || null
        virementNom  = sett?.virement_nom  || 'Lieu Secret'
        virementInfo = sett?.virement_info || null
      }

      await sendCoursConfirmation({
        studentName:    student_name,
        studentEmail:   student_email,
        startISO:       slot_start,
        endISO:         slot_end,
        timezone,
        zoomLink,
        message,
        cancelUrl:      generateCancelUrl(reservation.id),
        paymentMethod:  payment_method || null,
        virementIban,
        virementNom,
        virementInfo,
        achetePack:     achete_pack || null,
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