import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, ...params } = body

    if (!type) return NextResponse.json({ error: 'Type requis' }, { status: 400 })

    let amount = 0
    let description = ''
    let customId = ''
    let returnUrl = ''
    let cancelUrl = ''

    if (type === 'cours') {
      // Réservation d'un cours individuel
      const { slot_start, slot_end, student_name, student_email, student_phone, student_timezone, message, gift_code, amount_override, eleve_id } = params
      if (!slot_start || !student_name || !student_email) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

      // Récupérer le tarif
      const { data: settings } = await supabaseAdmin.from('site_settings').select('tarif_cours_1h').eq('id', 1).single()
      const tarif = parseFloat(settings?.tarif_cours_1h || '22')

      // Déduire bon cadeau si présent
      let montantFinal = amount_override !== undefined ? amount_override : tarif
      if (!amount_override && gift_code) {
        const { data: card } = await supabaseAdmin.from('gift_cards').select('montant_restant').eq('code', gift_code.toUpperCase()).eq('status', 'active').single()
        if (card) montantFinal = Math.max(0, tarif - card.montant_restant)
      }
      if (montantFinal <= 0) return NextResponse.json({ error: 'Montant nul — utilisez la réservation directe' }, { status: 400 })

      amount = montantFinal
      description = `Cours de piano individuel — Lieu Secret`
      // Stocker les données dans customId (JSON encodé en base64)
      const data = { type: 'cours', slot_start, slot_end, student_name, student_email, student_phone: student_phone || null, student_timezone: student_timezone || 'Europe/Paris', message: message || null, gift_code: gift_code || null, eleve_id: eleve_id || null }
      customId = Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 127)
      returnUrl = `${APP_URL}/reservation/confirmation?paypal=success&type=cours&email=${encodeURIComponent(student_email)}&name=${encodeURIComponent(student_name)}`
      cancelUrl = `${APP_URL}/reservation`

    } else if (type === 'pack') {
      const { pack_label, heures, montant, acheteur_nom, acheteur_email, eleve_id } = params
      if (!pack_label || !heures || !montant || !acheteur_nom || !acheteur_email) return NextResponse.json({ error: 'Données pack manquantes' }, { status: 400 })

      amount = parseFloat(montant)
      description = `${pack_label} — Lieu Secret (${heures}h de cours)`
      const data = { type: 'pack', pack_label, heures, montant, acheteur_nom, acheteur_email, eleve_id: eleve_id || null }
      customId = Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 127)
      returnUrl = `${APP_URL}/pack/confirmation?paypal=success&type=pack&email=${encodeURIComponent(acheteur_email)}&pack=${encodeURIComponent(pack_label)}`
      cancelUrl = `${APP_URL}/packs`

    } else if (type === 'cadeau') {
      const { acheteur_nom, acheteur_email, destinataire_nom, message, montant } = params
      if (!acheteur_nom || !acheteur_email || !destinataire_nom || !montant) return NextResponse.json({ error: 'Données cadeau manquantes' }, { status: 400 })

      amount = parseFloat(montant)
      description = `Bon cadeau Lieu Secret — Pour ${destinataire_nom}`
      const data = { type: 'cadeau', acheteur_nom, acheteur_email, destinataire_nom, message: message || null, montant }
      customId = Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 127)
      returnUrl = `${APP_URL}/cadeau/confirmation?paypal=success&email=${encodeURIComponent(acheteur_email)}`
      cancelUrl = `${APP_URL}/cadeau`

    } else if (type === 'event') {
      const { event_id, student_name, student_email, student_phone, student_timezone, message } = params
      if (!event_id || !student_name || !student_email) return NextResponse.json({ error: 'Données événement manquantes' }, { status: 400 })

      const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', event_id).eq('is_active', true).single()
      if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
      if (event.is_free) return NextResponse.json({ error: 'Événement gratuit' }, { status: 400 })

      amount = event.price
      description = `${event.title} — Lieu Secret`
      const data = { type: 'event', event_id, student_name, student_email, student_phone: student_phone || null, student_timezone: student_timezone || 'Europe/Paris', message: message || null }
      customId = Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 127)
      returnUrl = `${APP_URL}/reservation/confirmation?paypal=success&type=event&email=${encodeURIComponent(student_email)}`
      cancelUrl = `${APP_URL}/reservation?tab=evenements`
    } else {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    const order = await createPayPalOrder({ amount, description, customId, returnUrl, cancelUrl })
    return NextResponse.json({ orderId: order.id, approveUrl: order.approveUrl })

  } catch (err: unknown) {
    console.error('[PayPal create-order]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur PayPal' }, { status: 500 })
  }
}
