-- ══════════════════════════════════════════════════════════════════
-- QUESTIONS VIDÉO POUR LES QUIZ
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- S'assurer que la colonne video_url existe
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ══════════════════════════════════════════════════════════════════
-- EXEMPLES DE QUESTIONS VIDÉO
-- Remplacez les URLs NULL par vos vraies URLs YouTube ou Cloudinary
-- ══════════════════════════════════════════════════════════════════

-- Quiz: Développement de l'oreille
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, video_url, points, position)
SELECT id, 'video',
  'Regardez cette démonstration — quel accord est joué en premier ?',
  '["Do majeur","La mineur","Fa majeur","Sol majeur"]',
  'Do majeur',
  'Do majeur = Do - Mi - Sol. C''est l''accord le plus fondamental, souvent le premier appris.',
  NULL,  -- Remplacez par: 'https://www.youtube.com/watch?v=VOTRE_ID' ou URL Cloudinary
  2, 200
FROM quiz WHERE titre ILIKE '%oreille%' LIMIT 1;

INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, video_url, points, position)
SELECT id, 'video',
  'Dans cette vidéo, quelle technique de main gauche est utilisée ?',
  '["Alberti bass","Arpège","Block chords","Stride"]',
  'Arpège',
  'L''arpège consiste à jouer les notes d''un accord une par une, de bas en haut.',
  NULL,  -- Remplacez par votre URL vidéo
  2, 201
FROM quiz WHERE titre ILIKE '%oreille%' LIMIT 1;

-- Quiz: Accords majeurs et mineurs
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, video_url, points, position)
SELECT id, 'video',
  'Regardez le placement des doigts — quel accord est formé ?',
  '["Do majeur","Ré majeur","Mi majeur","Fa majeur"]',
  'Do majeur',
  'Do majeur : pouce sur Do, majeur sur Mi, auriculaire sur Sol.',
  NULL,  -- Remplacez par votre URL vidéo
  2, 200
FROM quiz WHERE titre ILIKE '%accord%' AND titre ILIKE '%majeur%' LIMIT 1;

-- Quiz: Renversements et progressions
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, video_url, points, position)
SELECT id, 'video',
  'Dans cette progression, combien d''accords différents entendez-vous ?',
  '["2","3","4","5"]',
  '4',
  'La progression I-V-vi-IV contient 4 accords différents. C''est la plus courante en musique pop.',
  NULL,  -- Remplacez par votre URL vidéo
  2, 200
FROM quiz WHERE titre ILIKE '%progression%' OR titre ILIKE '%renversement%' LIMIT 1;

-- ══════════════════════════════════════════════════════════════════
-- COMMENT UTILISER VOS VIDÉOS
-- ══════════════════════════════════════════════════════════════════
-- Option 1 — YouTube (recommandé):
--   video_url = 'https://www.youtube.com/watch?v=VOTRE_ID_VIDEO'
--   Le lecteur YouTube s'affiche directement dans le quiz
--
-- Option 2 — Cloudinary:
--   video_url = 'https://res.cloudinary.com/VOTRE_CLOUD/video/upload/FICHIER.mp4'
--   Le lecteur vidéo natif s'affiche
--
-- Pour mettre à jour une question existante:
--   UPDATE quiz_questions
--   SET video_url = 'https://www.youtube.com/watch?v=VOTRE_ID'
--   WHERE question LIKE '%accord est joué%';
--
-- Pour ajouter depuis l'admin:
--   Admin → Quiz → Sélectionner un quiz → Ajouter une question
--   Type: "Question avec vidéo" → coller l'URL YouTube ou Cloudinary
-- ══════════════════════════════════════════════════════════════════

-- Vérification finale
SELECT type, COUNT(*) as nb,
  COUNT(CASE WHEN audio_url IS NOT NULL THEN 1 END) as avec_audio,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as avec_image,
  COUNT(CASE WHEN video_url IS NOT NULL THEN 1 END) as avec_video
FROM quiz_questions
GROUP BY type
ORDER BY nb DESC;
