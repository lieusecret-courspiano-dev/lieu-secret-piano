-- ============================================================
-- LIEU SECRET — Migration V3.7
-- Colonne gift_code dans reservations
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS gift_code VARCHAR(20) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_gift_code ON reservations(gift_code);

-- Vérification
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'reservations' AND column_name = 'gift_code';