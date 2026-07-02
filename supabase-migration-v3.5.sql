-- ============================================================
-- LIEU SECRET — Migration V3.5
-- Tables email_logs et gift_cards
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

-- ── Table email_logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key            VARCHAR(255) NOT NULL UNIQUE,
  type           VARCHAR(100) NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_key ON email_logs(key);
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_logs_service_all" ON email_logs;
CREATE POLICY "email_logs_service_all" ON email_logs USING (auth.role() = 'service_role');

-- ── Table gift_cards ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code              VARCHAR(20) NOT NULL UNIQUE,
  montant           DECIMAL(10,2) NOT NULL,
  montant_restant   DECIMAL(10,2) NOT NULL DEFAULT 0,
  acheteur_nom      VARCHAR(255) NOT NULL,
  acheteur_email    VARCHAR(255) NOT NULL,
  destinataire_nom  VARCHAR(255) NOT NULL,
  message           TEXT,
  stripe_session_id VARCHAR(255),
  status            VARCHAR(50) NOT NULL DEFAULT 'active',
  expires_at        TIMESTAMPTZ NOT NULL,
  used_at           TIMESTAMPTZ,
  reservation_id    UUID REFERENCES reservations(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code   ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gift_cards_service_all"  ON gift_cards;
DROP POLICY IF EXISTS "gift_cards_public_check" ON gift_cards;
CREATE POLICY "gift_cards_service_all"  ON gift_cards USING (auth.role() = 'service_role');
CREATE POLICY "gift_cards_public_check" ON gift_cards FOR SELECT USING (true);

-- ── Trigger montant_restant ───────────────────────────────
CREATE OR REPLACE FUNCTION init_gift_card_montant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.montant_restant = 0 THEN NEW.montant_restant = NEW.montant; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_init_gift_card ON gift_cards;
CREATE TRIGGER trg_init_gift_card BEFORE INSERT ON gift_cards FOR EACH ROW EXECUTE FUNCTION init_gift_card_montant();

-- ── Vérification ──────────────────────────────────────────
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('email_logs', 'gift_cards') ORDER BY table_name;