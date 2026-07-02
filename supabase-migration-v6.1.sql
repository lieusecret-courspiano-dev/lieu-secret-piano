-- ============================================================
-- MIGRATION v6.1 — Messagerie élève + Répertoire personnel
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ── 1. Messagerie élève ↔ professeur ─────────────────────
CREATE TABLE IF NOT EXISTS eleve_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  expediteur  TEXT NOT NULL DEFAULT 'eleve', -- 'eleve' ou 'admin'
  contenu     TEXT NOT NULL,
  lu          BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eleve_messages_eleve ON eleve_messages(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_messages_created ON eleve_messages(created_at DESC);

ALTER TABLE eleve_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access eleve_messages" ON eleve_messages;
CREATE POLICY "Service role full access eleve_messages" ON eleve_messages FOR ALL USING (true);

-- ── 2. Répertoire personnel ───────────────────────────────
CREATE TABLE IF NOT EXISTS eleve_repertoire (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  titre       TEXT NOT NULL,
  compositeur TEXT,
  statut      TEXT DEFAULT 'en_cours',
  -- Statuts: 'souhaite' (à apprendre), 'en_cours' (en travail), 'maitrise' (maîtrisé)
  notes       TEXT,
  lien_url    TEXT,  -- lien YouTube ou partition
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eleve_repertoire_eleve ON eleve_repertoire(eleve_id);

ALTER TABLE eleve_repertoire ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access eleve_repertoire" ON eleve_repertoire;
CREATE POLICY "Service role full access eleve_repertoire" ON eleve_repertoire FOR ALL USING (true);