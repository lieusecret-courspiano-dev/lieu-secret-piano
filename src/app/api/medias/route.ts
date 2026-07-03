import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  // Si admin=true dans les params, retourner TOUS les médias (y compris inactifs)
  const { searchParams } = new URL(req.url)
  const isAdminRequest = searchParams.get('admin') === 'true'

  if (isAdminRequest) {
    const isAdmin = await validateAdminSession()
    if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { data, error } = await supabaseAdmin
      .from('medias')
      .select('*')
      .order('position', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Public : seulement les actifs
  const { data, error } = await supabase
    .from('medias')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { type, titre, description, url, auteur, position } = body

  if (!url) return NextResponse.json({ error: 'URL requise' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('medias')
    .insert({ type: type || 'photo', titre, description, url, auteur, position: position || 0, is_active: true })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}