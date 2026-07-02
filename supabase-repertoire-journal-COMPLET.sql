-- ══════════════════════════════════════════════════════════════════
-- TABLES COMPLÈTES: eleve_repertoire + eleve_journal
-- Tous les champs utilisés par les pages espace élève
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── TABLE: eleve_repertoire ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_repertoire (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  titre       TEXT        NOT NULL,
  compositeur TEXT,
  tonalite    TEXT,
  niveau      TEXT,        -- 'Débutant' | 'Intermédiaire' | 'Avancé'
  statut      TEXT        NOT NULL DEFAULT 'a_apprendre',
  -- statut: 'a_apprendre' | 'en_cours' | 'maitrise'
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes si la table existe déjà
ALTER TABLE eleve_repertoire ADD COLUMN IF NOT EXISTS compositeur TEXT;
ALTER TABLE eleve_repertoire ADD COLUMN IF NOT EXISTS tonalite    TEXT;
ALTER TABLE eleve_repertoire ADD COLUMN IF NOT EXISTS niveau      TEXT;
ALTER TABLE eleve_repertoire ADD COLUMN IF NOT EXISTS notes       TEXT;
ALTER TABLE eleve_repertoire ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- Index
CREATE INDEX IF NOT EXISTS idx_eleve_repertoire_eleve_id ON eleve_repertoire(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_repertoire_statut   ON eleve_repertoire(statut);

-- RLS
ALTER TABLE eleve_repertoire ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eleve_repertoire_service" ON eleve_repertoire;
CREATE POLICY "eleve_repertoire_service" ON eleve_repertoire
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_eleve_repertoire_updated_at ON eleve_repertoire;
CREATE TRIGGER trg_eleve_repertoire_updated_at
  BEFORE UPDATE ON eleve_repertoire
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── TABLE: eleve_journal ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_journal (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id       UUID        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  date_pratique  DATE        NOT NULL DEFAULT CURRENT_DATE,
  duree_minutes  INTEGER     NOT NULL DEFAULT 30 CHECK (duree_minutes > 0),
  humeur         TEXT,        -- 'excellent' | 'bien' | 'moyen' | 'difficile'
  morceaux       TEXT,        -- morceaux travaillés (texte libre)
  notes          TEXT,        -- notes personnelles
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes si la table existe déjà
ALTER TABLE eleve_journal ADD COLUMN IF NOT EXISTS date_pratique  DATE    DEFAULT CURRENT_DATE;
ALTER TABLE eleve_journal ADD COLUMN IF NOT EXISTS duree_minutes  INTEGER DEFAULT 30;
ALTER TABLE eleve_journal ADD COLUMN IF NOT EXISTS humeur         TEXT;
ALTER TABLE eleve_journal ADD COLUMN IF NOT EXISTS morceaux       TEXT;
ALTER TABLE eleve_journal ADD COLUMN IF NOT EXISTS notes          TEXT;

-- Index
CREATE INDEX IF NOT EXISTS idx_eleve_journal_eleve_id      ON eleve_journal(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_journal_date_pratique ON eleve_journal(date_pratique DESC);

-- RLS
ALTER TABLE eleve_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eleve_journal_service" ON eleve_journal;
CREATE POLICY "eleve_journal_service" ON eleve_journal
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── COLONNES sur la table eleves (pour le journal) ─────────────────
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS total_heures_pratique  INTEGER DEFAULT 0;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS streak_semaines         INTEGER DEFAULT 0;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS streak_derniere_semaine TEXT;


-- ── VÉRIFICATION FINALE ────────────────────────────────────────────
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('eleve_repertoire', 'eleve_journal')
ORDER BY table_name, ordinal_position;
