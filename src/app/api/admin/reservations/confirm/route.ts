import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { sendCoursConfirmation, sendAdminNotification } from '@/lib/email'
import { getSiteSettings } from '@/lib/settings'
import { generateCoursICS } from '@/lib/ics'
import { formatDateLocal } from '@/lib/utils'
import { generateCancelUrl } from '@/lib/cancel'
import { Resend } from 'resend'

const resend      = new Resend(process.env.RESEND_API_KEY!)
const FROM        = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'

function generatePackCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PK-'
  for (let i = 0; i < 8; i++) { if (i === 4) code += '-'; code += chars[Math.floor(Math.random() * chars.length)] }
  return code
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { reservation_id, confirm_type, pack_label, pack_heures, pack_montant } = await req.json()
  if (!reservation_id) return NextResponse.json({ error: 'reservation_id requis' }, { status: 400 })

  try {
    const { data: reservation, error } = await supabaseAdmin
      .from('reservations').select('*').eq('id', reservation_id).single()

    if (error || !reservation) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    if (reservation.status === 'confirmed') return NextResponse.json({ error: 'Déjà confirmée' }, { status: 400 })
    // Accepter pending_virement et pending
    if (!['pending_virement', 'pending', 'cancelled'].includes(reservation.status) && reservation.status !== 'confirmed') {
      // Statut inconnu mais on continue quand même
    }

    // Confirmer la réservation
    await supabaseAdmin.from('reservations').update({ status: 'confirmed' }).eq('id', reservation_id)

    const siteSettings = await getSiteSettings()
    const timezone     = reservation.student_timezone || 'Europe/Paris'
    const zoomLink     = siteSettings.zoom_cours || null

    // Envoyer l'email de confirmation cours
    await sendCoursConfirmation({
      studentName:  reservation.student_name,
      studentEmail: reservation.student_email,
      startISO:     reservation.slot_start,
      endISO:       reservation.slot_end,
      timezone,
      zoomLink,
      message:      reservation.message,
      cancelUrl:    generateCancelUrl(reservation_id),
    })

    // Notifier l'admin
    const dateLocal = formatDateLocal(reservation.slot_start, timezone)
    const adminICS  = generateCoursICS({
      studentName: reservation.student_name,
      startISO:    reservation.slot_start,
      endISO:      reservation.slot_end,
      zoomLink:    zoomLink ?? undefined,
    })
    await sendAdminNotification({
      studentName:  reservation.student_name,
      studentEmail: reservation.student_email,
      type:         'Cours individuel (virement confirmé)',
      dateLocal,
      timezone,
      zoomLink,
      message:      reservation.message,
      icsContent:   adminICS,
    })

    // Si pack : générer le code PK et envoyer à l'élève
    if (confirm_type === 'pack' && pack_label && pack_heures && pack_montant) {
      const code      = generatePackCode()
      const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      const expiresDate = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

      await supabaseAdmin.from('course_packs').insert({
        code,
        pack_label,
        heures_total:     parseInt(String(pack_heures)),
        heures_restantes: parseInt(String(pack_heures)),
        montant:          parseFloat(String(pack_montant)),
        acheteur_nom:     reservation.student_name,
        acheteur_email:   reservation.student_email,
        status:           'active',
        expires_at:       expiresAt.toISOString(),
      })

      // Email pack à l'élève
      await resend.emails.send({
        from: FROM, to: reservation.student_email,
        subject: `Votre ${pack_label} Lieu Secret - Code : ${code}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#252540);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">
<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>
<div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ECOLE DE PIANO EN LIGNE</div>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Votre pack de cours est active !</h2>
<p style="color:#a0a0c0;font-size:14px;margin:0 0 24px;">Bonjour ${reservation.student_name},</p>
<p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Votre paiement a ete recu. Votre <strong style="color:#f59e0b;">${pack_label}</strong> est maintenant actif.</p>
<div style="background:#1a1a2e;border:2px solid #f59e0b;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
  <p style="margin:0 0 8px;color:#a0a0c0;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Code de votre pack</p>
  <div style="font-size:32px;color:#f59e0b;font-weight:bold;letter-spacing:6px;font-family:monospace;">${code}</div>
  <p style="margin:12px 0 4px;color:#f0f0f0;font-size:18px;font-weight:bold;">${pack_heures} heures de cours</p>
  <p style="margin:0;color:#7070a0;font-size:12px;">Valable jusqu au ${expiresDate}</p>
</div>
<div style="background:#2a2a45;border-radius:8px;padding:16px;margin:20px 0;">
  <p style="margin:0 0 8px;color:#f59e0b;font-size:13px;font-weight:bold;">Comment utiliser votre pack ?</p>
  <ol style="margin:0;padding-left:20px;color:#a0a0c0;font-size:13px;line-height:1.8;">
    <li>Rendez-vous sur <a href="${APP_URL}/reservation" style="color:#f59e0b;">${APP_URL}/reservation</a></li>
    <li>Choisissez un creneau disponible</li>
    <li>Dans la modale, selectionnez Pack de cours et saisissez le code <strong style="color:#f0f0f0;">${code}</strong></li>
    <li>1 heure sera debitee a chaque reservation</li>
  </ol>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
  <td width="48%" style="text-align:center;padding-right:8px;">
    <a href="${APP_URL}/mon-pack" style="display:block;background:#f59e0b;color:#1a1a2e;font-size:14px;font-weight:bold;padding:14px 20px;border-radius:8px;text-decoration:none;">Consulter mes heures</a>
  </td>
  <td width="4%"></td>
  <td width="48%" style="text-align:center;padding-left:8px;">
    <a href="${APP_URL}/reservation" style="display:block;background:transparent;color:#f59e0b;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:8px;text-decoration:none;border:2px solid #f59e0b;">Reserver un cours</a>
  </td>
</tr>
</table>
<div style="background:#2a2a45;border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:14px;margin-top:16px;">
  <p style="margin:0;color:#a0a0c0;font-size:12px;">Si vous ne recevez pas cet email, verifiez votre dossier Spam.</p>
</div>
<p style="color:#7070a0;font-size:13px;margin-top:24px;">A tres bientot,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>
</td></tr></table></td></tr></table></body></html>`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}