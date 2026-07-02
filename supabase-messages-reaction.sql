-- Ajouter la colonne reaction dans eleve_messages
ALTER TABLE eleve_messages ADD COLUMN IF NOT EXISTS reaction TEXT;

-- Vérification
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'eleve_messages' AND column_name = 'reaction';
