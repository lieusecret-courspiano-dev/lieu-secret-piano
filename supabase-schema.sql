-- ============================================================
-- LIEU SECRET — Schéma Base de Données Supabase V3 FINAL
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE : availability_rules (règles récurrentes hebdomadaires)
-- ============================================================
CREATE TABLE IF NOT EXISTS availability_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL, -- 0=Dim, 1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam
  start_time  VARCHAR(5) NOT NULL, -- "09:00"
  end_time    VARCHAR(5) NOT NULL, -- "18:00"
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : availability_exceptions (exceptions ponctuelles)
-- ============================================================
CREATE TABLE IF NOT EXISTS availability_exceptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exception_date DATE NOT NULL,
  type           VARCHAR(20) NOT NULL DEFAULT 'closed', -- 'closed' ou 'open'
  start_time     VARCHAR(5),
  end_time       VARCHAR(5),
  reason         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : booking_settings (paramètres du moteur)
-- ============================================================
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

-- ============================================================
-- TABLE : events (Ateliers, Cours collectifs, Événements)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  type             VARCHAR(50) NOT NULL DEFAULT 'evenement',
  date_heure       TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_spots        INTEGER,
  spots_remaining  INTEGER,
  price            DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_free          BOOLEAN NOT NULL DEFAULT true,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  zoom_link        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : reservations
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id           UUID REFERENCES events(id) ON DELETE SET NULL,
  slot_start         TIMESTAMPTZ,  -- pour les cours individuels (remplace creneau_id)
  slot_end           TIMESTAMPTZ,  -- pour les cours individuels
  student_name       VARCHAR(255) NOT NULL,
  student_email      VARCHAR(255) NOT NULL,
  student_phone      VARCHAR(50),
  student_timezone   VARCHAR(100) NOT NULL DEFAULT 'Europe/Paris',
  message            TEXT,
  type               VARCHAR(50) NOT NULL DEFAULT 'cours',
  status             VARCHAR(50) NOT NULL DEFAULT 'confirmed',
  payment_method     VARCHAR(50) NOT NULL DEFAULT 'gratuit',
  amount             DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_session_id  VARCHAR(255),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : messages (Contact)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(255),
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : payments (Stripe)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id            UUID REFERENCES reservations(id) ON DELETE SET NULL,
  event_id                  UUID REFERENCES events(id) ON DELETE SET NULL,
  stripe_payment_intent_id  VARCHAR(255),
  stripe_session_id         VARCHAR(255),
  amount                    DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency                  VARCHAR(10) NOT NULL DEFAULT 'eur',
  status                    VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : site_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  site_title       VARCHAR(255) DEFAULT 'Lieu Secret — École de Piano',
  site_description TEXT DEFAULT 'Réservez vos cours de piano en ligne',
  contact_email    VARCHAR(255) DEFAULT 'contact@lieusecret-courspiano.fr',
  phone            VARCHAR(50) DEFAULT '',
  instagram        TEXT DEFAULT '',
  facebook         TEXT DEFAULT '',
  youtube          TEXT DEFAULT '',
  tiktok           TEXT DEFAULT '',
  virement_iban    VARCHAR(255) DEFAULT '',
  virement_nom     VARCHAR(255) DEFAULT 'Lieu Secret',
  virement_info    TEXT DEFAULT '',
  hero_title       VARCHAR(255) DEFAULT 'L''art du piano,',
  hero_title2      VARCHAR(255) DEFAULT 'a votre rythme',
  hero_subtitle    TEXT DEFAULT 'Cours individuels, ateliers de groupe et masterclass en ligne.',
  hero_btn1        TEXT DEFAULT 'Reserver un creneau',
  hero_btn2        TEXT DEFAULT 'Decouvrir les offres',
  apropos_titre    TEXT DEFAULT 'Un espace musical unique et bienveillant',
  apropos_texte1   TEXT DEFAULT '',
  apropos_texte2   TEXT DEFAULT '',
  apropos_point1   TEXT DEFAULT 'Cours 100% en ligne via Zoom ou Google Meet',
  apropos_point2   TEXT DEFAULT 'Creneaux flexibles adaptes a votre emploi du temps',
  apropos_point3   TEXT DEFAULT 'Gestion automatique des fuseaux horaires internationaux',
  apropos_point4   TEXT DEFAULT 'Confirmation instantanee par email avec fichier .ics',
  offres_titre     TEXT DEFAULT 'Choisissez votre formule',
  offres_sous_titre TEXT DEFAULT '',
  offre1_titre     TEXT DEFAULT 'Cours individuel',
  offre1_sous      TEXT DEFAULT 'Sur mesure',
  offre1_desc      TEXT DEFAULT '',
  offre1_btn       TEXT DEFAULT 'Reserver un creneau',
  offre1_f1        TEXT DEFAULT '1h de cours en tete-a-tete',
  offre1_f2        TEXT DEFAULT 'Creneau flexible',
  offre1_f3        TEXT DEFAULT 'Suivi personnalise',
  offre1_f4        TEXT DEFAULT 'Lien Zoom envoye par email',
  offre2_titre     TEXT DEFAULT 'Atelier de groupe',
  offre2_sous      TEXT DEFAULT 'Collectif',
  offre2_desc      TEXT DEFAULT '',
  offre2_btn       TEXT DEFAULT 'Voir les ateliers',
  offre2_f1        TEXT DEFAULT 'Jusqu''a 8 participants',
  offre2_f2        TEXT DEFAULT 'Theme defini a l''avance',
  offre2_f3        TEXT DEFAULT 'Echanges et partage',
  offre2_f4        TEXT DEFAULT 'Gratuit ou payant',
  offre3_titre     TEXT DEFAULT 'Masterclass',
  offre3_sous      TEXT DEFAULT 'Perfectionnement',
  offre3_desc      TEXT DEFAULT '',
  offre3_btn       TEXT DEFAULT 'Voir les masterclass',
  offre3_f1        TEXT DEFAULT 'Niveau intermediaire/avance',
  offre3_f2        TEXT DEFAULT 'Technique approfondie',
  offre3_f3        TEXT DEFAULT 'Petits groupes (6 max)',
  offre3_f4        TEXT DEFAULT 'Enregistrement disponible',
  steps_label      TEXT DEFAULT 'Simple et rapide',
  steps_titre      TEXT DEFAULT 'Comment ca marche ?',
  cta_titre        TEXT DEFAULT 'Pret(e) a commencer ?',
  cta_sous_titre   TEXT DEFAULT 'Reservez votre premier cours des maintenant.',
  stats_label1     TEXT DEFAULT '100% En ligne',
  stats_label2     TEXT DEFAULT '1h Cours individuel',
  stats_label3     TEXT DEFAULT 'Monde entier Fuseaux horaires',
  stats_label4     TEXT DEFAULT 'Tous niveaux Debutant a avance',
  zoom_cours       TEXT DEFAULT '',
  zoom_atelier     TEXT DEFAULT '',
  zoom_masterclass TEXT DEFAULT '',
  zoom_evenement   TEXT DEFAULT '',
  stripe_public_key TEXT DEFAULT '',
  cours_access_code TEXT DEFAULT 'eleve',
  tab_cours_label  TEXT DEFAULT 'Cours individuels',
  tab_events_label TEXT DEFAULT 'Ateliers & Evenements',
  espace_eleves_title TEXT DEFAULT 'Espace eleves',
  espace_eleves_desc  TEXT DEFAULT 'Les cours individuels sont reserves aux eleves inscrits.',
  reservation_code_placeholder TEXT DEFAULT 'Votre code d''acces',
  reservation_code_btn         TEXT DEFAULT 'Acceder aux creneaux',
  reservation_contact_link     TEXT DEFAULT 'Pas encore eleve ?',
  reservation_select_date      TEXT DEFAULT 'Selectionnez une date pour voir les creneaux',
  reservation_no_slot          TEXT DEFAULT 'Aucun creneau disponible ce jour.',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABLE : admin_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : inscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS inscriptions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prenom           VARCHAR(255) NOT NULL,
  nom              VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  telephone        VARCHAR(50),
  adresse          TEXT,
  ville            VARCHAR(255),
  pays             VARCHAR(255) DEFAULT 'France',
  niveau           VARCHAR(100) NOT NULL,
  annees_pratique  VARCHAR(50),
  rythme           TEXT,
  frequence        TEXT,
  objectifs        TEXT,
  message          TEXT,
  status           VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : inscription_questions
-- ============================================================
CREATE TABLE IF NOT EXISTS inscription_questions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label      VARCHAR(255) NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'text',
  options    TEXT,
  required   BOOLEAN NOT NULL DEFAULT true,
  position   INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_events_date_heure    ON events(date_heure);
CREATE INDEX IF NOT EXISTS idx_events_is_active     ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_is_featured   ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_reservations_email   ON reservations(student_email);
CREATE INDEX IF NOT EXISTS idx_reservations_event   ON reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_reservations_slot    ON reservations(slot_start);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_rules_day            ON availability_rules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_exceptions_date      ON availability_exceptions(exception_date);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscription_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings     ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DROP POLICY IF EXISTS "events_public_read"        ON events;
DROP POLICY IF EXISTS "settings_public_read"      ON site_settings;
DROP POLICY IF EXISTS "rules_public_read"         ON availability_rules;
DROP POLICY IF EXISTS "exceptions_public_read"    ON availability_exceptions;
DROP POLICY IF EXISTS "bsettings_public_read"     ON booking_settings;
DROP POLICY IF EXISTS "questions_public_read"     ON inscription_questions;

CREATE POLICY "events_public_read"     ON events          FOR SELECT USING (is_active = true);
CREATE POLICY "settings_public_read"   ON site_settings   FOR SELECT USING (true);
CREATE POLICY "rules_public_read"      ON availability_rules FOR SELECT USING (is_active = true);
CREATE POLICY "exceptions_public_read" ON availability_exceptions FOR SELECT USING (true);
CREATE POLICY "bsettings_public_read"  ON booking_settings FOR SELECT USING (true);
CREATE POLICY "questions_public_read"  ON inscription_questions FOR SELECT USING (is_active = true);

-- Accès complet service role
DROP POLICY IF EXISTS "events_service_all"        ON events;
DROP POLICY IF EXISTS "reservations_service_all"  ON reservations;
DROP POLICY IF EXISTS "messages_service_all"      ON messages;
DROP POLICY IF EXISTS "settings_service_all"      ON site_settings;
DROP POLICY IF EXISTS "sessions_service_all"      ON admin_sessions;
DROP POLICY IF EXISTS "payments_service_all"      ON payments;
DROP POLICY IF EXISTS "inscriptions_service_all"  ON inscriptions;
DROP POLICY IF EXISTS "questions_service_all"     ON inscription_questions;
DROP POLICY IF EXISTS "rules_service_all"         ON availability_rules;
DROP POLICY IF EXISTS "exceptions_service_all"    ON availability_exceptions;
DROP POLICY IF EXISTS "bsettings_service_all"     ON booking_settings;

CREATE POLICY "events_service_all"       ON events               USING (auth.role() = 'service_role');
CREATE POLICY "reservations_service_all" ON reservations         USING (auth.role() = 'service_role');
CREATE POLICY "messages_service_all"     ON messages             USING (auth.role() = 'service_role');
CREATE POLICY "settings_service_all"     ON site_settings        USING (auth.role() = 'service_role');
CREATE POLICY "sessions_service_all"     ON admin_sessions       USING (auth.role() = 'service_role');
CREATE POLICY "payments_service_all"     ON payments             USING (auth.role() = 'service_role');
CREATE POLICY "inscriptions_service_all" ON inscriptions         USING (auth.role() = 'service_role');
CREATE POLICY "questions_service_all"    ON inscription_questions USING (auth.role() = 'service_role');
CREATE POLICY "rules_service_all"        ON availability_rules   USING (auth.role() = 'service_role');
CREATE POLICY "exceptions_service_all"   ON availability_exceptions USING (auth.role() = 'service_role');
CREATE POLICY "bsettings_service_all"    ON booking_settings     USING (auth.role() = 'service_role');

-- Insertions publiques
DROP POLICY IF EXISTS "reservations_public_insert" ON reservations;
DROP POLICY IF EXISTS "messages_public_insert"     ON messages;
DROP POLICY IF EXISTS "inscriptions_public_insert" ON inscriptions;

CREATE POLICY "reservations_public_insert" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_public_insert"     ON messages     FOR INSERT WITH CHECK (true);
CREATE POLICY "inscriptions_public_insert" ON inscriptions FOR INSERT WITH CHECK (true);
-- ============================================================
-- TABLE : medias (photos, videos, temoignages)
-- ============================================================
CREATE TABLE IF NOT EXISTS medias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        VARCHAR(20) NOT NULL DEFAULT 'photo', -- 'photo', 'video', 'temoignage'
  titre       VARCHAR(255),
  description TEXT,
  url         TEXT NOT NULL,
  auteur      VARCHAR(255),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "medias_service_all" ON medias;
DROP POLICY IF EXISTS "medias_public_read" ON medias;
CREATE POLICY "medias_service_all" ON medias USING (auth.role() = 'service_role');
CREATE POLICY "medias_public_read" ON medias FOR SELECT USING (is_active = true);
