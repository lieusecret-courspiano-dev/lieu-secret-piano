import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

// GET — questions propres à un examen (examen_questions)
export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const examen_id = searchParams.get('examen_id')
  if (!examen_id) return NextResponse.json({ error: 'examen_id requis' }, { status: 400 })

  // Vérifier que l'élève est autorisé pour cet examen
  const { data: autorisation } = await supabaseAdmin
    .from('examen_eleves')
    .select('id')
    .eq('examen_id', examen_id)
    .eq('eleve_id', eleve.id)
    .single()

  if (!autorisation) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // 1. Charger les questions propres à l'examen
  const { data: examQuestions, error } = await supabaseAdmin
    .from('examen_questions')
    .select('id, type, question, options, bonne_reponse, explication, audio_url, image_url, video_url, points, position')
    .eq('examen_id', examen_id)
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let questions = examQuestions || []

  // Mélanger et limiter à 25 questions (qu'elles viennent de examen_questions ou de la banque)
  if (questions.length > 25) {
    questions = [...questions].sort(() => Math.random() - 0.5).slice(0, 25)
  } else if (questions.length > 0) {
    questions = [...questions].sort(() => Math.random() - 0.5)
  }

  // 2. Si pas de questions propres → tirer aléatoirement depuis la banque
  if (questions.length === 0) {
    // Récupérer la catégorie de l'examen
    const { data: examen } = await supabaseAdmin
      .from('examens')
      .select('categorie, score_min')
      .eq('id', examen_id)
      .single()

    if (examen?.categorie) {
      const { data: banque } = await supabaseAdmin
        .from('banque_questions')
        .select('id, type, question, options, bonne_reponse, explication, audio_url, image_url, video_url, points, position')
        .eq('categorie', examen.categorie)

      if (banque && banque.length > 0) {
        // Mélanger aléatoirement (Fisher-Yates)
        const shuffled = [...banque].sort(() => Math.random() - 0.5)
        // Prendre max 25 questions
        questions = shuffled.slice(0, 25)
      }
    }
  }

  // Ne pas exposer bonne_reponse au frontend pendant l'examen
  const sanitized = questions.map(({ bonne_reponse, ...q }: any) => q)

  return NextResponse.json(sanitized)
}