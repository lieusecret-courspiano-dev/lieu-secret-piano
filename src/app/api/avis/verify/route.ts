import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DateTime } from 'luxon'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') || ''
  if (!token) return NextResponse.json({ valid: false, error: 'Token manquant' })
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [reservationId, email] = decoded.split(':')
    if (!reservationId || !email) return NextResponse.json({ valid: false, error: 'Token invalide' })
    const { data: reservation, error } = await supabaseAdmin.from('reservations').select('id, student_name, student_email, slot_start, created_at').eq('id', reservationId).eq('student_email', email).single()
    if (error || !reservation) return NextResponse.json({ valid: false, error: 'Réservation introuvable' })
    if (DateTime.utc().diff(DateTime.fromISO(reservation.created_at), 'days').days > 7) return NextResponse.json({ valid: false, error: 'Lien expiré' })
    const { data: existing } = await supabaseAdmin.from('email_logs').select('id').eq('key', `review_submitted_${reservationId}`).single()
    if (existing) return NextResponse.json({ valid: false, error: 'Avis déjà soumis' })
    return NextResponse.json({ valid: true, student_name: reservation.student_name })
  } catch { return NextResponse.json({ valid: false, error: 'Erreur serveur' }) }
}
