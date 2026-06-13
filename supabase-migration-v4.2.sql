-- ============================================================
-- LIEU SECRET — Migration V4.2
-- Nettoyage doublons compétences + colonnes témoignages
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

-- 1. Supprimer les doublons de compétences (garder le plus récent)
DELETE FROM competences a USING competences b
WHERE a.created_at < b.created_at AND a.nom = b.nom AND a.categorie = b.categorie;

-- 2. Ajouter colonnes note et contenu dans medias si manquantes
ALTER TABLE medias ADD COLUMN IF NOT EXISTS note INTEGER DEFAULT 5;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS contenu TEXT;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 3. Vérification compétences sans doublons
SELECT categorie, nom, COUNT(*) as nb
FROM competences
GROUP BY categorie, nom
ORDER BY categorie, nom;
