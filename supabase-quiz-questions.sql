-- ============================================================
-- QUIZ QUESTIONS — Basées sur le support de cours Lieu Secret
-- Exécutez ce fichier APRÈS supabase-migration-v7-FINAL.sql
-- ============================================================

-- ── QUIZ (créer si pas encore fait) ──────────────────────────

INSERT INTO quiz (titre, description, niveau, score_min, statut) VALUES
  ('Découverte du clavier',             'Organisation du clavier, nom des notes, repères.',          'fondamentaux', 70, 'publie'),
  ('Altérations et intervalles',        'Dièses, bémols, bécarres et distances entre les notes.',    'fondamentaux', 70, 'publie'),
  ('Construction des gammes majeures',  'Formule T-T-D-T-T-T-D et pratique des gammes.',             'fondamentaux', 70, 'publie'),
  ('Accords majeurs et mineurs',        'Construire et identifier les accords de base.',              'fondamentaux', 70, 'publie'),
  ('Renversements et progressions',     'Renversements d''accords et progressions magiques.',         'comprehension', 70, 'publie'),
  ('Développement de l''oreille',       'Identifier les accords et tonalités à l''oreille.',          'comprehension', 70, 'publie'),
  ('Harmonie avancée',                  'Accords de 7e, sus, add et voicings modernes.',              'expression',   70, 'publie'),
  ('Improvisation et créativité',       'Principes de l''improvisation et du jeu spontané.',          'expression',   70, 'publie')
ON CONFLICT DO NOTHING;

-- ── QUESTIONS QUIZ 1 : Découverte du clavier ─────────────────

WITH q AS (SELECT id FROM quiz WHERE titre = 'Découverte du clavier' LIMIT 1)
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position)
SELECT q.id, v.type, v.question, v.options::jsonb, v.bonne_reponse, v.explication, v.points, v.position
FROM q, (VALUES
  ('qcm','Combien y a-t-il de touches blanches différentes sur un piano ?',
   '["5","7","8","12"]','7',
   'Il y a 7 touches blanches différentes : Do, Ré, Mi, Fa, Sol, La, Si — qui se répètent sur toute l''étendue du clavier.',1,0),
  ('qcm','Quelle note se trouve juste à gauche du groupe de 2 touches noires ?',
   '["Ré","Mi","Do","Fa"]','Do',
   'Do est toujours juste à gauche du groupe de 2 noires. C''est le repère principal du clavier.',1,1),
  ('qcm','Quelle note se trouve juste à gauche du groupe de 3 touches noires ?',
   '["Sol","Fa","La","Mi"]','Fa',
   'Fa est toujours juste à gauche du groupe de 3 noires. Ces deux repères permettent de retrouver toutes les notes.',1,2),
  ('vrai_faux','Un piano standard possède 88 touches.',
   NULL,'Vrai',
   'Un piano standard possède 88 touches : 52 blanches et 36 noires, couvrant 7 octaves complètes.',1,3),
  ('qcm','Comment s''appelle la note "C" en notation française ?',
   '["La","Si","Do","Ré"]','Do',
   'En notation anglophone : C=Do, D=Ré, E=Mi, F=Fa, G=Sol, A=La, B=Si.',1,4),
  ('qcm','Quel doigt porte le numéro 1 ?',
   '["L''auriculaire","L''index","Le majeur","Le pouce"]','Le pouce',
   'Numérotation : 1=Pouce, 2=Index, 3=Majeur, 4=Annulaire, 5=Auriculaire.',1,5),
  ('qcm','Pour jouer un accord à 3 sons (triade), quels doigts utilise-t-on ?',
   '["1-2-3","1-3-5","2-3-4","1-4-5"]','1-3-5',
   'Pour les triades : Pouce (1), Majeur (3) et Auriculaire (5). Ce doigté permet de jouer les 3 notes confortablement.',1,6),
  ('vrai_faux','Les touches noires peuvent changer de nom selon la gamme.',
   NULL,'Vrai',
   'Une touche noire peut s''appeler Do# ou Réb selon la gamme. Les touches blanches gardent toujours le même nom.',1,7),
  ('qcm','Quelle est la bonne posture au piano ?',
   '["Dos courbé, poignets rigides","Dos droit, poignets souples, doigts courbés","Dos droit, bras tendus","Assis très loin du clavier"]','Dos droit, poignets souples, doigts courbés',
   'La posture correcte : dos droit mais détendu, coudes légèrement en avant, poignets souples, doigts légèrement courbés comme pour tenir une balle.',1,8),
  ('qcm','Combien d''octaves complètes couvre un piano standard ?',
   '["5","6","7","8"]','7',
   'Un piano standard couvre 7 octaves complètes avec ses 88 touches.',1,9)
) AS v(type, question, options, bonne_reponse, explication, points, position)
ON CONFLICT DO NOTHING;

-- ── QUESTIONS QUIZ 2 : Altérations et intervalles ────────────

WITH q AS (SELECT id FROM quiz WHERE titre = 'Altérations et intervalles' LIMIT 1)
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position)
SELECT q.id, v.type, v.question, v.options::jsonb, v.bonne_reponse, v.explication, v.points, v.position
FROM q, (VALUES
  ('qcm','Que fait le dièse (#) sur une note ?',
   '["Il l''abaisse d''un demi-ton","Il l''élève d''un demi-ton","Il l''élève d''un ton","Il annule l''altération"]','Il l''élève d''un demi-ton',
   'Le dièse (#) élève la note d''un demi-ton chromatique. Ex : Do# est un demi-ton au-dessus de Do.',1,0),
  ('qcm','Que fait le bémol (b) sur une note ?',
   '["Il l''élève d''un demi-ton","Il l''abaisse d''un demi-ton","Il l''abaisse d''un ton","Il annule l''altération"]','Il l''abaisse d''un demi-ton',
   'Le bémol (b) abaisse la note d''un demi-ton chromatique. Ex : Réb est un demi-ton en dessous de Ré.',1,1),
  ('qcm','Combien de demi-tons y a-t-il dans un ton ?',
   '["1","2","3","4"]','2',
   '1 ton = 2 demi-tons. Un demi-ton correspond à une touche adjacente (blanche ou noire).',1,2),
  ('qcm','Comment s''appelle la distance entre deux notes ?',
   '["Un accord","Un intervalle","Une gamme","Un degré"]','Un intervalle',
   'Un intervalle est la distance qui sépare deux notes. Il se mesure en tons et demi-tons.',1,3),
  ('qcm','Dans l''accord Do majeur (Do-Mi-Sol), comment s''appelle Mi ?',
   '["La fondamentale","La quinte","La tierce","L''octave"]','La tierce',
   'Mi est la 3ème note de l''accord, donc la Tierce. Do est la Fondamentale, Sol est la Quinte.',1,4),
  ('qcm','Que fait le bécarre sur une note ?',
   '["Il l''élève d''un demi-ton","Il l''abaisse d''un demi-ton","Il annule toutes les altérations","Il double la note"]','Il annule toutes les altérations',
   'Le bécarre annule l''effet de toutes les altérations et rend à une note sa hauteur naturelle.',1,5),
  ('qcm','Combien de demi-tons séparent une fondamentale de sa quinte ?',
   '["5","6","7","8"]','7',
   'La quinte est située 7 demi-tons au-dessus de la fondamentale. Ex : Do → Sol = 7 demi-tons.',1,6),
  ('vrai_faux','Un intervalle mélodique est joué avec les deux notes simultanément.',
   NULL,'Faux',
   'Un intervalle mélodique est joué successivement. L''intervalle harmonique est joué simultanément.',1,7),
  ('qcm','Combien de demi-tons séparent une fondamentale de sa tierce majeure ?',
   '["2","3","4","5"]','4',
   'La tierce majeure est à 4 demi-tons de la fondamentale. La tierce mineure est à 3 demi-tons.',1,8),
  ('qcm','Comment s''appelle la 8ème note d''une gamme ?',
   '["La septième","La quinte","L''octave","La sixte"]','L''octave',
   'L''octave est la 8ème note, identique à la fondamentale mais une octave plus haut (12 demi-tons).',1,9)
) AS v(type, question, options, bonne_reponse, explication, points, position)
ON CONFLICT DO NOTHING;

-- ── QUESTIONS QUIZ 3 : Construction des gammes ───────────────

WITH q AS (SELECT id FROM quiz WHERE titre = 'Construction des gammes majeures' LIMIT 1)
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position)
SELECT q.id, v.type, v.question, v.options::jsonb, v.bonne_reponse, v.explication, v.points, v.position
FROM q, (VALUES
  ('qcm','Quelle est la formule pour construire une gamme majeure ?',
   '["T-D-T-T-D-T-T","T-T-D-T-T-T-D","D-T-T-D-T-T-T","T-T-T-D-T-T-D"]','T-T-D-T-T-T-D',
   'La formule T-T-D-T-T-T-D (T=Ton, D=Demi-ton) s''applique à toutes les gammes majeures.',2,0),
  ('qcm','Dans la gamme de Do majeur, quelle est la 4ème note ?',
   '["Mi","Sol","Fa","La"]','Fa',
   'Gamme de Do majeur : Do-Ré-Mi-Fa-Sol-La-Si-Do. La 4ème note est Fa.',1,1),
  ('qcm','Combien d''altérations contient la gamme de Do majeur ?',
   '["0","1","2","7"]','0',
   'La gamme de Do majeur est la seule gamme majeure sans altération — uniquement des touches blanches.',1,2),
  ('qcm','Quelle gamme majeure contient Fa# ?',
   '["Do majeur","Fa majeur","Sol majeur","La majeur"]','Sol majeur',
   'Gamme de Sol majeur : Sol-La-Si-Do-Ré-Mi-Fa#-Sol. Elle contient un seul dièse : Fa#.',1,3),
  ('qcm','Entre Mi et Fa, quel est l''intervalle ?',
   '["1 ton","1 demi-ton","2 tons","3 demi-tons"]','1 demi-ton',
   'Mi et Fa sont des touches blanches adjacentes sans touche noire entre elles : intervalle d''un demi-ton.',1,4),
  ('vrai_faux','La gamme pentatonique contient 7 notes.',
   NULL,'Faux',
   'La gamme pentatonique contient 5 notes (penta = cinq). Très utilisée en jazz, blues et rock.',1,5),
  ('qcm','Quel est le doigté correct pour la gamme de Do majeur à la main droite ?',
   '["1-2-3-4-5-1-2-3","1-2-3-1-2-3-4-5","1-2-3-4-1-2-3-4","1-3-5-1-3-5-1-3"]','1-2-3-1-2-3-4-5',
   'Le doigté 1-2-3-1-2-3-4-5 inclut le passage du pouce sous le majeur entre Mi et Fa.',2,6),
  ('qcm','Dans une gamme majeure, quel degré est toujours diminué ?',
   '["Le 5ème","Le 6ème","Le 7ème","Le 2ème"]','Le 7ème',
   '1er, 4ème, 5ème degrés = Majeurs. 2ème, 3ème, 6ème = Mineurs. 7ème = Diminué.',1,7),
  ('qcm','Que signifie T dans la formule T-T-D-T-T-T-D ?',
   '["Tierce","Ton","Touche","Tempo"]','Ton',
   'T = Ton (sauter une touche blanche ou noire). D = Demi-ton (touche voisine directe).',1,8),
  ('qcm','Combien de notes contient une gamme majeure ?',
   '["5","6","7","8"]','8',
   'Une gamme majeure contient 8 notes (la 8ème étant la répétition de la fondamentale à l''octave supérieure).',1,9)
) AS v(type, question, options, bonne_reponse, explication, points, position)
ON CONFLICT DO NOTHING;

-- ── QUESTIONS QUIZ 4 : Accords majeurs et mineurs ────────────

WITH q AS (SELECT id FROM quiz WHERE titre = 'Accords majeurs et mineurs' LIMIT 1)
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position)
SELECT q.id, v.type, v.question, v.options::jsonb, v.bonne_reponse, v.explication, v.points, v.position
FROM q, (VALUES
  ('qcm','Quelle est la formule pour construire un accord majeur ?',
   '["Fond. + 3 + 4 demi-tons","Fond. + 4 + 3 demi-tons","Fond. + 5 + 2 demi-tons","Fond. + 2 + 5 demi-tons"]','Fond. + 4 + 3 demi-tons',
   'Accord majeur = Fondamentale + 4 demi-tons (tierce majeure) + 3 demi-tons (quinte). Ex : Do-Mi-Sol.',2,0),
  ('qcm','Quelles sont les notes de l''accord de Sol majeur ?',
   '["Sol-La-Ré","Sol-Si-Ré","Sol-Si-Mi","Sol-La-Mi"]','Sol-Si-Ré',
   'Sol majeur : Sol + 4 demi-tons = Si + 3 demi-tons = Ré. Résultat : Sol-Si-Ré.',2,1),
  ('qcm','Quelle est la différence entre accord majeur et mineur ?',
   '["La quinte est différente","La fondamentale change","La tierce est abaissée d''un demi-ton","Le nombre de notes change"]','La tierce est abaissée d''un demi-ton',
   'La seule différence : la tierce mineure est à 3 demi-tons (au lieu de 4 pour le majeur).',2,2),
  ('qcm','Comment note-t-on un accord mineur en notation anglophone ?',
   '["Avec un M majuscule","Avec un m minuscule","Avec un b","Avec un #"]','Avec un m minuscule',
   'Ex : La mineur = Am, Ré mineur = Dm, Mi mineur = Em. Le m minuscule indique l''accord mineur.',1,3),
  ('qcm','Quelles sont les notes de l''accord de La mineur ?',
   '["La-Do#-Mi","La-Do-Mi","La-Si-Mi","La-Do-Ré"]','La-Do-Mi',
   'La mineur : La + 3 demi-tons = Do + 4 demi-tons = Mi. Résultat : La-Do-Mi.',2,4),
  ('vrai_faux','Un accord majeur produit une sonorité mélancolique.',
   NULL,'Faux',
   'C''est l''accord mineur qui est mélancolique. L''accord majeur produit une sonorité joyeuse et stable.',1,5),
  ('qcm','Dans la notation anglophone, comment s''écrit Ré mineur ?',
   '["Rm","Dm","Rem","Dm7"]','Dm',
   'Ré = D en anglais. Mineur = m minuscule. Donc Ré mineur = Dm.',1,6),
  ('qcm','Quelles sont les notes de l''accord de Fa majeur ?',
   '["Fa-La-Do","Fa-Sol-Do","Fa-La-Ré","Fa-Si-Do"]','Fa-La-Do',
   'Fa majeur : Fa + 4 demi-tons = La + 3 demi-tons = Do. Résultat : Fa-La-Do.',2,7),
  ('qcm','Qu''est-ce qu''une triade ?',
   '["Un accord de 4 notes","Un accord de 3 sons","Une gamme de 3 notes","Un arpège"]','Un accord de 3 sons',
   'Une triade est un accord de 3 sons : la fondamentale, la tierce et la quinte.',1,8),
  ('qcm','Quelles sont les notes de l''accord de Mi mineur ?',
   '["Mi-Sol#-Si","Mi-Sol-Si","Mi-Fa-Si","Mi-La-Si"]','Mi-Sol-Si',
   'Mi mineur : Mi + 3 demi-tons = Sol + 4 demi-tons = Si. Résultat : Mi-Sol-Si.',2,9)
) AS v(type, question, options, bonne_reponse, explication, points, position)
ON CONFLICT DO NOTHING;

-- ── QUESTIONS QUIZ 5 : Renversements et progressions ─────────

WITH q AS (SELECT id FROM quiz WHERE titre = 'Renversements et progressions' LIMIT 1)
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position)
SELECT q.id, v.type, v.question, v.options::jsonb, v.bonne_reponse, v.explication, v.points, v.position
FROM q, (VALUES
  ('qcm','Dans le 1er renversement de Do majeur, quelle note est en bas ?',
   '["Do","Sol","Mi","Ré"]','Mi',
   '1er renversement : la fondamentale monte à l''octave. Mi (tierce) devient la note la plus grave : Mi-Sol-Do.',2,0),
  ('qcm','Dans le 2ème renversement de Do majeur, quelle note est en bas ?',
   '["Do","Mi","Sol","La"]','Sol',
   '2ème renversement : Sol (quinte) devient la note la plus grave : Sol-Do-Mi.',2,1),
  ('qcm','Quelle est la progression magique la plus populaire ?',
   '["1-2-3-4","1-4-5-1","1-5-6-4","6-4-1-5"]','1-5-6-4',
   'La progression 1-5-6-4 est la plus utilisée en pop, rock et gospel. En Do : Do-Sol-Lam-Fa.',2,2),
  ('qcm','En Do majeur, quelle est la progression 1-5-6-4 ?',
   '["Do-Fa-Lam-Sol","Do-Sol-Lam-Fa","Do-Lam-Fa-Sol","Fa-Sol-Lam-Do"]','Do-Sol-Lam-Fa',
   '1=Do, 5=Sol, 6=La mineur, 4=Fa. Cette progression crée un équilibre parfait.',2,3),
  ('vrai_faux','Les renversements permettent d''éviter les grands déplacements de la main.',
   NULL,'Vrai',
   'C''est l''un des principaux avantages des renversements : fluidité et économie de mouvement.',1,4),
  ('qcm','Dans la progression 1-5-6-4, quel accord est mineur ?',
   '["Le 1","Le 5","Le 6","Le 4"]','Le 6',
   'Dans une gamme majeure, le 6ème degré est toujours mineur. C''est lui qui apporte l''émotion.',1,5),
  ('qcm','Quel est l''avantage principal des renversements ?',
   '["Changer la tonalité","Améliorer la fluidité des enchaînements","Ajouter des notes","Changer le rythme"]','Améliorer la fluidité des enchaînements',
   'Les renversements permettent de passer d''un accord à l''autre avec un minimum de mouvement.',1,6),
  ('qcm','En Do majeur, quelle est la progression 1-6-4-5 ?',
   '["Do-Lam-Fa-Sol","Do-Sol-Fa-Lam","Fa-Lam-Do-Sol","Do-Fa-Sol-Lam"]','Do-Lam-Fa-Sol',
   '1=Do, 6=La mineur, 4=Fa, 5=Sol. Variante classique et intemporelle.',2,7),
  ('qcm','Combien de renversements possède un accord à 3 sons ?',
   '["1","2","3","4"]','2',
   'Un accord à 3 sons a 2 renversements : le 1er (tierce en bas) et le 2ème (quinte en bas).',1,8),
  ('qcm','Dans la position fondamentale, quelle note est en bas ?',
   '["La tierce","La quinte","La fondamentale","L''octave"]','La fondamentale',
   'En position fondamentale, la fondamentale est la note la plus grave. C''est la position classique.',1,9)
) AS v(type, question, options, bonne_reponse, explication, points, position)
ON CONFLICT DO NOTHING;

-- ── QUESTIONS QUIZ 6 : Développement de l'oreille ────────────

WITH q AS (SELECT id FROM quiz WHERE titre = 'Développement de l''oreille' LIMIT 1)
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position)
SELECT q.id, v.type, v.question, v.options::jsonb, v.bonne_reponse, v.explication, v.points, v.position
FROM q, (VALUES
  ('qcm','Comment identifier la tonalité d''un chant ?',
   '["Écouter la première note","Écouter la note finale","Compter les notes","Regarder la partition"]','Écouter la note finale',
   'La note finale correspond souvent à la tonique (1er degré). C''est le point de départ pour identifier la tonalité.',1,0),
  ('qcm','Quel type d''accord produit un son joyeux et stable ?',
   '["Mineur","Diminué","Majeur","Sus4"]','Majeur',
   'L''accord majeur produit une sonorité joyeuse, lumineuse et stable.',1,1),
  ('qcm','Quel accord produit une tension qui appelle une résolution ?',
   '["Majeur","Mineur","7e dominante","Sus2"]','7e dominante',
   'L''accord de 7e dominante crée une tension harmonique qui appelle naturellement une résolution vers la tonique.',1,2),
  ('vrai_faux','Pour retrouver une mélodie à l''oreille, il faut d''abord trouver la première note.',
   NULL,'Vrai',
   'Méthode : écouter → fredonner → trouver la première note → construire note par note.',1,3),
  ('qcm','Dans la musique de louange, quelle est la tonalité la plus courante ?',
   '["Si bémol majeur","Do majeur","Fa# majeur","Ré bémol majeur"]','Do majeur',
   'Les tonalités les plus courantes en louange : Do, Sol, Ré, La et Mi majeur.',1,4),
  ('qcm','Comment reconnaître un accord mineur à l''oreille ?',
   '["Son lumineux et joyeux","Son sombre et mélancolique","Son tendu et instable","Son ouvert et aérien"]','Son sombre et mélancolique',
   'L''accord mineur se reconnaît à son caractère sombre et mélancolique, contrairement au majeur.',1,5),
  ('qcm','Quelle est la première étape pour retrouver une mélodie à l''oreille ?',
   '["Jouer directement sur le piano","Écouter la mélodie plusieurs fois","Chercher la partition","Demander à quelqu''un"]','Écouter la mélodie plusieurs fois',
   'Étape 1 : écouter attentivement. Étape 2 : fredonner. Étape 3 : trouver la première note. Étape 4 : construire note par note.',1,6),
  ('qcm','Quel accord produit un son instable et dissonant ?',
   '["Majeur","Mineur","Sus4","Diminué"]','Diminué',
   'L''accord diminué produit un son instable et dissonant qui crée une forte tension.',1,7),
  ('qcm','Comment s''appelle la capacité à percevoir et reproduire les sons musicaux ?',
   '["La technique","L''oreille musicale","La mémoire","Le rythme"]','L''oreille musicale',
   'L''oreille musicale est la capacité à percevoir, analyser et reproduire les sons. Elle se développe avec la pratique.',1,8),
  ('reponse_courte','Citez une tonalité courante en musique de louange.',
   NULL,'Do majeur',
   'Les tonalités courantes en louange : Do majeur, Sol majeur, Ré majeur, La majeur, Mi majeur.',1,9)
) AS v(type, question, options, bonne_reponse, explication, points, position)
ON CONFLICT DO NOTHING;

-- ── QUESTIONS QUIZ 7 : Harmonie avancée ──────────────────────

WITH q AS (SELECT id FROM quiz WHERE titre = 'Harmonie avancée' LIMIT 1)
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position)
SELECT q.id, v.type, v.question, v.options::jsonb, v.bonne_reponse, v.explication, v.points, v.position
FROM q, (VALUES
  ('qcm','Quelles notes composent l''accord Cmaj7 ?',
   '["Do-Mi-Sol-La","Do-Mi-Sol-Si","Do-Ré-Sol-Si","Do-Mi-Fa-Si"]','Do-Mi-Sol-Si',
   'Cmaj7 = Do + Mi (tierce maj.) + Sol (quinte) + Si (7e maj.). Son doux et lumineux.',2,0),
  ('qcm','Quelle est la différence entre maj7 et 7 dominante ?',
   '["La quinte est différente","La 7e est mineure dans la dominante","La fondamentale change","La tierce est différente"]','La 7e est mineure dans la dominante',
   'Maj7 : 7e majeure (11 demi-tons). 7 dominante : 7e mineure (10 demi-tons). Ex : G7=Sol-Si-Ré-Fa.',2,1),
  ('qcm','Dans un accord sus4, quelle note remplace la tierce ?',
   '["La seconde","La quarte","La sixte","La septième"]','La quarte',
   'Sus4 = la tierce est remplacée par la quarte. Ex : Csus4 = Do-Fa-Sol. Son suspendu.',2,2),
  ('qcm','Quel accord produit un son suspendu, en attente ?',
   '["Maj7","Mineur","Sus4","Add9"]','Sus4',
   'L''accord sus4 crée une sensation de suspension et d''attente. Il résout vers l''accord majeur.',1,3),
  ('qcm','Qu''est-ce qu''un voicing ?',
   '["Un type de gamme","La façon dont les notes d''un accord sont disposées","Un rythme particulier","Un type d''arpège"]','La façon dont les notes d''un accord sont disposées',
   'Le voicing désigne la disposition des notes d''un accord sur le clavier. Un même accord peut avoir de nombreux voicings.',1,4),
  ('qcm','Quelles notes composent l''accord Am7 ?',
   '["La-Do-Mi-Sol","La-Do#-Mi-Sol","La-Do-Mi-Si","La-Ré-Mi-Sol"]','La-Do-Mi-Sol',
   'Am7 = La (fond.) + Do (tierce min.) + Mi (quinte) + Sol (7e min.). Son doux et mélancolique.',2,5),
  ('qcm','Quelle est la couleur musicale des accords majeurs ?',
   '["Mélancolie, profondeur","Tension, mouvement","Joie, lumière, stabilité","Suspension, attente"]','Joie, lumière, stabilité',
   'Majeur = joie, lumière. Mineur = mélancolie. 7e dominante = tension. Sus4 = suspension.',1,6),
  ('qcm','Qu''est-ce qu''une substitution d''accord ?',
   '["Jouer un accord plus fort","Remplacer un accord par un autre de même fonction","Changer de tonalité","Ajouter une note"]','Remplacer un accord par un autre de même fonction',
   'Une substitution remplace un accord par un autre qui remplit la même fonction harmonique mais avec une couleur différente.',1,7),
  ('qcm','Quelles notes composent Csus2 ?',
   '["Do-Mi-Sol","Do-Fa-Sol","Do-Ré-Sol","Do-Mi-La"]','Do-Ré-Sol',
   'Csus2 = Do-Ré-Sol. La tierce Mi est remplacée par la seconde Ré. Son ouvert et aérien.',2,8),
  ('qcm','Comment répartir les notes d''un accord entre les deux mains en voicing moderne ?',
   '["Toutes les notes à la main droite","Main gauche = fondamentale, main droite = reste","Toutes les notes à la main gauche","Alterner les notes entre les mains"]','Main gauche = fondamentale, main droite = reste',
   'En voicing moderne : la main gauche joue la fondamentale (basse), la main droite joue le reste de l''accord.',1,9)
) AS v(type, question, options, bonne_reponse, explication, points, position)
ON CONFLICT DO NOTHING;

-- ── QUESTIONS QUIZ 8 : Improvisation et créativité ───────────

WITH q AS (SELECT id FROM quiz WHERE titre = 'Improvisation et créativité' LIMIT 1)
INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position)
SELECT q.id, v.type, v.question, v.options::jsonb, v.bonne_reponse, v.explication, v.points, v.position
FROM q, (VALUES
  ('qcm','Sur quoi repose l''improvisation musicale ?',
   '["La lecture de partitions","La connaissance des gammes, accords et rythme","La mémorisation de morceaux","La vitesse de jeu"]','La connaissance des gammes, accords et rythme',
   'L''improvisation repose sur une solide connaissance des gammes, des accords et du rythme.',1,0),
  ('qcm','Quelle gamme est recommandée pour débuter l''improvisation ?',
   '["Gamme chromatique","Gamme mineure harmonique","Gamme pentatonique","Gamme par tons"]','Gamme pentatonique',
   'La gamme pentatonique (5 notes) est idéale pour débuter car toutes ses notes sonnent bien ensemble.',1,1),
  ('qcm','Qu''est-ce qu''un fill musical ?',
   '["Un accord enrichi","Un court passage qui remplit un espace entre deux phrases","Un type de gamme","Un rythme syncopé"]','Un court passage qui remplit un espace entre deux phrases',
   'Un fill est un court passage (1-2 mesures max) qui remplit l''espace entre deux phrases musicales.',1,2),
  ('vrai_faux','Pendant la louange, le piano doit jouer en continu sans s''arrêter.',
   NULL,'Faux',
   'Laisser des silences est essentiel. Le piano accompagne et sert le moment spirituel.',1,3),
  ('qcm','Quelle est la première étape pour improviser sur une grille d''accords ?',
   '["Jouer le plus vite possible","Maîtriser la gamme de la tonalité","Inventer de nouveaux accords","Ignorer la grille"]','Maîtriser la gamme de la tonalité',
   'Étape 1 : maîtriser la gamme. Étape 2 : jouer la grille à la main gauche. Étape 3 : improviser à la main droite.',1,4),
  ('qcm','Quelle est la durée typique d''une introduction musicale ?',
   '["1-2 mesures","4-8 mesures","16-32 mesures","1 mesure"]','4-8 mesures',
   'Une introduction dure typiquement 4 à 8 mesures. Elle prépare l''auditeur à la tonalité et au tempo.',1,5),
  ('qcm','Quel principe est essentiel pour le jeu spontané en louange ?',
   '["Jouer le plus fort possible","Écouter avant de jouer","Jouer en continu","Improviser rapidement"]','Écouter avant de jouer',
   'Écouter avant de jouer permet de sentir l''atmosphère du moment et d''intervenir au bon moment.',1,6),
  ('qcm','Qu''est-ce qu''un arrangement musical ?',
   '["Jouer plus fort","Adapter un morceau existant pour le piano","Changer de tonalité","Jouer plus vite"]','Adapter un morceau existant pour le piano',
   'L''arrangement consiste à adapter un morceau existant pour le piano, en distribuant les parties entre les deux mains.',1,7),
  ('qcm','Comment développer son propre style musical ?',
   '["Copier exactement un autre pianiste","Écouter beaucoup, expérimenter et jouer régulièrement","Jouer uniquement des gammes","Éviter d''écouter d''autres styles"]','Écouter beaucoup, expérimenter et jouer régulièrement',
   'Le style se développe en écoutant beaucoup de musique, en expérimentant et en pratiquant régulièrement.',1,8),
  ('reponse_courte','Citez un principe du jeu spontané pendant la louange.',
   NULL,'Écouter avant de jouer',
   'Principes : écouter avant de jouer, jouer avec douceur, utiliser des accords simples, laisser des silences.',1,9)
) AS v(type, question, options, bonne_reponse, explication, points, position)
ON CONFLICT DO NOTHING;