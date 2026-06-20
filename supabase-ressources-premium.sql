-- ═══════════════════════════════════════════════════════════
-- RESSOURCES PREMIUM — Table et politiques
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ressources_premium (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'video',
  -- Types : 'video_youtube', 'coaching_visio', 'formation', 'documentation', 'audio', 'autre'
  prix          NUMERIC(10,2) NOT NULL DEFAULT 0,
  est_gratuit   BOOLEAN DEFAULT false,
  est_publie    BOOLEAN DEFAULT false,
  image_url     TEXT,
  -- Contenu selon le type
  youtube_url   TEXT,   -- URL YouTube privée (visible après achat)
  zoom_url      TEXT,   -- Lien Zoom pour coaching visio
  fichier_url   TEXT,   -- URL fichier PDF/doc
  duree_minutes INTEGER,-- Durée en minutes (vidéo/coaching)
  nb_places     INTEGER,-- Nombre de places (coaching visio, null = illimité)
  date_coaching TIMESTAMPTZ, -- Date/heure du coaching visio
  niveau        TEXT DEFAULT 'tous', -- 'debutant', 'intermediaire', 'avance', 'tous'
  tags          TEXT[],
  position      INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Table des achats de ressources premium
CREATE TABLE IF NOT EXISTS ressources_premium_achats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ressource_id    UUID NOT NULL REFERENCES ressources_premium(id) ON DELETE CASCADE,
  acheteur_email  TEXT NOT NULL,
  acheteur_nom    TEXT NOT NULL,
  montant         NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT 'virement',
  -- 'stripe', 'paypal', 'virement', 'gratuit'
  statut          TEXT NOT NULL DEFAULT 'en_attente',
  -- 'en_attente', 'confirme', 'annule'
  stripe_session_id TEXT,
  paypal_order_id   TEXT,
  token_acces     TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at      TIMESTAMPTZ DEFAULT now(),
  confirmed_at    TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_rp_publie    ON ressources_premium(est_publie);
CREATE INDEX IF NOT EXISTS idx_rp_type      ON ressources_premium(type);
CREATE INDEX IF NOT EXISTS idx_rpa_email    ON ressources_premium_achats(acheteur_email);
CREATE INDEX IF NOT EXISTS idx_rpa_ressource ON ressources_premium_achats(ressource_id);
CREATE INDEX IF NOT EXISTS idx_rpa_token    ON ressources_premium_achats(token_acces);
CREATE INDEX IF NOT EXISTS idx_rpa_statut   ON ressources_premium_achats(statut);

-- RLS
ALTER TABLE ressources_premium ENABLE ROW LEVEL SECURITY;
ALTER TABLE ressources_premium_achats ENABLE ROW LEVEL SECURITY;

-- Lecture publique des ressources publiées
DROP POLICY IF EXISTS "rp_public_read" ON ressources_premium;
CREATE POLICY "rp_public_read" ON ressources_premium
  FOR SELECT USING (est_publie = true);

-- Accès complet service role
DROP POLICY IF EXISTS "rp_service_all" ON ressources_premium;
CREATE POLICY "rp_service_all" ON ressources_premium
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rpa_service_all" ON ressources_premium_achats;
CREATE POLICY "rpa_service_all" ON ressources_premium_achats
  FOR ALL USING (true) WITH CHECK (true);

SELECT 'Tables ressources_premium créées avec succès' AS status;