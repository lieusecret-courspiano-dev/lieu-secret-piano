export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — liste tous les articles
export async function GET() {
  const err = await checkAdmin()
  if (err) return err

  const { data, error } = await supabaseAdmin
    .from('location_articles')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — créer un article
export async function POST(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()

  // Vérifier que le slug est unique
  const { data: existing } = await supabaseAdmin
    .from('location_articles')
    .select('id')
    .eq('slug', body.slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Ce slug est déjà utilisé. Veuillez en choisir un autre.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('location_articles')
    .insert({
      nom: body.nom,
      slug: body.slug,
      description: body.description || null,
      description_courte: body.description_courte || null,
      photos: body.photos || [],
      numero_serie: body.numero_serie || null,
      valeur_declaree: body.valeur_declaree || null,
      prix_jour: body.prix_jour || null,
      prix_weekend: body.prix_weekend || null,
      prix_semaine: body.prix_semaine || null,
      prix_mois: body.prix_mois || null,
      caution: body.caution || 0,
      accessoires_inclus: body.accessoires_inclus || null,
      disponible: body.disponible ?? true,
      stock: body.stock || 1,
      categorie: body.categorie || 'instrument',
      position: body.position || 0,
      publie: body.publie ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — modifier un article
export async function PATCH(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Si le slug change, vérifier l'unicité
  if (updates.slug) {
    const { data: existing } = await supabaseAdmin
      .from('location_articles')
      .select('id')
      .eq('slug', updates.slug)
      .neq('id', id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ce slug est déjà utilisé.' }, { status: 400 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('location_articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Invalider le cache Next.js
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/location')
    revalidatePath('/location/[slug]', 'page')
  } catch {}

  return NextResponse.json(data)
}

// DELETE — supprimer un article
export async function DELETE(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Vérifier qu'il n'y a pas de réservations actives
  const { data: reservations } = await supabaseAdmin
    .from('location_reservations')
    .select('id')
    .eq('article_id', id)
    .in('statut', ['en_attente', 'validee', 'en_cours'])

  if (reservations && reservations.length > 0) {
    return NextResponse.json({
      error: 'Impossible de supprimer cet article : il a des réservations actives en cours.',
    }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('location_articles')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Invalider le cache Next.js pour la page publique
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/location')
    revalidatePath('/location/[slug]', 'page')
  } catch {}

  return NextResponse.json({ success: true })
}