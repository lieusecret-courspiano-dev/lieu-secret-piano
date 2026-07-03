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

  // Charger les questions propres à l'examen
  const { data: questions, error } = await supabaseAdmin
    .from('examen_questions')
    .select('id, type, question, options, bonne_reponse, explication, audio_url, image_url, video_url, points, position')
    .eq('examen_id', examen_id)
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ne pas exposer bonne_reponse au frontend pendant l'examen
  const sanitized = (questions || []).map(({ bonne_reponse, ...q }) => q)

  return NextResponse.json(sanitized)
}