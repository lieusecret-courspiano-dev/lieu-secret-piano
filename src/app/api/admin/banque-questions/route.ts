import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'

// GET — toutes les questions de la banque
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categorie = searchParams.get('categorie')

  let query = supabaseAdmin
    .from('banque_questions')
    .select('*')
    .order('categorie')
    .order('position')

  if (categorie) query = query.eq('categorie', categorie)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST — créer une question
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { categorie, type, question, options, bonne_reponse, explication, audio_url, image_url, video_url, points, position } = body

  if (!question?.trim()) return NextResponse.json({ error: 'Question requise' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('banque_questions').insert({
    categorie: categorie || 'Fondamentaux',
    type: type || 'qcm',
    question: question.trim(),
    options: Array.isArray(options) ? options.filter((o: string) => o.trim()) : null,
    bonne_reponse: bonne_reponse || null,
    explication: explication || null,
    audio_url: audio_url || null,
    image_url: image_url || null,
    video_url: video_url || null,
    points: points || 1,
    position: position || 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — modifier une question
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('banque_questions')
    .update({
      categorie: updates.categorie,
      type: updates.type,
      question: updates.question?.trim(),
      options: Array.isArray(updates.options) ? updates.options.filter((o: string) => o.trim()) : null,
      bonne_reponse: updates.bonne_reponse || null,
      explication: updates.explication || null,
      audio_url: updates.audio_url || null,
      image_url: updates.image_url || null,
      video_url: updates.video_url || null,
      points: updates.points || 1,
      position: updates.position || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — supprimer une question
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabaseAdmin.from('banque_questions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}