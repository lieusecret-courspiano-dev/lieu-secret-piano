-- ══════════════════════════════════════════════════════════════════
-- SYSTÈME D'EXAMENS FINAUX — Lieu Secret Piano
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════
-- Architecture: réutilise les tables existantes (competences,
-- eleve_progression, certificats) sans les modifier.
-- ══════════════════════════════════════════════════════════════════

-- ── Table: examens ────────────────────────────────────────────────
-- Définit un examen final (créé par l'admin)
CREATE TABLE IF NOT EXISTS examens (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titre           TEXT        NOT NULL,
  description     TEXT,
  categorie       TEXT        NOT NULL,  -- 'Fondamentaux' | 'Compréhension et autonomie' | 'Expression et maîtrise'
  quiz_id         UUID        REFERENCES quiz(id) ON DELETE SET NULL,  -- quiz utilisé comme base
  score_min       INTEGER     NOT NULL DEFAULT 75,  -- % minimum pour réussir
  duree_minutes   INTEGER     NOT NULL DEFAULT 60,  -- durée en minutes
  date_examen     TIMESTAMPTZ NOT NULL,             -- date et heure de début
  nb_tentatives   INTEGER     NOT NULL DEFAULT 1,   -- tentatives autorisées
  est_actif       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table: examen_eleves ──────────────────────────────────────────
-- Élèves autorisés à passer un examen
CREATE TABLE IF NOT EXISTS examen_eleves (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  examen_id   UUID        NOT NULL REFERENCES examens(id) ON DELETE CASCADE,
  eleve_id    UUID        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  tentatives  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(examen_id, eleve_id)
);

-- ── Table: examen_sessions ────────────────────────────────────────
-- Une session = un élève qui passe un examen
CREATE TABLE IF NOT EXISTS examen_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  examen_id       UUID        NOT NULL REFERENCES examens(id) ON DELETE CASCADE,
  eleve_id        UUID        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  submitted_at    TIMESTAMPTZ,                    -- NULL = en cours
  reponses        JSONB       DEFAULT '{}',       -- {question_id: reponse}
  score           NUMERIC(5,2),                   -- % obtenu
  reussi          BOOLEAN,
  niveau_medaille TEXT,                           -- 'bronze' | 'argent' | 'or' | NULL
  tentative_num   INTEGER     NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Index ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_examen_eleves_examen_id ON examen_eleves(examen_id);
CREATE INDEX IF NOT EXISTS idx_examen_eleves_eleve_id  ON examen_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_examen_sessions_examen  ON examen_sessions(examen_id);
CREATE INDEX IF NOT EXISTS idx_examen_sessions_eleve   ON examen_sessions(eleve_id);

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE examens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE examen_eleves    ENABLE ROW LEVEL SECURITY;
ALTER TABLE examen_sessions  ENABLE ROW LEVEL SECURITY;

-- Service role: accès complet
DROP POLICY IF EXISTS "examens_service"         ON examens;
DROP POLICY IF EXISTS "examen_eleves_service"   ON examen_eleves;
DROP POLICY IF EXISTS "examen_sessions_service" ON examen_sessions;

CREATE POLICY "examens_service"         ON examens         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "examen_eleves_service"   ON examen_eleves   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "examen_sessions_service" ON examen_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Trigger updated_at ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_examens_updated_at ON examens;
CREATE TRIGGER trg_examens_updated_at
  BEFORE UPDATE ON examens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Vérification ──────────────────────────────────────────────────
SELECT 'Tables examens créées avec succès' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('examens', 'examen_eleves', 'examen_sessions')
ORDER BY table_name;
