import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — questions d'un examen (pour l'édition admin)
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const examen_id = req.nextUrl.searchParams.get('examen_id')
  if (!examen_id) return NextResponse.json({ error: 'examen_id requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('examen_questions')
    .select('*')
    .eq('examen_id', examen_id)
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// PUT — remplacer toutes les questions d'un examen
export async function PUT(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { examen_id, questions } = await req.json()
  if (!examen_id) return NextResponse.json({ error: 'examen_id requis' }, { status: 400 })

  // Supprimer les anciennes questions
  await supabaseAdmin.from('examen_questions').delete().eq('examen_id', examen_id)

  // Insérer les nouvelles
  if (Array.isArray(questions) && questions.length > 0) {
    const { error } = await supabaseAdmin.from('examen_questions').insert(
      questions.map((q: any, i: number) => ({
        examen_id, type: q.type || 'qcm', question: q.question,
        options: q.options?.filter((o: string) => o?.trim()) || null,
        bonne_reponse: q.bonne_reponse || null, explication: q.explication || null,
        audio_url: q.audio_url || null, image_url: q.image_url || null, video_url: q.video_url || null,
        points: q.points || 1, position: i,
      }))
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
