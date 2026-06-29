-- ============================================================
-- QUIZ QUESTIONS SIMPLIFIÉ — Sans apostrophes problématiques
-- Exécutez ce fichier dans Supabase SQL Editor
-- Les quiz doivent déjà exister dans la table quiz
-- ============================================================

-- Vérifier que les quiz existent
-- SELECT id, titre FROM quiz ORDER BY created_at;

-- Questions Quiz 1 : Decouverte du clavier
DO $$
DECLARE quiz_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM quiz WHERE titre = 'Decouverte du clavier' LIMIT 1;
  IF quiz_id IS NULL THEN RAISE NOTICE 'Quiz Decouverte du clavier non trouve'; RETURN; END IF;
  INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position) VALUES
  (quiz_id, 'qcm', 'Combien de touches blanches differentes sur un piano ?', '["5","7","8","12"]', '7', 'Il y a 7 touches blanches : Do, Re, Mi, Fa, Sol, La, Si.', 1, 0),
  (quiz_id, 'qcm', 'Quelle note est juste a gauche du groupe de 2 noires ?', '["Re","Mi","Do","Fa"]', 'Do', 'Do est toujours juste a gauche du groupe de 2 noires.', 1, 1),
  (quiz_id, 'qcm', 'Quelle note est juste a gauche du groupe de 3 noires ?', '["Sol","Fa","La","Mi"]', 'Fa', 'Fa est toujours juste a gauche du groupe de 3 noires.', 1, 2),
  (quiz_id, 'vrai_faux', 'Un piano standard possede 88 touches.', NULL, 'Vrai', '88 touches : 52 blanches et 36 noires, 7 octaves completes.', 1, 3),
  (quiz_id, 'qcm', 'Comment s appelle la note C en notation francaise ?', '["La","Si","Do","Re"]', 'Do', 'C=Do, D=Re, E=Mi, F=Fa, G=Sol, A=La, B=Si.', 1, 4),
  (quiz_id, 'qcm', 'Quel doigt porte le numero 1 ?', '["Auriculaire","Index","Majeur","Pouce"]', 'Pouce', '1=Pouce, 2=Index, 3=Majeur, 4=Annulaire, 5=Auriculaire.', 1, 5),
  (quiz_id, 'qcm', 'Pour jouer une triade, quels doigts utilise-t-on ?', '["1-2-3","1-3-5","2-3-4","1-4-5"]', '1-3-5', 'Pour les triades : Pouce (1), Majeur (3) et Auriculaire (5).', 1, 6),
  (quiz_id, 'vrai_faux', 'Les touches noires peuvent changer de nom selon la gamme.', NULL, 'Vrai', 'Une touche noire peut s appeler Do# ou Reb selon la gamme.', 1, 7),
  (quiz_id, 'qcm', 'Quelle est la bonne posture au piano ?', '["Dos courbe poignets rigides","Dos droit poignets souples doigts courbes","Dos droit bras tendus","Assis tres loin"]', 'Dos droit poignets souples doigts courbes', 'Dos droit mais detendu, coudes en avant, poignets souples, doigts courbes.', 1, 8),
  (quiz_id, 'qcm', 'Combien d octaves couvre un piano standard ?', '["5","6","7","8"]', '7', 'Un piano standard couvre 7 octaves completes.', 1, 9);
  RAISE NOTICE 'Quiz 1 : 10 questions inserees';
END $$;

-- Questions Quiz 2 : Alterations et intervalles
DO $$
DECLARE quiz_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM quiz WHERE titre = 'Alterations et intervalles' LIMIT 1;
  IF quiz_id IS NULL THEN RAISE NOTICE 'Quiz Alterations non trouve'; RETURN; END IF;
  INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position) VALUES
  (quiz_id, 'qcm', 'Que fait le diese sur une note ?', '["Il abaisse d un demi-ton","Il eleve d un demi-ton","Il eleve d un ton","Il annule"]', 'Il eleve d un demi-ton', 'Le diese eleve la note d un demi-ton.', 1, 0),
  (quiz_id, 'qcm', 'Que fait le bemol sur une note ?', '["Il eleve d un demi-ton","Il abaisse d un demi-ton","Il abaisse d un ton","Il annule"]', 'Il abaisse d un demi-ton', 'Le bemol abaisse la note d un demi-ton.', 1, 1),
  (quiz_id, 'qcm', 'Combien de demi-tons dans un ton ?', '["1","2","3","4"]', '2', '1 ton = 2 demi-tons.', 1, 2),
  (quiz_id, 'qcm', 'Comment s appelle la distance entre deux notes ?', '["Un accord","Un intervalle","Une gamme","Un degre"]', 'Un intervalle', 'Un intervalle est la distance qui separe deux notes.', 1, 3),
  (quiz_id, 'qcm', 'Dans Do majeur (Do-Mi-Sol), comment s appelle Mi ?', '["Fondamentale","Quinte","Tierce","Octave"]', 'Tierce', 'Mi est la 3eme note, donc la Tierce.', 1, 4),
  (quiz_id, 'qcm', 'Que fait le becarre sur une note ?', '["Eleve d un demi-ton","Abaisse d un demi-ton","Annule toutes les alterations","Double la note"]', 'Annule toutes les alterations', 'Le becarre annule toutes les alterations.', 1, 5),
  (quiz_id, 'qcm', 'Combien de demi-tons entre fondamentale et quinte ?', '["5","6","7","8"]', '7', 'La quinte est a 7 demi-tons de la fondamentale.', 1, 6),
  (quiz_id, 'vrai_faux', 'Un intervalle melodique est joue simultanement.', NULL, 'Faux', 'Melodique = successivement. Harmonique = simultanement.', 1, 7),
  (quiz_id, 'qcm', 'Combien de demi-tons entre fondamentale et tierce majeure ?', '["2","3","4","5"]', '4', 'Tierce majeure = 4 demi-tons. Tierce mineure = 3 demi-tons.', 1, 8),
  (quiz_id, 'qcm', 'Comment s appelle la 8eme note d une gamme ?', '["Septieme","Quinte","Octave","Sixte"]', 'Octave', 'L octave est la 8eme note, identique a la fondamentale mais plus haut.', 1, 9);
  RAISE NOTICE 'Quiz 2 : 10 questions inserees';
END $$;

-- Questions Quiz 3 : Construction des gammes majeures
DO $$
DECLARE quiz_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM quiz WHERE titre = 'Construction des gammes majeures' LIMIT 1;
  IF quiz_id IS NULL THEN RAISE NOTICE 'Quiz Gammes non trouve'; RETURN; END IF;
  INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position) VALUES
  (quiz_id, 'qcm', 'Quelle est la formule pour construire une gamme majeure ?', '["T-D-T-T-D-T-T","T-T-D-T-T-T-D","D-T-T-D-T-T-T","T-T-T-D-T-T-D"]', 'T-T-D-T-T-T-D', 'La formule T-T-D-T-T-T-D s applique a toutes les gammes majeures.', 2, 0),
  (quiz_id, 'qcm', 'Dans la gamme de Do majeur, quelle est la 4eme note ?', '["Mi","Sol","Fa","La"]', 'Fa', 'Do-Re-Mi-Fa-Sol-La-Si-Do. La 4eme note est Fa.', 1, 1),
  (quiz_id, 'qcm', 'Combien d alterations dans la gamme de Do majeur ?', '["0","1","2","7"]', '0', 'Do majeur est la seule gamme majeure sans alteration.', 1, 2),
  (quiz_id, 'qcm', 'Quelle gamme majeure contient Fa# ?', '["Do majeur","Fa majeur","Sol majeur","La majeur"]', 'Sol majeur', 'Sol majeur : Sol-La-Si-Do-Re-Mi-Fa#-Sol.', 1, 3),
  (quiz_id, 'qcm', 'Entre Mi et Fa, quel est l intervalle ?', '["1 ton","1 demi-ton","2 tons","3 demi-tons"]', '1 demi-ton', 'Mi et Fa sont adjacents sans touche noire entre eux.', 1, 4),
  (quiz_id, 'vrai_faux', 'La gamme pentatonique contient 7 notes.', NULL, 'Faux', 'La gamme pentatonique contient 5 notes.', 1, 5),
  (quiz_id, 'qcm', 'Doigte correct gamme Do majeur main droite ?', '["1-2-3-4-5-1-2-3","1-2-3-1-2-3-4-5","1-2-3-4-1-2-3-4","1-3-5-1-3-5-1-3"]', '1-2-3-1-2-3-4-5', 'Passage du pouce sous le majeur entre Mi et Fa.', 2, 6),
  (quiz_id, 'qcm', 'Dans une gamme majeure, quel degre est toujours diminue ?', '["5eme","6eme","7eme","2eme"]', '7eme', '1er, 4eme, 5eme = Majeurs. 2eme, 3eme, 6eme = Mineurs. 7eme = Diminue.', 1, 7),
  (quiz_id, 'qcm', 'Que signifie T dans la formule T-T-D ?', '["Tierce","Ton","Touche","Tempo"]', 'Ton', 'T = Ton (sauter une touche). D = Demi-ton (touche voisine).', 1, 8),
  (quiz_id, 'qcm', 'Combien de notes dans une gamme majeure ?', '["5","6","7","8"]', '8', 'Une gamme majeure contient 8 notes.', 1, 9);
  RAISE NOTICE 'Quiz 3 : 10 questions inserees';
END $$;

-- Questions Quiz 4 : Accords majeurs et mineurs
DO $$
DECLARE quiz_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM quiz WHERE titre = 'Accords majeurs et mineurs' LIMIT 1;
  IF quiz_id IS NULL THEN RAISE NOTICE 'Quiz Accords non trouve'; RETURN; END IF;
  INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position) VALUES
  (quiz_id, 'qcm', 'Formule pour construire un accord majeur ?', '["Fond. + 3 + 4","Fond. + 4 + 3","Fond. + 5 + 2","Fond. + 2 + 5"]', 'Fond. + 4 + 3', 'Accord majeur = Fondamentale + 4 demi-tons + 3 demi-tons.', 2, 0),
  (quiz_id, 'qcm', 'Notes de l accord de Sol majeur ?', '["Sol-La-Re","Sol-Si-Re","Sol-Si-Mi","Sol-La-Mi"]', 'Sol-Si-Re', 'Sol + 4 demi-tons = Si + 3 demi-tons = Re.', 2, 1),
  (quiz_id, 'qcm', 'Difference entre accord majeur et mineur ?', '["Quinte differente","Fondamentale change","Tierce abaissee d un demi-ton","Nombre de notes different"]', 'Tierce abaissee d un demi-ton', 'La tierce mineure est a 3 demi-tons au lieu de 4.', 2, 2),
  (quiz_id, 'qcm', 'Comment noter un accord mineur en anglais ?', '["M majuscule","m minuscule","b","#"]', 'm minuscule', 'La mineur = Am, Re mineur = Dm, Mi mineur = Em.', 1, 3),
  (quiz_id, 'qcm', 'Notes de l accord de La mineur ?', '["La-Do#-Mi","La-Do-Mi","La-Si-Mi","La-Do-Re"]', 'La-Do-Mi', 'La + 3 demi-tons = Do + 4 demi-tons = Mi.', 2, 4),
  (quiz_id, 'vrai_faux', 'Un accord majeur produit une sonorite melancolique.', NULL, 'Faux', 'C est l accord mineur qui est melancolique. Le majeur est joyeux.', 1, 5),
  (quiz_id, 'qcm', 'Comment s ecrit Re mineur en anglais ?', '["Rm","Dm","Rem","Dm7"]', 'Dm', 'Re = D. Mineur = m. Donc Re mineur = Dm.', 1, 6),
  (quiz_id, 'qcm', 'Notes de l accord de Fa majeur ?', '["Fa-La-Do","Fa-Sol-Do","Fa-La-Re","Fa-Si-Do"]', 'Fa-La-Do', 'Fa + 4 demi-tons = La + 3 demi-tons = Do.', 2, 7),
  (quiz_id, 'qcm', 'Qu est-ce qu une triade ?', '["Accord de 4 notes","Accord de 3 sons","Gamme de 3 notes","Arpege"]', 'Accord de 3 sons', 'Une triade est un accord de 3 sons : fondamentale, tierce et quinte.', 1, 8),
  (quiz_id, 'qcm', 'Notes de l accord de Mi mineur ?', '["Mi-Sol#-Si","Mi-Sol-Si","Mi-Fa-Si","Mi-La-Si"]', 'Mi-Sol-Si', 'Mi + 3 demi-tons = Sol + 4 demi-tons = Si.', 2, 9);
  RAISE NOTICE 'Quiz 4 : 10 questions inserees';
END $$;

-- Questions Quiz 5 : Renversements et progressions
DO $$
DECLARE quiz_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM quiz WHERE titre = 'Renversements et progressions' LIMIT 1;
  IF quiz_id IS NULL THEN RAISE NOTICE 'Quiz Renversements non trouve'; RETURN; END IF;
  INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position) VALUES
  (quiz_id, 'qcm', 'Dans le 1er renversement de Do majeur, quelle note est en bas ?', '["Do","Sol","Mi","Re"]', 'Mi', '1er renversement : Mi (tierce) devient la note la plus grave : Mi-Sol-Do.', 2, 0),
  (quiz_id, 'qcm', 'Dans le 2eme renversement de Do majeur, quelle note est en bas ?', '["Do","Mi","Sol","La"]', 'Sol', '2eme renversement : Sol (quinte) devient la note la plus grave : Sol-Do-Mi.', 2, 1),
  (quiz_id, 'qcm', 'Quelle est la progression magique la plus populaire ?', '["1-2-3-4","1-4-5-1","1-5-6-4","6-4-1-5"]', '1-5-6-4', 'La progression 1-5-6-4 est la plus utilisee en pop, rock et gospel.', 2, 2),
  (quiz_id, 'qcm', 'En Do majeur, quelle est la progression 1-5-6-4 ?', '["Do-Fa-Lam-Sol","Do-Sol-Lam-Fa","Do-Lam-Fa-Sol","Fa-Sol-Lam-Do"]', 'Do-Sol-Lam-Fa', '1=Do, 5=Sol, 6=La mineur, 4=Fa.', 2, 3),
  (quiz_id, 'vrai_faux', 'Les renversements evitent les grands deplacements de la main.', NULL, 'Vrai', 'C est l avantage principal des renversements : fluidite et economie de mouvement.', 1, 4),
  (quiz_id, 'qcm', 'Dans la progression 1-5-6-4, quel accord est mineur ?', '["Le 1","Le 5","Le 6","Le 4"]', 'Le 6', 'Dans une gamme majeure, le 6eme degre est toujours mineur.', 1, 5),
  (quiz_id, 'qcm', 'Avantage principal des renversements ?', '["Changer la tonalite","Ameliorer la fluidite","Ajouter des notes","Changer le rythme"]', 'Ameliorer la fluidite', 'Les renversements permettent de passer d un accord a l autre avec un minimum de mouvement.', 1, 6),
  (quiz_id, 'qcm', 'En Do majeur, progression 1-6-4-5 ?', '["Do-Lam-Fa-Sol","Do-Sol-Fa-Lam","Fa-Lam-Do-Sol","Do-Fa-Sol-Lam"]', 'Do-Lam-Fa-Sol', '1=Do, 6=La mineur, 4=Fa, 5=Sol.', 2, 7),
  (quiz_id, 'qcm', 'Combien de renversements pour un accord a 3 sons ?', '["1","2","3","4"]', '2', 'Un accord a 3 sons a 2 renversements : 1er et 2eme.', 1, 8),
  (quiz_id, 'qcm', 'En position fondamentale, quelle note est en bas ?', '["Tierce","Quinte","Fondamentale","Octave"]', 'Fondamentale', 'En position fondamentale, la fondamentale est la note la plus grave.', 1, 9);
  RAISE NOTICE 'Quiz 5 : 10 questions inserees';
END $$;

-- Questions Quiz 6 : Developpement de oreille
DO $$
DECLARE quiz_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM quiz WHERE titre = 'Developpement de oreille' LIMIT 1;
  IF quiz_id IS NULL THEN RAISE NOTICE 'Quiz Oreille non trouve'; RETURN; END IF;
  INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position) VALUES
  (quiz_id, 'qcm', 'Comment identifier la tonalite d un chant ?', '["Premiere note","Note finale","Compter les notes","Regarder la partition"]', 'Note finale', 'La note finale correspond souvent a la tonique.', 1, 0),
  (quiz_id, 'qcm', 'Quel accord produit un son joyeux et stable ?', '["Mineur","Diminue","Majeur","Sus4"]', 'Majeur', 'L accord majeur produit une sonorite joyeuse et stable.', 1, 1),
  (quiz_id, 'qcm', 'Quel accord produit une tension qui appelle une resolution ?', '["Majeur","Mineur","7e dominante","Sus2"]', '7e dominante', 'L accord de 7e dominante cree une tension qui appelle une resolution.', 1, 2),
  (quiz_id, 'vrai_faux', 'Pour retrouver une melodie, il faut d abord trouver la premiere note.', NULL, 'Vrai', 'Methode : ecouter, fredonner, trouver la premiere note, construire note par note.', 1, 3),
  (quiz_id, 'qcm', 'Tonalite la plus courante en musique de louange ?', '["Sib majeur","Do majeur","Fa# majeur","Reb majeur"]', 'Do majeur', 'Les tonalites courantes en louange : Do, Sol, Re, La et Mi majeur.', 1, 4),
  (quiz_id, 'qcm', 'Comment reconnaitre un accord mineur a l oreille ?', '["Son lumineux","Son sombre et melancolique","Son tendu","Son ouvert"]', 'Son sombre et melancolique', 'L accord mineur se reconnait a son caractere sombre et melancolique.', 1, 5),
  (quiz_id, 'qcm', 'Premiere etape pour retrouver une melodie a l oreille ?', '["Jouer directement","Ecouter plusieurs fois","Chercher la partition","Demander a quelqu un"]', 'Ecouter plusieurs fois', 'Etape 1 : ecouter. Etape 2 : fredonner. Etape 3 : trouver la premiere note.', 1, 6),
  (quiz_id, 'qcm', 'Quel accord produit un son instable et dissonant ?', '["Majeur","Mineur","Sus4","Diminue"]', 'Diminue', 'L accord diminue produit un son instable et dissonant.', 1, 7),
  (quiz_id, 'qcm', 'Comment s appelle la capacite a percevoir et reproduire les sons ?', '["La technique","L oreille musicale","La memoire","Le rythme"]', 'L oreille musicale', 'L oreille musicale se developpe avec la pratique reguliere.', 1, 8),
  (quiz_id, 'reponse_courte', 'Citez une tonalite courante en musique de louange.', NULL, 'Do majeur', 'Tonalites courantes : Do, Sol, Re, La, Mi majeur.', 1, 9);
  RAISE NOTICE 'Quiz 6 : 10 questions inserees';
END $$;

-- Questions Quiz 7 : Harmonie avancee
DO $$
DECLARE quiz_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM quiz WHERE titre = 'Harmonie avancee' LIMIT 1;
  IF quiz_id IS NULL THEN RAISE NOTICE 'Quiz Harmonie non trouve'; RETURN; END IF;
  INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position) VALUES
  (quiz_id, 'qcm', 'Notes de l accord Cmaj7 ?', '["Do-Mi-Sol-La","Do-Mi-Sol-Si","Do-Re-Sol-Si","Do-Mi-Fa-Si"]', 'Do-Mi-Sol-Si', 'Cmaj7 = Do + Mi + Sol + Si (7e majeure). Son doux et lumineux.', 2, 0),
  (quiz_id, 'qcm', 'Difference entre maj7 et 7 dominante ?', '["Quinte differente","7e mineure dans la dominante","Fondamentale change","Tierce differente"]', '7e mineure dans la dominante', 'Maj7 : 7e majeure. 7 dominante : 7e mineure.', 2, 1),
  (quiz_id, 'qcm', 'Dans un accord sus4, quelle note remplace la tierce ?', '["Seconde","Quarte","Sixte","Septieme"]', 'Quarte', 'Sus4 = la tierce est remplacee par la quarte. Ex : Csus4 = Do-Fa-Sol.', 2, 2),
  (quiz_id, 'qcm', 'Quel accord produit un son suspendu ?', '["Maj7","Mineur","Sus4","Add9"]', 'Sus4', 'L accord sus4 cree une sensation de suspension et d attente.', 1, 3),
  (quiz_id, 'qcm', 'Qu est-ce qu un voicing ?', '["Type de gamme","Disposition des notes d un accord","Rythme particulier","Type d arpege"]', 'Disposition des notes d un accord', 'Le voicing designe la disposition des notes d un accord sur le clavier.', 1, 4),
  (quiz_id, 'qcm', 'Notes de l accord Am7 ?', '["La-Do-Mi-Sol","La-Do#-Mi-Sol","La-Do-Mi-Si","La-Re-Mi-Sol"]', 'La-Do-Mi-Sol', 'Am7 = La + Do + Mi + Sol (7e mineure).', 2, 5),
  (quiz_id, 'qcm', 'Couleur musicale des accords majeurs ?', '["Melancolie","Tension","Joie lumiere stabilite","Suspension"]', 'Joie lumiere stabilite', 'Majeur = joie. Mineur = melancolie. 7e dominante = tension.', 1, 6),
  (quiz_id, 'qcm', 'Qu est-ce qu une substitution d accord ?', '["Jouer plus fort","Remplacer un accord par un autre de meme fonction","Changer de tonalite","Ajouter une note"]', 'Remplacer un accord par un autre de meme fonction', 'Une substitution remplace un accord par un autre de meme fonction harmonique.', 1, 7),
  (quiz_id, 'qcm', 'Notes de Csus2 ?', '["Do-Mi-Sol","Do-Fa-Sol","Do-Re-Sol","Do-Mi-La"]', 'Do-Re-Sol', 'Csus2 = Do-Re-Sol. La tierce Mi est remplacee par la seconde Re.', 2, 8),
  (quiz_id, 'qcm', 'Repartition des notes en voicing moderne ?', '["Tout a la main droite","Main gauche fondamentale droite reste","Tout a la main gauche","Alterner"]', 'Main gauche fondamentale droite reste', 'Main gauche joue la basse, main droite joue le reste de l accord.', 1, 9);
  RAISE NOTICE 'Quiz 7 : 10 questions inserees';
END $$;

-- Questions Quiz 8 : Improvisation et creativite
DO $$
DECLARE quiz_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM quiz WHERE titre = 'Improvisation et creativite' LIMIT 1;
  IF quiz_id IS NULL THEN RAISE NOTICE 'Quiz Improvisation non trouve'; RETURN; END IF;
  INSERT INTO quiz_questions (quiz_id, type, question, options, bonne_reponse, explication, points, position) VALUES
  (quiz_id, 'qcm', 'Sur quoi repose l improvisation musicale ?', '["Lecture de partitions","Connaissance des gammes accords et rythme","Memorisation de morceaux","Vitesse de jeu"]', 'Connaissance des gammes accords et rythme', 'L improvisation repose sur les gammes, les accords et le rythme.', 1, 0),
  (quiz_id, 'qcm', 'Quelle gamme pour debuter l improvisation ?', '["Chromatique","Mineure harmonique","Pentatonique","Par tons"]', 'Pentatonique', 'La gamme pentatonique (5 notes) est ideale pour debuter.', 1, 1),
  (quiz_id, 'qcm', 'Qu est-ce qu un fill musical ?', '["Accord enrichi","Court passage entre deux phrases","Type de gamme","Rythme syncope"]', 'Court passage entre deux phrases', 'Un fill remplit l espace entre deux phrases musicales (1-2 mesures max).', 1, 2),
  (quiz_id, 'vrai_faux', 'Pendant la louange, le piano doit jouer en continu.', NULL, 'Faux', 'Laisser des silences est essentiel. Le piano accompagne et sert le moment.', 1, 3),
  (quiz_id, 'qcm', 'Premiere etape pour improviser sur une grille ?', '["Jouer vite","Maitriser la gamme de la tonalite","Inventer des accords","Ignorer la grille"]', 'Maitriser la gamme de la tonalite', 'Etape 1 : maitriser la gamme. Etape 2 : jouer la grille. Etape 3 : improviser.', 1, 4),
  (quiz_id, 'qcm', 'Duree typique d une introduction musicale ?', '["1-2 mesures","4-8 mesures","16-32 mesures","1 mesure"]', '4-8 mesures', 'Une introduction dure typiquement 4 a 8 mesures.', 1, 5),
  (quiz_id, 'qcm', 'Principe essentiel du jeu spontane en louange ?', '["Jouer fort","Ecouter avant de jouer","Jouer en continu","Improviser rapidement"]', 'Ecouter avant de jouer', 'Ecouter avant de jouer permet de sentir l atmosphere du moment.', 1, 6),
  (quiz_id, 'qcm', 'Qu est-ce qu un arrangement musical ?', '["Jouer plus fort","Adapter un morceau pour le piano","Changer de tonalite","Jouer plus vite"]', 'Adapter un morceau pour le piano', 'L arrangement adapte un morceau existant pour le piano.', 1, 7),
  (quiz_id, 'qcm', 'Comment developper son propre style musical ?', '["Copier un pianiste","Ecouter experimenter et jouer regulierement","Jouer uniquement des gammes","Eviter d autres styles"]', 'Ecouter experimenter et jouer regulierement', 'Le style se developpe en ecoutant, experimentant et pratiquant.', 1, 8),
  (quiz_id, 'reponse_courte', 'Citez un principe du jeu spontane pendant la louange.', NULL, 'Ecouter avant de jouer', 'Principes : ecouter, jouer avec douceur, accords simples, laisser des silences.', 1, 9);
  RAISE NOTICE 'Quiz 8 : 10 questions inserees';
END $$;