-- ============================================================
-- LIEU SECRET — Migration V4.1
-- Table ressources (si pas encore créée via v4.0)
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS ressources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre       VARCHAR(255) NOT NULL,
  description TEXT,
  type        VARCHAR(50) NOT NULL DEFAULT 'pdf',
  url         TEXT,
  contenu     TEXT,
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

SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ressources';
