-- Ajouter la table examen_questions (questions propres à l'examen, indépendantes des quiz)
CREATE TABLE IF NOT EXISTS examen_questions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  examen_id     UUID        NOT NULL REFERENCES examens(id) ON DELETE CASCADE,
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
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_examen_questions_examen_id ON examen_questions(examen_id);

ALTER TABLE examen_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "examen_questions_service" ON examen_questions;
CREATE POLICY "examen_questions_service" ON examen_questions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

SELECT 'examen_questions créée' AS status;
