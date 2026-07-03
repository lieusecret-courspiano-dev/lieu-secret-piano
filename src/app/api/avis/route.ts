import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const { token, note, texte, auteur } = await req.json()
  if (!token || !texte?.trim()) return NextResponse.json({ error: 'Token et texte requis' }, { status: 400 })
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [reservationId, email] = decoded.split(':')
    if (!reservationId || !email) return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    const { data: reservation, error } = await supabaseAdmin.from('reservations').select('id, student_name, student_email').eq('id', reservationId).eq('student_email', email).single()
    if (error || !reservation) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    const { data: existing } = await supabaseAdmin.from('email_logs').select('id').eq('key', `review_submitted_${reservationId}`).single()
    if (existing) return NextResponse.json({ error: 'Avis déjà soumis' }, { status: 409 })
    const nomAffiche = auteur?.trim() || reservation.student_name.split(' ')[0]
    const noteLabel = '⭐'.repeat(Math.min(5, Math.max(1, note)))
    await supabaseAdmin.from('medias').insert({ type: 'temoignage', titre: `${noteLabel} — Cours de piano`, description: texte.trim().slice(0, 500), url: `avis:${reservationId}`, auteur: nomAffiche, is_active: false, position: 0 })
    await supabaseAdmin.from('email_logs').insert({ key: `review_submitted_${reservationId}`, type: 'review_submitted', reservation_id: reservationId })
    return NextResponse.json({ success: true })
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 }) }
}
