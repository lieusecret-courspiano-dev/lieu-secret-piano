-- ============================================================
-- LIEU SECRET — Schéma Base de Données COMPLET
-- Version consolidée — remplace toutes les migrations précédentes
-- À exécuter UNE SEULE FOIS sur une base vierge
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DISPONIBILITÉS & RÉSERVATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS availability_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL,
  start_time  VARCHAR(5) NOT NULL,
  end_time    VARCHAR(5) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_exceptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exception_date DATE NOT NULL,
  type           VARCHAR(20) NOT NULL DEFAULT 'closed',
  start_time     VARCHAR(5),
  end_time       VARCHAR(5),
  reason         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_settings (
  id                 INTEGER PRIMARY KEY DEFAULT 1,
  slot_duration_min  INTEGER NOT NULL DEFAULT 60,
  buffer_min         INTEGER NOT NULL DEFAULT 15,
  min_notice_hours   INTEGER NOT NULL DEFAULT 10,
  max_days_ahead     INTEGER NOT NULL DEFAULT 60,
  slot_increment_min INTEGER NOT NULL DEFAULT 60,
  timezone           VARCHAR(100) NOT NULL DEFAULT 'Europe/Paris',
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO booking_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL DEFAULT 'atelier',
  date_heure       TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_spots        INTEGER,
  spots_remaining  INTEGER,
  price            DECIMAL(10,2) DEFAULT 0,
  is_free          BOOLEAN DEFAULT false,
  is_active        BOOLEAN DEFAULT true,
  is_featured      BOOLEAN DEFAULT false,
  zoom_link        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id           UUID REFERENCES events(id) ON DELETE SET NULL,
  slot_start         TIMESTAMPTZ,
  slot_end           TIMESTAMPTZ,
  student_name       TEXT NOT NULL,
  student_email      TEXT NOT NULL,
  student_phone      TEXT,
  student_timezone   TEXT DEFAULT 'Europe/Paris',
  message            TEXT,
  type               TEXT DEFAULT 'cours',
  status             TEXT DEFAULT 'pending',
  payment_method     TEXT DEFAULT 'virement',
  amount             DECIMAL(10,2) DEFAULT 0,
  stripe_session_id  TEXT,
  gift_code          VARCHAR(20),
  pack_code          TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reservations_email      ON reservations(student_email);
CREATE INDEX IF NOT EXISTS idx_reservations_status     ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_slot       ON reservations(slot_start);
CREATE INDEX IF NOT EXISTS idx_reservations_gift_code  ON reservations(gift_code);
CREATE INDEX IF NOT EXISTS idx_reservations_pack_code  ON reservations(pack_code);

-- ============================================================
-- MESSAGES & PARAMÈTRES
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id                      INTEGER PRIMARY KEY DEFAULT 1,
  site_title              TEXT DEFAULT 'Lieu Secret',
  site_description        TEXT DEFAULT '',
  contact_email           TEXT DEFAULT '',
  phone                   TEXT DEFAULT '',
  whatsapp                TEXT DEFAULT '',
  instagram               TEXT DEFAULT '',
  facebook                TEXT DEFAULT '',
  youtube                 TEXT DEFAULT '',
  tiktok                  TEXT DEFAULT '',
  virement_iban           TEXT DEFAULT '',
  virement_nom            TEXT DEFAULT 'Lieu Secret',
  virement_info           TEXT DEFAULT '',
  hero_title              TEXT DEFAULT '',
  hero_title2             TEXT DEFAULT '',
  hero_subtitle           TEXT DEFAULT '',
  hero_btn1               TEXT DEFAULT 'Réserver un créneau',
  hero_btn2               TEXT DEFAULT 'Découvrir les offres',
  stats_label1            TEXT DEFAULT '100% En ligne',
  stats_label2            TEXT DEFAULT '1h Cours individuel',
  stats_label3            TEXT DEFAULT 'Monde entier',
  stats_label4            TEXT DEFAULT 'Tous niveaux',
  zoom_cours              TEXT DEFAULT '',
  zoom_atelier            TEXT DEFAULT '',
  zoom_masterclass        TEXT DEFAULT '',
  zoom_evenement          TEXT DEFAULT '',
  stripe_public_key       TEXT DEFAULT '',
  cours_access_code       TEXT DEFAULT '',
  tab_cours_label         TEXT DEFAULT 'Cours individuels',
  tab_events_label        TEXT DEFAULT 'Ateliers et Événements',
  espace_eleves_title     TEXT DEFAULT 'Espace élèves',
  espace_eleves_desc      TEXT DEFAULT '',
  reservation_titre       TEXT DEFAULT 'Réservez votre cours de piano',
  reservation_sous_titre  TEXT DEFAULT '',
  reservation_no_slot     TEXT DEFAULT 'Aucun créneau disponible ce jour.',
  reservation_select_date TEXT DEFAULT 'Sélectionnez une date',
  reservation_code_placeholder TEXT DEFAULT 'Votre code accès',
  reservation_code_btn    TEXT DEFAULT 'Accéder aux créneaux',
  reservation_contact_link TEXT DEFAULT 'Pas encore élève ?',
  banner_actif            TEXT DEFAULT 'false',
  banner_message          TEXT DEFAULT '',
  banner_type             TEXT DEFAULT 'info',
  tarif_cours_1h          TEXT DEFAULT '22',
  tarif_pack_label1       TEXT DEFAULT 'Pack 5h',
  tarif_pack_prix1        TEXT DEFAULT '100',
  tarif_pack_desc1        TEXT DEFAULT '5 heures de cours',
  tarif_pack_label2       TEXT DEFAULT '',
  tarif_pack_prix2        TEXT DEFAULT '',
  tarif_pack_desc2        TEXT DEFAULT '',
  tarif_pack_label3       TEXT DEFAULT '',
  tarif_pack_prix3        TEXT DEFAULT '',
  tarif_pack_desc3        TEXT DEFAULT '',
  tarif_pack_label4       TEXT DEFAULT 'Pack 20h',
  tarif_pack_prix4        TEXT DEFAULT '420',
  tarif_pack_desc4        TEXT DEFAULT '20 heures de cours',
  cadeau_formule1_label   TEXT DEFAULT 'Bon Découverte',
  cadeau_formule1_desc    TEXT DEFAULT '1 cours de piano',
  cadeau_formule1_prix    TEXT DEFAULT '22',
  cadeau_formule2_label   TEXT DEFAULT 'Bon Progression',
  cadeau_formule2_desc    TEXT DEFAULT '3 cours de piano',
  cadeau_formule2_prix    TEXT DEFAULT '60',
  cadeau_formule3_label   TEXT DEFAULT 'Bon Immersion',
  cadeau_formule3_desc    TEXT DEFAULT '5 cours de piano',
  cadeau_formule3_prix    TEXT DEFAULT '90',
  prof_nom                TEXT DEFAULT '',
  prof_titre              TEXT DEFAULT '',
  prof_photo              TEXT DEFAULT '',
  prof_bio                TEXT DEFAULT '',
  prof_vision             TEXT DEFAULT '',
  prof_pedagogie          TEXT DEFAULT '',
  apropos_titre           TEXT DEFAULT 'Un espace musical unique et bienveillant',
  apropos_texte1          TEXT DEFAULT '',
  apropos_texte2          TEXT DEFAULT '',
  apropos_point1          TEXT DEFAULT 'Cours 100% en ligne via Zoom ou Google Meet',
  apropos_point2          TEXT DEFAULT 'Créneaux flexibles',
  apropos_point3          TEXT DEFAULT 'Gestion automatique des fuseaux horaires',
  apropos_point4          TEXT DEFAULT 'Confirmation instantanée par email',
  offres_titre            TEXT DEFAULT 'Choisissez votre formule',
  offres_sous_titre       TEXT DEFAULT '',
  cta_titre               TEXT DEFAULT 'Prêt(e) à commencer ?',
  cta_sous_titre          TEXT DEFAULT 'Réservez votre premier cours dès maintenant.',
  steps_titre             TEXT DEFAULT 'Comment ça marche ?',
  steps_label             TEXT DEFAULT 'Simple et rapide',
  offre1_titre            TEXT DEFAULT 'Cours individuel',
  offre1_sous             TEXT DEFAULT 'Sur mesure',
  offre1_desc             TEXT DEFAULT '',
  offre1_btn              TEXT DEFAULT 'Réserver un créneau',
  offre1_f1               TEXT DEFAULT '1h de cours en tête-à-tête',
  offre1_f2               TEXT DEFAULT 'Créneau flexible',
  offre1_f3               TEXT DEFAULT 'Suivi personnalisé',
  offre1_f4               TEXT DEFAULT 'Lien Zoom envoyé par email',
  offre2_titre            TEXT DEFAULT 'Atelier de groupe',
  offre2_sous             TEXT DEFAULT 'Collectif',
  offre2_desc             TEXT DEFAULT '',
  offre2_btn              TEXT DEFAULT 'Voir les ateliers',
  offre2_f1               TEXT DEFAULT "Jusqu'à 8 participants",
  offre2_f2               TEXT DEFAULT "Thème défini à l'avance",
  offre2_f3               TEXT DEFAULT 'Échanges et partage',
  offre2_f4               TEXT DEFAULT 'Gratuit ou payant',
  offre3_titre            TEXT DEFAULT 'Masterclass',
  offre3_sous             TEXT DEFAULT 'Perfectionnement',
  offre3_desc             TEXT DEFAULT '',
  offre3_btn              TEXT DEFAULT 'Voir les masterclass',
  offre3_f1               TEXT DEFAULT 'Niveau intermédiaire/avancé',
  offre3_f2               TEXT DEFAULT 'Technique approfondie',
  offre3_f3               TEXT DEFAULT 'Petits groupes (6 max)',
  offre3_f4               TEXT DEFAULT 'Enregistrement disponible',
  packs_label             TEXT DEFAULT 'Packs de cours',
  packs_titre             TEXT DEFAULT 'Acheter un pack de cours',
  packs_sous_titre        TEXT DEFAULT '',
  essai_label             TEXT DEFAULT 'SANS ENGAGEMENT',
  essai_titre             TEXT DEFAULT 'Cours d''essai gratuit',
  essai_sous_titre        TEXT DEFAULT '1 heure offerte pour découvrir notre approche pédagogique.',
  essai_duree             TEXT DEFAULT '1h offerte',
  essai_duree_desc        TEXT DEFAULT 'Cours individuel',
  essai_format            TEXT DEFAULT 'En ligne',
  essai_format_desc       TEXT DEFAULT 'Via Zoom ou Meet',
  essai_form_titre        TEXT DEFAULT 'Réservez votre cours d''essai',
  essai_btn_label         TEXT DEFAULT 'Demander mon cours d''essai gratuit',
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INSCRIPTIONS & MÉDIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS inscriptions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom              TEXT,
  prenom           TEXT,
  email            TEXT NOT NULL,
  telephone        TEXT,
  pays             TEXT,
  niveau           TEXT,
  objectif         TEXT,
  message          TEXT,
  reponses         JSONB,
  status           TEXT DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inscriptions_email  ON inscriptions(email);
CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status);

CREATE TABLE IF NOT EXISTS inscription_questions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label      TEXT NOT NULL,
  type       TEXT DEFAULT 'text',
  options    TEXT,
  is_active  BOOLEAN DEFAULT true,
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL DEFAULT 'temoignage',
  titre       TEXT,
  description TEXT,
  url         TEXT,
  auteur      TEXT,
  note        INTEGER DEFAULT 5,
  contenu     TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT NOT NULL,
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_key ON email_logs(key);

-- ============================================================
-- PACKS DE COURS & BONS CADEAUX
-- ============================================================

CREATE TABLE IF NOT EXISTS course_packs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  pack_label      TEXT NOT NULL,
  heures_total    INTEGER NOT NULL,
  heures_restantes INTEGER NOT NULL,
  acheteur_nom    TEXT NOT NULL,
  acheteur_email  TEXT NOT NULL,
  montant         DECIMAL(10,2) DEFAULT 0,
  payment_method  TEXT DEFAULT 'virement',
  status          TEXT DEFAULT 'pending_virement',
  stripe_session_id TEXT,
  paypal_order_id TEXT,
  notes           TEXT,
  date_paiement   DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_packs_code         ON course_packs(code);
CREATE INDEX IF NOT EXISTS idx_course_packs_email        ON course_packs(acheteur_email);
CREATE INDEX IF NOT EXISTS idx_course_packs_status       ON course_packs(status);
CREATE INDEX IF NOT EXISTS idx_course_packs_date_paiement ON course_packs(date_paiement);

CREATE TABLE IF NOT EXISTS pack_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id    UUID REFERENCES course_packs(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  delta      INTEGER NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pack_history_pack ON pack_history(pack_id);

CREATE TABLE IF NOT EXISTS pack_reminders_sent (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id    UUID REFERENCES course_packs(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pack_reminders_pack ON pack_reminders_sent(pack_id);

CREATE TABLE IF NOT EXISTS gift_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  formule_label   TEXT NOT NULL,
  nb_cours        INTEGER NOT NULL DEFAULT 1,
  montant         DECIMAL(10,2) DEFAULT 0,
  acheteur_nom    TEXT NOT NULL,
  acheteur_email  TEXT NOT NULL,
  beneficiaire_nom   TEXT,
  beneficiaire_email TEXT,
  message_perso   TEXT,
  status          TEXT DEFAULT 'pending_virement',
  payment_method  TEXT DEFAULT 'virement',
  stripe_session_id TEXT,
  paypal_order_id TEXT,
  date_paiement   DATE,
  used_at         TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code         ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status       ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_date_paiement ON gift_cards(date_paiement);

-- ============================================================
-- COURS D'ESSAI & PARRAINAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS essais_gratuits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom        TEXT NOT NULL,
  prenom     TEXT NOT NULL,
  email      TEXT NOT NULL,
  telephone  TEXT,
  niveau     TEXT,
  message    TEXT,
  status     TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_essais_email  ON essais_gratuits(email);
CREATE INDEX IF NOT EXISTS idx_essais_status ON essais_gratuits(status);

CREATE TABLE IF NOT EXISTS parrainages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_email TEXT NOT NULL,
  parrain_nom   TEXT,
  code          TEXT UNIQUE NOT NULL,
  nb_filleuls   INTEGER DEFAULT 0,
  credits_gagnes INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parrainages_code  ON parrainages(code);
CREATE INDEX IF NOT EXISTS idx_parrainages_email ON parrainages(parrain_email);

CREATE TABLE IF NOT EXISTS parrainage_filleuls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_email TEXT NOT NULL,
  filleul_email TEXT NOT NULL,
  filleul_nom   TEXT,
  status        TEXT DEFAULT 'pending',
  validated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parrainage_credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_email TEXT NOT NULL,
  montant       DECIMAL(10,2) DEFAULT 0,
  type          TEXT DEFAULT 'parrainage',
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parrainage_credits_email  ON parrainage_credits(parrain_email);
CREATE INDEX IF NOT EXISTS idx_parrainage_credits_status ON parrainage_credits(status);

-- ============================================================
-- MÉDIATHÈQUE & PARTITIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS partitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       TEXT NOT NULL,
  compositeur TEXT,
  niveau      TEXT DEFAULT 'tous',
  style       TEXT DEFAULT 'classique',
  fichier_url TEXT,
  apercu_url  TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partitions_niveau ON partitions(niveau);
CREATE INDEX IF NOT EXISTS idx_partitions_style  ON partitions(style);
CREATE INDEX IF NOT EXISTS idx_partitions_active ON partitions(is_active);

CREATE TABLE IF NOT EXISTS mediatheque (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       TEXT NOT NULL,
  description TEXT,
  type        TEXT DEFAULT 'video',
  url         TEXT,
  url_image   TEXT,
  niveau      TEXT DEFAULT 'tous',
  duree       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mediatheque_niveau ON mediatheque(niveau);
CREATE INDEX IF NOT EXISTS idx_mediatheque_type   ON mediatheque(type);
CREATE INDEX IF NOT EXISTS idx_mediatheque_active ON mediatheque(is_active);

-- ============================================================
-- ESPACE ÉLÈVE
-- ============================================================

CREATE TABLE IF NOT EXISTS eleves (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   TEXT UNIQUE NOT NULL,
  password_hash           TEXT,
  prenom                  TEXT NOT NULL DEFAULT '',
  nom                     TEXT NOT NULL DEFAULT '',
  telephone               TEXT,
  pays                    TEXT,
  niveau                  TEXT DEFAULT 'debutant',
  objectif                TEXT,
  is_active               BOOLEAN DEFAULT true,
  email_verified          BOOLEAN DEFAULT false,
  setup_token             TEXT,
  setup_token_expires     TIMESTAMPTZ,
  reset_token             TEXT,
  reset_token_expires     TIMESTAMPTZ,
  avatar                  TEXT DEFAULT 'piano',
  parrainage_code         TEXT,
  parrain_email           TEXT,
  streak_semaines         INTEGER DEFAULT 0,
  streak_derniere_semaine TEXT,
  total_heures_pratique   INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleves_email ON eleves(email);

CREATE TABLE IF NOT EXISTS eleve_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id   UUID REFERENCES eleves(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_sessions_token   ON eleve_sessions(token);
CREATE INDEX IF NOT EXISTS idx_eleve_sessions_eleve   ON eleve_sessions(eleve_id);

CREATE TABLE IF NOT EXISTS competences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  description TEXT,
  categorie   TEXT DEFAULT 'Fondamentaux',
  ordre       INTEGER DEFAULT 0,
  niveau      INTEGER DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eleve_progression (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id     UUID REFERENCES eleves(id) ON DELETE CASCADE,
  competence   TEXT NOT NULL,
  categorie    TEXT,
  validee      BOOLEAN DEFAULT false,
  validee_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(eleve_id, competence)
);
CREATE INDEX IF NOT EXISTS idx_progression_eleve ON eleve_progression(eleve_id);

CREATE TABLE IF NOT EXISTS ressources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  titre       TEXT NOT NULL,
  description TEXT,
  type        TEXT DEFAULT 'pdf',
  url         TEXT,
  url_image   TEXT,
  duree       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ressources_eleve ON ressources(eleve_id);

CREATE TABLE IF NOT EXISTS notes_cours (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id   UUID REFERENCES eleves(id) ON DELETE CASCADE,
  titre      TEXT,
  contenu    TEXT NOT NULL,
  date_cours DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_eleve ON notes_cours(eleve_id);

CREATE TABLE IF NOT EXISTS certificats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id        UUID REFERENCES eleves(id) ON DELETE CASCADE,
  nom_certificat  TEXT NOT NULL,
  niveau          TEXT,
  date_obtention  DATE,
  numero          TEXT UNIQUE,
  commentaire     TEXT,
  verset_biblique TEXT,
  pdf_url         TEXT,
  type_certificat TEXT DEFAULT 'manuel',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_certificats_eleve ON certificats(eleve_id);

CREATE TABLE IF NOT EXISTS travaux_a_faire (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       TEXT NOT NULL,
  description TEXT,
  fichier_url TEXT,
  echeance    DATE,
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travaux_eleves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travail_id  UUID REFERENCES travaux_a_faire(id) ON DELETE CASCADE,
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  statut      TEXT DEFAULT 'a_faire',
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(travail_id, eleve_id)
);
CREATE INDEX IF NOT EXISTS idx_travaux_eleves_eleve   ON travaux_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_travaux_eleves_travail ON travaux_eleves(travail_id);

CREATE TABLE IF NOT EXISTS eleve_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  expediteur  TEXT NOT NULL DEFAULT 'eleve',
  contenu     TEXT NOT NULL,
  lu          BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_messages_eleve   ON eleve_messages(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_messages_created ON eleve_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS eleve_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id   UUID REFERENCES eleves(id) ON DELETE CASCADE,
  type       TEXT DEFAULT 'info',
  titre      TEXT NOT NULL,
  message    TEXT,
  lien       TEXT,
  lu         BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_notifications_eleve ON eleve_notifications(eleve_id);

CREATE TABLE IF NOT EXISTS eleve_repertoire (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id   UUID REFERENCES eleves(id) ON DELETE CASCADE,
  titre      TEXT NOT NULL,
  compositeur TEXT,
  tonalite   TEXT,
  niveau     TEXT,
  statut     TEXT DEFAULT 'en_cours',
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_repertoire_eleve ON eleve_repertoire(eleve_id);

CREATE TABLE IF NOT EXISTS eleve_objectifs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id   UUID REFERENCES eleves(id) ON DELETE CASCADE,
  titre      TEXT NOT NULL,
  description TEXT,
  echeance   DATE,
  statut     TEXT DEFAULT 'en_cours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_objectifs_eleve ON eleve_objectifs(eleve_id);

CREATE TABLE IF NOT EXISTS eleve_journal (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id        UUID REFERENCES eleves(id) ON DELETE CASCADE,
  date_pratique   DATE NOT NULL,
  duree_minutes   INTEGER DEFAULT 30,
  humeur          TEXT,
  notes           TEXT,
  morceaux        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_journal_eleve ON eleve_journal(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_journal_date  ON eleve_journal(date_pratique DESC);

CREATE TABLE IF NOT EXISTS eleve_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  badge_key   TEXT NOT NULL,
  badge_nom   TEXT NOT NULL,
  badge_desc  TEXT,
  badge_icon  TEXT,
  obtenu_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(eleve_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_eleve_badges_eleve ON eleve_badges(eleve_id);

CREATE TABLE IF NOT EXISTS eleve_medias_prives (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id     UUID REFERENCES eleves(id) ON DELETE CASCADE,
  type         TEXT DEFAULT 'audio',
  titre        TEXT,
  url          TEXT NOT NULL,
  public_id    TEXT,
  commentaire_admin TEXT,
  lu_admin     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_medias_prives_eleve   ON eleve_medias_prives(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_medias_prives_created ON eleve_medias_prives(created_at DESC);

-- ============================================================
-- QUIZ PÉDAGOGIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS quiz (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         TEXT NOT NULL,
  description   TEXT,
  niveau        TEXT DEFAULT 'fondamentaux',
  categorie     TEXT,
  score_min     INTEGER DEFAULT 70,
  duree_minutes INTEGER DEFAULT 0,
  statut        TEXT DEFAULT 'brouillon',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID REFERENCES quiz(id) ON DELETE CASCADE,
  type          TEXT NOT NULL DEFAULT 'qcm',
  question      TEXT NOT NULL,
  options       JSONB,
  bonne_reponse TEXT,
  explication   TEXT,
  audio_url     TEXT,
  image_url     TEXT,
  video_url     TEXT,
  points        INTEGER DEFAULT 1,
  position      INTEGER DEFAULT 0,
  statut        TEXT DEFAULT 'publie',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz    ON quiz_questions(quiz_id, position);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_statut  ON quiz_questions(statut);

CREATE TABLE IF NOT EXISTS quiz_resultats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id    UUID REFERENCES quiz(id) ON DELETE CASCADE,
  eleve_id   UUID REFERENCES eleves(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL,
  reponses   JSONB,
  reussi     BOOLEAN DEFAULT FALSE,
  tentative  INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_resultats_eleve ON quiz_resultats(eleve_id);
CREATE INDEX IF NOT EXISTS idx_quiz_resultats_quiz  ON quiz_resultats(quiz_id);

-- ============================================================
-- SUPPORTS PÉDAGOGIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS supports_pedagogiques (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         TEXT NOT NULL,
  description   TEXT,
  niveau        TEXT DEFAULT 'tous',
  type          TEXT DEFAULT 'pdf',
  fichier_url   TEXT,
  fichier_nom   TEXT,
  apercu_url    TEXT,
  est_gratuit   BOOLEAN DEFAULT FALSE,
  prix          DECIMAL(10,2) DEFAULT 5.00,
  est_publie    BOOLEAN DEFAULT FALSE,
  nb_pages      INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supports_achats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_id            UUID REFERENCES supports_pedagogiques(id) ON DELETE CASCADE,
  eleve_id              UUID REFERENCES eleves(id) ON DELETE SET NULL,
  acheteur_email        TEXT,
  acheteur_nom          TEXT,
  montant               DECIMAL(10,2) DEFAULT 0,
  payment_method        TEXT DEFAULT 'virement',
  statut                TEXT DEFAULT 'en_attente',
  stripe_session_id     TEXT,
  paypal_order_id       TEXT,
  note_admin            TEXT,
  attribue_manuellement BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_supports_achats_eleve   ON supports_achats(eleve_id);
CREATE INDEX IF NOT EXISTS idx_supports_achats_support ON supports_achats(support_id);
CREATE INDEX IF NOT EXISTS idx_supports_achats_statut  ON supports_achats(statut);

CREATE TABLE IF NOT EXISTS supports_progression (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_id    UUID REFERENCES supports_pedagogiques(id) ON DELETE CASCADE,
  eleve_id      UUID REFERENCES eleves(id) ON DELETE CASCADE,
  page_actuelle INTEGER DEFAULT 1,
  statut        TEXT DEFAULT 'non_commence',
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(support_id, eleve_id)
);
CREATE INDEX IF NOT EXISTS idx_supports_prog_eleve ON supports_progression(eleve_id);

-- ============================================================
-- RLS — Row Level Security (accès via service_role uniquement)
-- ============================================================

ALTER TABLE availability_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscription_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE medias                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_packs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_history            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_reminders_sent     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE essais_gratuits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE parrainages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parrainage_filleuls     ENABLE ROW LEVEL SECURITY;
ALTER TABLE parrainage_credits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE partitions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE mediatheque             ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleves                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE competences             ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_progression       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ressources              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_cours             ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE travaux_a_faire         ENABLE ROW LEVEL SECURITY;
ALTER TABLE travaux_eleves          ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_repertoire        ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_objectifs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_journal           ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_badges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_medias_prives     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_resultats          ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports_pedagogiques   ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports_achats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports_progression    ENABLE ROW LEVEL SECURITY;

-- Politiques permissives (service_role a accès total de toute façon)
DO $$ BEGIN CREATE POLICY "open" ON availability_rules      FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON availability_exceptions FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON booking_settings        FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON events                  FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON reservations            FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON messages                FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON admin_sessions          FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON site_settings           FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON inscriptions            FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON inscription_questions   FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON medias                  FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON email_logs              FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON course_packs            FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON pack_history            FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON pack_reminders_sent     FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON gift_cards              FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON essais_gratuits         FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON parrainages             FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON parrainage_filleuls     FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON parrainage_credits      FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON partitions              FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON mediatheque             FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleves                  FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_sessions          FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON competences             FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_progression       FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON ressources              FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON notes_cours             FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON certificats             FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON travaux_a_faire         FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON travaux_eleves          FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_messages          FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_notifications     FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_repertoire        FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_objectifs         FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_journal           FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_badges            FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON eleve_medias_prives     FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON quiz                    FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON quiz_questions          FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON quiz_resultats          FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON supports_pedagogiques   FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON supports_achats         FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "open" ON supports_progression    FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Schéma Lieu Secret créé avec succès !' as status;