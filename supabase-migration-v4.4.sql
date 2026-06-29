-- Migration v4.4 — Nouvelles fonctionnalités
-- À exécuter dans Supabase SQL Editor

-- 1. Cours d'essai gratuits
CREATE TABLE IF NOT EXISTS essais_gratuits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  niveau      TEXT DEFAULT 'debutant',
  message     TEXT,
  timezone    TEXT DEFAULT 'Europe/Paris',
  status      TEXT DEFAULT 'pending',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_essais_email ON essais_gratuits(email);
CREATE INDEX IF NOT EXISTS idx_essais_status ON essais_gratuits(status);

-- 2. Bibliothèque de partitions
CREATE TABLE IF NOT EXISTS partitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre        TEXT NOT NULL,
  compositeur  TEXT,
  niveau       TEXT DEFAULT 'tous',
  style        TEXT DEFAULT 'classique',
  description  TEXT,
  url_pdf      TEXT NOT NULL,
  url_audio    TEXT,
  gratuit      BOOLEAN DEFAULT TRUE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partitions_niveau ON partitions(niveau);
CREATE INDEX IF NOT EXISTS idx_partitions_style ON partitions(style);
CREATE INDEX IF NOT EXISTS idx_partitions_active ON partitions(is_active);

-- 3. Système de parrainage
CREATE TABLE IF NOT EXISTS parrainages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  parrain_id      UUID REFERENCES eleves(id) ON DELETE SET NULL,
  parrain_email   TEXT NOT NULL,
  parrain_nom     TEXT NOT NULL,
  filleuls_count  INTEGER DEFAULT 0,
  heures_offertes INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parrainages_code ON parrainages(code);
CREATE INDEX IF NOT EXISTS idx_parrainages_email ON parrainages(parrain_email);

CREATE TABLE IF NOT EXISTS parrainage_filleuls (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrainage_id  UUID REFERENCES parrainages(id) ON DELETE CASCADE,
  filleul_email  TEXT NOT NULL,
  filleul_nom    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Rappels renouvellement de pack (éviter les doublons)
CREATE TABLE IF NOT EXISTS pack_reminders_sent (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id          UUID REFERENCES course_packs(id) ON DELETE CASCADE,
  heures_restantes INTEGER NOT NULL,
  email            TEXT NOT NULL,
  sent_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pack_reminders_pack ON pack_reminders_sent(pack_id);

-- 5. Ajouter colonne pack_code dans reservations si pas présente
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pack_code TEXT;

-- Table crédits parrainage en attente (si le parrain n'a pas encore de pack)
CREATE TABLE IF NOT EXISTS parrainage_credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_email TEXT NOT NULL,
  parrain_id    UUID REFERENCES eleves(id) ON DELETE SET NULL,
  heures        INTEGER DEFAULT 1,
  raison        TEXT,
  status        TEXT DEFAULT 'pending',  -- pending, applied
  pack_id       UUID REFERENCES course_packs(id) ON DELETE SET NULL,
  applied_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parrainage_credits_email ON parrainage_credits(parrain_email);
CREATE INDEX IF NOT EXISTS idx_parrainage_credits_status ON parrainage_credits(status);
