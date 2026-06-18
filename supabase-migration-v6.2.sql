-- ============================================================
-- MIGRATION v6.2 — Espace audio/vidéo élève
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ── 1. Table des envois audio/vidéo ──────────────────────
CREATE TABLE IF NOT EXISTS eleve_medias_prives (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      UUID REFERENCES eleves(id) ON DELETE CASCADE,
  titre         TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL DEFAULT 'audio', -- 'audio', 'video', 'lien'
  url           TEXT,           -- URL Supabase Storage ou lien externe
  storage_path  TEXT,           -- chemin dans Supabase Storage
  taille_bytes  BIGINT,
  duree_sec     INTEGER,
  commentaire_admin TEXT,       -- réponse du professeur
  commentaire_at    TIMESTAMPTZ,
  lu_admin      BOOLEAN DEFAULT FALSE,
  lu_eleve      BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eleve_medias_prives_eleve ON eleve_medias_prives(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_medias_prives_created ON eleve_medias_prives(created_at DESC);

ALTER TABLE eleve_medias_prives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access emp" ON eleve_medias_prives;
CREATE POLICY "Service role full access emp" ON eleve_medias_prives FOR ALL USING (true);

-- ── 2. Configuration Cloudinary (variables Vercel) ────────
-- Ajoutez ces variables dans Vercel > Settings > Environment Variables :
--
-- CLOUDINARY_CLOUD_NAME  = votre_cloud_name (ex: dxxxxxxxx)
-- CLOUDINARY_API_KEY     = votre_api_key
-- CLOUDINARY_API_SECRET  = votre_api_secret
--
-- Trouvez ces valeurs dans : cloudinary.com > Dashboard > API Keys
--
-- Plan gratuit Cloudinary : 25 Go de stockage + 25 Go bande passante/mois
-- Largement suffisant pour des centaines d'enregistrements audio/vidéo