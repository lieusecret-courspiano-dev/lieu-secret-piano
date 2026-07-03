import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DateTime } from 'luxon'
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
export const dynamic = 'force-dynamic'
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || ''
  if (!cronSecret) return true
  return req.headers.get('authorization') === 'Bearer ' + cronSecret
}
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const now = DateTime.utc()
  let sent48h = 0, sent1h = 0, sentReview = 0
  try {
    const { data: reservations } = await supabaseAdmin.from('reservations').select('*').eq('status', 'confirmed').not('slot_start', 'is', null).gte('slot_start', now.toISO()).lte('slot_start', now.plus({ hours: 49 }).toISO())
    const { data: settings } = await supabaseAdmin.from('site_settings').select('zoom_cours').eq('id', 1).single()
    for (const res of (reservations || [])) {
      const startDT = DateTime.fromISO(res.slot_start, { zone: 'utc' })
      const hoursLeft = startDT.diff(now, 'hours').hours
      const timezone = res.student_timezone || 'Europe/Paris'
      const dateLocal = startDT.setZone(timezone).setLocale('fr').toFormat("EEEE d MMMM yyyy 'a' HH'h'mm")
      const zoomLink = settings?.zoom_cours || null
      const key48h = 'reminder_48h_' + res.id
      const key1h = 'reminder_1h_' + res.id
      const { data: ex48h } = await supabaseAdmin.from('email_logs').select('id').eq('key', key48h).single()
      const { data: ex1h } = await supabaseAdmin.from('email_logs').select('id').eq('key', key1h).single()
      if (hoursLeft >= 47 && hoursLeft <= 49 && !ex48h) {
        try { await resend.emails.send({ from: FROM, to: res.student_email, subject: 'Rappel - Votre cours dans 48h', html: '<p>Bonjour ' + res.student_name + ', votre cours est prevu le ' + dateLocal + (zoomLink ? '. Lien Zoom : ' + zoomLink : '') + '</p>' }); await supabaseAdmin.from('email_logs').insert({ key: key48h, type: 'reminder_48h', reservation_id: res.id }); sent48h++ } catch {}
      }
      if (hoursLeft >= 0.9 && hoursLeft <= 1.1 && !ex1h) {
        try { await resend.emails.send({ from: FROM, to: res.student_email, subject: 'Votre cours commence dans 1h', html: '<p>Bonjour ' + res.student_name + ', votre cours commence bientot !' + (zoomLink ? ' Lien Zoom : ' + zoomLink : '') + '</p>' }); await supabaseAdmin.from('email_logs').insert({ key: key1h, type: 'reminder_1h', reservation_id: res.id }); sent1h++ } catch {}
      }
    }
    const { data: pastRes } = await supabaseAdmin.from('reservations').select('*').eq('status', 'confirmed').not('slot_start', 'is', null).gte('slot_start', now.minus({ hours: 3 }).toISO()).lte('slot_start', now.minus({ hours: 2 }).toISO())
    for (const res of (pastRes || [])) {
      const keyReview = 'review_request_' + res.id
      const { data: exReview } = await supabaseAdmin.from('email_logs').select('id').eq('key', keyReview).single()
      if (!exReview) {
        try {
          const reviewToken = Buffer.from(res.id + ':' + res.student_email).toString('base64url')
          const reviewUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr') + '/avis?token=' + reviewToken
          await resend.emails.send({ from: FROM, to: res.student_email, subject: "Comment s etait votre cours ?", html: '<p>Bonjour ' + res.student_name + ', <a href="' + reviewUrl + '">Laissez votre avis</a> (valable 7 jours).</p>' })
          await supabaseAdmin.from('email_logs').insert({ key: keyReview, type: 'review_request', reservation_id: res.id })
          sentReview++
        } catch {}
      }
    }
    return NextResponse.json({ success: true, sent48h, sent1h, sentReview, timestamp: now.toISO() })
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 }) }
}
