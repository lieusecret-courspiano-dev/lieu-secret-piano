import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('blog_articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { titre, extrait, contenu, categorie, image_url, temps_lecture, est_publie } = body

  if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })

  const slug = slugify(titre) + '-' + Date.now().toString(36)

  const { data, error } = await supabaseAdmin
    .from('blog_articles')
    .insert({ titre, slug, extrait: extrait || '', contenu: contenu || '', categorie: categorie || 'Conseils', image_url: image_url || null, temps_lecture: temps_lecture || '5 min', est_publie: est_publie ?? false })
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

  const { data, error } = await supabaseAdmin
    .from('blog_articles')
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

  const { error } = await supabaseAdmin.from('blog_articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}