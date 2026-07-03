import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

// GET — examens de l'élève connecté
export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  // Récupérer les examens auxquels l'élève est autorisé
  const { data: autorisations } = await supabaseAdmin
    .from('examen_eleves')
    .select('examen_id, tentatives, examen:examens(*)')
    .eq('eleve_id', eleve.id)

  if (!autorisations) return NextResponse.json([])

  // Pour chaque examen, récupérer la dernière session
  const result = await Promise.all(autorisations.map(async (a: any) => {
    const [sessionsRes, questionsRes] = await Promise.all([
      supabaseAdmin.from('examen_sessions')
        .select('id, score, reussi, niveau_medaille, submitted_at, started_at, tentative_num')
        .eq('examen_id', a.examen_id).eq('eleve_id', eleve.id)
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('examen_questions')
        .select('id, type, question, options, audio_url, image_url, video_url, points, position')
        .eq('examen_id', a.examen_id).order('position'),
    ])

    return {
      ...a.examen,
      quiz_id: a.examen?.quiz_id || null,
      tentatives_utilisees: a.tentatives,
      sessions: sessionsRes.data || [],
      derniere_session: sessionsRes.data?.[0] || null,
      questions_propres: questionsRes.data || [],  // questions propres à l'examen
    }
  }))

  return NextResponse.json(result)
}
