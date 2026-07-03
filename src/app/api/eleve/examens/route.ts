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
    const { data: sessions } = await supabaseAdmin
      .from('examen_sessions')
      .select('id, score, reussi, niveau_medaille, submitted_at, started_at, tentative_num')
      .eq('examen_id', a.examen_id)
      .eq('eleve_id', eleve.id)
      .order('created_at', { ascending: false })

    return {
      ...a.examen,
      tentatives_utilisees: a.tentatives,
      sessions: sessions || [],
      derniere_session: sessions?.[0] || null,
    }
  }))

  return NextResponse.json(result)
}
