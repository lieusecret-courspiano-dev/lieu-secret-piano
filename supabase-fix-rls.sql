-- ============================================================
-- CORRECTION RLS — A executer dans Supabase SQL Editor
-- Regle les problemes de politiques manquantes
-- ============================================================

-- Activer RLS sur toutes les tables quiz/supports
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_resultats ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports_pedagogiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports_achats ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports_progression ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "srole quiz" ON quiz;
DROP POLICY IF EXISTS "srole quiz_q" ON quiz_questions;
DROP POLICY IF EXISTS "srole quiz_r" ON quiz_resultats;
DROP POLICY IF EXISTS "srole supports" ON supports_pedagogiques;
DROP POLICY IF EXISTS "srole supports_a" ON supports_achats;
DROP POLICY IF EXISTS "srole supports_p" ON supports_progression;

-- Recreer les politiques
CREATE POLICY "srole quiz" ON quiz FOR ALL USING (true);
CREATE POLICY "srole quiz_q" ON quiz_questions FOR ALL USING (true);
CREATE POLICY "srole quiz_r" ON quiz_resultats FOR ALL USING (true);
CREATE POLICY "srole supports" ON supports_pedagogiques FOR ALL USING (true);
CREATE POLICY "srole supports_a" ON supports_achats FOR ALL USING (true);
CREATE POLICY "srole supports_p" ON supports_progression FOR ALL USING (true);

-- Verification
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('quiz','quiz_questions','quiz_resultats','supports_pedagogiques','supports_achats','supports_progression')
ORDER BY tablename;