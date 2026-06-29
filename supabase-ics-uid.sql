-- ═══════════════════════════════════════════════════════════
-- Ajout colonne ics_uid dans reservations
-- Permet de réutiliser le même UID ICS lors de l'annulation
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS ics_uid TEXT;

-- Index pour retrouver rapidement par UID
CREATE INDEX IF NOT EXISTS idx_reservations_ics_uid ON reservations(ics_uid);

SELECT 'Colonne ics_uid ajoutée avec succès' AS status;