-- ═══════════════════════════════════════════════════════════
-- TABLE BLOG ARTICLES
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blog_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  extrait     TEXT DEFAULT '',
  contenu     TEXT DEFAULT '',
  categorie   TEXT DEFAULT 'Conseils',
  image_url   TEXT,
  temps_lecture TEXT DEFAULT '5 min',
  est_publie  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Index pour les recherches par slug et catégorie
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categorie ON blog_articles(categorie);
CREATE INDEX IF NOT EXISTS idx_blog_publie ON blog_articles(est_publie);

-- RLS
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- Lecture publique des articles publiés
DROP POLICY IF EXISTS "blog_public_read" ON blog_articles;
CREATE POLICY "blog_public_read" ON blog_articles
  FOR SELECT USING (est_publie = true);

-- Accès complet pour le service role (admin)
DROP POLICY IF EXISTS "blog_service_all" ON blog_articles;
CREATE POLICY "blog_service_all" ON blog_articles
  FOR ALL USING (true)
  WITH CHECK (true);

SELECT 'Table blog_articles créée avec succès' AS status;