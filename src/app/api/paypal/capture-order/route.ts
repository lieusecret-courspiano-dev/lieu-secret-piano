import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCoursConfirmation, sendAdminNotification } from '@/lib/email'
import { getSiteSettings } from '@/lib/settings'
import { generateCoursICS } from '@/lib/ics'
import { formatDateLocal } from '@/lib/utils'
import { Resend } from 'resend'
import { generateGiftCardPDF } from '@/lib/pdf'

export const dynamic = 'force-dynamic'

const resend  = new Resend(process.env.RESEND_API_KEY!)
const FROM    = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

function genPKCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = 'PK-'
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)]
  c += '-'
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)]
  return c
}

function genGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LS-'
  for (let i = 0; i < 8; i++) { if (i === 4) code += '-'; code += chars[Math.floor(Math.random() * chars.length)] }
  return code
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId requis' }, { status: 400 })

    // Capturer le paiement PayPal
    const capture = await capturePayPalOrder(orderId)
    if (capture.status !== 'COMPLETED') return NextResponse.json({ error: 'Paiement non complété' }, { status: 400 })

    // Décoder les données depuis customId
    let data: Record<string, unknown>
    try {
      data = JSON.parse(Buffer.from(capture.customId, 'base64').toString('utf-8'))
    } catch {
      return NextResponse.json({ error: 'Données de commande invalides' }, { status: 400 })
    }

    const type = data.type as string
    const settings = await getSiteSettings()

    // ── COURS INDIVIDUEL ──
    if (type === 'cours') {
      const { slot_start, slot_end, student_name, student_email, student_phone, student_timezone, message, gift_code, eleve_id } = data as {
        slot_start: string; slot_end: string; student_name: string; student_email: string
        student_phone: string | null; student_timezone: string; message: string | null
        gift_code: string | null; eleve_id: string | null
      }

      // Créer la réservation
      const { data: reservation, error } = await supabaseAdmin.from('reservations').insert({
        slot_start, slot_end, student_name, student_email,
        student_phone: student_phone || null, student_timezone: student_timezone || 'Europe/Paris',
        message: message || null, type: 'cours', status: 'confirmed',
        payment_method: 'paypal', amount: capture.amount,
        gift_code: gift_code || null, eleve_id: eleve_id || null,
      }).select().single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Déduire bon cadeau si présent
      if (gift_code) {
        const { data: card } = await supabaseAdmin.from('gift_cards').select('id, montant_restant').eq('code', gift_code.toUpperCase()).single()
        if (card) {
          const deduction = Math.min(card.montant_restant, parseFloat(settings.tarif_cours_1h || '22'))
          await supabaseAdmin.from('gift_cards').update({ montant_restant: Math.max(0, card.montant_restant - deduction), status: card.montant_restant - deduction <= 0 ? 'used' : 'active' }).eq('id', card.id)
        }
      }

      // Email de confirmation
      try {
        const timezone = student_timezone || 'Europe/Paris'
        const dateLocal = formatDateLocal(slot_start, timezone)
        const zoomLink  = settings.zoom_cours || undefined
        await sendCoursConfirmation({ studentName: student_name, studentEmail: student_email, startISO: slot_start, endISO: slot_end, timezone, zoomLink: zoomLink || null, message: message || null, paymentMethod: 'paypal' })
        await sendAdminNotification({ studentName: student_name, studentEmail: student_email, type: 'Cours individuel (PayPal)', dateLocal, timezone, zoomLink: zoomLink || null, message: message || null, icsContent: null })
      } catch (emailErr) { console.error('Email cours PayPal error:', emailErr) }

      return NextResponse.json({ success: true, type: 'cours', reservation_id: reservation?.id })
    }

    // ── PACK DE COURS ──
    if (type === 'pack') {
      const { pack_label, heures, montant, acheteur_nom, acheteur_email, eleve_id } = data as {
        pack_label: string; heures: number; montant: number; acheteur_nom: string; acheteur_email: string; eleve_id: string | null
      }

      // Générer code PK unique
      let packCode = genPKCode()
      for (let i = 0; i < 5; i++) {
        const { data: ex } = await supabaseAdmin.from('course_packs').select('id').eq('code', packCode).single()
        if (!ex) break
        packCode = genPKCode()
      }

      const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const { data: newPack, error } = await supabaseAdmin.from('course_packs').insert({
        code: packCode, pack_label, heures_total: parseInt(String(heures)),
        heures_restantes: parseInt(String(heures)), heures_utilisees: 0,
        montant: parseFloat(String(montant)), acheteur_nom, acheteur_email,
        eleve_id: eleve_id || null, status: 'active', payment_method: 'paypal',
        expires_at: expiresAt.toISOString(),
      }).select().single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Lier au compte élève par email si pas déjà lié
      if (!eleve_id) {
        const { data: eleve } = await supabaseAdmin.from('eleves').select('id').eq('email', acheteur_email.toLowerCase()).single()
        if (eleve && newPack) await supabaseAdmin.from('course_packs').update({ eleve_id: eleve.id }).eq('id', newPack.id)
      }

      // Historique
      if (newPack) {
        await supabaseAdmin.from('pack_history').insert({ pack_id: newPack.id, type: 'achat', delta: parseInt(String(heures)), note: `Achat ${pack_label} via PayPal` })
        // Appliquer crédits parrainage en attente
        try {
          const { data: credits } = await supabaseAdmin.from('parrainage_credits').select('*').eq('parrain_email', acheteur_email.toLowerCase()).eq('status', 'pending')
          if (credits && credits.length > 0) {
            const totalH = credits.reduce((s: number, c: {heures: number}) => s + c.heures, 0)
            await supabaseAdmin.from('course_packs').update({ heures_restantes: parseInt(String(heures)) + totalH }).eq('id', newPack.id)
            for (const credit of credits) {
              await supabaseAdmin.from('pack_history').insert({ pack_id: newPack.id, type: 'parrainage', delta: credit.heures, note: credit.raison })
              await supabaseAdmin.from('parrainage_credits').update({ status: 'applied', pack_id: newPack.id, applied_at: new Date().toISOString() }).eq('id', credit.id)
            }
          }
        } catch {}
      }

      // Email avec code PK
      try {
        const expireDate = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        await resend.emails.send({
          from: FROM, to: acheteur_email,
          subject: `Votre ${pack_label} est activé — Code : ${packCode}`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;text-align:center;">Votre pack est activé !</h2>
            <p>Bonjour ${acheteur_nom},</p>
            <div style="background:rgba(245,158,11,0.1);border:2px solid #f59e0b;border-radius:16px;padding:24px;text-align:center;margin:20px 0;">
              <p style="color:#a0a0c0;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Votre code pack</p>
              <p style="font-family:monospace;font-size:32px;font-weight:900;color:#f59e0b;letter-spacing:6px;margin:0;">${packCode}</p>
              <p style="color:#a0a0c0;font-size:12px;margin:8px 0 0;">${heures}h — Valable jusqu'au ${expireDate}</p>
            </div>
            <p>Paiement PayPal confirmé. Utilisez ce code lors de vos réservations.</p>
            <div style="text-align:center;margin:20px 0;">
              <a href="${APP_URL}/mon-pack" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Consulter mes heures</a>
            </div>
            <p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas cet email.</p>
          </div>`,
        })
        // Email admin
        await sendAdminNotification({ studentName: acheteur_nom, studentEmail: acheteur_email, type: `Pack ${pack_label} (PayPal) — Code : ${packCode}`, dateLocal: new Date().toLocaleDateString('fr-FR'), timezone: 'Europe/Paris', zoomLink: null, message: null, icsContent: null })
      } catch (emailErr) { console.error('Email pack PayPal error:', emailErr) }

      return NextResponse.json({ success: true, type: 'pack', pack_code: packCode })
    }

    // ── BON CADEAU ──
    if (type === 'cadeau') {
      const { acheteur_nom, acheteur_email, destinataire_nom, message, montant } = data as {
        acheteur_nom: string; acheteur_email: string; destinataire_nom: string; message: string | null; montant: number
      }

      // Générer code LS unique
      let giftCode = genGiftCode()
      for (let i = 0; i < 5; i++) {
        const { data: ex } = await supabaseAdmin.from('gift_cards').select('id').eq('code', giftCode).single()
        if (!ex) break
        giftCode = genGiftCode()
      }

      const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const { data: newCard, error } = await supabaseAdmin.from('gift_cards').insert({
        code: giftCode, montant: parseFloat(String(montant)), montant_restant: parseFloat(String(montant)),
        acheteur_nom, acheteur_email, destinataire_nom, message: message || null,
        status: 'active', payment_method: 'paypal', expires_at: expiresAt.toISOString(),
      }).select().single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Email avec code LS + PDF
      try {
        const expireDate = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        let pdfBuffer: Buffer | null = null
        try { pdfBuffer = await generateGiftCardPDF({ code: giftCode, montant: parseFloat(String(montant)), acheteur_nom, destinataire_nom, message: message || '', expires_at: expiresAt.toISOString() }) } catch {}

        const attachments = pdfBuffer ? [{ filename: `bon-cadeau-${giftCode}.pdf`, content: pdfBuffer.toString('base64') }] : []
        await resend.emails.send({
          from: FROM, to: acheteur_email,
          subject: `Votre bon cadeau Lieu Secret — Code : ${giftCode}`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;text-align:center;">Bon cadeau confirmé !</h2>
            <p>Bonjour ${acheteur_nom},</p>
            <div style="background:rgba(245,158,11,0.1);border:2px solid #f59e0b;border-radius:16px;padding:24px;text-align:center;margin:20px 0;">
              <p style="color:#a0a0c0;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Code bon cadeau</p>
              <p style="font-family:monospace;font-size:28px;font-weight:900;color:#f59e0b;letter-spacing:4px;margin:0;">${giftCode}</p>
              <p style="color:#a0a0c0;font-size:12px;margin:8px 0 0;">${montant} € — Pour ${destinataire_nom} — Valable jusqu'au ${expireDate}</p>
            </div>
            <p>Paiement PayPal confirmé. ${pdfBuffer ? 'Le bon cadeau en PDF est joint à cet email.' : ''}</p>
            <p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas cet email.</p>
          </div>`,
          attachments,
        })
      } catch (emailErr) { console.error('Email cadeau PayPal error:', emailErr) }

      return NextResponse.json({ success: true, type: 'cadeau', gift_code: giftCode, card_id: newCard?.id })
    }

    return NextResponse.json({ error: 'Type non géré' }, { status: 400 })
  } catch (err: unknown) {
    console.error('[PayPal capture-order]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur PayPal' }, { status: 500 })
  }
}
