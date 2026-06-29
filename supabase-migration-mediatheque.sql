-- Migration Médiathèque — Renommage partitions → mediatheque
-- À exécuter dans Supabase SQL Editor

-- Créer la table mediatheque (si partitions n'existe pas encore)
CREATE TABLE IF NOT EXISTS mediatheque (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre        TEXT NOT NULL,
  compositeur  TEXT,
  niveau       TEXT DEFAULT 'tous',
  type         TEXT DEFAULT 'pdf',  -- pdf, video, audio, partition, exercice, lien
  style        TEXT DEFAULT 'classique',
  description  TEXT,
  url_pdf      TEXT,
  url_video    TEXT,
  url_audio    TEXT,
  url_image    TEXT,  -- miniature/aperçu
  gratuit      BOOLEAN DEFAULT TRUE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Si la table partitions existe déjà, migrer les données
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partitions') THEN
    INSERT INTO mediatheque (id, titre, compositeur, niveau, type, style, description, url_pdf, url_audio, gratuit, is_active, created_at)
    SELECT id, titre, compositeur, niveau, 'pdf', style, description, url_pdf, url_audio, gratuit, is_active, created_at
    FROM partitions
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mediatheque_niveau ON mediatheque(niveau);
CREATE INDEX IF NOT EXISTS idx_mediatheque_type ON mediatheque(type);
CREATE INDEX IF NOT EXISTS idx_mediatheque_active ON mediatheque(is_active);

-- Ajouter colonne url_image dans ressources si pas présente
ALTER TABLE ressources ADD COLUMN IF NOT EXISTS url_image TEXT;
ALTER TABLE ressources ADD COLUMN IF NOT EXISTS duree TEXT;  -- durée vidéo ex: "12:34"
