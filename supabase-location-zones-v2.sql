-- ============================================================
-- MISE À JOUR DES ZONES DE LIVRAISON
-- Zones basées sur Saint-Étienne avec tarifs précis
-- Exécutez dans Supabase SQL Editor
-- ============================================================

-- Supprimer les zones existantes et les recréer
DELETE FROM location_zones_livraison;

-- Insérer les nouvelles zones
INSERT INTO location_zones_livraison (nom, distance_min, distance_max, tarif, sur_devis, actif, position)
VALUES
  ('Saint-Étienne (0–15 km)',     0,   15,   0.00,  FALSE, TRUE, 1),
  ('Proche banlieue (15–30 km)', 15,   30,   5.00,  FALSE, TRUE, 2),
  ('Agglomération (30–50 km)',   30,   50,  NULL,   FALSE, TRUE, 3),
  ('Grand rayon (> 50 km)',      50,  NULL,  NULL,  TRUE,  TRUE, 4);

-- Vérification
SELECT nom, distance_min, distance_max, tarif, sur_devis FROM location_zones_livraison ORDER BY position;