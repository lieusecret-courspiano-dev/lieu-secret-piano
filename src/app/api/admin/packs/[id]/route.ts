import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

function generatePackCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PK-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  code += '-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}


// Appliquer les crédits de parrainage en attente pour un email donné
async function applyPendingParrainageCredits(packId: string, email: string) {
  try {
    const { data: credits } = await supabaseAdmin
      .from('parrainage_credits')
      .select('*')
      .eq('parrain_email', email.toLowerCase())
      .eq('status', 'pending')
    
    if (!credits || credits.length === 0) return
    
    const totalHeures = credits.reduce((s: number, c: {heures: number}) => s + c.heures, 0)
    
    // Récupérer le pack actuel
    const { data: pack } = await supabaseAdmin
      .from('course_packs')
      .select('heures_restantes')
      .eq('id', packId)
      .single()
    
    if (!pack) return
    
    // Créditer les heures
    await supabaseAdmin.from('course_packs').update({
      heures_restantes: pack.heures_restantes + totalHeures
    }).eq('id', packId)
    
    // Enregistrer dans l'historique
    for (const credit of credits) {
      await supabaseAdmin.from('pack_history').insert({
        pack_id: packId, type: 'parrainage', delta: credit.heures,
        note: `${credit.raison} (crédit appliqué à l'activation du pack)`
      })
      // Marquer le crédit comme appliqué
      await supabaseAdmin.from('parrainage_credits').update({
        status: 'applied', pack_id: packId, applied_at: new Date().toISOString()
      }).eq('id', credit.id)
    }
    
    console.log(`[parrainage] ${totalHeures}h de crédits en attente appliqués au pack ${packId} pour ${email}`)
  } catch (err) { console.error('Erreur application crédits parrainage:', err) }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  // Extraire les champs spéciaux qui ne vont PAS dans Supabase
  const { confirm_virement, ajustement, commentaire, ...updateFields } = body

  // ── Confirmation paiement virement : génère PK + active + email ──
  if (confirm_virement) {
    const { data: currentPack } = await supabaseAdmin
      .from('course_packs').select('*').eq('id', params.id).single()

    if (!currentPack) return NextResponse.json({ error: 'Pack introuvable' }, { status: 404 })

    // Générer code PK unique
    let packCode = generatePackCode()
    for (let i = 0; i < 5; i++) {
      const { data: ex } = await supabaseAdmin.from('course_packs').select('id').eq('code', packCode).single()
      if (!ex) break
      packCode = generatePackCode()
    }

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const { data: pack, error } = await supabaseAdmin
      .from('course_packs')
      .update({ code: packCode, status: 'active', expires_at: expiresAt.toISOString(), payment_method: 'virement', date_paiement: new Date().toISOString().split('T')[0] })
      .eq('id', params.id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Enregistrer dans l'historique
    try {
      await supabaseAdmin.from('pack_history').insert({
        pack_id: params.id, type: 'achat', delta: currentPack.heures_total,
        note: `Achat ${currentPack.pack_label} — virement confirmé`,
        commentaire: "Paiement virement confirmé par l'administrateur",
      })
    } catch {}

    // Email client avec code PK
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      const expireDate = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: currentPack.acheteur_email,
        subject: `Votre ${currentPack.pack_label} est activé — Code : ${packCode}`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;text-align:center;">Votre pack est activé !</h2>
          <p>Bonjour ${currentPack.acheteur_nom},</p>
          <p>Votre paiement a été reçu. Votre <strong style="color:#f59e0b;">${currentPack.pack_label}</strong> est maintenant actif.</p>
          <div style="background:#f59e0b20;border:2px solid #f59e0b;border-radius:16px;padding:24px;text-align:center;margin:20px 0;">
            <p style="color:#a0a0c0;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Votre code pack</p>
            <p style="font-family:monospace;font-size:32px;font-weight:900;color:#f59e0b;letter-spacing:6px;margin:0;">${packCode}</p>
            <p style="color:#a0a0c0;font-size:12px;margin:8px 0 0;">${currentPack.heures_total} heures — Valable jusqu'au ${expireDate}</p>
          </div>
          <div style="background:#1a1a2e;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#f59e0b;font-size:13px;font-weight:bold;margin:0 0 8px;">Comment utiliser votre pack ?</p>
            <ol style="color:#d0d0e8;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
              <li>Rendez-vous sur <a href="${baseUrl}/reservation" style="color:#f59e0b;">${baseUrl}/reservation</a></li>
              <li>Choisissez votre créneau</li>
              <li>Sélectionnez "Déjà payé" et saisissez le code <strong style="color:#f59e0b;">${packCode}</strong></li>
            </ol>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <a href="${baseUrl}/mon-pack" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Consulter mes heures</a>
          </div>
          <p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas cet email.</p>
        </div>`,
      })
    } catch (emailErr) { console.error('Email pack confirm error:', emailErr) }

    // Appliquer les crédits de parrainage en attente
    await applyPendingParrainageCredits(params.id, currentPack.acheteur_email)
    
    return NextResponse.json({ ...pack, pack_code: packCode })
  }

  // ── Mise à jour standard (sans confirm_virement) ──
  const { data: pack, error } = await supabaseAdmin
    .from('course_packs').update(updateFields).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enregistrer ajustement dans l'historique
  if (ajustement !== undefined && ajustement !== 0) {
    try {
      await supabaseAdmin.from('pack_history').insert({
        pack_id: params.id, type: 'ajustement', delta: ajustement,
        note: commentaire || (ajustement > 0 ? `+${ajustement}h ajoutée(s) par l'administrateur` : `${ajustement}h retirée(s) par l'administrateur`),
        commentaire: commentaire || null,
      })
    } catch {}
  }

  return NextResponse.json(pack)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { error } = await supabaseAdmin.from('course_packs').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
