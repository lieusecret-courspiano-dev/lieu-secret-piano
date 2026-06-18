import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

const QUIZ_BADGES: Record<string, { nom: string; description: string; icone: string }> = {
  fondamentaux: { nom: 'Fondamentaux maîtrisés', description: 'Vous avez réussi un quiz de niveau Fondamentaux', icone: '🎹' },
  comprehension: { nom: 'Compréhension musicale', description: 'Vous avez réussi un quiz de niveau Compréhension', icone: '🎵' },
  expression: { nom: 'Expression avancée', description: 'Vous avez réussi un quiz de niveau Expression', icone: '🏆' },
}

function normalize(s: string): string {
  return s.toString().toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const { data: quiz, error: quizError } = await supabaseAdmin.from('quiz').select('*').eq('id', id).single()
    if (quizError || !quiz) return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })

    const { data: questions, error: qError } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, type, question, options, audio_url, image_url, video_url, points, position')
      .eq('quiz_id', id)
      .order('position')

    if (qError) console.error('[quiz GET] questions error:', qError.message)

    const { data: resultats } = await supabaseAdmin
      .from('quiz_resultats')
      .select('*')
      .eq('quiz_id', id)
      .eq('eleve_id', eleve.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ ...quiz, questions: questions || [], resultats: resultats || [] })
  }

  const { data: allQuiz } = await supabaseAdmin
    .from('quiz')
    .select('*, quiz_questions(count)')
    .order('created_at', { ascending: true })

  const niveauOrder: Record<string, number> = { fondamentaux: 0, comprehension: 1, expression: 2 }
  const quiz = (allQuiz || []).sort((a, b) => (niveauOrder[a.niveau] ?? 9) - (niveauOrder[b.niveau] ?? 9))

  const { data: resultats } = await supabaseAdmin
    .from('quiz_resultats')
    .select('quiz_id, score, reussi, created_at')
    .eq('eleve_id', eleve.id)

  return NextResponse.json(quiz.map(q => ({
    ...q,
    meilleur_score: (resultats || []).filter(r => r.quiz_id === q.id).reduce((max, r) => Math.max(max, r.score), 0),
    reussi: (resultats || []).some(r => r.quiz_id === q.id && r.reussi),
    nb_tentatives: (resultats || []).filter(r => r.quiz_id === q.id).length,
  })))
}

export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { quiz_id, reponses } = await req.json()
  if (!quiz_id || !reponses) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const { data: quiz, error: quizError } = await supabaseAdmin.from('quiz').select('*').eq('id', quiz_id).single()
  if (quizError || !quiz) return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })

  const { data: questions, error: qError } = await supabaseAdmin
    .from('quiz_questions').select('*').eq('quiz_id', quiz_id)

  if (qError) return NextResponse.json({ error: 'Erreur questions: ' + qError.message }, { status: 500 })
  if (!questions || questions.length === 0) return NextResponse.json({ error: 'Aucune question' }, { status: 400 })

  // ── Calcul du score ──────────────────────────────────────────
  let points_obtenus = 0
  let points_total = 0
  const corrections: Record<string, { correct: boolean; bonne_reponse: string; explication: string | null; question: string }> = {}

  for (const q of questions) {
    const pts = Number(q.points) || 1
    points_total += pts

    const rep = normalize(reponses[q.id] || '')
    const bon = normalize(q.bonne_reponse || '')

    const correct = rep !== '' && (rep === bon || bon.includes(rep) || rep.includes(bon))
    if (correct) points_obtenus += pts

    corrections[q.id] = {
      correct,
      bonne_reponse: q.bonne_reponse || '',
      explication: q.explication,
      question: q.question,
    }
  }

  const score = points_total > 0 ? Math.round((points_obtenus / points_total) * 100) : 0
  const reussi = score >= (quiz.score_min || 70)

  console.log(`[quiz score] quiz="${quiz.titre}" pts=${points_obtenus}/${points_total} score=${score}% reussi=${reussi}`)

  // ── Sauvegarder le résultat ──────────────────────────────────
  const { count } = await supabaseAdmin
    .from('quiz_resultats')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', quiz_id)
    .eq('eleve_id', eleve.id)

  

  // ── Badge + notification si réussi ──────────────────────────
  let badge = null
  if (reussi) {
    const badgeInfo = QUIZ_BADGES[quiz.niveau]
    if (badgeInfo) {
      badge = badgeInfo
      try {
        const { data: existingBadge } = await supabaseAdmin
          .from('eleve_badges').select('id').eq('eleve_id', eleve.id).eq('nom', badgeInfo.nom).single()
        if (!existingBadge) {
          await supabaseAdmin.from('eleve_badges').insert({
            eleve_id: eleve.id, nom: badgeInfo.nom, description: badgeInfo.description,
            icone: badgeInfo.icone, categorie: 'quiz', obtenu_le: new Date().toISOString(),
          })
        }
      } catch {}
    }

    try {
      await supabaseAdmin.from('eleve_notifications').insert({
        eleve_id: eleve.id, type: 'badge',
        titre: `Quiz réussi : ${quiz.titre}`,
        message: `Félicitations ! Vous avez obtenu ${score}% (minimum requis : ${quiz.score_min}%).${badgeInfo ? ` Badge : ${badgeInfo.icone} ${badgeInfo.nom}` : ''}`,
        lien: '/espace-eleve/quiz',
      })
    } catch {}

    if (quiz.competence_id) {
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
  }

  return NextResponse.json({ score, reussi, corrections, badge })
}