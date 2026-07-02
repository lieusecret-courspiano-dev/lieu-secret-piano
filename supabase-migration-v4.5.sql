-- Migration v4.5 — Colonnes page cours d'essai + parrainage_credits
-- À exécuter dans Supabase SQL Editor

-- 1. Colonnes page cours d'essai
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS essai_label       TEXT DEFAULT 'SANS ENGAGEMENT',
  ADD COLUMN IF NOT EXISTS essai_titre       TEXT DEFAULT 'Cours d''essai gratuit',
  ADD COLUMN IF NOT EXISTS essai_sous_titre  TEXT DEFAULT '30 minutes offertes pour découvrir notre approche pédagogique. Aucune carte bancaire requise.',
  ADD COLUMN IF NOT EXISTS essai_duree       TEXT DEFAULT '1h offerte',
  ADD COLUMN IF NOT EXISTS essai_duree_desc  TEXT DEFAULT 'Cours individuel',
  ADD COLUMN IF NOT EXISTS essai_format      TEXT DEFAULT 'En ligne',
  ADD COLUMN IF NOT EXISTS essai_format_desc TEXT DEFAULT 'Via Zoom ou Meet',
  ADD COLUMN IF NOT EXISTS essai_form_titre  TEXT DEFAULT 'Réservez votre cours d''essai',
  ADD COLUMN IF NOT EXISTS essai_btn_label   TEXT DEFAULT 'Demander mon cours d''essai gratuit';

-- 2. Colonnes page packs (si pas encore exécuté v4.3)
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS packs_label      TEXT DEFAULT 'Packs de cours',
  ADD COLUMN IF NOT EXISTS packs_titre      TEXT DEFAULT 'Acheter un pack de cours',
  ADD COLUMN IF NOT EXISTS packs_sous_titre TEXT DEFAULT 'Achetez un pack d''heures et réservez vos cours au fur et à mesure.';

-- 3. Table crédits parrainage en attente (si pas encore exécuté v4.4)
CREATE TABLE IF NOT EXISTS parrainage_credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_email TEXT NOT NULL,
  parrain_id    UUID REFERENCES eleves(id) ON DELETE SET NULL,
  heures        INTEGER DEFAULT 1,
  raison        TEXT,
  status        TEXT DEFAULT 'pending',
  pack_id       UUID REFERENCES course_packs(id) ON DELETE SET NULL,
  applied_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parrainage_credits_email  ON parrainage_credits(parrain_email);
CREATE INDEX IF NOT EXISTS idx_parrainage_credits_status ON parrainage_credits(status);

-- 4. Mettre à jour les valeurs par défaut
UPDATE site_settings SET
  essai_label       = COALESCE(NULLIF(essai_label, ''),       'SANS ENGAGEMENT'),
  essai_titre       = COALESCE(NULLIF(essai_titre, ''),       'Cours d''essai gratuit'),
  essai_sous_titre  = COALESCE(NULLIF(essai_sous_titre, ''),  '30 minutes offertes pour découvrir notre approche pédagogique.'),
  essai_duree       = COALESCE(NULLIF(essai_duree, ''),       '1h offerte'),
  essai_duree_desc  = COALESCE(NULLIF(essai_duree_desc, ''),  'Cours individuel'),
  essai_format      = COALESCE(NULLIF(essai_format, ''),      'En ligne'),
  essai_format_desc = COALESCE(NULLIF(essai_format_desc, ''), 'Via Zoom ou Meet'),
  essai_form_titre  = COALESCE(NULLIF(essai_form_titre, ''),  'Réservez votre cours d''essai'),
  essai_btn_label   = COALESCE(NULLIF(essai_btn_label, ''),   'Demander mon cours d''essai gratuit')
WHERE id = 1;

-- Colonnes anti-abus parrainage
ALTER TABLE parrainage_filleuls
  ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_parrainage_filleuls_status ON parrainage_filleuls(status);
CREATE INDEX IF NOT EXISTS idx_parrainage_filleuls_created ON parrainage_filleuls(created_at);
