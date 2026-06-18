import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — tous les envois (ou d'un élève spécifique)
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eleveId = searchParams.get('eleve_id')

  let query = supabaseAdmin
    .from('eleve_medias_prives')
    .select('*, eleves(id, prenom, nom, email)')
    .order('created_at', { ascending: false })

  if (eleveId) query = query.eq('eleve_id', eleveId)

  const { data } = await query
  return NextResponse.json(data || [])
}

// PATCH — ajouter un commentaire admin + générer URL signée fraîche
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, commentaire_admin, refresh_url } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Avec Cloudinary, les URLs sont permanentes — pas besoin de refresh
  if (refresh_url) {
    const { data: media } = await supabaseAdmin
      .from('eleve_medias_prives').select('url').eq('id', id).single()
    return NextResponse.json({ url: media?.url || null })
  }

  const updateData: Record<string, unknown> = { lu_admin: true }
  if (commentaire_admin !== undefined) {
    updateData.commentaire_admin = commentaire_admin
    updateData.commentaire_at = new Date().toISOString()
    updateData.lu_eleve = false // L'élève doit voir le nouveau commentaire
  }

  const { data, error } = await supabaseAdmin
    .from('eleve_medias_prives')
    .update(updateData)
    .eq('id', id)
    .select('*, eleves(id, prenom, nom, email)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifier l'élève si commentaire ajouté
  if (commentaire_admin && data) {
    const eleve = data.eleves as { id: string; prenom: string; nom: string; email: string } | null
    if (eleve) {
      try {
        await supabaseAdmin.from('eleve_notifications').insert({
          eleve_id: eleve.id,
          type: 'media',
          titre: 'Votre professeur a commenté votre enregistrement',
          message: commentaire_admin.substring(0, 100) + (commentaire_admin.length > 100 ? '...' : ''),
          lien: '/espace-eleve/enregistrements',
        })

        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY!)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
        await resend.emails.send({
          from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
          to: eleve.email,
          subject: `Commentaire de votre professeur — ${data.titre}`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;">Commentaire de votre professeur</h2>
            <p>Bonjour ${eleve.prenom},</p>
            <p>Votre professeur a écouté votre enregistrement <strong style="color:#f59e0b;">${data.titre}</strong> et vous a laissé un commentaire :</p>
            <div style="background:#252540;border-left:3px solid #f59e0b;padding:16px;border-radius:8px;margin:16px 0;">
              <p style="margin:0;white-space:pre-wrap;">${commentaire_admin}</p>
            </div>
            <div style="text-align:center;margin:20px 0;">
              <a href="${baseUrl}/espace-eleve/enregistrements" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mes enregistrements</a>
            </div>
          </div>`,
        }).catch(console.error)
      } catch {}
    }
  }

  return NextResponse.json(data)
}
// DELETE — supprimer un enregistrement (admin)
export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Récupérer le public_id Cloudinary
  const { data: media } = await supabaseAdmin
    .from('eleve_medias_prives').select('storage_path, type').eq('id', id).single()

  if (media?.storage_path) {
    try {
      const { deleteFromCloudinary } = await import('@/lib/cloudinary')
      await deleteFromCloudinary(media.storage_path, 'video')
    } catch (err) { console.error('Cloudinary delete error:', err) }
  }

  await supabaseAdmin.from('eleve_medias_prives').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
