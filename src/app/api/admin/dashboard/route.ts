import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { DateTime } from 'luxon'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fromParam = searchParams.get('from')
  const toParam   = searchParams.get('to')

  const now  = DateTime.now()
  const from = fromParam ? DateTime.fromISO(fromParam).startOf('day') : now.minus({ months: 11 }).startOf('month')
  const to   = toParam   ? DateTime.fromISO(toParam).endOf('day')     : now.endOf('day')

  const fromISO = from.toISO()!
  const toISO   = to.toISO()!

  try {
    // Réservations (activité pédagogique)
    const { data: reservations } = await supabaseAdmin
      .from('reservations')
      .select('id, slot_start, amount, payment_method, status, created_at, type, pack_code')
      .gte('created_at', fromISO).lte('created_at', toISO)

    // Packs achetés (revenus réels — exclure pending_virement)
    // Utilise date_paiement si disponible, sinon created_at
    const { data: packsAll } = await supabaseAdmin
      .from('course_packs')
      .select('id, montant, heures_total, heures_restantes, status, payment_method, created_at, date_paiement')
      .neq('status', 'pending_virement')

    // Filtrer par date_paiement (date réelle du paiement) ou created_at en fallback
    // date_paiement est au format YYYY-MM-DD, fromISO/toISO sont des ISO complets
    // On compare en extrayant juste la partie date
    const fromDate = from.toFormat('yyyy-MM-dd')
    const toDate   = to.toFormat('yyyy-MM-dd')

    const packs = (packsAll || []).filter(p => {
      // date_paiement est YYYY-MM-DD, created_at est ISO complet
      const dateRef = p.date_paiement
        ? p.date_paiement  // déjà YYYY-MM-DD
        : p.created_at?.substring(0, 10) // extraire YYYY-MM-DD de l'ISO
      return dateRef >= fromDate && dateRef <= toDate
    })

    // Bons cadeaux vendus (revenus réels)
    const { data: giftCardsAll } = await supabaseAdmin
      .from('gift_cards')
      .select('id, montant, status, payment_method, created_at, date_paiement')
      .neq('status', 'pending_virement')

    const giftCards = (giftCardsAll || []).filter(g => {
      const dateRef = g.date_paiement
        ? g.date_paiement
        : g.created_at?.substring(0, 10)
      return dateRef >= fromDate && dateRef <= toDate
    })

    // Événements payants
    const { data: eventResa } = await supabaseAdmin
      .from('reservations')
      .select('id, amount, payment_method, status, created_at, type')
      .gte('created_at', fromISO).lte('created_at', toISO)
      .eq('status', 'confirmed')
      .in('type', ['atelier', 'evenement', 'masterclass'])
      .gt('amount', 0)

    // CB et PayPal direct sans pack
    const { data: cbResa } = await supabaseAdmin
      .from('reservations')
      .select('id, amount, payment_method, status, created_at')
      .gte('created_at', fromISO).lte('created_at', toISO)
      .eq('status', 'confirmed')
      .in('payment_method', ['stripe', 'paypal'])
      .eq('type', 'cours')
      .is('pack_code', null)

    // Supports pédagogiques vendus (revenus réels)
    const { data: supportsAchatsAll } = await supabaseAdmin
      .from('supports_achats')
      .select('id, montant, payment_method, statut, created_at, supports_pedagogiques(titre)')
      .eq('statut', 'actif')
      .neq('attribue_manuellement', true)

    const supportsAchats = (supportsAchatsAll || []).filter(s => {
      const dateRef = s.created_at?.substring(0, 10)
      return dateRef >= fromDate && dateRef <= toDate
    })

    // Élèves actifs
    const { count: elevesActifs } = await supabaseAdmin
      .from('eleves').select('*', { count: 'exact', head: true }).eq('is_active', true)

    // Inscriptions
    const { count: inscriptions } = await supabaseAdmin
      .from('inscriptions').select('*', { count: 'exact', head: true })
      .gte('created_at', fromISO).lte('created_at', toISO)

    // CALCUL REVENUS (sans double comptabilisation)
    const revenusPacks    = (packs || []).reduce((s, p) => s + (p.montant || 0), 0)
    const revenusGifts    = (giftCards || []).reduce((s, g) => s + (g.montant || 0), 0)
    const revenusEvents   = (eventResa || []).reduce((s, r) => s + (r.amount || 0), 0)
    const revenusCB       = (cbResa || []).reduce((s, r) => s + (r.amount || 0), 0)
    const revenusSupports = (supportsAchats || []).reduce((s, x) => s + (x.montant || 0), 0)
    const revenusTotal    = revenusPacks + revenusGifts + revenusEvents + revenusCB + revenusSupports

    // Par mode de paiement
    const revenusVirement = [
      ...(packs || []).filter(p => p.payment_method === 'virement'),
      ...(giftCards || []).filter(g => g.payment_method === 'virement'),
    ].reduce((s, x) => s + (x.montant || 0), 0)

    // Stripe uniquement
    const revenusStripe = revenusCB
      + (packs || []).filter(p => p.payment_method === 'stripe').reduce((s, p) => s + (p.montant || 0), 0)
      + (giftCards || []).filter(g => g.payment_method === 'stripe').reduce((s, g) => s + (g.montant || 0), 0)
      + (eventResa || []).filter(r => r.payment_method === 'stripe').reduce((s, r) => s + (r.amount || 0), 0)
      + (supportsAchats || []).filter(s => s.payment_method === 'stripe').reduce((s, x) => s + (x.montant || 0), 0)

    // PayPal uniquement
    const revenusPayPal = (cbResa || []).filter(r => r.payment_method === 'paypal').reduce((s, r) => s + (r.amount || 0), 0)
      + (packs || []).filter(p => p.payment_method === 'paypal').reduce((s, p) => s + (p.montant || 0), 0)
      + (giftCards || []).filter(g => g.payment_method === 'paypal').reduce((s, g) => s + (g.montant || 0), 0)
      + (eventResa || []).filter(r => r.payment_method === 'paypal').reduce((s, r) => s + (r.amount || 0), 0)
      + (supportsAchats || []).filter(s => s.payment_method === 'paypal').reduce((s, x) => s + (x.montant || 0), 0)

    const revenusCarte = revenusStripe + revenusPayPal

    // ACTIVITÉ PÉDAGOGIQUE
    const coursConfirmes  = (reservations || []).filter(r => r.status === 'confirmed' && r.type === 'cours').length
    const coursAvecPack   = (reservations || []).filter(r => r.status === 'confirmed' && r.pack_code).length
    const heuresRestantes = (packs || []).filter(p => p.status === 'active').reduce((s, p) => s + (p.heures_restantes || 0), 0)

    // DONNÉES MENSUELLES
    const months: string[] = []
    let cursor = from.startOf('month')
    while (cursor <= to.startOf('month')) {
      months.push(cursor.toFormat('yyyy-MM'))
      cursor = cursor.plus({ months: 1 })
    }

    const monthlyData = months.map(month => {
      // Utilise date_paiement (YYYY-MM-DD) si disponible, sinon created_at
      const mPacks    = (packs || []).filter(p => (p.date_paiement || p.created_at?.substring(0, 10))?.startsWith(month))
      const mGifts    = (giftCards || []).filter(g => (g.date_paiement || g.created_at?.substring(0, 10))?.startsWith(month))
      const mEvents   = (eventResa || []).filter(r => r.created_at?.startsWith(month))
      const mCB       = (cbResa || []).filter(r => r.created_at?.startsWith(month))
      const mSupports = (supportsAchats || []).filter(s => s.created_at?.startsWith(month))
      const mCours    = (reservations || []).filter(r => r.created_at?.startsWith(month) && r.status === 'confirmed' && r.type === 'cours')
      const revenus = mPacks.reduce((s, p) => s + (p.montant || 0), 0)
                    + mGifts.reduce((s, g) => s + (g.montant || 0), 0)
                    + mEvents.reduce((s, r) => s + (r.amount || 0), 0)
                    + mCB.reduce((s, r) => s + (r.amount || 0), 0)
                    + mSupports.reduce((s, x) => s + (x.montant || 0), 0)
      return {
        month, label: DateTime.fromFormat(month, 'yyyy-MM').setLocale('fr').toFormat('MMM yy'),
        revenus: Math.round(revenus * 100) / 100,
        revenus_packs: Math.round(mPacks.reduce((s, p) => s + (p.montant || 0), 0) * 100) / 100,
        revenus_cadeaux: Math.round(mGifts.reduce((s, g) => s + (g.montant || 0), 0) * 100) / 100,
        revenus_events: Math.round(mEvents.reduce((s, r) => s + (r.amount || 0), 0) * 100) / 100,
        revenus_cb: Math.round(mCB.reduce((s, r) => s + (r.amount || 0), 0) * 100) / 100,
        revenus_supports: Math.round(mSupports.reduce((s, x) => s + (x.montant || 0), 0) * 100) / 100,
        cours: mCours.length, packs_vendus: mPacks.length, cadeaux_vendus: mGifts.length, supports_vendus: mSupports.length,
      }
    })

    return NextResponse.json({
      periode: { from: fromISO, to: toISO },
      revenus: {
        total: Math.round(revenusTotal * 100) / 100,
        packs: Math.round(revenusPacks * 100) / 100,
        cadeaux: Math.round(revenusGifts * 100) / 100,
        events: Math.round(revenusEvents * 100) / 100,
        cb_direct: Math.round(revenusCB * 100) / 100,
        supports: Math.round(revenusSupports * 100) / 100,
        par_stripe: Math.round(revenusStripe * 100) / 100,
        par_paypal: Math.round(revenusPayPal * 100) / 100,
        par_carte: Math.round(revenusCarte * 100) / 100,
        par_virement: Math.round(revenusVirement * 100) / 100,
      },
      activite: {
        cours_confirmes: coursConfirmes, cours_avec_pack: coursAvecPack,
        heures_consommees: coursAvecPack, heures_restantes: heuresRestantes,
        eleves_actifs: elevesActifs || 0, inscriptions: inscriptions || 0,
      },
      comptabilite: {
        nb_transactions: (packs?.length || 0) + (giftCards?.length || 0) + (cbResa?.length || 0) + (eventResa?.length || 0),
        nb_packs_vendus: packs?.length || 0, nb_cadeaux_vendus: giftCards?.length || 0,
        nb_events_vendus: eventResa?.length || 0,
        montant_stripe: Math.round(revenusStripe * 100) / 100,
        montant_paypal: Math.round(revenusPayPal * 100) / 100,
        montant_carte: Math.round(revenusCarte * 100) / 100,
        montant_virement: Math.round(revenusVirement * 100) / 100,
      },
      monthlyData,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
