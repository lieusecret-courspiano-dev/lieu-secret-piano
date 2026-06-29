import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data } = await supabaseAdmin.from('ressources').select('id, titre, description, type, url, categorie, is_public, created_at, eleve_id, eleves(prenom, nom)').order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('ressources').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Notification à l'élève si ressource spécifique
  if (body.eleve_id) {
    try {
      await supabaseAdmin.from('eleve_notifications').insert({
        eleve_id: body.eleve_id,
        type: 'ressource',
        titre: 'Nouvelle ressource disponible',
        message: `"${body.titre}" a été ajouté à vos ressources.`,
        lien: '/espace-eleve/ressources',
      })
      // Email notification
      const { data: eleve } = await supabaseAdmin.from('eleves').select('email, prenom').eq('id', body.eleve_id).single()
      if (eleve) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY!)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
        await resend.emails.send({
          from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
          to: eleve.email,
          subject: `Nouvelle ressource disponible — ${body.titre}`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;">Nouvelle ressource disponible</h2><p>Bonjour ${eleve.prenom},</p><p>Une nouvelle ressource <strong style="color:#f59e0b;">${body.titre}</strong> a été ajoutée à votre espace élève.</p><div style="text-align:center;margin:20px 0;"><a href="${baseUrl}/espace-eleve/ressources" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mes ressources</a></div></div>`,
        }).catch(console.error)
      }
    } catch {}
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('ressources')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, titre, description, type, url, categorie, is_public, created_at, eleve_id, eleves(prenom, nom)')
    .single()
  if (error) {
    // Si updated_at n'existe pas, réessayer sans
    const { data: data2, error: error2 } = await supabaseAdmin
      .from('ressources')
      .update(fields)
      .eq('id', id)
      .select('id, titre, description, type, url, categorie, is_public, created_at, eleve_id, eleves(prenom, nom)')
      .single()
    if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
    return NextResponse.json(data2)
  }
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('ressources').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
