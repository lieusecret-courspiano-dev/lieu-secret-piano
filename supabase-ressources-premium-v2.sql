-- ═══════════════════════════════════════════════════════════
-- RESSOURCES PREMIUM v2 — Ajout champs aperçu et infos techniques
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Ajouter les nouveaux champs à la table existante
ALTER TABLE ressources_premium
  ADD COLUMN IF NOT EXISTS nb_pages       INTEGER,
  ADD COLUMN IF NOT EXISTS taille_fichier TEXT,
  ADD COLUMN IF NOT EXISTS qualite_video  TEXT DEFAULT 'HD',
  ADD COLUMN IF NOT EXISTS format_audio   TEXT DEFAULT 'MP3',
  ADD COLUMN IF NOT EXISTS apercu_duree   INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS apercu_pages   INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS apercu_url     TEXT;

SELECT 'Champs aperçu ajoutés avec succès' AS status;