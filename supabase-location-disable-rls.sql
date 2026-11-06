-- ============================================================
-- DÉSACTIVER RLS SUR LES TABLES LOCATION
-- (Le projet utilise supabaseAdmin qui contourne RLS,
--  mais au cas où RLS bloquerait les opérations)
-- ============================================================

-- Désactiver RLS sur toutes les tables location
ALTER TABLE location_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_zones_livraison DISABLE ROW LEVEL SECURITY;

-- Vérification
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'location_%'
ORDER BY tablename;
