-- ============================================================
-- SCRIPT SQL COMPLET — MODULE LOCATION
-- Exécutez dans Supabase SQL Editor dans cet ordre
-- ============================================================

-- ============================================================
-- PARTIE 1 : TABLES (si pas encore créées)
-- ============================================================

CREATE TABLE IF NOT EXISTS location_zones_livraison (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           TEXT NOT NULL,
  distance_min  INTEGER NOT NULL DEFAULT 0,
  distance_max  INTEGER,
  tarif         DECIMAL(10,2),
  sur_devis     BOOLEAN DEFAULT FALSE,
  actif         BOOLEAN DEFAULT TRUE,
  position      INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_articles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom                 TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  description_courte  TEXT,
  photos              JSONB DEFAULT '[]',
  numero_serie        TEXT,
  valeur_declaree     DECIMAL(10,2),
  prix_jour           DECIMAL(10,2),
  prix_weekend        DECIMAL(10,2),
  prix_semaine        DECIMAL(10,2),
  prix_mois           DECIMAL(10,2),
  caution             DECIMAL(10,2) NOT NULL DEFAULT 0,
  accessoires_inclus  TEXT,
  disponible          BOOLEAN DEFAULT TRUE,
  stock               INTEGER DEFAULT 1,
  categorie           TEXT DEFAULT 'instrument',
  position            INTEGER DEFAULT 0,
  publie              BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_reservations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id            UUID REFERENCES location_articles(id) ON DELETE SET NULL,
  article_nom           TEXT NOT NULL,
  article_valeur        DECIMAL(10,2),
  locataire_nom         TEXT NOT NULL,
  locataire_email       TEXT NOT NULL,
  locataire_telephone   TEXT,
  locataire_adresse     TEXT,
  locataire_ville       TEXT,
  locataire_code_postal TEXT,
  date_debut            DATE NOT NULL,
  date_fin              DATE NOT NULL,
  duree_type            TEXT NOT NULL,
  nb_jours              INTEGER,
  mode_remise           TEXT NOT NULL DEFAULT 'retrait',
  adresse_livraison     TEXT,
  zone_livraison_id     UUID REFERENCES location_zones_livraison(id) ON DELETE SET NULL,
  frais_livraison       DECIMAL(10,2) DEFAULT 0,
  montant_location      DECIMAL(10,2) NOT NULL,
  montant_acompte       DECIMAL(10,2),
  montant_total         DECIMAL(10,2) NOT NULL,
  est_acompte           BOOLEAN DEFAULT FALSE,
  caution_montant       DECIMAL(10,2) DEFAULT 0,
  caution_type          TEXT,
  caution_reference     TEXT,
  caution_restituee     BOOLEAN DEFAULT FALSE,
  moyen_paiement        TEXT,
  paiement_statut       TEXT DEFAULT 'en_attente',
  stripe_session_id     TEXT,
  stripe_hold_id        TEXT,
  paypal_order_id       TEXT,
  reference_virement    TEXT,
  contrat_genere        BOOLEAN DEFAULT FALSE,
  contrat_url           TEXT,
  contrat_signe         BOOLEAN DEFAULT FALSE,
  contrat_signe_le      TIMESTAMPTZ,
  signature_nom         TEXT,
  statut                TEXT DEFAULT 'en_attente',
  note_client           TEXT,
  note_admin            TEXT,
  date_remise_effective TIMESTAMPTZ,
  date_retour_effective TIMESTAMPTZ,
  penalites_retard      DECIMAL(10,2) DEFAULT 0,
  nb_jours_retard       INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   UUID REFERENCES location_reservations(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  nom_fichier      TEXT,
  fichier_url      TEXT NOT NULL,
  taille_octets    INTEGER,
  valide           BOOLEAN,
  note_admin       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARTIE 2 : INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_location_articles_slug
  ON location_articles(slug);
CREATE INDEX IF NOT EXISTS idx_location_articles_disponible
  ON location_articles(disponible, publie);
CREATE INDEX IF NOT EXISTS idx_location_reservations_statut
  ON location_reservations(statut);
CREATE INDEX IF NOT EXISTS idx_location_reservations_email
  ON location_reservations(locataire_email);
CREATE INDEX IF NOT EXISTS idx_location_reservations_dates
  ON location_reservations(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_location_reservations_article
  ON location_reservations(article_id);
CREATE INDEX IF NOT EXISTS idx_location_reservations_paiement
  ON location_reservations(paiement_statut);
CREATE INDEX IF NOT EXISTS idx_location_documents_reservation
  ON location_documents(reservation_id);

-- ============================================================
-- PARTIE 3 : TRIGGERS updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_location_articles_updated_at ON location_articles;
CREATE TRIGGER trg_location_articles_updated_at
  BEFORE UPDATE ON location_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_location_reservations_updated_at ON location_reservations;
CREATE TRIGGER trg_location_reservations_updated_at
  BEFORE UPDATE ON location_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_location_zones_updated_at ON location_zones_livraison;
CREATE TRIGGER trg_location_zones_updated_at
  BEFORE UPDATE ON location_zones_livraison
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PARTIE 4 : ZONES DE LIVRAISON V2
-- Saint-Étienne gratuit, proche banlieue 5€
-- ============================================================

DELETE FROM location_zones_livraison;

INSERT INTO location_zones_livraison (nom, distance_min, distance_max, tarif, sur_devis, actif, position)
VALUES
  ('Saint-Étienne (0–15 km)',     0,   15,   0.00,  FALSE, TRUE, 1),
  ('Proche banlieue (15–30 km)', 15,   30,   5.00,  FALSE, TRUE, 2),
  ('Agglomération (30–50 km)',   30,   50,   NULL,  FALSE, TRUE, 3),
  ('Grand rayon (> 50 km)',      50,  NULL,  NULL,  TRUE,  TRUE, 4);

-- ============================================================
-- PARTIE 5 : VÉRIFICATION FINALE
-- ============================================================

SELECT 'location_zones_livraison' AS table_name, COUNT(*) AS nb_lignes FROM location_zones_livraison
UNION ALL
SELECT 'location_articles', COUNT(*) FROM location_articles
UNION ALL
SELECT 'location_reservations', COUNT(*) FROM location_reservations
UNION ALL
SELECT 'location_documents', COUNT(*) FROM location_documents;
