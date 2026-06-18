import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code?.trim()) return NextResponse.json({ error: 'Code requis' }, { status: 400 })

  try {
    const { data: pack, error } = await supabaseAdmin
      .from('course_packs')
      .select('id, code, pack_label, heures_total, heures_restantes, montant, status, expires_at, acheteur_nom, acheteur_email, created_at')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error || !pack) return NextResponse.json({ error: 'Code invalide ou introuvable' }, { status: 404 })

    // Récupérer l'historique des réservations liées à ce pack
    const { data: reservations } = await supabaseAdmin
      .from('reservations')
      .select('id, slot_start, slot_end, student_name, student_timezone, status, created_at')
      .eq('pack_code', pack.code)
      .order('slot_start', { ascending: false })

    // Historique des mouvements (pack_history)
    const { data: history } = await supabaseAdmin
      .from('pack_history')
      .select('id, type, delta, note, commentaire, created_at')
      .eq('pack_id', pack.id)
      .order('created_at', { ascending: false })

    const heures_utilisees = pack.heures_total - pack.heures_restantes
    const tarif_horaire    = pack.heures_total > 0 ? Math.round(pack.montant / pack.heures_total * 100) / 100 : 0
    const is_expired       = new Date(pack.expires_at) < new Date()

    return NextResponse.json({
      code:             pack.code,
      pack_label:       pack.pack_label,
      heures_total:     pack.heures_total,
      heures_restantes: pack.heures_restantes,
      heures_utilisees,
      montant:          pack.montant,
      tarif_horaire,
      status:           is_expired ? 'expired' : pack.status,
      expires_at:       pack.expires_at,
      acheteur_nom:     pack.acheteur_nom,
      created_at:       pack.created_at,
      reservations:     reservations || [],
      history:          history || [],
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}