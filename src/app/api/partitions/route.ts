import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const niveau = searchParams.get('niveau')
  const style  = searchParams.get('style')
  let query = supabaseAdmin.from('mediatheque').select('id, titre, compositeur, niveau, type, style, description, url_pdf, url_video, url_audio, url_image, gratuit, created_at').eq('is_active', true).order('created_at', { ascending: false })
  if (niveau) query = query.eq('niveau', niveau)
  if (style)  query = query.eq('style', style)
  const { data } = await query
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json()
  const { titre, compositeur, niveau, type, style, description, url_pdf, url_video, url_audio, url_image, gratuit } = body
  if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  const hasUrl = url_pdf || url_video || url_audio || url_image
  if (!hasUrl) return NextResponse.json({ error: 'Au moins une URL est requise' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('mediatheque').insert({
    titre, compositeur: compositeur || null, niveau: niveau || 'tous',
    type: type || 'pdf', style: style || 'classique', description: description || null,
    url_pdf: url_pdf || null, url_video: url_video || null,
    url_audio: url_audio || null, url_image: url_image || null,
    gratuit: gratuit !== false, is_active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id, ...updates } = await req.json()
  const { data, error } = await supabaseAdmin.from('mediatheque').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  await supabaseAdmin.from('mediatheque').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
