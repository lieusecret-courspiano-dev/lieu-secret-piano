import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// POST — confirmer un paiement virement pour un support
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { achat_id } = await req.json()
  if (!achat_id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { data: achat } = await supabaseAdmin
    .from('supports_achats')
    .select('*, eleves(email, prenom, nom), supports_pedagogiques(titre)')
    .eq('id', achat_id).single()

  if (!achat) return NextResponse.json({ error: 'Achat non trouvé' }, { status: 404 })

  await supabaseAdmin.from('supports_achats').update({ statut: 'actif' }).eq('id', achat_id)

  // Notifier l'élève
  try {
    const eleve = achat.eleves as { email: string; prenom: string; nom: string } | null
    const support = achat.supports_pedagogiques as { titre: string } | null
    if (eleve && support) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: eleve.email,
        subject: `Accès activé : ${support.titre} — Lieu Secret`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;">Votre accès est activé !</h2>
          <p>Bonjour ${eleve.prenom},</p>
          <p>Votre paiement a été confirmé. Vous avez maintenant accès à <strong style="color:#f59e0b;">${support.titre}</strong>.</p>
          <div style="text-align:center;margin:20px 0;"><a href="${baseUrl}/espace-eleve/mes-supports" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Accéder à mon support</a></div>
        </div>`,
      }).catch(console.error)

      // Notification dans l'espace élève
      if (achat.eleve_id) {
        await supabaseAdmin.from('eleve_notifications').insert({
          eleve_id: achat.eleve_id, type: 'ressource',
          titre: `Accès activé : ${support.titre}`,
          message: 'Votre paiement a été confirmé. Le support est disponible dans votre espace.',
          lien: '/espace-eleve/mes-supports',
        })
      }
    }
  } catch {}

  return NextResponse.json({ success: true })
}
