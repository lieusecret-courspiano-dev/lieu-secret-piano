import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { quiz_id, type, question, options, bonne_reponse, explication, audio_url, image_url, points, position } = body

  if (!quiz_id || !question?.trim()) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('quiz_questions').insert({
    quiz_id, type: type || 'qcm', question,
    options: options || null, bonne_reponse: bonne_reponse || null,
    explication: explication || null, audio_url: audio_url || null,
    image_url: image_url || null, points: points || 1, position: position || 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, ...fields } = await req.json()
  const { data, error } = await supabaseAdmin.from('quiz_questions').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json()
  await supabaseAdmin.from('quiz_questions').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
