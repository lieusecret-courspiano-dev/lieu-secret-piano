-- Ajouter la colonne phone dans site_settings si elle n'existe pas
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';

-- Vérification
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'site_settings' AND column_name = 'phone';