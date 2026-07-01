-- ══════════════════════════════════════════════════════════════════
-- FIX: Colonnes manquantes sur eleve_repertoire et eleve_journal
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Ajouter la colonne niveau si elle n'existe pas déjà
ALTER TABLE eleve_repertoire ADD COLUMN IF NOT EXISTS niveau TEXT;

-- Ajouter la colonne duree_minutes si elle n'existe pas déjà
ALTER TABLE eleve_journal ADD COLUMN IF NOT EXISTS duree_minutes INTEGER CHECK (duree_minutes > 0);

-- Vérification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eleve_repertoire' 
AND column_name = 'niveau';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eleve_journal' 
AND column_name = 'duree_minutes';
