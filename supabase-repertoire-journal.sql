-- ══════════════════════════════════════════════════════════════════
-- TABLE: eleve_repertoire — Mon répertoire musical
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS eleve_repertoire (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  titre       TEXT NOT NULL,
  compositeur TEXT,
  tonalite    TEXT,
  niveau      TEXT,  -- 'Débutant', 'Intermédiaire', 'Avancé'
  statut      TEXT NOT NULL DEFAULT 'a_apprendre',
  -- statut: 'a_apprendre' | 'en_cours' | 'maitrise'
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_eleve_repertoire_eleve_id ON eleve_repertoire(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_repertoire_statut   ON eleve_repertoire(statut);

-- RLS
ALTER TABLE eleve_repertoire ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eleve_repertoire_own" ON eleve_repertoire;
CREATE POLICY "eleve_repertoire_own" ON eleve_repertoire
  FOR ALL USING (
    eleve_id = (
      SELECT eleve_id FROM eleve_sessions
      WHERE token = current_setting('request.cookies', true)::json->>'ls_eleve_session'
      AND expires_at > NOW()
    )
  );

-- Service role accès complet
DROP POLICY IF EXISTS "eleve_repertoire_service" ON eleve_repertoire;
CREATE POLICY "eleve_repertoire_service" ON eleve_repertoire
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_eleve_repertoire_updated_at ON eleve_repertoire;
CREATE TRIGGER update_eleve_repertoire_updated_at
  BEFORE UPDATE ON eleve_repertoire
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ══════════════════════════════════════════════════════════════════
-- TABLE: eleve_journal — Journal de pratique
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS eleve_journal (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id       UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  date_pratique  DATE NOT NULL DEFAULT CURRENT_DATE,
  duree_minutes  INTEGER NOT NULL CHECK (duree_minutes > 0),
  humeur         TEXT,  -- 'excellent' | 'bien' | 'moyen' | 'difficile'
  morceaux       TEXT,  -- morceaux travaillés (texte libre)
  notes          TEXT,  -- notes personnelles
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_eleve_journal_eleve_id      ON eleve_journal(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_journal_date_pratique ON eleve_journal(date_pratique DESC);

-- RLS
ALTER TABLE eleve_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eleve_journal_own" ON eleve_journal;
CREATE POLICY "eleve_journal_own" ON eleve_journal
  FOR ALL USING (
    eleve_id = (
      SELECT eleve_id FROM eleve_sessions
      WHERE token = current_setting('request.cookies', true)::json->>'ls_eleve_session'
      AND expires_at > NOW()
    )
  );

-- Service role accès complet
DROP POLICY IF EXISTS "eleve_journal_service" ON eleve_journal;
CREATE POLICY "eleve_journal_service" ON eleve_journal
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════════
-- COLONNES SUPPLÉMENTAIRES sur la table eleves
-- (nécessaires pour le journal de pratique)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE eleves ADD COLUMN IF NOT EXISTS total_heures_pratique INTEGER DEFAULT 0;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS streak_semaines        INTEGER DEFAULT 0;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS streak_derniere_semaine TEXT;


-- ══════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ══════════════════════════════════════════════════════════════════

SELECT 'eleve_repertoire OK' AS status, COUNT(*) AS nb_lignes FROM eleve_repertoire
UNION ALL
SELECT 'eleve_journal OK', COUNT(*) FROM eleve_journal;
