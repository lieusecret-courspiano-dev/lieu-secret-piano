-- ============================================================
-- MODULE COMPTABILITÉ / FACTURATION — Lieu Secret
-- Exécutez dans Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLE 1 : Paramètres comptabilité
-- ============================================================
CREATE TABLE IF NOT EXISTS comptabilite_parametres (
  id                    INTEGER PRIMARY KEY DEFAULT 1,
  -- Informations légales
  nom_entreprise        TEXT DEFAULT 'Lieu Secret',
  nom_proprietaire      TEXT DEFAULT 'Claudine Yombo',
  siret                 TEXT DEFAULT '98246654200015',
  adresse               TEXT DEFAULT '106F rue de la Richelandière',
  code_postal           TEXT DEFAULT '42100',
  ville                 TEXT DEFAULT 'Saint-Étienne',
  telephone             TEXT DEFAULT '+33695346598',
  email                 TEXT DEFAULT 'lieusecret-courspiano@outlook.fr',
  site_web              TEXT DEFAULT 'https://www.lieusecret-courspiano.fr',
  -- TVA
  tva_active            BOOLEAN DEFAULT FALSE,
  taux_tva              DECIMAL(5,2) DEFAULT 20.00,
  numero_tva            TEXT,
  mention_tva           TEXT DEFAULT 'TVA non applicable — Art. 293 B du CGI',
  -- Numérotation
  prefixe_facture       TEXT DEFAULT 'FAC',
  prefixe_devis         TEXT DEFAULT 'DEV',
  -- Paiement
  iban                  TEXT,
  bic                   TEXT,
  conditions_paiement   TEXT DEFAULT 'Paiement à réception de facture',
  -- Mentions légales
  mentions_legales      TEXT DEFAULT 'Auto-entrepreneur — Dispensé d''immatriculation au RCS et au RM',
  -- Apparence
  couleur_principale    TEXT DEFAULT '#f59e0b',
  logo_url              TEXT,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les paramètres par défaut
INSERT INTO comptabilite_parametres (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABLE 2 : Séquences de numérotation par année
-- ============================================================
CREATE TABLE IF NOT EXISTS comptabilite_sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,   -- 'facture' | 'devis'
  annee       INTEGER NOT NULL,
  dernier_num INTEGER DEFAULT 0,
  UNIQUE(type, annee)
);

-- Initialiser les séquences pour 2024, 2025, 2026
INSERT INTO comptabilite_sequences (type, annee, dernier_num) VALUES
  ('facture', 2024, 0),
  ('facture', 2025, 0),
  ('facture', 2026, 0),
  ('devis', 2024, 0),
  ('devis', 2025, 0),
  ('devis', 2026, 0)
ON CONFLICT (type, annee) DO NOTHING;

-- ============================================================
-- TABLE 3 : Factures
-- ============================================================
CREATE TABLE IF NOT EXISTS comptabilite_factures (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Numérotation
  numero            TEXT NOT NULL UNIQUE,   -- ex: FAC-2026-0001
  annee             INTEGER NOT NULL,
  -- Type et source
  type              TEXT NOT NULL DEFAULT 'vente',
  -- 'vente' | 'avoir' | 'import'
  source            TEXT,
  -- 'pack' | 'cours' | 'evenement' | 'cadeau' | 'support' |
  -- 'ressource' | 'location' | 'manuel' | 'import'
  source_id         TEXT,                   -- ID de l'objet source
  -- Client
  client_nom        TEXT NOT NULL,
  client_email      TEXT,
  client_telephone  TEXT,
  client_adresse    TEXT,
  -- Dates
  date_facture      DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance     DATE,
  date_paiement     DATE,
  -- Montants
  montant_ht        DECIMAL(10,2) NOT NULL DEFAULT 0,
  taux_tva          DECIMAL(5,2) DEFAULT 0,
  montant_tva       DECIMAL(10,2) DEFAULT 0,
  montant_ttc       DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- Paiement
  moyen_paiement    TEXT,
  -- 'stripe' | 'paypal' | 'virement' | 'especes' | 'cheque' | 'autre'
  statut_paiement   TEXT DEFAULT 'paye',
  -- 'paye' | 'en_attente' | 'partiel' | 'annule'
  -- Statut facture
  statut            TEXT DEFAULT 'emise',
  -- 'brouillon' | 'emise' | 'payee' | 'annulee' | 'avoir'
  -- PDF
  pdf_url           TEXT,
  -- Notes
  notes             TEXT,
  notes_internes    TEXT,
  -- Import Odoo
  numero_odoo       TEXT,                   -- Numéro original Odoo
  -- Métadonnées
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4 : Lignes de facture
-- ============================================================
CREATE TABLE IF NOT EXISTS comptabilite_factures_lignes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id    UUID REFERENCES comptabilite_factures(id) ON DELETE CASCADE,
  position      INTEGER DEFAULT 0,
  designation   TEXT NOT NULL,
  description   TEXT,
  quantite      DECIMAL(10,3) DEFAULT 1,
  unite         TEXT DEFAULT 'unité',       -- 'unité' | 'heure' | 'mois' | 'forfait'
  prix_unitaire DECIMAL(10,2) NOT NULL,
  taux_tva      DECIMAL(5,2) DEFAULT 0,
  montant_ht    DECIMAL(10,2) NOT NULL,
  montant_tva   DECIMAL(10,2) DEFAULT 0,
  montant_ttc   DECIMAL(10,2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5 : Devis
-- ============================================================
CREATE TABLE IF NOT EXISTS comptabilite_devis (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero            TEXT NOT NULL UNIQUE,   -- ex: DEV-2026-0001
  annee             INTEGER NOT NULL,
  -- Client
  client_nom        TEXT NOT NULL,
  client_email      TEXT,
  client_telephone  TEXT,
  client_adresse    TEXT,
  -- Dates
  date_devis        DATE NOT NULL DEFAULT CURRENT_DATE,
  date_validite     DATE,                   -- Date d'expiration du devis
  -- Montants
  montant_ht        DECIMAL(10,2) NOT NULL DEFAULT 0,
  taux_tva          DECIMAL(5,2) DEFAULT 0,
  montant_tva       DECIMAL(10,2) DEFAULT 0,
  montant_ttc       DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- Statut
  statut            TEXT DEFAULT 'envoye',
  -- 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'facture'
  -- Si converti en facture
  facture_id        UUID REFERENCES comptabilite_factures(id) ON DELETE SET NULL,
  -- Objet du devis
  objet             TEXT,
  notes             TEXT,
  conditions        TEXT,
  -- PDF
  pdf_url           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6 : Lignes de devis
-- ============================================================
CREATE TABLE IF NOT EXISTS comptabilite_devis_lignes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id      UUID REFERENCES comptabilite_devis(id) ON DELETE CASCADE,
  position      INTEGER DEFAULT 0,
  designation   TEXT NOT NULL,
  description   TEXT,
  quantite      DECIMAL(10,3) DEFAULT 1,
  unite         TEXT DEFAULT 'unité',
  prix_unitaire DECIMAL(10,2) NOT NULL,
  taux_tva      DECIMAL(5,2) DEFAULT 0,
  montant_ht    DECIMAL(10,2) NOT NULL,
  montant_tva   DECIMAL(10,2) DEFAULT 0,
  montant_ttc   DECIMAL(10,2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 7 : Dépenses / Charges
-- ============================================================
CREATE TABLE IF NOT EXISTS comptabilite_depenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_depense    DATE NOT NULL DEFAULT CURRENT_DATE,
  categorie       TEXT NOT NULL,
  -- 'logiciel' | 'materiel' | 'formation' | 'marketing' |
  -- 'frais_bancaires' | 'assurance' | 'telephone' | 'internet' |
  -- 'deplacement' | 'fournitures' | 'autre'
  designation     TEXT NOT NULL,
  fournisseur     TEXT,
  montant_ht      DECIMAL(10,2) NOT NULL,
  taux_tva        DECIMAL(5,2) DEFAULT 0,
  montant_tva     DECIMAL(10,2) DEFAULT 0,
  montant_ttc     DECIMAL(10,2) NOT NULL,
  moyen_paiement  TEXT,
  numero_piece    TEXT,                     -- Numéro de facture fournisseur
  justificatif_url TEXT,                   -- URL du justificatif scanné
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 8 : Imports (historique)
-- ============================================================
CREATE TABLE IF NOT EXISTS comptabilite_imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL DEFAULT 'odoo', -- 'odoo' | 'csv' | 'excel'
  nom_fichier     TEXT,
  nb_lignes       INTEGER DEFAULT 0,
  nb_importees    INTEGER DEFAULT 0,
  nb_erreurs      INTEGER DEFAULT 0,
  statut          TEXT DEFAULT 'en_cours',  -- 'en_cours' | 'termine' | 'erreur'
  erreurs         JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_factures_numero
  ON comptabilite_factures(numero);
CREATE INDEX IF NOT EXISTS idx_factures_annee
  ON comptabilite_factures(annee);
CREATE INDEX IF NOT EXISTS idx_factures_client_email
  ON comptabilite_factures(client_email);
CREATE INDEX IF NOT EXISTS idx_factures_date
  ON comptabilite_factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_factures_statut
  ON comptabilite_factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_source
  ON comptabilite_factures(source, source_id);
CREATE INDEX IF NOT EXISTS idx_factures_lignes_facture
  ON comptabilite_factures_lignes(facture_id);
CREATE INDEX IF NOT EXISTS idx_devis_numero
  ON comptabilite_devis(numero);
CREATE INDEX IF NOT EXISTS idx_devis_client
  ON comptabilite_devis(client_email);
CREATE INDEX IF NOT EXISTS idx_depenses_date
  ON comptabilite_depenses(date_depense);
CREATE INDEX IF NOT EXISTS idx_depenses_categorie
  ON comptabilite_depenses(categorie);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compta_factures_updated_at ON comptabilite_factures;
CREATE TRIGGER trg_compta_factures_updated_at
  BEFORE UPDATE ON comptabilite_factures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_compta_devis_updated_at ON comptabilite_devis;
CREATE TRIGGER trg_compta_devis_updated_at
  BEFORE UPDATE ON comptabilite_devis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_compta_depenses_updated_at ON comptabilite_depenses;
CREATE TRIGGER trg_compta_depenses_updated_at
  BEFORE UPDATE ON comptabilite_depenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FONCTION : Générer le prochain numéro de facture/devis
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_numero(p_type TEXT, p_annee INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_num     INTEGER;
  v_prefixe TEXT;
  v_result  TEXT;
BEGIN
  -- Insérer la séquence si elle n'existe pas
  INSERT INTO comptabilite_sequences (type, annee, dernier_num)
  VALUES (p_type, p_annee, 0)
  ON CONFLICT (type, annee) DO NOTHING;

  -- Incrémenter et récupérer
  UPDATE comptabilite_sequences
  SET dernier_num = dernier_num + 1
  WHERE type = p_type AND annee = p_annee
  RETURNING dernier_num INTO v_num;

  -- Préfixe selon le type
  v_prefixe := CASE p_type
    WHEN 'facture' THEN 'FAC'
    WHEN 'devis'   THEN 'DEV'
    ELSE 'DOC'
  END;

  -- Format : FAC-2026-0001
  v_result := v_prefixe || '-' || p_annee || '-' || LPAD(v_num::TEXT, 4, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DÉSACTIVER RLS
-- ============================================================
ALTER TABLE comptabilite_parametres   DISABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite_sequences    DISABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite_factures     DISABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite_factures_lignes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite_devis        DISABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite_devis_lignes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite_depenses     DISABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite_imports      DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'comptabilite_%'
ORDER BY tablename;
