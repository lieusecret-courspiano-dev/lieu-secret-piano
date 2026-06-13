import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    type,
    event_id,
    slot_start,
    slot_end,
    student_name,
    student_email,
    student_phone,
    student_timezone,
    message,
    gift_code,
    amount_override,
  } = body

  // Pour les packs, la validation se fait dans le bloc dédié (acheteur_nom/acheteur_email)
  if (type !== 'pack' && (!student_name || !student_email)) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'

  // ── Cours individuel payé par CB ──────────────────────
  if (type === 'cours' || slot_start) {
    if (!slot_start || !slot_end) {
      return NextResponse.json({ error: 'Créneau manquant' }, { status: 400 })
    }

    // Récupérer le tarif depuis les paramètres
    const { data: settings } = await supabaseAdmin
      .from('site_settings').select('tarif_cours_1h').eq('id', 1).single()
    const tarif = parseFloat(settings?.tarif_cours_1h || '22')

    // Déduire le bon cadeau si présent
    let montantFinal = amount_override !== undefined ? amount_override : tarif
    if (!amount_override && gift_code) {
      const { data: card } = await supabaseAdmin
        .from('gift_cards').select('montant_restant').eq('code', gift_code.toUpperCase()).eq('status', 'active').single()
      if (card) montantFinal = Math.max(0, tarif - card.montant_restant)
    }

    if (montantFinal <= 0) {
      return NextResponse.json({ error: 'Montant nul — utilisez la réservation directe' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Cours de piano individuel — Lieu Secret' },
          unit_amount: Math.round(montantFinal * 100),
        },
        quantity: 1,
      }],
      customer_email: student_email,
      metadata: {
        type: 'cours',
        slot_start,
        slot_end,
        student_name,
        student_email,
        student_phone:    student_phone || '',
        student_timezone: student_timezone || 'Europe/Paris',
        message:          message || '',
        gift_code:        gift_code || '',
      },
      success_url: `${appUrl}/reservation/confirmation?session_id={CHECKOUT_SESSION_ID}&type=cours&email=${encodeURIComponent(student_email)}&name=${encodeURIComponent(student_name)}`,
      cancel_url:  `${appUrl}/reservation`,
    })

    return NextResponse.json({ url: session.url })
  }

  // ── Pack de cours ──────────────────────────────────────────────────
  if (type === 'pack') {
    const { pack_label, heures, montant, acheteur_nom, acheteur_email, eleve_id } = body
    if (!pack_label || !heures || !montant || !acheteur_nom || !acheteur_email) {
      return NextResponse.json({ error: 'Données pack manquantes' }, { status: 400 })
    }
    const packSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `${pack_label} — Lieu Secret`, description: `${heures} heures de cours de piano` },
          unit_amount: Math.round(Number(montant) * 100),
        },
        quantity: 1,
      }],
      customer_email: acheteur_email,
      metadata: {
        type: 'pack',
        pack_label,
        heures: String(heures),
        montant: String(montant),
        acheteur_nom,
        acheteur_email,
        eleve_id: eleve_id || '',
      },
      success_url: `${appUrl}/pack/confirmation?session_id={CHECKOUT_SESSION_ID}&type=pack&email=${encodeURIComponent(acheteur_email)}&pack=${encodeURIComponent(pack_label)}`,
      cancel_url:  `${appUrl}/packs`,
    })
    return NextResponse.json({ url: packSession.url })
  }

  // ── Événement payant ──────────────────────────────────
  if (!event_id) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const { data: event, error } = await supabaseAdmin
    .from('events').select('*').eq('id', event_id).eq('is_active', true).single()

  if (error || !event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  if (event.is_free) return NextResponse.json({ error: 'Cet événement est gratuit' }, { status: 400 })
  if (event.max_spots !== null && event.spots_remaining <= 0) return NextResponse.json({ error: 'Plus de places disponibles' }, { status: 409 })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: event.title, description: event.description || `Lieu Secret — ${event.title}` },
        unit_amount: Math.round(event.price * 100),
      },
      quantity: 1,
    }],
    customer_email: student_email,
    metadata: {
      type: 'event',
      event_id,
      student_name,
      student_email,
      student_phone:    student_phone || '',
      student_timezone: student_timezone || 'Europe/Paris',
      message:          message || '',
      gift_code:        gift_code || '',
    },
    success_url: `${appUrl}/reservation/confirmation?session_id={CHECKOUT_SESSION_ID}&type=event&email=${encodeURIComponent(student_email)}`,
    cancel_url:  `${appUrl}/reservation?tab=evenements`,
  })

  return NextResponse.json({ url: session.url })
}