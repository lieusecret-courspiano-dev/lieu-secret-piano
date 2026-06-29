import { supabaseAdmin } from './supabase'

interface BadgeData {
  badge_key: string
  badge_nom: string
  badge_desc: string
  badge_icon: string
}

export async function attribuerBadge(eleve_id: string, badge: BadgeData): Promise<boolean> {
  try {
    // Vérifier si le badge existe déjà
    const { data: existing } = await supabaseAdmin
      .from('eleve_badges')
      .select('id')
      .eq('eleve_id', eleve_id)
      .eq('badge_key', badge.badge_key)
      .single()

    if (existing) return false // Déjà obtenu

    // Insérer le badge
    await supabaseAdmin.from('eleve_badges').insert({
      eleve_id,
      badge_key: badge.badge_key,
      badge_nom: badge.badge_nom,
      badge_desc: badge.badge_desc,
      badge_icon: badge.badge_icon,
      obtenu_at: new Date().toISOString(),
    })

    // Envoyer une notification
    await supabaseAdmin.from('eleve_notifications').insert({
      eleve_id,
      type: 'badge',
      titre: `Badge obtenu : ${badge.badge_nom}`,
      message: badge.badge_desc,
      lien: '/espace-eleve/badges',
    })

    return true
  } catch (e) {
    console.error('[badge] erreur attribution:', badge.badge_key, e)
    return false
  }
}

// Badges prédéfinis
export const BADGES = {
  PREMIER_COURS:      { badge_key: 'premier_cours',     badge_nom: 'Premier cours',          badge_desc: 'Vous avez réservé votre premier cours',           badge_icon: '🎹' },
  PREMIER_JOURNAL:    { badge_key: 'premier_journal',   badge_nom: 'Premier pas',             badge_desc: 'Première entrée dans le journal de pratique',     badge_icon: '📝' },
  PRATIQUE_10H:       { badge_key: 'pratique_10h',      badge_nom: '10 heures de pratique',   badge_desc: 'Vous avez pratiqué 10 heures au total',           badge_icon: '⏱️' },
  PRATIQUE_50H:       { badge_key: 'pratique_50h',      badge_nom: '50 heures de pratique',   badge_desc: 'Vous avez pratiqué 50 heures au total',           badge_icon: '🎯' },
  PRATIQUE_100H:      { badge_key: 'pratique_100h',     badge_nom: '100 heures de pratique',  badge_desc: 'Vous avez pratiqué 100 heures au total',          badge_icon: '🏆' },
  STREAK_4:           { badge_key: 'streak_4',          badge_nom: 'Régularité 1 mois',       badge_desc: '4 semaines consécutives de pratique',             badge_icon: '🔥' },
  STREAK_12:          { badge_key: 'streak_12',         badge_nom: 'Régularité 3 mois',       badge_desc: '12 semaines consécutives de pratique',            badge_icon: '⚡' },
  CERT_FONDAMENTAUX:  { badge_key: 'cert_fondamentaux', badge_nom: 'Fondamentaux',            badge_desc: 'Certificat Fondamentaux du piano obtenu',         badge_icon: '🎓' },
  CERT_COMPREHENSION: { badge_key: 'cert_comprehension',badge_nom: 'Compréhension',           badge_desc: 'Certificat Compréhension et autonomie obtenu',    badge_icon: '🎵' },
  CERT_EXPRESSION:    { badge_key: 'cert_expression',   badge_nom: 'Expression',              badge_desc: 'Certificat Expression et maîtrise obtenu',        badge_icon: '🌟' },
  DIPLOME_FINAL:      { badge_key: 'diplome_final',     badge_nom: 'Diplôme final',           badge_desc: 'Formation complète Lieu Secret validée',          badge_icon: '🏅' },
  PREMIER_OBJECTIF:   { badge_key: 'premier_objectif',  badge_nom: 'Visionnaire',             badge_desc: 'Premier objectif musical défini',                 badge_icon: '🎯' },
  OBJECTIF_ATTEINT:   { badge_key: 'objectif_atteint',  badge_nom: 'Accomplissement',         badge_desc: 'Premier objectif musical atteint',                badge_icon: '✅' },
  PREMIER_ENREG:      { badge_key: 'premier_enreg',     badge_nom: 'Première prise',          badge_desc: 'Premier enregistrement envoyé au professeur',     badge_icon: '🎙️' },
  PREMIER_MESSAGE:    { badge_key: 'premier_message',   badge_nom: 'Communicant',             badge_desc: 'Premier message envoyé au professeur',            badge_icon: '💬' },
  QUIZ_FONDAMENTAUX:  { badge_key: 'quiz_fondamentaux', badge_nom: 'Quiz Fondamentaux',       badge_desc: 'Vous avez réussi un quiz de niveau Fondamentaux', badge_icon: '🎹' },
  QUIZ_COMPREHENSION: { badge_key: 'quiz_comprehension',badge_nom: 'Quiz Compréhension',      badge_desc: 'Vous avez réussi un quiz de niveau Compréhension', badge_icon: '🎵' },
  QUIZ_EXPRESSION:    { badge_key: 'quiz_expression',   badge_nom: 'Quiz Expression',         badge_desc: 'Vous avez réussi un quiz de niveau Expression',   badge_icon: '🏆' },
}