-- ══════════════════════════════════════════════════════════════
-- TABLE : banque_questions
-- Questions réutilisables par catégorie pour les examens finaux
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS banque_questions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie     TEXT        NOT NULL DEFAULT 'Fondamentaux',
  type          TEXT        NOT NULL DEFAULT 'qcm',
  question      TEXT        NOT NULL,
  options       JSONB,
  bonne_reponse TEXT,
  explication   TEXT,
  audio_url     TEXT,
  image_url     TEXT,
  video_url     TEXT,
  points        INTEGER     NOT NULL DEFAULT 1,
  position      INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banque_questions_categorie ON banque_questions(categorie);
CREATE INDEX IF NOT EXISTS idx_banque_questions_position  ON banque_questions(categorie, position);

ALTER TABLE banque_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "banque_questions_service" ON banque_questions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "banque_questions_service"
  ON banque_questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

SELECT 'banque_questions créée avec succès' AS status;
SELECT COUNT(*) AS nb_questions FROM banque_questions;
