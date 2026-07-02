import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — liste tous les travaux avec leurs élèves assignés
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: travaux } = await supabaseAdmin
    .from('travaux_a_faire')
    .select('*, travaux_eleves(id, eleve_id, termine, termine_at, eleves(prenom, nom, email))')
    .order('created_at', { ascending: false })

  return NextResponse.json(travaux || [])
}

// POST — créer un travail et l'assigner à des élèves
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { titre, description, consignes, ressource_url, echeance, eleve_ids } = await req.json()

  if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })

  // Créer le travail
  const { data: travail, error } = await supabaseAdmin
    .from('travaux_a_faire')
    .insert({ titre, description: description || null, consignes: consignes || null, ressource_url: ressource_url || null, echeance: echeance || null })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Assigner aux élèves
  const ids: string[] = Array.isArray(eleve_ids) ? eleve_ids : []
  if (ids.length > 0) {
    await supabaseAdmin.from('travaux_eleves').insert(
      ids.map(eleve_id => ({ travail_id: travail.id, eleve_id }))
    )

    // Envoyer emails de notification
    try {
      const { data: eleves } = await supabaseAdmin
        .from('eleves').select('email, prenom').in('id', ids)

      if (eleves && eleves.length > 0) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY!)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

        for (const eleve of eleves) {
          await resend.emails.send({
            from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
            to: eleve.email,
            subject: `Nouveau travail à faire — ${titre}`,
            html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
              <h2 style="color:#f59e0b;">Nouveau travail à faire</h2>
              <p>Bonjour ${eleve.prenom},</p>
              <p>Votre professeur vous a assigné un nouveau travail :</p>
              <div style="background:#252540;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
                <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;">${titre}</p>
                ${description ? `<p style="margin:4px 0;color:#d0d0e8;">${description}</p>` : ''}
                ${echeance ? `<p style="margin:8px 0;color:#a0a0c0;">Échéance : <strong style="color:#f59e0b;">${new Date(echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>` : ''}
              </div>
              <div style="text-align:center;margin:20px 0;">
                <a href="${baseUrl}/espace-eleve/travaux" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mon travail</a>
              </div>
              <p style="color:#7070a0;font-size:12px;">Vérifiez votre dossier Spam si vous ne recevez pas nos emails.</p>
            </div>`,
          }).catch(console.error)
        }
      }
    } catch (emailErr) { console.error('Email travail error:', emailErr) }
  }

  return NextResponse.json(travail)
}

// PATCH — modifier un travail
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, eleve_ids, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('travaux_a_faire')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mettre à jour les assignations si fourni
  if (Array.isArray(eleve_ids)) {
    await supabaseAdmin.from('travaux_eleves').delete().eq('travail_id', id)
    if (eleve_ids.length > 0) {
      await supabaseAdmin.from('travaux_eleves').insert(
        eleve_ids.map((eleve_id: string) => ({ travail_id: id, eleve_id }))
      )
    }
  }

  return NextResponse.json(data)
}

// DELETE — supprimer un travail
export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json()
  await supabaseAdmin.from('travaux_a_faire').delete().eq('id', id)
  return NextResponse.json({ success: true })
}