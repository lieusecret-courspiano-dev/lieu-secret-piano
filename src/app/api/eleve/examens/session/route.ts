import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

const SYLLABUS_ORDER = ['Fondamentaux', 'Compréhension et autonomie', 'Expression et maîtrise']

const CERT_CONFIG: Record<string, { titre: string; niveau: string; type: string }> = {
  'Fondamentaux': { titre: 'Fondamentaux du piano', niveau: 'Niveau 1 — Fondamentaux', type: 'fondamentaux' },
  'Compréhension et autonomie': { titre: 'Compréhension et autonomie', niveau: 'Niveau 2 — Compréhension et autonomie', type: 'comprehension' },
  'Expression et maîtrise': { titre: 'Expression et maîtrise', niveau: 'Niveau 3 — Expression et maîtrise', type: 'expression' },
}

function getMedaille(score: number): string | null {
  if (score >= 90) return 'or'
  if (score >= 80) return 'argent'
  if (score >= 70) return 'bronze'
  return null
}

// POST — démarrer ou soumettre un examen
export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const body = await req.json()
  const { action, examen_id, reponses } = body

  // ── Démarrer l'examen ──────────────────────────────────────────
  if (action === 'start') {
    // Vérifier que l'élève est autorisé
    const { data: autorisation } = await supabaseAdmin
      .from('examen_eleves')
      .select('tentatives, examen:examens(nb_tentatives, date_examen, duree_minutes, est_actif)')
      .eq('examen_id', examen_id)
      .eq('eleve_id', eleve.id)
      .single()

    if (!autorisation) return NextResponse.json({ error: 'Non autorisé pour cet examen' }, { status: 403 })

    const examen = autorisation.examen as any
    if (!examen?.est_actif) return NextResponse.json({ error: 'Examen non disponible' }, { status: 403 })

    // Vérifier la date
    const now = new Date()
    const dateExamen = new Date(examen.date_examen)
    if (now < dateExamen) return NextResponse.json({ error: "L'examen n'a pas encore commencé" }, { status: 403 })

    // Vérifier les tentatives
    if (autorisation.tentatives >= examen.nb_tentatives) {
      return NextResponse.json({ error: 'Nombre maximum de tentatives atteint' }, { status: 403 })
    }

    // Vérifier qu'il n'y a pas de session en cours
    const { data: sessionEnCours } = await supabaseAdmin
      .from('examen_sessions')
      .select('id, started_at')
      .eq('examen_id', examen_id)
      .eq('eleve_id', eleve.id)
      .is('submitted_at', null)
      .single()

    if (sessionEnCours) {
      return NextResponse.json({ session_id: sessionEnCours.id, started_at: sessionEnCours.started_at, resumed: true })
    }

    // Créer la session
    const tentativeNum = autorisation.tentatives + 1
    const { data: session, error } = await supabaseAdmin.from('examen_sessions').insert({
      examen_id, eleve_id: eleve.id, tentative_num: tentativeNum,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Incrémenter le compteur de tentatives
    await supabaseAdmin.from('examen_eleves')
      .update({ tentatives: tentativeNum })
      .eq('examen_id', examen_id)
      .eq('eleve_id', eleve.id)

    return NextResponse.json({ session_id: session.id, started_at: session.started_at })
  }

  // ── Soumettre l'examen ─────────────────────────────────────────
  if (action === 'submit') {
    const { session_id } = body

    // Récupérer la session
    const { data: session } = await supabaseAdmin
      .from('examen_sessions')
      .select('*, examen:examens(score_min, categorie, quiz_id)')
      .eq('id', session_id)
      .eq('eleve_id', eleve.id)
      .single()

    if (!session) return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    if (session.submitted_at) return NextResponse.json({ error: 'Examen déjà soumis' }, { status: 400 })

    const examen = session.examen as any

    // Calculer le score
    let score = 0
    let reussi = false
    let niveau_medaille: string | null = null

    if (reponses) {
      const { data: examenQuestions } = await supabaseAdmin
        .from('examen_questions')
        .select('id, bonne_reponse, points')
        .eq('examen_id', session.examen_id)
        .order('position')

      let questions: any[] = examenQuestions || []

      if (questions.length === 0 && examen?.quiz_id) {
        const { data: quizQuestions } = await supabaseAdmin
          .from('quiz_questions')
          .select('id, bonne_reponse, points')
          .eq('quiz_id', examen.quiz_id)
          .eq('statut', 'publie')
        questions = quizQuestions || []
      }

      if (questions.length > 0) {
        let totalPoints = 0
        let pointsObtenus = 0
        questions.forEach((q: any) => {
          // Toutes les questions sont corrigées automatiquement
          totalPoints += q.points || 1
          const rep = (reponses[q.id] || '').toString().toLowerCase().trim()
          const bonneRep = (q.bonne_reponse || '').toString().toLowerCase().trim()
          if (!rep || !bonneRep) return
          // Validation flexible : accepte si la réponse contient la bonne réponse ou vice versa
          // (pour les questions audio/image/vidéo avec réponses courtes)
          const isCorrect = rep === bonneRep ||
            (q.type !== 'qcm' && q.type !== 'vrai_faux' && (
              rep.includes(bonneRep) || bonneRep.includes(rep)
            ))
          if (isCorrect) pointsObtenus += q.points || 1
        })
        score = totalPoints > 0 ? Math.round((pointsObtenus / totalPoints) * 100) : 0
      }
    }

    reussi = score >= (examen?.score_min ?? 75)
    niveau_medaille = reussi ? getMedaille(score) : null

    // Mettre à jour la session
    await supabaseAdmin.from('examen_sessions').update({
      submitted_at: new Date().toISOString(),
      reponses: reponses || {},
      score, reussi, niveau_medaille,
    }).eq('id', session_id)

    // Si réussi → valider automatiquement les compétences
    if (reussi && examen?.categorie) {
      const categorie = examen.categorie
      const { data: comps } = await supabaseAdmin
        .from('competences').select('nom').eq('categorie', categorie)

      if (comps && comps.length > 0) {
        for (const comp of comps) {
          const { data: existing } = await supabaseAdmin
            .from('eleve_progression')
            .select('id').eq('eleve_id', eleve.id).eq('competence', comp.nom).eq('categorie', categorie).single()

          if (existing) {
            await supabaseAdmin.from('eleve_progression')
              .update({ validee: true, updated_at: new Date().toISOString() })
              .eq('id', existing.id)
          } else {
            await supabaseAdmin.from('eleve_progression').insert({
              eleve_id: eleve.id, competence: comp.nom, categorie, validee: true,
            })
          }
        }

        // Générer le certificat si toutes les compétences sont validées
        await generateCertifIfNeeded(eleve.id, categorie, niveau_medaille)
      }

      // Notification
      try {
        await supabaseAdmin.from('eleve_notifications').insert({
          eleve_id: eleve.id, type: 'badge',
          titre: `Examen réussi — ${score}%${niveau_medaille ? ` (${niveau_medaille})` : ''}`,
          message: `Félicitations ! Vous avez réussi l'examen "${examen.categorie}" avec ${score}%.`,
          lien: '/espace-eleve/progression',
        })
      } catch {}
    }

    // Construire le détail des corrections
    let corrections: any[] = []
    if (reponses) {
      const { data: qDetails } = await supabaseAdmin
        .from('examen_questions')
        .select('id, type, question, bonne_reponse, explication, points')
        .eq('examen_id', session.examen_id)
        .order('position')
      const qList = (qDetails && qDetails.length > 0) ? qDetails : []
      corrections = qList.map((q: any) => {
        const rep = (reponses[q.id] || '').toString().toLowerCase().trim()
        const bonneRep = (q.bonne_reponse || '').toString().toLowerCase().trim()
        const isCorrect = q.type !== 'reponse_libre' && rep && bonneRep && (
          rep === bonneRep || (q.type !== 'qcm' && q.type !== 'vrai_faux' && (rep.includes(bonneRep) || bonneRep.includes(rep)))
        )
        return {
          question: q.question, type: q.type,
          reponse_eleve: reponses[q.id] || '',
          bonne_reponse: q.bonne_reponse || '',
          explication: q.explication || '',
          correct: isCorrect, points: q.points || 1,
        }
      })
    }
    return NextResponse.json({ score, reussi, niveau_medaille, score_min: examen?.score_min ?? 75, corrections })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}

async function generateCertifIfNeeded(eleveId: string, categorie: string, niveau_medaille: string | null) {
  const certConf = CERT_CONFIG[categorie]
  if (!certConf) return

  const { data: comps } = await supabaseAdmin.from('competences').select('nom').eq('categorie', categorie)
  if (!comps || comps.length === 0) return

  const { data: progs } = await supabaseAdmin.from('eleve_progression')
    .select('competence, validee').eq('eleve_id', eleveId).eq('categorie', categorie)

  const validees = (progs || []).filter(p => p.validee).map(p => p.competence)
  if (!comps.every(c => validees.includes(c.nom))) return

  const { data: existing } = await supabaseAdmin.from('certificats')
    .select('id').eq('eleve_id', eleveId).eq('type_certificat', certConf.type).single()
  if (existing) return

  const { count } = await supabaseAdmin.from('certificats').select('*', { count: 'exact', head: true })
  const year = new Date().getFullYear()
  const numero = `LS-${year}-${String((count || 0) + 1).padStart(3, '0')}`

  const niveauLabel = niveau_medaille === 'or' ? 'Mention Or' : niveau_medaille === 'argent' ? 'Mention Argent' : niveau_medaille === 'bronze' ? 'Mention Bronze' : ''

  await supabaseAdmin.from('certificats').insert({
    eleve_id: eleveId,
    nom_certificat: certConf.titre,
    niveau: `${certConf.niveau}${niveauLabel ? ` — ${niveauLabel}` : ''}`,
    date_obtention: new Date().toISOString().split('T')[0],
    numero, type_certificat: certConf.type,
    commentaire: `Certificat obtenu par examen final${niveauLabel ? ` — ${niveauLabel}` : ''}.`,
  })

  try {
    await supabaseAdmin.from('eleve_notifications').insert({
      eleve_id: eleveId, type: 'certificat',
      titre: `Certificat obtenu : ${certConf.titre}`,
      message: `Votre certificat "${certConf.titre}" est disponible.`,
      lien: '/espace-eleve/certificats',
    })
  } catch {}
}
