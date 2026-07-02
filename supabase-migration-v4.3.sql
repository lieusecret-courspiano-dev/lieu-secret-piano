-- Migration v4.3 — Colonnes page packs + nettoyage
-- À exécuter dans Supabase SQL Editor

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS packs_label      TEXT DEFAULT 'Packs de cours',
  ADD COLUMN IF NOT EXISTS packs_titre      TEXT DEFAULT 'Acheter un pack de cours',
  ADD COLUMN IF NOT EXISTS packs_sous_titre TEXT DEFAULT 'Achetez un pack d''heures et réservez vos cours au fur et à mesure.';

-- Mettre à jour la ligne existante avec les valeurs par défaut si vides
UPDATE site_settings
SET
  packs_label      = COALESCE(NULLIF(packs_label, ''), 'Packs de cours'),
  packs_titre      = COALESCE(NULLIF(packs_titre, ''), 'Acheter un pack de cours'),
  packs_sous_titre = COALESCE(NULLIF(packs_sous_titre, ''), 'Achetez un pack d''heures et réservez vos cours au fur et à mesure.')
WHERE id = 1;
