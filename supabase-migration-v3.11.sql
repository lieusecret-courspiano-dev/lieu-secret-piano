-- ============================================================
-- LIEU SECRET — Migration V3.11
-- Colonnes manquantes : tarif_pack_desc4, bons cadeaux formules
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

-- Colonne manquante tarif_pack_desc4
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS tarif_pack_label4 TEXT DEFAULT 'Pack 20h',
  ADD COLUMN IF NOT EXISTS tarif_pack_prix4  TEXT DEFAULT '420',
  ADD COLUMN IF NOT EXISTS tarif_pack_desc4  TEXT DEFAULT '20 heures de cours';

-- Colonnes bons cadeaux formules
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS cadeau_formule1_label TEXT DEFAULT 'Bon Découverte',
  ADD COLUMN IF NOT EXISTS cadeau_formule1_desc  TEXT DEFAULT '1 cours de piano',
  ADD COLUMN IF NOT EXISTS cadeau_formule1_prix  TEXT DEFAULT '22',
  ADD COLUMN IF NOT EXISTS cadeau_formule2_label TEXT DEFAULT 'Bon Progression',
  ADD COLUMN IF NOT EXISTS cadeau_formule2_desc  TEXT DEFAULT '3 cours de piano',
  ADD COLUMN IF NOT EXISTS cadeau_formule2_prix  TEXT DEFAULT '60',
  ADD COLUMN IF NOT EXISTS cadeau_formule3_label TEXT DEFAULT 'Bon Immersion',
  ADD COLUMN IF NOT EXISTS cadeau_formule3_desc  TEXT DEFAULT '5 cours de piano',
  ADD COLUMN IF NOT EXISTS cadeau_formule3_prix  TEXT DEFAULT '90';

-- Vérification
SELECT column_name FROM information_schema.columns
WHERE table_name = 'site_settings'
  AND column_name IN ('tarif_pack_desc4', 'cadeau_formule1_label', 'cadeau_formule2_label', 'cadeau_formule3_label')
ORDER BY column_name;
