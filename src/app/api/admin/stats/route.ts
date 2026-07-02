import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { DateTime } from 'luxon'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const now      = DateTime.now()
    const start12m = now.minus({ months: 11 }).startOf('month').toISO()!

    // Réservations des 12 derniers mois
    const { data: reservations } = await supabaseAdmin
      .from('reservations')
      .select('id, slot_start, amount, payment_method, status, created_at, type')
      .gte('created_at', start12m)
      .order('created_at', { ascending: true })

    // Inscriptions
    const { data: inscriptions } = await supabaseAdmin
      .from('inscriptions')
      .select('id, created_at, status')
      .gte('created_at', start12m)
      .order('created_at', { ascending: true })

    // Bons cadeaux
    const { data: giftCards } = await supabaseAdmin
      .from('gift_cards')
      .select('id, montant, status, created_at')
      .gte('created_at', start12m)

    // Packs
    const { data: packs } = await supabaseAdmin
      .from('course_packs')
      .select('id, montant, heures_total, heures_restantes, status, created_at')
      .gte('created_at', start12m)

    // Élèves
    const { count: totalEleves } = await supabaseAdmin
      .from('eleves').select('*', { count: 'exact', head: true })
    const { count: elevesActifs } = await supabaseAdmin
      .from('eleves').select('*', { count: 'exact', head: true }).eq('is_active', true)

    // Essais gratuits en attente
    const { count: essaisEnAttente } = await supabaseAdmin
      .from('essais_gratuits').select('*', { count: 'exact', head: true }).eq('status', 'pending')

    // Parrainages en attente
    const { count: parrainagesEnAttente } = await supabaseAdmin
      .from('parrainage_filleuls').select('*', { count: 'exact', head: true }).eq('status', 'pending')

    // Événements actifs
    const { count: evenements } = await supabaseAdmin
      .from('events').select('*', { count: 'exact', head: true }).eq('is_active', true)

    // Témoignages en attente
    const { count: temoignages } = await supabaseAdmin
      .from('medias').select('*', { count: 'exact', head: true }).eq('is_approved', false)

    // Avis email_logs
    const { data: reviewRequests } = await supabaseAdmin
      .from('email_logs').select('id').eq('type', 'review_request')
    const { data: reviewSubmitted } = await supabaseAdmin
      .from('email_logs').select('id').eq('type', 'review_submitted')

    // Construire les données mensuelles
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      months.push(now.minus({ months: i }).toFormat('yyyy-MM'))
    }

    const monthlyData = months.map(month => {
      const monthRes  = (reservations || []).filter(r => r.created_at?.startsWith(month))
      const monthIns  = (inscriptions || []).filter(i => i.created_at?.startsWith(month))
      const monthGift = (giftCards || []).filter(g => g.created_at?.startsWith(month))
      const monthPack = (packs || []).filter(p => p.created_at?.startsWith(month))

      // Revenus = packs + cadeaux + CB direct (sans double comptabilisation)
      const revenusPacks = monthPack.reduce((s, p) => s + (p.montant || 0), 0)
      const revenusGifts = monthGift.filter(g => g.status !== 'pending_virement').reduce((s, g) => s + (g.montant || 0), 0)
      const revenusCB    = monthRes.filter(r => r.status === 'confirmed' && r.payment_method === 'stripe' && !r.type?.includes('pack')).reduce((s, r) => s + (r.amount || 0), 0)

      return {
        month,
        label: DateTime.fromFormat(month, 'yyyy-MM').setLocale('fr').toFormat('MMM yy'),
        reservations: monthRes.filter(r => r.status === 'confirmed').length,
        inscriptions: monthIns.length,
        revenus: Math.round((revenusPacks + revenusGifts + revenusCB) * 100) / 100,
        revenus_cours: Math.round(revenusCB * 100) / 100,
        revenus_cadeaux: Math.round(revenusGifts * 100) / 100,
        revenus_packs: Math.round(revenusPacks * 100) / 100,
      }
    })

    // Heures les plus demandées
    const hourCounts: Record<number, number> = {}
    ;(reservations || []).filter(r => r.slot_start && r.status === 'confirmed').forEach(r => {
      const hour = DateTime.fromISO(r.slot_start, { zone: 'utc' }).setZone('Europe/Paris').hour
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const popularHours = Object.entries(hourCounts)
      .map(([h, count]) => ({ hour: parseInt(h), label: `${h}h`, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8).sort((a, b) => a.hour - b.hour)

    // Méthodes de paiement
    const paymentMethods: Record<string, number> = {}
    ;(reservations || []).filter(r => r.status === 'confirmed').forEach(r => {
      const m = r.payment_method || 'autre'
      paymentMethods[m] = (paymentMethods[m] || 0) + 1
    })

    // Totaux
    const totalReservations = (reservations || []).filter(r => r.status === 'confirmed').length
    const totalRevenus      = monthlyData.reduce((s, m) => s + m.revenus, 0)
    const totalInscriptions = (inscriptions || []).length
    const totalGiftCards    = (giftCards || []).filter(g => g.status !== 'pending_virement').length
    const totalPacks        = (packs || []).length
    const tauxConversion    = reviewRequests?.length
      ? Math.round(((reviewSubmitted?.length || 0) / reviewRequests.length) * 100) : 0

    return NextResponse.json({
      monthlyData,
      popularHours,
      paymentMethods,
      totals: {
        reservations:    totalReservations,
        revenus:         Math.round(totalRevenus * 100) / 100,
        inscriptions:    totalInscriptions,
        gift_cards:      totalGiftCards,
        packs:           totalPacks,
        taux_conversion: tauxConversion,
        total_cours:     (reservations || []).filter(r => r.status === 'confirmed').length,
        eleves_total:    totalEleves || 0,
        eleves_actifs:   elevesActifs || 0,
        essais_attente:  essaisEnAttente || 0,
        parrainages_attente: parrainagesEnAttente || 0,
        evenements:      evenements || 0,
        temoignages_attente: temoignages || 0,
      },
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
