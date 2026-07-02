-- Ajout des colonnes manquantes pour le gestionnaire de quiz complet
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'publie';
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS type_reponse TEXT DEFAULT 'unique'; -- 'unique', 'multiple'
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS duree_minutes INTEGER DEFAULT 0;
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS categorie TEXT;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_quiz_questions_statut ON quiz_questions(statut);
CREATE INDEX IF NOT EXISTS idx_quiz_niveau ON quiz(niveau);

SELECT 'Migration quiz upgrade OK' as status;
