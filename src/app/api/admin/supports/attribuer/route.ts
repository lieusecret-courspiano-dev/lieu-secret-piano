import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// POST — Attribuer manuellement un support à un élève
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Session expirée. Reconnectez-vous.' }, { status: 401 })

  const { support_id, eleve_email, note_admin, montant, payment_method } = await req.json()

  if (!support_id || !eleve_email) {
    return NextResponse.json({ error: 'support_id et eleve_email requis' }, { status: 400 })
  }

  const { data: eleve } = await supabaseAdmin
    .from('eleves')
    .select('id, prenom, nom, email')
    .eq('email', eleve_email.trim().toLowerCase())
    .single()

  if (!eleve) {
    return NextResponse.json({ error: `Aucun élève trouvé avec l'email : ${eleve_email}` }, { status: 404 })
  }

  const { data: existing } = await supabaseAdmin
    .from('supports_achats')
    .select('id, statut')
    .eq('support_id', support_id)
    .eq('eleve_id', eleve.id)
    .eq('statut', 'actif')
    .single()

  if (existing) {
    return NextResponse.json({ error: `${eleve.prenom} ${eleve.nom} a déjà accès à ce support.` }, { status: 409 })
  }

  const { data: support } = await supabaseAdmin
    .from('supports_pedagogiques')
    .select('titre, prix')
    .eq('id', support_id)
    .single()

  const { data: achat, error } = await supabaseAdmin
    .from('supports_achats')
    .insert({
      support_id,
      eleve_id: eleve.id,
      acheteur_email: eleve.email,
      acheteur_nom: `${eleve.prenom} ${eleve.nom}`,
      montant: montant ?? support?.prix ?? 0,
      payment_method: payment_method || 'manuel',
      statut: 'actif',
      attribue_manuellement: true,
      note_admin: note_admin || 'Attribution manuelle par l\'administrateur',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data: settings } = await supabaseAdmin.from('site_settings').select('contact_email, site_title').eq('id', 1).single()
    const siteTitle = settings?.site_title || 'Lieu Secret'
    const fromEmail = settings?.contact_email || 'contact@lieusecret-courspiano.fr'

    await resend.emails.send({
      from: `${siteTitle} <${fromEmail}>`,
      to: eleve.email,
      subject: `Votre support de cours est disponible — ${support?.titre}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:560px;margin:0 auto;border-radius:12px;">
          <h1 style="color:#f59e0b;text-align:center;">LIEU SECRET</h1>
          <h2 style="color:#ffffff;">Bonjour ${eleve.prenom},</h2>
          <p style="color:#d0d0e8;">Votre support <strong style="color:#f59e0b;">${support?.titre}</strong> est disponible dans votre espace élève.</p>
          ${note_admin ? `<p style="color:#a0a0c0;font-style:italic;">${note_admin}</p>` : ''}
          <div style="text-align:center;margin:24px 0;">
            <a href="https://lieusecret-courspiano.fr/espace-eleve/mes-supports"
               style="background:#f59e0b;color:#1a1a2e;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Accéder à mon support
            </a>
          </div>
          <p style="color:#505080;font-size:11px;text-align:center;">© ${new Date().getFullYear()} ${siteTitle}</p>
        </div>
      `,
    })
  } catch (emailErr) {
    console.error('Email non envoyé:', emailErr)
  }

  return NextResponse.json({ success: true, achat, eleve: { prenom: eleve.prenom, nom: eleve.nom, email: eleve.email } })
}

// GET — Liste des attributions
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json([], { status: 200 })

  const { searchParams } = new URL(req.url)
  const support_id = searchParams.get('support_id')

  let query = supabaseAdmin
    .from('supports_achats')
    .select('*, eleves(prenom, nom, email), supports_pedagogiques(titre)')
    .order('created_at', { ascending: false })

  if (support_id) query = query.eq('support_id', support_id)

  const { data } = await query
  return NextResponse.json(data || [])
}

// DELETE — Révoquer l'accès
export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { achat_id } = await req.json()
  await supabaseAdmin.from('supports_achats').delete().eq('id', achat_id)
  return NextResponse.json({ success: true })
}