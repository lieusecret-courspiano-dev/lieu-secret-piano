import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET — supports accessibles par l'élève (gratuits + achetés)
export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  // Supports gratuits publiés
  const { data: gratuits } = await supabaseAdmin
    .from('supports_pedagogiques')
    .select('*')
    .eq('est_publie', true)
    .eq('est_gratuit', true)

  // Supports achetés par l'élève
  const { data: achats } = await supabaseAdmin
    .from('supports_achats')
    .select('support_id, statut, supports_pedagogiques(*)')
    .eq('eleve_id', eleve.id)
    .eq('statut', 'actif')

  const supportsAchetes = (achats || []).map(a => a.supports_pedagogiques).filter(Boolean)

  // Fusionner sans doublons
  const tous = [...(gratuits || []), ...supportsAchetes]
  const unique = tous.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)

  // Ajouter la progression de lecture
  const { data: progressions } = await supabaseAdmin
    .from('supports_progression')
    .select('*')
    .eq('eleve_id', eleve.id)

  const avecProgression = unique.map(s => ({
    ...s,
    progression: (progressions || []).find(p => p.support_id === s.id) || null,
  }))

  return NextResponse.json(avecProgression)
}

// POST — acheter/accéder à un support (gratuit ou paiement)
export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { support_id, payment_method } = await req.json()
  if (!support_id) return NextResponse.json({ error: 'Support ID manquant' }, { status: 400 })

  const { data: support } = await supabaseAdmin.from('supports_pedagogiques').select('*').eq('id', support_id).single()
  if (!support) return NextResponse.json({ error: 'Support non trouvé' }, { status: 404 })

  // Vérifier si déjà acheté
  const { data: existing } = await supabaseAdmin.from('supports_achats').select('id').eq('support_id', support_id).eq('eleve_id', eleve.id).single()
  if (existing) return NextResponse.json({ success: true, already_owned: true })

  // Support gratuit → accès immédiat
  if (support.est_gratuit) {
    await supabaseAdmin.from('supports_achats').insert({
      support_id, eleve_id: eleve.id, montant: 0, payment_method: 'gratuit', statut: 'actif',
    })
    return NextResponse.json({ success: true, statut: 'actif' })
  }

  // Support payant par virement → en attente
  if (payment_method === 'virement') {
    await supabaseAdmin.from('supports_achats').insert({
      support_id, eleve_id: eleve.id, montant: support.prix, payment_method: 'virement', statut: 'en_attente',
    })
    // Email avec coordonnées bancaires
    try {
      const { getSiteSettings } = await import('@/lib/settings')
      const settings = await getSiteSettings()
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: eleve.email,
        subject: `Demande d'accès : ${support.titre} — Lieu Secret`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;">Demande reçue !</h2>
          <p>Bonjour ${eleve.prenom},</p>
          <p>Votre demande d'accès à <strong style="color:#f59e0b;">${support.titre}</strong> (${support.prix} €) a bien été enregistrée.</p>
          ${settings.virement_iban ? `<div style="background:#252540;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;">Coordonnées bancaires</p>
            <p style="margin:4px 0;">Bénéficiaire : ${settings.virement_nom || 'Lieu Secret'}</p>
            <p style="margin:4px 0;">IBAN : <strong style="color:#f59e0b;">${settings.virement_iban}</strong></p>
            <p style="margin:4px 0;">Montant : <strong>${support.prix} €</strong></p>
          </div>` : ''}
          <p>Dès réception de votre virement, votre accès sera activé automatiquement.</p>
          <div style="text-align:center;margin:20px 0;"><a href="${baseUrl}/espace-eleve/mes-supports" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Mes supports</a></div>
        </div>`,
      }).catch(console.error)
      // Notifier l'admin
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: settings.contact_email || 'contact@lieusecret-courspiano.fr',
        subject: `Demande d'achat support : ${support.titre} — ${eleve.prenom} ${eleve.nom}`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;">Nouvelle demande d'achat</h2><p>${eleve.prenom} ${eleve.nom} (${eleve.email}) souhaite accéder à <strong>${support.titre}</strong> (${support.prix} €) par virement.</p><p>Confirmez le paiement dans Admin → Supports pédagogiques.</p></div>`,
      }).catch(console.error)
    } catch {}
    return NextResponse.json({ success: true, statut: 'en_attente' })
  }

  return NextResponse.json({ error: 'Méthode de paiement non supportée' }, { status: 400 })
}

// PATCH — mettre à jour la progression de lecture
export async function PATCH(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { support_id, page_actuelle, statut } = await req.json()

  const { data: existing } = await supabaseAdmin.from('supports_progression').select('id').eq('support_id', support_id).eq('eleve_id', eleve.id).single()

  if (existing) {
    await supabaseAdmin.from('supports_progression').update({ page_actuelle, statut, updated_at: new Date().toISOString() }).eq('id', existing.id)
  } else {
    await supabaseAdmin.from('supports_progression').insert({ support_id, eleve_id: eleve.id, page_actuelle, statut })
  }

  return NextResponse.json({ success: true })
}