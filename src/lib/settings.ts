import { supabase, supabaseAdmin } from './supabase'
import type { SiteSettings } from '@/types'

const DEFAULT_SETTINGS: SiteSettings = {
  site_title:        'Lieu Secret — École de Piano',
  site_description:  'Réservez vos cours de piano en ligne',
  contact_email:     'contact@lieusecret-courspiano.fr',
  phone:             '',
  instagram:         '',
  facebook:          '',
  youtube:           '',
  tiktok:            '',
  virement_iban:     '',
  virement_nom:      'Lieu Secret',
  virement_info:     'Virement bancaire — précisez votre nom et la date du cours en référence',
  hero_title:        'Réservez votre cours de piano',
  hero_title2:       'a votre rythme',
  hero_subtitle:     'Choisissez un créneau et commencez votre aventure musicale',
  zoom_cours:        '',
  zoom_atelier:      '',
  zoom_masterclass:  '',
  zoom_evenement:    '',
  stripe_public_key: '',
  cours_access_code:   '',
  tab_cours_label:     'Cours individuels',
  tab_events_label:    'Ateliers & Evenements',
  espace_eleves_title:  'Espace eleves',
  espace_eleves_desc:   'Les cours individuels sont reserves aux eleves inscrits.',
  reservation_titre:           'Reservez votre cours de piano',
  reservation_no_slot:         'Aucun creneau disponible ce jour.',
  reservation_select_date:     'Selectionnez une date pour voir les creneaux',
  reservation_code_placeholder: "Votre code d'acces",
  reservation_code_btn:        'Acceder aux creneaux',
  reservation_contact_link:    'Pas encore eleve ?',
  apropos_titre:        'Un espace musical unique et bienveillant',
  apropos_texte1:       'Lieu Secret est une ecole de piano en ligne pensee pour tous les niveaux. Que vous soyez debutant curieux ou musicien confirme souhaitant progresser, nos cours s\'adaptent a votre rythme et a vos objectifs.',
  apropos_texte2:       'Chaque cours est une invitation a explorer la musique dans un cadre chaleureux et professionnel. La reservation est simple, rapide, et s\'adapte a votre fuseau horaire ou que vous soyez dans le monde.',
  apropos_point1:       'Cours 100% en ligne via Zoom ou Google Meet',
  apropos_point2:       'Creneaux flexibles adaptes a votre emploi du temps',
  apropos_point3:       'Gestion automatique des fuseaux horaires internationaux',
  apropos_point4:       'Confirmation instantanee par email avec fichier calendrier (.ics)',
  offres_titre:         'Choisissez votre formule',
  offres_sous_titre:    'Des cours adaptes a chaque profil, du debutant au musicien confirme.',
  cta_titre:            'Pret(e) a commencer ?',
  cta_sous_titre:       'Reservez votre premier cours des maintenant. Aucun engagement, annulation libre.',
  stats_label1:         '100% En ligne',
  stats_label2:         '1h Cours individuel',
  stats_label3:         'Monde entier Fuseaux horaires',
  stats_label4:         'Tous niveaux Debutant a avance',
  hero_btn1:            'Reserver un creneau',
  hero_btn2:            'Decouvrir les offres',
  steps_titre:          'Comment ca marche ?',
  steps_label:          'Simple et rapide',
  offre1_titre:         'Cours individuel',
  offre1_sous:          'Sur mesure',
  offre1_desc:          'Un cours dedie entierement a vous. Choisissez votre creneau, votre rythme, vos objectifs.',
  offre1_btn:           'Reserver un creneau',
  offre1_f1:            '1h de cours en tete-a-tete',
  offre1_f2:            'Creneau flexible',
  offre1_f3:            'Suivi personnalise',
  offre1_f4:            'Lien Zoom envoye par email',
  offre2_titre:         'Atelier de groupe',
  offre2_sous:          'Collectif',
  offre2_desc:          "Apprenez en groupe dans une ambiance conviviale. Ideal pour progresser ensemble.",
  offre2_btn:           'Voir les ateliers',
  offre2_f1:            "Jusqu'a 8 participants",
  offre2_f2:            "Theme defini a l'avance",
  offre2_f3:            'Echanges et partage',
  offre2_f4:            'Gratuit ou payant',
  offre3_titre:         'Masterclass',
  offre3_sous:          'Perfectionnement',
  offre3_desc:          "Poussez votre technique plus loin avec des exercices cibles et des conseils d'expert.",
  offre3_btn:           'Voir les masterclass',
  offre3_f1:            'Niveau intermediaire/avance',
  offre3_f2:            'Technique approfondie',
  offre3_f3:            'Petits groupes (6 max)',
  offre3_f4:            'Enregistrement disponible',
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...data }
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const { error } = await supabaseAdmin
    .from('site_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) throw new Error(error.message)
}