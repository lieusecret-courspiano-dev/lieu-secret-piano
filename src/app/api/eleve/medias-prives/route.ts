import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET — liste des envois de l'élève
export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('eleve_medias_prives')
    .select('*')
    .eq('eleve_id', eleve.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

// POST — créer un envoi (lien externe ou après upload Storage)
export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const body = await req.json()
  const { titre, description, type, url, storage_path, taille_bytes } = body

  if (!titre?.trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  if (!url && !storage_path) return NextResponse.json({ error: 'URL ou fichier requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('eleve_medias_prives')
    .insert({
      eleve_id: eleve.id,
      titre: titre.trim(),
      description: description?.trim() || null,
      type: type || 'audio',
      url: url || null,
      storage_path: storage_path || null,
      taille_bytes: taille_bytes || null,
      lu_admin: false,
      lu_eleve: true,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifier l'admin
  try {
    const { getSiteSettings } = await import('@/lib/settings')
    const settings = await getSiteSettings()
    const adminEmail = settings.contact_email || 'lieusecret-courspiano@outlook.fr'
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

    await resend.emails.send({
      from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
      to: adminEmail,
      subject: `Nouvel enregistrement de ${eleve.prenom} ${eleve.nom} — ${titre}`,
      html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
        <h2 style="color:#f59e0b;">Nouvel enregistrement reçu</h2>
        <p><strong>${eleve.prenom} ${eleve.nom}</strong> vous a envoyé un ${type === 'video' ? 'vidéo' : type === 'lien' ? 'lien' : 'audio'} :</p>
        <div style="background:#252540;border-left:3px solid #f59e0b;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;">${titre}</p>
          ${description ? `<p style="margin:0;color:#d0d0e8;">${description}</p>` : ''}
        </div>
        <div style="text-align:center;margin:20px 0;">
          <a href="${baseUrl}/admin/eleve-medias" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Écouter et commenter</a>
        </div>
      </div>`,
    }).catch(console.error)
  } catch {}

  // Badge "Première prise" — premier enregistrement envoyé
  try {
    const { count } = await supabaseAdmin
      .from('eleve_medias_prives').select('*', { count: 'exact', head: true }).eq('eleve_id', eleve.id)
    if ((count || 0) === 1) {
      const { attribuerBadge, BADGES } = await import('@/lib/badges')
      await attribuerBadge(eleve.id, BADGES.PREMIER_ENREG)
    }
  } catch {}

  return NextResponse.json(data)
}

// DELETE — supprimer un envoi
export async function DELETE(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Récupérer le public_id Cloudinary pour supprimer le fichier
  const { data: media } = await supabaseAdmin
    .from('eleve_medias_prives').select('storage_path, type').eq('id', id).eq('eleve_id', eleve.id).single()

  if (media?.storage_path) {
    try {
      const { deleteFromCloudinary } = await import('@/lib/cloudinary')
      const resourceType = media.type === 'video' ? 'video' : 'video' // Cloudinary stocke audio comme video
      await deleteFromCloudinary(media.storage_path, resourceType)
    } catch (err) { console.error('Cloudinary delete error:', err) }
  }

  await supabaseAdmin.from('eleve_medias_prives').delete().eq('id', id).eq('eleve_id', eleve.id)
  return NextResponse.json({ success: true })
}
// PATCH — marquer lu_eleve (commentaire vu)
export async function PATCH(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id, lu_eleve } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
  await supabaseAdmin.from('eleve_medias_prives').update({ lu_eleve }).eq('id', id).eq('eleve_id', eleve.id)
  return NextResponse.json({ success: true })
}
