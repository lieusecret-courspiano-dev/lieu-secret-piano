-- ============================================================
-- MIGRATION avatar — Colonne avatar pour les élèves
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Ajouter la colonne avatar à la table eleves
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT 'piano';

-- Valeurs possibles : 'piano', 'notes', 'treble', 'star', 'heart', 'crown'
-- L'élève peut choisir son avatar depuis son tableau de bord

COMMENT ON COLUMN eleves.avatar IS 'Avatar choisi par l''élève dans son espace personnel. Valeurs: piano, notes, treble, star, heart, crown';