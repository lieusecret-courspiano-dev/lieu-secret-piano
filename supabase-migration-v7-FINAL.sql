-- ============================================================
-- MIGRATION v7 FINALE — Sans aucune politique RLS
-- Exécutez ce fichier tel quel dans Supabase SQL Editor
-- ============================================================

-- Tables Quiz
CREATE TABLE IF NOT EXISTS quiz (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         TEXT NOT NULL,
  description   TEXT,
  niveau        TEXT DEFAULT 'fondamentaux',
  module        TEXT,
  competence_id UUID,
  score_min     INTEGER DEFAULT 70,
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
  points        INTEGER DEFAULT 1,
  position      INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_resultats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID REFERENCES quiz(id) ON DELETE CASCADE,
  eleve_id      UUID REFERENCES eleves(id) ON DELETE CASCADE,
  score         INTEGER NOT NULL,
  reponses      JSONB,
  reussi        BOOLEAN DEFAULT FALSE,
  tentative     INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tables Supports
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

CREATE TABLE IF NOT EXISTS supports_progression (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_id    UUID REFERENCES supports_pedagogiques(id) ON DELETE CASCADE,
  eleve_id      UUID REFERENCES eleves(id) ON DELETE CASCADE,
  page_actuelle INTEGER DEFAULT 1,
  statut        TEXT DEFAULT 'non_commence',
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(support_id, eleve_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quiz_resultats_eleve  ON quiz_resultats(eleve_id);
CREATE INDEX IF NOT EXISTS idx_quiz_resultats_quiz   ON quiz_resultats(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz   ON quiz_questions(quiz_id, position);
CREATE INDEX IF NOT EXISTS idx_supports_achats_eleve ON supports_achats(eleve_id);
CREATE INDEX IF NOT EXISTS idx_supports_prog_eleve   ON supports_progression(eleve_id);

-- RLS : activer seulement si pas déjà actif (pas d'erreur si déjà actif)
DO $$ BEGIN ALTER TABLE quiz ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE quiz_resultats ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE supports_pedagogiques ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE supports_achats ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE supports_progression ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Politiques RLS : créer seulement si elles n'existent pas
DO $$ BEGIN CREATE POLICY "srole quiz"       ON quiz                 FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "srole quiz_q"     ON quiz_questions        FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "srole quiz_r"     ON quiz_resultats        FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "srole supports"   ON supports_pedagogiques FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "srole supports_a" ON supports_achats       FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "srole supports_p" ON supports_progression  FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
