-- ============================================================
-- LIEU SECRET — Migration V4.0
-- Espace Élève Complet
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

-- ── Table élèves (comptes) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS eleves (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  prenom          VARCHAR(100) NOT NULL,
  nom             VARCHAR(100) NOT NULL,
  telephone       VARCHAR(30),
  timezone        VARCHAR(100) DEFAULT 'Europe/Paris',
  password_hash   TEXT,
  reset_token     TEXT,
  reset_expires   TIMESTAMPTZ,
  setup_token     TEXT,
  setup_expires   TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eleves_email ON eleves(email);
ALTER TABLE eleves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eleves_service_all" ON eleves;
CREATE POLICY "eleves_service_all" ON eleves USING (auth.role() = 'service_role');

-- ── Table sessions élèves ───────────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id    UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eleve_sessions_token ON eleve_sessions(token);
ALTER TABLE eleve_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eleve_sessions_service_all" ON eleve_sessions;
CREATE POLICY "eleve_sessions_service_all" ON eleve_sessions USING (auth.role() = 'service_role');

-- ── Table progression élèves ────────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_progression (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id    UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  competence  VARCHAR(255) NOT NULL,
  categorie   VARCHAR(100) NOT NULL,
  validee     BOOLEAN DEFAULT false,
  validee_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progression_eleve ON eleve_progression(eleve_id);
ALTER TABLE eleve_progression ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progression_service_all" ON eleve_progression;
CREATE POLICY "progression_service_all" ON eleve_progression USING (auth.role() = 'service_role');

-- ── Table compétences ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS competences (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categorie   VARCHAR(100) NOT NULL,
  nom         VARCHAR(255) NOT NULL,
  ordre       INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE competences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "competences_service_all" ON competences;
DROP POLICY IF EXISTS "competences_public_read" ON competences;
CREATE POLICY "competences_service_all" ON competences USING (auth.role() = 'service_role');
CREATE POLICY "competences_public_read" ON competences FOR SELECT USING (true);

-- Compétences par défaut (sans doublons)
INSERT INTO competences (categorie, nom, ordre) VALUES
  ('Fondamentaux', 'Découverte du clavier', 1),
  ('Fondamentaux', 'Position des mains', 2),
  ('Fondamentaux', 'Premiers accords', 3),
  ('Fondamentaux', 'Lecture rythmique', 4),
  ('Accompagnement', 'Accords majeurs', 1),
  ('Accompagnement', 'Accords mineurs', 2),
  ('Accompagnement', 'Renversements', 3),
  ('Accompagnement', 'Progressions harmoniques', 4),
  ('Oreille musicale', 'Reconnaissance d''intervalles', 1),
  ('Oreille musicale', 'Relevé d''accords', 2),
  ('Oreille musicale', 'Accompagnement à l''oreille', 3),
  ('Improvisation', 'Créativité musicale', 1),
  ('Improvisation', 'Variations rythmiques', 2),
  ('Improvisation', 'Improvisation libre', 3)
ON CONFLICT DO NOTHING;

-- ── Table ressources ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ressources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre       VARCHAR(255) NOT NULL,
  description TEXT,
  type        VARCHAR(50) NOT NULL DEFAULT 'pdf',
  url         TEXT,
  categorie   VARCHAR(100),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE SET NULL,
  is_public   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ressources_eleve ON ressources(eleve_id);
ALTER TABLE ressources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ressources_service_all" ON ressources;
DROP POLICY IF EXISTS "ressources_public_read" ON ressources;
CREATE POLICY "ressources_service_all" ON ressources USING (auth.role() = 'service_role');
CREATE POLICY "ressources_public_read" ON ressources FOR SELECT USING (is_public = true);

-- ── Table notes de cours ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes_cours (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id        UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
  date_cours      DATE NOT NULL,
  resume          TEXT,
  notions         TEXT,
  exercices       TEXT,
  objectifs       TEXT,
  commentaires    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_eleve ON notes_cours(eleve_id);
ALTER TABLE notes_cours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes_service_all" ON notes_cours;
CREATE POLICY "notes_service_all" ON notes_cours USING (auth.role() = 'service_role');

-- ── Table certificats ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id        UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  numero          VARCHAR(20) NOT NULL UNIQUE,
  nom_certificat  VARCHAR(255) NOT NULL,
  niveau          VARCHAR(100),
  date_obtention  DATE NOT NULL,
  commentaire     TEXT,
  verset          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificats_eleve ON certificats(eleve_id);
ALTER TABLE certificats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certificats_service_all" ON certificats;
CREATE POLICY "certificats_service_all" ON certificats USING (auth.role() = 'service_role');

-- ── Table notifications élèves ──────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id    UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  titre       VARCHAR(255) NOT NULL,
  message     TEXT,
  lu          BOOLEAN DEFAULT false,
  lien        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_eleve ON eleve_notifications(eleve_id);
ALTER TABLE eleve_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifs_service_all" ON eleve_notifications;
CREATE POLICY "notifs_service_all" ON eleve_notifications USING (auth.role() = 'service_role');

-- ── Ajouter eleve_id dans les tables existantes ─────────────
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS eleve_id UUID REFERENCES eleves(id) ON DELETE SET NULL;
ALTER TABLE course_packs ADD COLUMN IF NOT EXISTS eleve_id UUID REFERENCES eleves(id) ON DELETE SET NULL;
ALTER TABLE gift_cards   ADD COLUMN IF NOT EXISTS eleve_id UUID REFERENCES eleves(id) ON DELETE SET NULL;

-- ── Colonnes supplémentaires ────────────────────────────────
ALTER TABLE course_packs ADD COLUMN IF NOT EXISTS heures_utilisees INTEGER NOT NULL DEFAULT 0;
ALTER TABLE course_packs ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';

-- Vérification
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('eleves', 'eleve_sessions', 'eleve_progression', 'competences', 'ressources', 'notes_cours', 'certificats', 'eleve_notifications')
ORDER BY table_name;
