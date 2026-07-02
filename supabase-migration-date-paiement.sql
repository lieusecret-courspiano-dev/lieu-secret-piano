-- Migration : Ajout colonne date_paiement pour distinction date comptable vs date création
-- À exécuter dans Supabase SQL Editor

-- Colonne date_paiement sur course_packs
ALTER TABLE course_packs
  ADD COLUMN IF NOT EXISTS date_paiement DATE;

-- Colonne date_paiement sur gift_cards
ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS date_paiement DATE;

-- Initialiser date_paiement avec created_at pour les enregistrements existants
UPDATE course_packs
  SET date_paiement = created_at::DATE
  WHERE date_paiement IS NULL AND status != 'pending_virement';

UPDATE gift_cards
  SET date_paiement = created_at::DATE
  WHERE date_paiement IS NULL AND status != 'pending_virement';

-- Index pour les requêtes par date_paiement
CREATE INDEX IF NOT EXISTS idx_course_packs_date_paiement ON course_packs(date_paiement);
CREATE INDEX IF NOT EXISTS idx_gift_cards_date_paiement ON gift_cards(date_paiement);

-- Commentaires
COMMENT ON COLUMN course_packs.date_paiement IS 'Date réelle du paiement (pour comptabilité URSSAF). Peut différer de created_at si le pack a été créé manuellement.';
COMMENT ON COLUMN gift_cards.date_paiement IS 'Date réelle du paiement (pour comptabilité URSSAF).';