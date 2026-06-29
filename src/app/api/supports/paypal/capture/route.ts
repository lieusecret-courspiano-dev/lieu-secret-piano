import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { capturePayPalOrder } from '@/lib/paypal'
import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

  try {
    // Capturer le paiement PayPal
    const capture = await capturePayPalOrder(token)
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Paiement non complété' }, { status: 400 })
    }

    // Décoder les données depuis customId
    let data: Record<string, string>
    try {
      const raw = capture.customId
      // Essayer base64 d'abord, puis JSON direct
      try {
        data = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
      } catch {
        data = JSON.parse(raw)
      }
    } catch {
      return NextResponse.json({ error: 'Données de commande invalides' }, { status: 400 })
    }

    if (data.type !== 'support') {
      return NextResponse.json({ error: 'Type de commande invalide' }, { status: 400 })
    }

    const support_id = data.support_id
    const eleve_id = data.eleve_id

    // Vérifier que c'est bien l'élève connecté
    if (eleve_id !== eleve.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Vérifier si déjà activé
    const { data: existing } = await supabaseAdmin
      .from('supports_achats')
      .select('id')
      .eq('support_id', support_id)
      .eq('eleve_id', eleve_id)
      .eq('statut', 'actif')
      .single()

    if (existing) {
      return NextResponse.json({ success: true, already_owned: true })
    }

    // Activer l'accès
    await supabaseAdmin.from('supports_achats').insert({
      support_id,
      eleve_id,
      acheteur_email: eleve.email,
      acheteur_nom: `${eleve.prenom} ${eleve.nom}`,
      montant: capture.amount || 0,
      payment_method: 'paypal',
      statut: 'actif',
    })

    // Récupérer infos support
    const { data: support } = await supabaseAdmin
      .from('supports_pedagogiques')
      .select('titre')
      .eq('id', support_id)
      .single()

    // Email confirmation
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const { data: settings } = await supabaseAdmin.from('site_settings').select('contact_email, site_title').eq('id', 1).single()
      const siteTitle = settings?.site_title || 'Lieu Secret'
      const fromEmail = settings?.contact_email || 'lieusecret-courspiano@outlook.fr'

      await resend.emails.send({
        from: `${siteTitle} <${fromEmail}>`,
        to: eleve.email,
        subject: `Votre support est disponible — ${support?.titre}`,
        html: `
          <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;">Paiement PayPal confirmé !</h2>
            <p>Bonjour ${eleve.prenom},</p>
            <p>Votre accès à <strong style="color:#f59e0b;">${support?.titre}</strong> est maintenant actif.</p>
            <div style="text-align:center;margin:20px 0;">
              <a href="${APP_URL}/espace-eleve/mes-supports" 
                 style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Accéder à mon support
              </a>
            </div>
            <p style="color:#7070a0;font-size:12px;text-align:center;">Pensez à vérifier vos spams.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Email non envoyé:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[PayPal capture support]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur PayPal' }, { status: 500 })
  }
}