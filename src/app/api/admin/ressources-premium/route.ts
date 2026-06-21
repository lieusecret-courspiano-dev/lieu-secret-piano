import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const achats = req.nextUrl.searchParams.get('achats')

  if (achats === '1') {
    const { data } = await supabaseAdmin
      .from('ressources_premium_achats')
      .select('*, ressources_premium(titre)')
      .order('created_at', { ascending: false })
    return NextResponse.json(data || [])
  }

  const { data, error } = await supabaseAdmin
    .from('ressources_premium')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const {
    titre, description, type, prix, est_gratuit, est_publie, image_url,
    youtube_url, zoom_url, fichier_url, duree_minutes, nb_places,
    date_coaching, niveau, tags, position,
    nb_pages, taille_fichier, qualite_video, format_audio,
    apercu_duree, apercu_pages, apercu_url,
  } = body

  if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('ressources_premium')
    .insert({
      titre,
      description: description || '',
      type: type || 'video_youtube',
      prix: parseFloat(prix) || 0,
      est_gratuit: est_gratuit || false,
      est_publie: est_publie || false,
      image_url: image_url || null,
      youtube_url: youtube_url || null,
      zoom_url: zoom_url || null,
      fichier_url: fichier_url || null,
      duree_minutes: duree_minutes ? parseInt(String(duree_minutes)) : null,
      nb_places: nb_places ? parseInt(String(nb_places)) : null,
      date_coaching: date_coaching || null,
      niveau: niveau || 'tous',
      tags: tags || [],
      position: position || 0,
      nb_pages: nb_pages ? parseInt(String(nb_pages)) : null,
      taille_fichier: taille_fichier || null,
      qualite_video: qualite_video || 'HD',
      format_audio: format_audio || 'MP3',
      apercu_duree: apercu_duree ? parseInt(String(apercu_duree)) : 30,
      apercu_pages: apercu_pages ? parseInt(String(apercu_pages)) : 3,
      apercu_url: apercu_url || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  if (updates.prix !== undefined) updates.prix = parseFloat(updates.prix) || 0
  if (updates.duree_minutes !== undefined) updates.duree_minutes = updates.duree_minutes ? parseInt(String(updates.duree_minutes)) : null
  if (updates.nb_places !== undefined) updates.nb_places = updates.nb_places ? parseInt(String(updates.nb_places)) : null
  if (updates.nb_pages !== undefined) updates.nb_pages = updates.nb_pages ? parseInt(String(updates.nb_pages)) : null
  if (updates.apercu_duree !== undefined) updates.apercu_duree = updates.apercu_duree ? parseInt(String(updates.apercu_duree)) : 30
  if (updates.apercu_pages !== undefined) updates.apercu_pages = updates.apercu_pages ? parseInt(String(updates.apercu_pages)) : 3

  const { data, error } = await supabaseAdmin
    .from('ressources_premium')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  const { error } = await supabaseAdmin.from('ressources_premium').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}