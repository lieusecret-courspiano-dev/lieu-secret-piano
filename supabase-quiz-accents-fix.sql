-- ══════════════════════════════════════════════════════════════════
-- CORRECTION DES ACCENTS DANS LES QUESTIONS DE QUIZ
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Découverte du clavier
UPDATE quiz_questions SET
  question = 'Combien de touches blanches différentes sur un piano ?',
  explication = 'Il y a 7 touches blanches : Do Ré Mi Fa Sol La Si'
WHERE question = 'Combien de touches blanches differentes sur un piano';

UPDATE quiz_questions SET
  question = 'Quelle note est juste à gauche du groupe de 2 noires ?',
  explication = 'Do est toujours juste à gauche du groupe de 2 noires'
WHERE question = 'Quelle note est juste a gauche du groupe de 2 noires';

UPDATE quiz_questions SET
  question = 'Quelle note est juste à gauche du groupe de 3 noires ?',
  explication = 'Fa est toujours juste à gauche du groupe de 3 noires'
WHERE question = 'Quelle note est juste a gauche du groupe de 3 noires';

UPDATE quiz_questions SET
  question = 'Comment s''appelle la note C en notation française ?',
  explication = 'C=Do D=Ré E=Mi F=Fa G=Sol A=La B=Si'
WHERE question = 'Comment s appelle la note C en notation francaise';

UPDATE quiz_questions SET
  question = 'Quel doigt porte le numéro 1 ?',
  explication = '1=Pouce 2=Index 3=Majeur 4=Annulaire 5=Auriculaire'
WHERE question = 'Quel doigt porte le numero 1';

UPDATE quiz_questions SET
  question = 'Qu''est-ce qu''un demi-ton ?',
  explication = 'Un demi-ton est le plus petit intervalle sur le piano, entre deux touches adjacentes'
WHERE question LIKE '%demi-ton%' AND explication NOT LIKE '%intervalle%';

-- Altérations et intervalles
UPDATE quiz_questions SET
  question = 'Qu''est-ce qu''un dièse (#) ?',
  explication = 'Un dièse élève la note d''un demi-ton. Do# est un demi-ton au-dessus de Do'
WHERE question LIKE '%diese%' OR question LIKE '%dièse%';

UPDATE quiz_questions SET
  question = 'Qu''est-ce qu''un bémol (b) ?',
  explication = 'Un bémol abaisse la note d''un demi-ton. Réb est un demi-ton en dessous de Ré'
WHERE question LIKE '%bemol%' OR question LIKE '%bémol%';

UPDATE quiz_questions SET
  question = 'Combien de demi-tons dans une octave ?',
  explication = 'Une octave contient 12 demi-tons. Ex: de Do à Do supérieur'
WHERE question LIKE '%octave%' AND question LIKE '%demi%';

-- Construction des gammes
UPDATE quiz_questions SET
  question = 'Quelle est la formule d''une gamme majeure ?',
  explication = 'T-T-½-T-T-T-½ (Ton-Ton-Demi-ton-Ton-Ton-Ton-Demi-ton)'
WHERE question LIKE '%formule%' AND question LIKE '%majeure%';

UPDATE quiz_questions SET
  question = 'Quelles notes composent la gamme de Do majeur ?',
  explication = 'Do Ré Mi Fa Sol La Si Do — aucune altération'
WHERE question LIKE '%Do majeur%' AND question LIKE '%notes%';

-- Accords majeurs et mineurs
UPDATE quiz_questions SET
  question = 'Qu''est-ce qu''un accord majeur ?',
  explication = 'Un accord majeur = fondamentale + tierce majeure (4 demi-tons) + quinte juste (7 demi-tons)'
WHERE question LIKE '%accord majeur%' AND question LIKE '%est-ce%';

UPDATE quiz_questions SET
  question = 'Quelles notes composent l''accord de Do majeur ?',
  explication = 'Do - Mi - Sol : fondamentale, tierce majeure, quinte juste'
WHERE question LIKE '%Do majeur%' AND question LIKE '%accord%';

UPDATE quiz_questions SET
  question = 'Qu''est-ce qu''un accord mineur ?',
  explication = 'Un accord mineur = fondamentale + tierce mineure (3 demi-tons) + quinte juste (7 demi-tons)'
WHERE question LIKE '%accord mineur%' AND question LIKE '%est-ce%';

-- Renversements et progressions
UPDATE quiz_questions SET
  question = 'Qu''est-ce qu''un renversement d''accord ?',
  explication = 'Renverser un accord = changer la note la plus basse sans changer les notes de l''accord'
WHERE question LIKE '%renversement%' AND question LIKE '%est-ce%';

UPDATE quiz_questions SET
  question = 'Quelle est la progression I-IV-V en Do majeur ?',
  explication = 'I=Do majeur, IV=Fa majeur, V=Sol majeur — très courante en musique populaire'
WHERE question LIKE '%I-IV-V%' OR question LIKE '%progression%';

-- Développement de l'oreille
UPDATE quiz_questions SET
  question = 'Comment reconnaître un accord majeur à l''oreille ?',
  explication = 'Un accord majeur sonne joyeux et lumineux. Un accord mineur sonne mélancolique'
WHERE question LIKE '%majeur%' AND question LIKE '%oreille%';

-- Corrections générales des mots sans accents
UPDATE quiz_questions SET question = REPLACE(question, 'Quel est le', 'Quel est le') WHERE question LIKE '%Quel est le%';
UPDATE quiz_questions SET explication = REPLACE(explication, 'a gauche', 'à gauche') WHERE explication LIKE '%a gauche%';
UPDATE quiz_questions SET explication = REPLACE(explication, 'a droite', 'à droite') WHERE explication LIKE '%a droite%';
UPDATE quiz_questions SET explication = REPLACE(explication, 'demi-ton', 'demi-ton') WHERE explication LIKE '%demi-ton%';
UPDATE quiz_questions SET question = REPLACE(question, ' a ', ' à ') WHERE question LIKE '% a %' AND question NOT LIKE '%La%';
UPDATE quiz_questions SET explication = REPLACE(explication, 'Re ', 'Ré ') WHERE explication LIKE '%Re %';
UPDATE quiz_questions SET explication = REPLACE(explication, 'Mi ', 'Mi ') WHERE explication LIKE '%Mi %';

-- Vérification
SELECT COUNT(*) as total_questions FROM quiz_questions;
SELECT question, explication FROM quiz_questions LIMIT 5;
