-- ============================================================
-- LIEU SECRET — Migration V3.3
-- Nouvelles colonnes : professeur + suppression valeurs par défaut
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

-- ── 1. Colonnes profil professeur ─────────────────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS prof_nom       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_titre     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_photo     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_bio       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_parcours  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prof_pedagogie TEXT DEFAULT '';

-- ── 2. Supprimer les valeurs par défaut du hero ────────────
-- (pour éviter le flash : la page affiche un skeleton
--  jusqu'à ce que Supabase retourne les vraies valeurs)
ALTER TABLE site_settings
  ALTER COLUMN hero_title     DROP DEFAULT,
  ALTER COLUMN hero_title2    DROP DEFAULT,
  ALTER COLUMN hero_subtitle  DROP DEFAULT,
  ALTER COLUMN hero_btn1      DROP DEFAULT,
  ALTER COLUMN hero_btn2      DROP DEFAULT,
  ALTER COLUMN apropos_titre  DROP DEFAULT,
  ALTER COLUMN apropos_texte1 DROP DEFAULT,
  ALTER COLUMN apropos_texte2 DROP DEFAULT,
  ALTER COLUMN offres_titre   DROP DEFAULT,
  ALTER COLUMN cta_titre      DROP DEFAULT,
  ALTER COLUMN cta_sous_titre DROP DEFAULT,
  ALTER COLUMN steps_titre    DROP DEFAULT,
  ALTER COLUMN steps_label    DROP DEFAULT;

-- ── 3. Vérification ───────────────────────────────────────
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'site_settings'
  AND column_name IN (
    'prof_nom', 'prof_titre', 'prof_photo',
    'prof_bio', 'prof_parcours', 'prof_pedagogie',
    'hero_title', 'hero_subtitle'
  )
ORDER BY column_name;