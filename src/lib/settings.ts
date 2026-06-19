import { supabase, supabaseAdmin } from './supabase'
import type { SiteSettings } from '@/types'

const DEFAULT_SETTINGS: SiteSettings = {
  site_title: 'Lieu Secret — École de Piano', site_description: 'Réservez vos cours de piano en ligne',
  contact_email: 'lieusecret-courspiano@outlook.fr', phone: '',
  instagram: '', facebook: '', youtube: '', tiktok: '',
  virement_iban: '', virement_nom: 'Lieu Secret', virement_info: 'Virement bancaire — précisez votre nom et la date du cours en référence',
  hero_title: '', hero_title2: '', hero_subtitle: '', hero_btn1: 'Réserver un créneau', hero_btn2: 'Découvrir les offres',
  stats_label1: '100% En ligne', stats_label2: '1h Cours individuel', stats_label3: 'Monde entier Fuseaux horaires', stats_label4: 'Tous niveaux Débutant à avancé',
  zoom_cours: '', zoom_atelier: '', zoom_masterclass: '', zoom_evenement: '',
  stripe_public_key: '', cours_access_code: '',
  tab_cours_label: 'Cours individuels', tab_events_label: 'Ateliers & Événements',
  espace_eleves_title: 'Espace élèves', espace_eleves_desc: 'Les cours individuels sont réservés aux élèves inscrits.',
  reservation_titre: 'Réservez votre cours de piano', reservation_no_slot: 'Aucun créneau disponible ce jour.',
  reservation_select_date: 'Sélectionnez une date pour voir les créneaux',
  reservation_code_placeholder: "Votre code d'accès", reservation_code_btn: 'Accéder aux créneaux',
  reservation_contact_link: 'Pas encore élève ?',
  banner_actif: 'false', banner_message: '', banner_type: 'info',
  tarif_cours_1h: '22', tarif_pack_label1: 'Pack 5h', tarif_pack_prix1: '100', tarif_pack_desc1: '5 heures de cours',
  tarif_pack_label2: 'Pack 8h', tarif_pack_prix2: '165', tarif_pack_desc2: '8 heures de cours',
  tarif_pack_label3: 'Pack 12h', tarif_pack_prix3: '250', tarif_pack_desc3: '12 heures de cours',
  tarif_pack_label4: 'Pack 20h', tarif_pack_prix4: '420', tarif_pack_desc4: '20 heures de cours',
  cadeau_formule1_label: 'Bon Découverte', cadeau_formule1_desc: '1 cours de piano', cadeau_formule1_prix: '22',
  cadeau_formule2_label: 'Bon Progression', cadeau_formule2_desc: '3 cours de piano', cadeau_formule2_prix: '60',
  cadeau_formule3_label: 'Bon Immersion', cadeau_formule3_desc: '5 cours de piano', cadeau_formule3_prix: '90',
  prof_nom: '', prof_titre: '', prof_photo: '', prof_bio: '', prof_vision: '', prof_pedagogie: '',
  apropos_titre: 'Un espace musical unique et bienveillant', apropos_texte1: '', apropos_texte2: '',
  apropos_point1: 'Cours 100% en ligne via Zoom', apropos_point2: 'Créneaux flexibles adaptés à votre emploi du temps',
  apropos_point3: 'Gestion automatique des fuseaux horaires internationaux', apropos_point4: 'Confirmation instantanée par email avec fichier calendrier (.ics)',
  offres_titre: 'Choisissez votre formule', offres_sous_titre: 'Des cours adaptés à chaque profil, du débutant au musicien confirmé.',
  packs_titre: 'Acheter un pack de cours',
  essai_label: 'SANS ENGAGEMENT', essai_titre: "Cours d'essai gratuit",
  essai_sous_titre: '30 minutes offertes pour découvrir notre approche pédagogique. Aucune carte bancaire requise.',
  essai_duree: '1h offerte', essai_duree_desc: 'Cours individuel',
  essai_format: 'En ligne', essai_format_desc: 'Via Zoom',
  essai_form_titre: "Réservez votre cours d'essai", essai_btn_label: "Demander mon cours d'essai gratuit", packs_sous_titre: "Achetez un pack d'heures et réservez vos cours au fur et à mesure.", packs_label: 'Packs de cours',
  cta_titre: 'Prêt(e) à commencer ?', cta_sous_titre: 'Réservez votre premier cours dès maintenant. Aucun engagement, annulation libre.',
  steps_titre: 'Comment ça marche ?', steps_label: 'Simple et rapide',
  offre1_titre: 'Cours individuel', offre1_sous: 'Sur mesure', offre1_desc: 'Un cours dédié entièrement à vous.', offre1_btn: 'Réserver un créneau',
  offre1_f1: '1h de cours en tête-à-tête', offre1_f2: 'Créneau flexible', offre1_f3: 'Suivi personnalisé', offre1_f4: 'Lien Zoom envoyé par email',
  offre2_titre: 'Atelier de groupe', offre2_sous: 'Collectif', offre2_desc: "Apprenez en groupe dans une ambiance conviviale.", offre2_btn: 'Voir les ateliers',
  offre2_f1: "Jusqu'à 8 participants", offre2_f2: "Thème défini à l'avance", offre2_f3: 'Échanges et partage', offre2_f4: 'Gratuit ou payant',
  offre3_titre: 'Masterclass', offre3_sous: 'Perfectionnement', offre3_desc: "Poussez votre technique plus loin.", offre3_btn: 'Voir les masterclass',
  offre3_f1: 'Niveau intermédiaire/avancé', offre3_f2: 'Technique approfondie', offre3_f3: 'Petits groupes (6 max)', offre3_f4: 'Enregistrement disponible',
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single()
  if (error || !data) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...data }
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const { error } = await supabaseAdmin.from('site_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', 1)
  if (error) throw new Error(error.message)
}