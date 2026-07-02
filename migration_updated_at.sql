-- Migration: Ajouter updated_at aux tables qui en ont besoin
-- À exécuter dans Supabase SQL Editor

-- Table quiz
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table quiz_questions  
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur quiz
DROP TRIGGER IF EXISTS update_quiz_updated_at ON quiz;
CREATE TRIGGER update_quiz_updated_at
  BEFORE UPDATE ON quiz
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appliquer le trigger sur quiz_questions
DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vérification
SELECT 'Migration OK' as status;
