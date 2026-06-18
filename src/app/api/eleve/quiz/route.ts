import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET — quiz publiés + résultats de l'élève
export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    // Détail d'un quiz avec questions (sans les bonnes réponses)
    const { data: quiz } = await supabaseAdmin.from('quiz').select('*').eq('id', id).single()
    if (!quiz) return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })

    const { data: questions } = await supabaseAdmin.from('quiz_questions')
      .select('id, type, question, options, audio_url, image_url, points, position')
      .eq('quiz_id', id).order('position')

    // Résultats précédents
    const { data: resultats } = await supabaseAdmin.from('quiz_resultats')
      .select('*').eq('quiz_id', id).eq('eleve_id', eleve.id).order('created_at', { ascending: false })

    return NextResponse.json({ ...quiz, questions: questions || [], resultats: resultats || [] })
  }

  // Liste des quiz publiés avec résultats
  // Ordre par niveau : fondamentaux → comprehension → expression
  const { data: allQuiz } = await supabaseAdmin.from('quiz').select('*, quiz_questions(count)').order('created_at', { ascending: true })
  const niveauOrder: Record<string, number> = { fondamentaux: 0, comprehension: 1, expression: 2 }
  const quiz = (allQuiz || []).sort((a, b) => (niveauOrder[a.niveau] ?? 9) - (niveauOrder[b.niveau] ?? 9))
  const { data: resultats } = await supabaseAdmin.from('quiz_resultats').select('quiz_id, score, reussi, created_at').eq('eleve_id', eleve.id)

  const quizAvecResultats = (quiz || []).map(q => ({
    ...q,
    meilleur_score: (resultats || []).filter(r => r.quiz_id === q.id).reduce((max, r) => Math.max(max, r.score), 0),
    reussi: (resultats || []).some(r => r.quiz_id === q.id && r.reussi),
    nb_tentatives: (resultats || []).filter(r => r.quiz_id === q.id).length,
  }))

  return NextResponse.json(quizAvecResultats)
}

// POST — soumettre les réponses d'un quiz
export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { quiz_id, reponses } = await req.json()
  if (!quiz_id || !reponses) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  // Récupérer le quiz et ses questions avec les bonnes réponses
  const { data: quiz } = await supabaseAdmin.from('quiz').select('*').eq('id', quiz_id).single()
  if (!quiz) return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })

  const { data: questions } = await supabaseAdmin.from('quiz_questions').select('*').eq('quiz_id', quiz_id)

  // Calculer le score
  let points_obtenus = 0
  let points_total = 0
  const corrections: Record<string, { correct: boolean; bonne_reponse: string; explication: string | null }> = {}

  for (const q of (questions || [])) {
    points_total += q.points || 1
    const reponse_eleve = reponses[q.id]
    const correct = reponse_eleve?.toString().toLowerCase().trim() === q.bonne_reponse?.toString().toLowerCase().trim()
    if (correct) points_obtenus += q.points || 1
    corrections[q.id] = { correct, bonne_reponse: q.bonne_reponse || '', explication: q.explication }
  }

  const score = points_total > 0 ? Math.round((points_obtenus / points_total) * 100) : 0
  const reussi = score >= (quiz.score_min || 70)

  // Compter les tentatives
  const { count } = await supabaseAdmin.from('quiz_resultats').select('*', { count: 'exact', head: true }).eq('quiz_id', quiz_id).eq('eleve_id', eleve.id)

  // Sauvegarder le résultat
  const { data: resultat } = await supabaseAdmin.from('quiz_resultats').insert({
    quiz_id, eleve_id: eleve.id, score, reponses, reussi, tentative: (count || 0) + 1,
  }).select().single()

  // Si réussi, valider la compétence liée (si existe)
  if (reussi && quiz.competence_id) {
    try {
      const { data: comp } = await supabaseAdmin.from('competences').select('nom, categorie').eq('id', quiz.competence_id).single()
      if (comp) {
        const { data: existing } = await supabaseAdmin.from('eleve_progression').select('id').eq('eleve_id', eleve.id).eq('competence', comp.nom).single()
        if (!existing) {
          await supabaseAdmin.from('eleve_progression').insert({ eleve_id: eleve.id, competence: comp.nom, categorie: comp.categorie, validee: true, validee_at: new Date().toISOString() })
        }
      }
    } catch {}
  }

  // Notification si réussi
  if (reussi) {
    try {
      await supabaseAdmin.from('eleve_notifications').insert({
        eleve_id: eleve.id, type: 'badge',
        titre: `Quiz réussi : ${quiz.titre}`,
        message: `Félicitations ! Vous avez obtenu ${score}% (minimum requis : ${quiz.score_min}%).`,
        lien: '/espace-eleve/quiz',
      })
    } catch {}
  }

  return NextResponse.json({ score, reussi, corrections, resultat_id: resultat?.id })
}