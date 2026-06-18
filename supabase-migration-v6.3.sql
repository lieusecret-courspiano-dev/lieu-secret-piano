-- ============================================================
-- MIGRATION v6.3 — Objectifs, Streak, Journal, Badges
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ── 1. Objectifs personnels ───────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_objectifs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  titre       TEXT NOT NULL,
  description TEXT,
  date_cible  DATE,
  statut      TEXT DEFAULT 'en_cours', -- 'en_cours', 'atteint', 'abandonne'
  progres     INTEGER DEFAULT 0,       -- 0-100%
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_objectifs_eleve ON eleve_objectifs(eleve_id);
ALTER TABLE eleve_objectifs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access objectifs" ON eleve_objectifs;
CREATE POLICY "Service role full access objectifs" ON eleve_objectifs FOR ALL USING (true);

-- ── 2. Journal de pratique ────────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_journal (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  date_pratique DATE NOT NULL DEFAULT CURRENT_DATE,
  duree_min   INTEGER NOT NULL DEFAULT 30, -- durée en minutes
  contenu     TEXT,                        -- ce qui a été travaillé
  humeur      TEXT DEFAULT 'bien',         -- 'difficile', 'bien', 'excellent'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eleve_journal_eleve ON eleve_journal(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_journal_date ON eleve_journal(date_pratique DESC);
ALTER TABLE eleve_journal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access journal" ON eleve_journal;
CREATE POLICY "Service role full access journal" ON eleve_journal FOR ALL USING (true);

-- ── 3. Badges & Récompenses ───────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  badge_key   TEXT NOT NULL,  -- identifiant unique du badge
  badge_nom   TEXT NOT NULL,
  badge_desc  TEXT,
  badge_icon  TEXT,           -- emoji ou nom d'icône
  obtenu_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(eleve_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_eleve_badges_eleve ON eleve_badges(eleve_id);
ALTER TABLE eleve_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access badges" ON eleve_badges;
CREATE POLICY "Service role full access badges" ON eleve_badges FOR ALL USING (true);

-- ── 4. Streak (régularité) ────────────────────────────────
-- Stocké dans la table eleves comme colonnes supplémentaires
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS streak_semaines INTEGER DEFAULT 0;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS streak_derniere_semaine TEXT; -- format YYYY-WW
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS total_heures_pratique INTEGER DEFAULT 0;