-- ══════════════════════════════════════════════════════════════════
-- QUESTIONS AUDIO ET IMAGE POUR LES QUIZ
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════
-- Note: Remplacez les URLs par vos vrais fichiers audio/image
-- Vous pouvez héberger vos fichiers sur Cloudinary ou Supabase Storage

-- ── Questions AUDIO — Développement de l'oreille ──────────────────
-- Ces questions nécessitent des fichiers audio que vous uploadez dans Cloudinary
-- Format: https://res.cloudinary.com/VOTRE_CLOUD/video/upload/FICHIER.mp3

-- Exemple de structure pour une question audio:
-- INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, audio_url, points, position)
-- SELECT id, 'audio', 'Écoutez cet accord — est-il majeur ou mineur ?',
--   '["Majeur","Mineur"]', 'Majeur',
--   'Un accord majeur sonne lumineux et joyeux. Un accord mineur sonne mélancolique.',
--   'https://res.cloudinary.com/VOTRE_CLOUD/video/upload/accord_do_majeur.mp3',
--   2, 10
-- FROM quiz WHERE titre = 'Développement de l''oreille';

-- ── Questions IMAGE — Découverte du clavier ────────────────────────
-- Ces questions utilisent des images de partitions ou de claviers

-- Exemple de structure pour une question image:
-- INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, image_url, points, position)
-- SELECT id, 'image', 'Quelle note est indiquée par la flèche sur ce clavier ?',
--   '["Do","Ré","Mi","Fa"]', 'Do',
--   'La note Do est toujours à gauche du groupe de 2 touches noires.',
--   'https://res.cloudinary.com/VOTRE_CLOUD/image/upload/clavier_do.png',
--   2, 11
-- FROM quiz WHERE titre = 'Découverte du clavier';

-- ── Questions AUDIO prêtes à l'emploi (avec URLs à compléter) ─────

-- Quiz: Développement de l'oreille
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, audio_url, points, position)
SELECT id, 'audio',
  'Écoutez cet extrait — combien de notes entendez-vous dans cet accord ?',
  '["2 notes","3 notes","4 notes","5 notes"]',
  '3 notes',
  'Un accord de base (triade) contient 3 notes : la fondamentale, la tierce et la quinte.',
  NULL,  -- Remplacez NULL par votre URL audio: 'https://...'
  2, 100
FROM quiz WHERE titre ILIKE '%oreille%' LIMIT 1;

INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, audio_url, points, position)
SELECT id, 'audio',
  'Écoutez cette gamme — est-elle majeure ou mineure ?',
  '["Majeure","Mineure","Chromatique","Pentatonique"]',
  'Majeure',
  'La gamme majeure a un son lumineux et joyeux grâce à sa tierce majeure.',
  NULL,  -- Remplacez NULL par votre URL audio
  2, 101
FROM quiz WHERE titre ILIKE '%oreille%' LIMIT 1;

INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, audio_url, points, position)
SELECT id, 'audio',
  'Quel intervalle entendez-vous entre ces deux notes ?',
  '["Seconde","Tierce","Quinte","Octave"]',
  'Quinte',
  'La quinte juste (7 demi-tons) a un son ouvert et stable, très reconnaissable.',
  NULL,  -- Remplacez NULL par votre URL audio
  2, 102
FROM quiz WHERE titre ILIKE '%oreille%' LIMIT 1;

-- ── Questions IMAGE prêtes à l'emploi ─────────────────────────────

-- Quiz: Découverte du clavier
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, image_url, points, position)
SELECT id, 'image',
  'Sur ce clavier, quelle note est indiquée ?',
  '["Do","Ré","Mi","Fa"]',
  'Do',
  'Do est toujours à gauche du groupe de 2 touches noires.',
  NULL,  -- Remplacez NULL par votre URL image
  2, 100
FROM quiz WHERE titre ILIKE '%clavier%' LIMIT 1;

INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, image_url, points, position)
SELECT id, 'image',
  'Combien de groupes de 3 touches noires voyez-vous sur ce clavier ?',
  '["3","4","5","6"]',
  '5',
  'Un piano standard a 5 groupes de 3 touches noires sur 7 octaves.',
  NULL,  -- Remplacez NULL par votre URL image
  2, 101
FROM quiz WHERE titre ILIKE '%clavier%' LIMIT 1;

-- Quiz: Construction des gammes
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, image_url, points, position)
SELECT id, 'image',
  'Sur cette partition, quelle gamme est représentée ?',
  '["Do majeur","Sol majeur","Ré majeur","Fa majeur"]',
  'Do majeur',
  'La gamme de Do majeur ne contient aucune altération (ni dièse ni bémol).',
  NULL,  -- Remplacez NULL par votre URL image
  2, 100
FROM quiz WHERE titre ILIKE '%gamme%' LIMIT 1;

-- ══════════════════════════════════════════════════════════════════
-- COMMENT AJOUTER VOS PROPRES FICHIERS AUDIO/IMAGE
-- ══════════════════════════════════════════════════════════════════
-- 1. Uploadez vos fichiers sur Cloudinary (cloudinary.com)
--    - Audio: .mp3, .wav, .ogg
--    - Image: .jpg, .png, .webp
--
-- 2. Copiez l'URL générée par Cloudinary
--    Ex: https://res.cloudinary.com/votre-cloud/video/upload/accord.mp3
--
-- 3. Mettez à jour les questions avec l'URL:
--    UPDATE quiz_questions
--    SET audio_url = 'https://res.cloudinary.com/...'
--    WHERE question = 'Écoutez cet accord...';
--
-- 4. Ou utilisez l'interface admin pour ajouter directement
--    Admin → Quiz → Sélectionner un quiz → Ajouter une question
--    Type: "Question audio" ou "Question avec image"
-- ══════════════════════════════════════════════════════════════════

-- Vérification
SELECT type, COUNT(*) as nb FROM quiz_questions GROUP BY type ORDER BY nb DESC;
