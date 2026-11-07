-- ============================================================
-- MIGRATION : zoom_link → kmeet_url dans la table reservations
-- Exécutez dans Supabase SQL Editor
-- ============================================================

-- 1. Renommer la colonne
ALTER TABLE reservations 
  RENAME COLUMN zoom_link TO kmeet_url;

-- 2. Vérification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN ('kmeet_url', 'zoom_link');

-- 3. Renommer aussi dans la table events si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'zoom_link'
  ) THEN
    ALTER TABLE events RENAME COLUMN zoom_link TO kmeet_url;
    RAISE NOTICE 'zoom_link renommé en kmeet_url dans events';
  END IF;
END $$;

-- 4. Vérification finale
SELECT 'reservations' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'reservations' AND column_name = 'kmeet_url'
UNION ALL
SELECT 'events', column_name 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'kmeet_url';
