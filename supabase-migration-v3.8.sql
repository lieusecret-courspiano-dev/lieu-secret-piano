-- ============================================================
-- LIEU SECRET — Migration V3.8
-- Colonnes tarifs + bannière dans site_settings
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

-- ── Bannière ─────────────────────────────────────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS banner_actif   TEXT DEFAULT 'false',
  ADD COLUMN IF NOT EXISTS banner_message TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_type    TEXT DEFAULT 'info';

-- ── Tarifs ───────────────────────────────────────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS tarif_cours_1h    TEXT DEFAULT '22',
  ADD COLUMN IF NOT EXISTS tarif_pack_label1 TEXT DEFAULT 'Pack 5h',
  ADD COLUMN IF NOT EXISTS tarif_pack_prix1  TEXT DEFAULT '100',
  ADD COLUMN IF NOT EXISTS tarif_pack_desc1  TEXT DEFAULT '5 heures de cours',
  ADD COLUMN IF NOT EXISTS tarif_pack_label2 TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tarif_pack_prix2  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tarif_pack_desc2  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tarif_pack_label3 TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tarif_pack_prix3  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tarif_pack_desc3  TEXT DEFAULT '';

-- ── Professeur ───────────────────────────────────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS prof_nom       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_titre     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_photo     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_bio       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_vision    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_pedagogie TEXT DEFAULT '';

-- ── WhatsApp ─────────────────────────────────────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '';

-- ── Vérification ─────────────────────────────────────────
SELECT column_name FROM information_schema.columns
WHERE table_name = 'site_settings'
  AND column_name IN ('banner_actif', 'tarif_cours_1h', 'prof_nom', 'whatsapp')
ORDER BY column_name;