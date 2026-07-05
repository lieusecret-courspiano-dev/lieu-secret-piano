-- ══════════════════════════════════════════════════════════════
-- QUESTIONS AVEC MÉDIAS — À compléter avec vos URLs
-- Ajoutez vos URLs audio/image/vidéo dans les champs prévus
-- ══════════════════════════════════════════════════════════════

-- ── FONDAMENTAUX — Questions avec médias (10 questions) ──────

INSERT INTO banque_questions (categorie, type, question, options, bonne_reponse, explication, audio_url, image_url, video_url, points, position) VALUES

-- Questions AUDIO (reconnaissance de notes/accords)
('Fondamentaux', 'audio',
 'Écoutez attentivement. Quelle note entendez-vous ?',
 '["Do", "Ré", "Mi", "Fa"]', 'Do',
 'Le Do central (Do4) est la note de référence du piano. Son fréquence est 261,63 Hz.',
 'REMPLACER_PAR_URL_AUDIO_DO', NULL, NULL, 2, 31),

('Fondamentaux', 'audio',
 'Écoutez cet accord. Est-il majeur ou mineur ?',
 '["Majeur", "Mineur"]', 'Majeur',
 'Un accord majeur a une couleur lumineuse et joyeuse, due à sa tierce majeure (2 tons).',
 'REMPLACER_PAR_URL_AUDIO_ACCORD_MAJEUR', NULL, NULL, 2, 32),

('Fondamentaux', 'audio',
 'Combien de notes entendez-vous dans cet accord ?',
 '["2 notes", "3 notes", "4 notes", "5 notes"]', '3 notes',
 'Une triade (accord de base) contient 3 notes : fondamentale, tierce et quinte.',
 'REMPLACER_PAR_URL_AUDIO_TRIADE', NULL, NULL, 2, 33),

-- Questions IMAGE (reconnaissance visuelle sur le clavier)
('Fondamentaux', 'image',
 'Regardez l''image. Quelle note est indiquée par la flèche sur le clavier ?',
 '["Do", "Mi", "Sol", "La"]', 'Mi',
 'Le Mi est la 3e touche blanche à droite du Do. Il se trouve juste à gauche d''un groupe de 2 touches noires.',
 NULL, 'REMPLACER_PAR_URL_IMAGE_CLAVIER_MI', NULL, 2, 34),

('Fondamentaux', 'image',
 'Regardez ce schéma. Quel accord est représenté sur le clavier ?',
 '["Do majeur", "Sol majeur", "Fa majeur", "Ré majeur"]', 'Do majeur',
 'Do majeur = Do + Mi + Sol. Ce sont les touches blanches 1, 3 et 5 à partir du Do.',
 NULL, 'REMPLACER_PAR_URL_IMAGE_ACCORD_DO', NULL, 2, 35),

('Fondamentaux', 'image',
 'Regardez la partition. Quelle note est représentée par cette ronde sur la portée ?',
 '["Do", "Sol", "La", "Si"]', 'Sol',
 'Le Sol se place sur la 2e ligne de la clé de Sol (clé de violon). C''est la note qui donne son nom à cette clé.',
 NULL, 'REMPLACER_PAR_URL_IMAGE_NOTE_SOL', NULL, 2, 36),

-- Questions VIDÉO (observation d''un geste ou d''une technique)
('Fondamentaux', 'video',
 'Regardez la vidéo. Quel doigté est utilisé pour jouer cette gamme de Do majeur ?',
 '["1-2-3-1-2-3-4-5", "1-2-3-4-1-2-3-4", "1-2-3-1-2-3-5", "2-3-4-1-2-3-4-5"]', '1-2-3-1-2-3-4-5',
 'Le doigté standard de la gamme de Do majeur à la main droite est 1-2-3-1-2-3-4-5 (passage du pouce sous le majeur).',
 NULL, NULL, 'REMPLACER_PAR_URL_VIDEO_GAMME_DO', 2, 37),

('Fondamentaux', 'video',
 'Regardez la vidéo. La position de la main est-elle correcte ?',
 '["Oui, la main est bien arrondie", "Non, les doigts sont trop plats", "Non, le poignet est trop bas", "Non, le coude est mal placé"]', 'Non, les doigts sont trop plats',
 'Une bonne position de main au piano nécessite des doigts arrondis (comme si on tenait une balle), le poignet souple et le coude légèrement écarté du corps.',
 NULL, NULL, 'REMPLACER_PAR_URL_VIDEO_POSITION', 2, 38),

-- ── COMPRÉHENSION — Questions avec médias (10 questions) ─────

('Compréhension et autonomie', 'audio',
 'Écoutez cette progression d''accords. Quelle est-elle ?',
 '["I-IV-V-I", "I-V-vi-IV", "ii-V-I", "I-IV-I-V"]', 'I-V-vi-IV',
 'La progression I-V-vi-IV est reconnaissable à son mouvement descendant caractéristique. C''est l''une des plus utilisées dans la musique contemporaine.',
 'REMPLACER_PAR_URL_AUDIO_PROGRESSION', NULL, NULL, 3, 31),

('Compréhension et autonomie', 'audio',
 'Écoutez. Cet accord est-il en position fondamentale ou en renversement ?',
 '["Position fondamentale", "Premier renversement", "Deuxième renversement"]', 'Premier renversement',
 'Dans le 1er renversement, la tierce est à la basse. Le son est plus léger et moins stable qu''en position fondamentale.',
 'REMPLACER_PAR_URL_AUDIO_RENVERSEMENT', NULL, NULL, 3, 32),

('Compréhension et autonomie', 'audio',
 'Écoutez ce rythme d''accompagnement. Comment s''appelle-t-il ?',
 '["Arpège", "Alberti bass", "Stride", "Boogie"]', 'Alberti bass',
 'La basse d''Alberti alterne basse-accord-milieu-accord. C''est un accompagnement classique très utilisé par Mozart et Haydn.',
 'REMPLACER_PAR_URL_AUDIO_ALBERTI', NULL, NULL, 2, 33),

('Compréhension et autonomie', 'audio',
 'Écoutez cette mélodie. Dans quelle tonalité est-elle ?',
 '["Do majeur", "Sol majeur", "Fa majeur", "Ré majeur"]', 'Sol majeur',
 'La tonalité de Sol majeur se reconnaît à la présence du Fa# et à la note de repos sur Sol.',
 'REMPLACER_PAR_URL_AUDIO_MELODIE_SOL', NULL, NULL, 3, 34),

('Compréhension et autonomie', 'image',
 'Regardez ce schéma d''accord. Quel renversement est représenté ?',
 '["Position fondamentale", "1er renversement", "2e renversement"]', '2e renversement',
 'Le 2e renversement place la quinte à la basse. On le reconnaît car la note la plus grave est la 5e de l''accord.',
 NULL, 'REMPLACER_PAR_URL_IMAGE_2EME_RENVERSEMENT', NULL, 2, 35),

('Compréhension et autonomie', 'image',
 'Regardez cette grille d''accords. Combien de mesures dure chaque accord ?',
 '["1 mesure", "2 mesures", "4 mesures", "8 mesures"]', '2 mesures',
 'Dans cette grille, chaque accord dure 2 mesures. Savoir lire une grille d''accords est essentiel pour accompagner en autonomie.',
 NULL, 'REMPLACER_PAR_URL_IMAGE_GRILLE', NULL, 2, 36),

('Compréhension et autonomie', 'video',
 'Regardez la vidéo. Quelle technique d''accompagnement est utilisée ?',
 '["Accords plaqués", "Arpèges", "Basse Alberti", "Stride"]', 'Arpèges',
 'Les arpèges consistent à jouer les notes d''un accord successivement. Ils créent un accompagnement fluide et mélodique.',
 NULL, NULL, 'REMPLACER_PAR_URL_VIDEO_ARPEGES', 2, 37),

('Compréhension et autonomie', 'video',
 'Regardez comment le pianiste utilise les renversements. Quel est l''avantage de cette technique ?',
 '["Jouer plus vite", "Éviter les grands sauts de main gauche", "Jouer plus fort", "Mémoriser plus facilement"]', 'Éviter les grands sauts de main gauche',
 'Les renversements permettent de rester dans la même zone du clavier tout en changeant d''accord, rendant le jeu plus fluide et économique.',
 NULL, NULL, 'REMPLACER_PAR_URL_VIDEO_RENVERSEMENTS', 3, 38),

-- ── EXPRESSION — Questions avec médias (12 questions) ────────

('Expression et maîtrise', 'audio',
 'Écoutez cet accord. Quel type d''accord entendez-vous ?',
 '["Accord majeur", "Accord mineur", "Accord de 7e de dominante", "Accord sus2"]', 'Accord de 7e de dominante',
 'L''accord de 7e de dominante a une couleur tendue et instable due à l''intervalle de triton entre la tierce et la 7e.',
 'REMPLACER_PAR_URL_AUDIO_ACCORD_7', NULL, NULL, 3, 41),

('Expression et maîtrise', 'audio',
 'Écoutez cette improvisation. Sur quelle gamme est-elle basée ?',
 '["Gamme majeure", "Gamme mineure naturelle", "Gamme pentatonique", "Gamme blues"]', 'Gamme pentatonique',
 'La gamme pentatonique (5 notes) est reconnaissable à son son ouvert et mélodieux, sans demi-tons. Elle est très utilisée dans l''improvisation.',
 'REMPLACER_PAR_URL_AUDIO_IMPRO_PENTA', NULL, NULL, 3, 42),

('Expression et maîtrise', 'audio',
 'Écoutez cette introduction. Combien de mesures dure-t-elle ?',
 '["2 mesures", "4 mesures", "8 mesures", "16 mesures"]', '4 mesures',
 'Une introduction de 4 mesures est la plus courante dans la musique de louange contemporaine. Elle établit la tonalité et le tempo.',
 'REMPLACER_PAR_URL_AUDIO_INTRO', NULL, NULL, 2, 43),

('Expression et maîtrise', 'audio',
 'Écoutez. Quel accord de substitution est utilisé à la place de la dominante ?',
 '["Accord de 7e de dominante", "Accord diminué", "Accord sus4", "Accord mineur du 2e degré"]', 'Accord sus4',
 'L''accord sus4 est souvent utilisé comme substitution de la dominante pour une résolution plus douce et moderne.',
 'REMPLACER_PAR_URL_AUDIO_SUBSTITUTION', NULL, NULL, 3, 44),

('Expression et maîtrise', 'audio',
 'Écoutez ce voicing. Combien d''octaves s''étend-il ?',
 '["1 octave", "2 octaves", "3 octaves", "4 octaves"]', '2 octaves',
 'Un voicing ouvert s''étend généralement sur 2 octaves, avec la basse à la main gauche et les notes aiguës à la main droite.',
 'REMPLACER_PAR_URL_AUDIO_VOICING', NULL, NULL, 2, 45),

('Expression et maîtrise', 'image',
 'Regardez ce voicing d''accord. Comment s''appelle cette disposition des notes ?',
 '["Voicing fermé", "Voicing ouvert", "Position fondamentale", "Accord brisé"]', 'Voicing ouvert',
 'Un voicing ouvert répartit les notes sur plus d''une octave, créant un son plus aéré et moderne. C''est le style typique de la louange contemporaine.',
 NULL, 'REMPLACER_PAR_URL_IMAGE_VOICING_OUVERT', NULL, 3, 46),

('Expression et maîtrise', 'image',
 'Regardez cette grille d''accords avec substitutions. Quel accord remplace le V degré ?',
 '["VII diminué", "II mineur", "IV majeur", "VI mineur"]', 'VII diminué',
 'Le VII° (accord diminué sur la sensible) est la substitution la plus courante de la dominante. Il partage 3 notes avec l''accord de 7e de dominante.',
 NULL, 'REMPLACER_PAR_URL_IMAGE_SUBSTITUTION', NULL, 3, 47),

('Expression et maîtrise', 'image',
 'Regardez cette partition. Identifiez le type d''ornement utilisé.',
 '["Trille", "Mordant", "Gruppetto", "Appoggiature"]', 'Trille',
 'Le trille est une alternance rapide entre deux notes voisines. Il est noté "tr" au-dessus de la note et ajoute de l''expressivité.',
 NULL, 'REMPLACER_PAR_URL_IMAGE_TRILLE', NULL, 2, 48),

('Expression et maîtrise', 'video',
 'Regardez cette improvisation. Quelle technique le pianiste utilise-t-il pour créer de la tension ?',
 '["Jouer plus fort", "Utiliser des notes hors gamme (blue notes)", "Jouer plus vite", "Répéter le même accord"]', 'Utiliser des notes hors gamme (blue notes)',
 'Les blue notes (notes "bleues") sont des notes légèrement abaissées qui créent une tension expressive caractéristique du blues et du gospel.',
 NULL, NULL, 'REMPLACER_PAR_URL_VIDEO_BLUE_NOTES', 3, 49),

('Expression et maîtrise', 'video',
 'Regardez comment le pianiste crée une introduction. Quelle progression utilise-t-il ?',
 '["I-IV-V", "I-V-vi-IV", "vi-IV-I-V", "IV-I-V-vi"]', 'vi-IV-I-V',
 'La progression vi-IV-I-V (mineure relative en premier) crée une introduction plus dramatique et émotionnelle avant d''arriver sur la tonique.',
 NULL, NULL, 'REMPLACER_PAR_URL_VIDEO_INTRO_AVANCEE', 3, 50),

('Expression et maîtrise', 'video',
 'Regardez ce fill pianistique. Combien de temps dure-t-il ?',
 '["1 temps", "2 temps", "1 mesure", "2 mesures"]', '1 mesure',
 'Un fill d''une mesure est le plus courant. Il remplit l''espace entre deux phrases musicales sans perturber la structure du morceau.',
 NULL, NULL, 'REMPLACER_PAR_URL_VIDEO_FILL', 2, 51),

('Expression et maîtrise', 'video',
 'Regardez cette fin de morceau. Quelle technique de conclusion est utilisée ?',
 '["Cadence parfaite simple", "Cadence avec ritardando et diminuendo", "Arrêt brusque", "Répétition du refrain"]', 'Cadence avec ritardando et diminuendo',
 'Une fin musicale professionnelle combine généralement une cadence parfaite (V-I), un ralentissement progressif (ritardando) et une diminution du volume (diminuendo).',
 NULL, NULL, 'REMPLACER_PAR_URL_VIDEO_FIN', 3, 52);

-- Vérification finale
SELECT categorie, type, COUNT(*) as nb FROM banque_questions GROUP BY categorie, type ORDER BY categorie, type;
