-- ═══════════════════════════════════════════════════════════
-- TABLE NEWSLETTER SUBSCRIBERS
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  source     TEXT DEFAULT 'site',   -- 'site', 'blog', 'footer', etc.
  actif      BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_actif  ON newsletter_subscribers(actif);

-- RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Seul le service role peut lire/écrire (pas d'accès public)
DROP POLICY IF EXISTS "newsletter_service_all" ON newsletter_subscribers;
CREATE POLICY "newsletter_service_all" ON newsletter_subscribers
  FOR ALL USING (true) WITH CHECK (true);

SELECT 'Table newsletter_subscribers créée avec succès' AS status;