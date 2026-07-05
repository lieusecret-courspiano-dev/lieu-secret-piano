import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

// GET — examens de l'élève connecté
export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  // 1. Examens auxquels l'élève est actuellement autorisé
  const { data: autorisations } = await supabaseAdmin
    .from('examen_eleves')
    .select('examen_id, tentatives, examen:examens(*)')
    .eq('eleve_id', eleve.id)

  // 2. Examens que l'élève a déjà passés (même s'il a été retiré de la liste)
  const { data: sessionsPassees } = await supabaseAdmin
    .from('examen_sessions')
    .select('examen_id, examen:examens(*)')
    .eq('eleve_id', eleve.id)
    .not('submitted_at', 'is', null)

  // Fusionner les deux listes sans doublons
  const examenIds = new Set<string>()
  const examensMap: Record<string, any> = {}

  // Ajouter les autorisations actuelles
  for (const a of (autorisations || [])) {
    if (a.examen_id && !examenIds.has(a.examen_id)) {
      examenIds.add(a.examen_id)
      examensMap[a.examen_id] = { examen: a.examen, tentatives: a.tentatives }
    }
  }

  // Ajouter les examens passés non encore dans la liste
  for (const s of (sessionsPassees || [])) {
    if (s.examen_id && !examenIds.has(s.examen_id) && s.examen) {
      examenIds.add(s.examen_id)
      examensMap[s.examen_id] = { examen: s.examen, tentatives: 0 }
    }
  }

  // Pour chaque examen, récupérer les sessions
  const result = await Promise.all(Array.from(examenIds).map(async (examen_id) => {
    const { examen, tentatives } = examensMap[examen_id]
    const { data: sessions } = await supabaseAdmin
      .from('examen_sessions')
      .select('id, score, reussi, niveau_medaille, submitted_at, started_at, tentative_num, eleve_id')
      .eq('examen_id', examen_id)
      .eq('eleve_id', eleve.id)
      .order('created_at', { ascending: false })

    return {
      ...examen,
      tentatives_utilisees: tentatives,
      sessions: sessions || [],
      derniere_session: sessions?.[0] || null,
    }
  }))

  return NextResponse.json(result)
}
