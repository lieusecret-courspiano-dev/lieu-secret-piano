-- ============================================================
-- LIEU SECRET — Migration V3.10
-- Colonne pack_code dans reservations
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS pack_code VARCHAR(20) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_pack_code ON reservations(pack_code);

-- Vérification
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'reservations' AND column_name IN ('gift_code', 'pack_code')
ORDER BY column_name;