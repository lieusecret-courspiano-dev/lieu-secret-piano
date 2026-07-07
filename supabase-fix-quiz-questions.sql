-- ══════════════════════════════════════════════════════════════
-- NETTOYAGE DES QUIZ D'ENTRAÎNEMENT
-- Supprime les questions en trop (garder seulement les 10 premières
-- par position pour chaque quiz)
-- ══════════════════════════════════════════════════════════════

-- 1. Voir l'état actuel
SELECT q.titre, COUNT(qq.id) as nb_questions
FROM quiz q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
GROUP BY q.titre
ORDER BY q.titre;

-- 2. Supprimer les questions en doublon (garder seulement les 10 premières par position)
-- Pour chaque quiz, on garde les 10 questions avec les positions les plus basses
DELETE FROM quiz_questions
WHERE id IN (
  SELECT qq.id
  FROM quiz_questions qq
  JOIN quiz q ON q.id = qq.quiz_id
  WHERE qq.position >= 10
);

-- 3. Vérification après nettoyage
SELECT q.titre, COUNT(qq.id) as nb_questions
FROM quiz q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
GROUP BY q.titre
ORDER BY q.titre;
