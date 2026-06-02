-- ============================================================
-- LIEU SECRET — Migration V3.1
-- Nouvelles colonnes suite aux améliorations
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

-- ── Ajout colonne WhatsApp dans site_settings ──────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '';

-- ── Ajout colonnes page réservation ────────────────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS reservation_titre      TEXT DEFAULT 'Réservez votre cours de piano',
  ADD COLUMN IF NOT EXISTS reservation_sous_titre TEXT DEFAULT 'Choisissez un créneau et commencez votre aventure musicale';

-- ── Mise à jour de la ligne existante avec les nouvelles valeurs par défaut ──
UPDATE site_settings
SET
  whatsapp               = COALESCE(whatsapp, ''),
  reservation_titre      = COALESCE(reservation_titre, 'Réservez votre cours de piano'),
  reservation_sous_titre = COALESCE(reservation_sous_titre, 'Choisissez un créneau et commencez votre aventure musicale')
WHERE id = 1;

-- ── Vérification ───────────────────────────────────────────
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'site_settings'
  AND column_name IN ('whatsapp', 'reservation_titre', 'reservation_sous_titre')
ORDER BY column_name;