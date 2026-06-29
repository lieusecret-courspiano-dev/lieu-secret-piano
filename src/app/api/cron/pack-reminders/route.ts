import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
export const dynamic = 'force-dynamic'
const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const { data: packs } = await supabaseAdmin
      .from('course_packs')
      .select('id, code, pack_label, heures_restantes, heures_total, acheteur_nom, acheteur_email, expires_at')
      .eq('status', 'active')
      .gt('heures_restantes', 0)
      .lte('heures_restantes', 2)

    if (!packs || packs.length === 0) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const pack of packs) {
      const { data: recentReminder } = await supabaseAdmin
        .from('pack_reminders_sent')
        .select('id')
        .eq('pack_id', pack.id)
        .eq('heures_restantes', pack.heures_restantes)
        .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single()
      if (recentReminder) continue

      const isExpiringSoon = new Date(pack.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const heuresText = pack.heures_restantes === 1 ? "Il ne vous reste plus qu'une heure" : `Il ne vous reste plus que ${pack.heures_restantes} heures`

      try {
        await resend.emails.send({
          from: FROM, to: pack.acheteur_email,
          subject: `${heuresText} sur votre pack — Lieu Secret`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;text-align:center;">Votre pack arrive à sa fin</h2>
            <p>Bonjour ${pack.acheteur_nom},</p>
            <div style="background:rgba(245,158,11,0.1);border:2px solid #f59e0b;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
              <p style="color:#f59e0b;font-size:24px;font-weight:bold;margin:0;">${pack.heures_restantes}h restante${pack.heures_restantes > 1 ? 's' : ''}</p>
              <p style="color:#a0a0c0;font-size:12px;margin:8px 0 0;">${pack.pack_label} — Code : ${pack.code}</p>
            </div>
            <p>${heuresText} sur votre pack <strong>${pack.pack_label}</strong>.</p>
            ${isExpiringSoon ? `<p style="color:#ef4444;">Votre pack expire le ${new Date(pack.expires_at).toLocaleDateString('fr-FR')}.</p>` : ''}
            <p>Rechargez votre pack pour continuer vos cours sans interruption.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${APP_URL}/packs" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:4px;">Recharger mon pack</a>
              <a href="${APP_URL}/reservation" style="background:transparent;color:#f59e0b;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;border:1px solid #f59e0b;display:inline-block;margin:4px;">Réserver un cours</a>
            </div>
            <p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas nos emails.</p>
          </div>`,
        })
        await supabaseAdmin.from('pack_reminders_sent').insert({
          pack_id: pack.id, heures_restantes: pack.heures_restantes,
          email: pack.acheteur_email, sent_at: new Date().toISOString(),
        })
        sent++
      } catch (emailErr) { console.error(`Erreur rappel pack ${pack.code}:`, emailErr) }
    }
    return NextResponse.json({ success: true, sent, total: packs.length })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
