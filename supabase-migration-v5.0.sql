-- ============================================================
-- MIGRATION v5.0 — Progression syllabus, Travaux, Notes améliorées
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ── 1. Ajouter colonnes au schéma des compétences ──────────
ALTER TABLE competences ADD COLUMN IF NOT EXISTS categorie TEXT DEFAULT 'Fondamentaux';
ALTER TABLE competences ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;
ALTER TABLE competences ADD COLUMN IF NOT EXISTS niveau INTEGER DEFAULT 1;

-- ── 2. Insérer le syllabus réel (vide d'abord les anciennes) ─
-- ATTENTION : ceci supprime les compétences existantes et leur historique de progression
-- Si vous voulez conserver l'historique, commentez le TRUNCATE et utilisez INSERT OR IGNORE
TRUNCATE TABLE competences RESTART IDENTITY CASCADE;

INSERT INTO competences (nom, categorie, niveau, ordre, is_active) VALUES
-- NIVEAU 1 : FONDAMENTAUX
('Connaître les notes du piano',           'Fondamentaux', 1,  1, true),
('Se repérer sur le clavier',              'Fondamentaux', 1,  2, true),
('Comprendre les tons et demi-tons',       'Fondamentaux', 1,  3, true),
('Comprendre les intervalles',             'Fondamentaux', 1,  4, true),
('Comprendre les altérations (# et b)',    'Fondamentaux', 1,  5, true),
('Comprendre les degrés d''une gamme',     'Fondamentaux', 1,  6, true),
('Construire une gamme majeure',           'Fondamentaux', 1,  7, true),
('Jouer la gamme de Do majeur',            'Fondamentaux', 1,  8, true),
('Utiliser un doigté correct',             'Fondamentaux', 1,  9, true),
('Développer l''agilité des doigts',       'Fondamentaux', 1, 10, true),
('Comprendre les accords majeurs',         'Fondamentaux', 1, 11, true),
('Comprendre les accords mineurs',         'Fondamentaux', 1, 12, true),
('Construire un accord majeur',            'Fondamentaux', 1, 13, true),
('Construire un accord mineur',            'Fondamentaux', 1, 14, true),
('Lire et comprendre la notation anglo-saxonne', 'Fondamentaux', 1, 15, true),
('Jouer les premiers chants du répertoire','Fondamentaux', 1, 16, true),
('Enchaîner des accords simples',          'Fondamentaux', 1, 17, true),

-- NIVEAU 2 : COMPRÉHENSION ET AUTONOMIE
('Comprendre les renversements d''accords',       'Compréhension et autonomie', 2,  1, true),
('Utiliser le premier renversement',              'Compréhension et autonomie', 2,  2, true),
('Utiliser le deuxième renversement',             'Compréhension et autonomie', 2,  3, true),
('Réaliser des enchaînements fluides',            'Compréhension et autonomie', 2,  4, true),
('Utiliser les progressions d''accords courantes','Compréhension et autonomie', 2,  5, true),
('Maîtriser les accords magiques',                'Compréhension et autonomie', 2,  6, true),
('Jouer différentes progressions de louange',     'Compréhension et autonomie', 2,  7, true),
('Utiliser les arpèges',                          'Compréhension et autonomie', 2,  8, true),
('Utiliser plusieurs rythmes d''accompagnement',  'Compréhension et autonomie', 2,  9, true),
('Jouer avec métronome',                          'Compréhension et autonomie', 2, 10, true),
('Jouer avec playback',                           'Compréhension et autonomie', 2, 11, true),
('Retrouver une mélodie à l''oreille',            'Compréhension et autonomie', 2, 12, true),
('Trouver la tonalité d''un chant',               'Compréhension et autonomie', 2, 13, true),
('Identifier des accords à l''oreille',           'Compréhension et autonomie', 2, 14, true),
('Reproduire un morceau entendu',                 'Compréhension et autonomie', 2, 15, true),
('Accompagner un chant en autonomie',             'Compréhension et autonomie', 2, 16, true),
('Jouer en situation réelle',                     'Compréhension et autonomie', 2, 17, true),

-- NIVEAU 3 : EXPRESSION ET MAÎTRISE
('Utiliser les accords 7e',                'Expression et maîtrise', 3,  1, true),
('Utiliser les accords 9e',                'Expression et maîtrise', 3,  2, true),
('Utiliser les accords sus',               'Expression et maîtrise', 3,  3, true),
('Utiliser les accords add',               'Expression et maîtrise', 3,  4, true),
('Comprendre les couleurs harmoniques',    'Expression et maîtrise', 3,  5, true),
('Utiliser des voicings modernes',         'Expression et maîtrise', 3,  6, true),
('Réaliser des substitutions d''accords',  'Expression et maîtrise', 3,  7, true),
('Improviser sur une grille harmonique',   'Expression et maîtrise', 3,  8, true),
('Créer des introductions',                'Expression et maîtrise', 3,  9, true),
('Créer des fins de chants',               'Expression et maîtrise', 3, 10, true),
('Utiliser des fills et transitions',      'Expression et maîtrise', 3, 11, true),
('Jouer spontanément pendant la louange',  'Expression et maîtrise', 3, 12, true),
('Réaliser des arrangements simples',      'Expression et maîtrise', 3, 13, true),
('Développer son propre style musical',    'Expression et maîtrise', 3, 14, true);

-- ── 3. Table travaux_a_faire ──────────────────────────────
CREATE TABLE IF NOT EXISTS travaux_a_faire (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         TEXT NOT NULL,
  description   TEXT,
  consignes     TEXT,
  ressource_url TEXT,
  echeance      DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison travaux ↔ élèves
CREATE TABLE IF NOT EXISTS travaux_eleves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travail_id  UUID REFERENCES travaux_a_faire(id) ON DELETE CASCADE,
  eleve_id    UUID REFERENCES eleves(id) ON DELETE CASCADE,
  termine     BOOLEAN DEFAULT FALSE,
  termine_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(travail_id, eleve_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_travaux_eleves_eleve ON travaux_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_travaux_eleves_travail ON travaux_eleves(travail_id);


ALTER TABLE notes_cours ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE notes_cours ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'admin';

-- ── 5. Certificats automatiques par catégorie ────────────
ALTER TABLE certificats ADD COLUMN IF NOT EXISTS type_certificat TEXT DEFAULT 'manuel';
-- Valeurs: 'manuel', 'fondamentaux', 'comprehension', 'expression', 'diplome_final'

-- ── 6. RLS pour les nouvelles tables ─────────────────────
ALTER TABLE travaux_a_faire ENABLE ROW LEVEL SECURITY;
ALTER TABLE travaux_eleves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access travaux" ON travaux_a_faire;
DROP POLICY IF EXISTS "Service role full access travaux_eleves" ON travaux_eleves;

CREATE POLICY "Service role full access travaux" ON travaux_a_faire
  FOR ALL USING (true);
CREATE POLICY "Service role full access travaux_eleves" ON travaux_eleves
  FOR ALL USING (true);