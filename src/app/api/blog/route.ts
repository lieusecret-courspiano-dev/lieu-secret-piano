import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const categorie = req.nextUrl.searchParams.get('categorie')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  try {
    if (slug) {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('slug', slug)
        .eq('est_publie', true)
        .single()
      if (error || !data) return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
      return NextResponse.json(data)
    }

    let query = supabase
      .from('blog_articles')
      .select('id, titre, slug, extrait, categorie, image_url, created_at, temps_lecture, est_publie')
      .eq('est_publie', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (categorie && categorie !== 'Tous') {
      query = query.eq('categorie', categorie)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Blog GET error:', err)
    return NextResponse.json([], { status: 200 })
  }
}