-- ============================================================
-- LIEU SECRET — Migration V3.9
-- Table course_packs (packs de cours prépayés)
-- Exécuter dans : Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS course_packs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code              VARCHAR(20) NOT NULL UNIQUE,
  pack_label        VARCHAR(100) NOT NULL,
  heures_total      INTEGER NOT NULL,
  heures_restantes  INTEGER NOT NULL,
  montant           DECIMAL(10,2) NOT NULL,
  acheteur_nom      VARCHAR(255) NOT NULL,
  acheteur_email    VARCHAR(255) NOT NULL,
  stripe_session_id VARCHAR(255),
  status            VARCHAR(50) NOT NULL DEFAULT 'active',
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_packs_code   ON course_packs(code);
CREATE INDEX IF NOT EXISTS idx_course_packs_email  ON course_packs(acheteur_email);
CREATE INDEX IF NOT EXISTS idx_course_packs_status ON course_packs(status);

ALTER TABLE course_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "course_packs_service_all"  ON course_packs;
DROP POLICY IF EXISTS "course_packs_public_check" ON course_packs;
CREATE POLICY "course_packs_service_all"  ON course_packs USING (auth.role() = 'service_role');
CREATE POLICY "course_packs_public_check" ON course_packs FOR SELECT USING (true);

-- Trigger pour initialiser heures_restantes
CREATE OR REPLACE FUNCTION init_course_pack_heures()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.heures_restantes = 0 THEN NEW.heures_restantes = NEW.heures_total; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_init_course_pack ON course_packs;
CREATE TRIGGER trg_init_course_pack BEFORE INSERT ON course_packs FOR EACH ROW EXECUTE FUNCTION init_course_pack_heures();

-- Vérification
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_packs';