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
    // Récupérer les filleuls en attente depuis plus de 24h
    const cutoff48h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: pendingFilleuls } = await supabaseAdmin
      .from('parrainage_filleuls')
      .select('*, parrainage:parrainages(*)')
      .eq('status', 'pending')
      .lte('created_at', cutoff48h)

    if (!pendingFilleuls || pendingFilleuls.length === 0) {
      return NextResponse.json({ validated: 0, message: 'Aucun parrainage en attente' })
    }

    let validated = 0
    for (const filleul of pendingFilleuls) {
      // PROTECTION 2: Vérifier que le filleul a fait au moins 1 réservation confirmée
      const { count: nbResa } = await supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('student_email', filleul.filleul_email.toLowerCase())
        .eq('status', 'confirmed')

      if (!nbResa || nbResa < 1) {
        console.log(`[parrainage] Filleul ${filleul.filleul_email} pas encore de réservation — skip`)
        continue
      }

      // Valider le parrainage
      await supabaseAdmin.from('parrainage_filleuls').update({ status: 'validated', validated_at: new Date().toISOString() }).eq('id', filleul.id)

      // Mettre à jour les heures offertes du parrain
      const parrainage = filleul.parrainage as { id: string; parrain_email: string; parrain_nom: string; parrain_id: string | null; heures_offertes: number; code: string }
      await supabaseAdmin.from('parrainages').update({ heures_offertes: (parrainage.heures_offertes || 0) + 1 }).eq('id', parrainage.id)

      // Créditer l'heure au parrain
      let pack = null
      if (parrainage.parrain_id) {
        const { data } = await supabaseAdmin.from('course_packs').select('id, heures_restantes, heures_total, status').eq('eleve_id', parrainage.parrain_id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single()
        pack = data
      }
      if (!pack) {
        const { data } = await supabaseAdmin.from('course_packs').select('id, heures_restantes, heures_total, status').eq('acheteur_email', parrainage.parrain_email.toLowerCase()).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single()
        pack = data
      }

      if (pack) {
        await supabaseAdmin.from('course_packs').update({ heures_restantes: pack.heures_restantes + 1 }).eq('id', pack.id)
        await supabaseAdmin.from('pack_history').insert({ pack_id: pack.id, type: 'parrainage', delta: 1, note: `Heure offerte — parrainage validé de ${filleul.filleul_nom || filleul.filleul_email}` })
      } else {
        // Stocker en crédit en attente
        await supabaseAdmin.from('parrainage_credits').insert({
          parrain_email: parrainage.parrain_email.toLowerCase(),
          parrain_id: parrainage.parrain_id || null,
          heures: 1,
          raison: `Parrainage validé de ${filleul.filleul_nom || filleul.filleul_email}`,
          status: 'pending',
        })
      }

      // Email au parrain : heure créditée !
      try {
        await resend.emails.send({ from: FROM, to: parrainage.parrain_email,
          subject: `Parrainage validé — 1 heure créditée sur votre pack !`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;text-align:center;">Parrainage validé !</h2>
            <p>Bonjour ${parrainage.parrain_nom},</p>
            <p><strong>${filleul.filleul_nom || filleul.filleul_email}</strong> a réservé son premier cours — votre parrainage est officiellement validé !</p>
            <div style="background:rgba(245,158,11,0.1);border:2px solid #f59e0b;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
              <p style="color:#f59e0b;font-size:22px;font-weight:bold;margin:0;">+1 heure créditée sur votre pack !</p>
            </div>
            <div style="text-align:center;margin:20px 0;">
              <a href="${APP_URL}/espace-eleve/parrainage" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mes parrainages</a>
            </div>
            <p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas nos emails.</p>
          </div>` })
      } catch {}

      validated++
      console.log(`[parrainage] Validé: ${filleul.filleul_email} → parrain ${parrainage.parrain_email} +1h`)
    }

    return NextResponse.json({ success: true, validated, total_pending: pendingFilleuls.length })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
