
-- ============================================================
-- ÉTAT DES LIEUX — Annexe A du contrat
-- ============================================================
CREATE TABLE IF NOT EXISTS location_etat_lieux (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   UUID REFERENCES location_reservations(id) ON DELETE CASCADE,
  type             TEXT NOT NULL DEFAULT 'remise', -- 'remise' | 'retour'
  elements         JSONB DEFAULT '[]',
  -- Chaque élément : { nom: string, etat_remise: string, etat_retour: string, observations: string }
  observations     TEXT,
  signe_loueur     BOOLEAN DEFAULT FALSE,
  signe_locataire  BOOLEAN DEFAULT FALSE,
  signature_locataire TEXT,
  date_signature   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_etat_lieux_reservation
  ON location_etat_lieux(reservation_id);

DROP TRIGGER IF EXISTS trg_location_etat_lieux_updated_at ON location_etat_lieux;
CREATE TRIGGER trg_location_etat_lieux_updated_at
  BEFORE UPDATE ON location_etat_lieux
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
