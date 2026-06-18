-- Correction des accents dans les questions et réponses
-- Quiz 1 : Découverte du clavier
UPDATE quiz_questions SET question = 'Combien de touches blanches différentes sur un piano ?' WHERE question = 'Combien de touches blanches differentes sur un piano';
UPDATE quiz_questions SET question = 'Quelle note est juste à gauche du groupe de 2 noires ?' WHERE question = 'Quelle note est juste a gauche du groupe de 2 noires';
UPDATE quiz_questions SET question = 'Quelle note est juste à gauche du groupe de 3 noires ?' WHERE question = 'Quelle note est juste a gauche du groupe de 3 noires';
UPDATE quiz_questions SET question = 'Un piano standard possède 88 touches.' WHERE question = 'Un piano standard possede 88 touches';
UPDATE quiz_questions SET question = 'Comment s''appelle la note C en notation française ?' WHERE question = 'Comment s appelle la note C en notation francaise';
UPDATE quiz_questions SET question = 'Quel doigt porte le numéro 1 ?' WHERE question = 'Quel doigt porte le numero 1';
UPDATE quiz_questions SET question = 'Pour jouer une triade, quels doigts utilise-t-on ?' WHERE question = 'Pour jouer une triade quels doigts utilise-t-on';
UPDATE quiz_questions SET question = 'Les touches noires peuvent changer de nom selon la gamme.' WHERE question = 'Les touches noires peuvent changer de nom selon la gamme';
UPDATE quiz_questions SET question = 'Combien d''octaves couvre un piano standard ?' WHERE question = 'Combien d octaves couvre un piano standard';
UPDATE quiz_questions SET question = 'Quelle est la bonne posture au piano ?' WHERE question = 'Quelle est la bonne posture au piano';
UPDATE quiz_questions SET bonne_reponse = 'Dos droit, poignets souples' WHERE bonne_reponse = 'Dos droit poignets souples';
UPDATE quiz_questions SET options = '["Dos courbé","Dos droit, poignets souples","Bras tendus","Assis loin"]' WHERE options = '["Dos courbe","Dos droit poignets souples","Bras tendus","Assis loin"]';

-- Quiz 2 : Altérations et intervalles
UPDATE quiz_questions SET question = 'Que fait le dièse sur une note ?' WHERE question = 'Que fait le diese sur une note';
UPDATE quiz_questions SET options = '["L''abaisse d''un demi-ton","L''élève d''un demi-ton","L''élève d''un ton","Annule"]', bonne_reponse = 'L''élève d''un demi-ton' WHERE question = 'Que fait le dièse sur une note ?';
UPDATE quiz_questions SET question = 'Que fait le bémol sur une note ?' WHERE question = 'Que fait le bemol sur une note';
UPDATE quiz_questions SET options = '["L''élève d''un demi-ton","L''abaisse d''un demi-ton","L''abaisse d''un ton","Annule"]', bonne_reponse = 'L''abaisse d''un demi-ton' WHERE question = 'Que fait le bémol sur une note ?';
UPDATE quiz_questions SET question = 'Combien de demi-tons dans un ton ?' WHERE question = 'Combien de demi-tons dans un ton';
UPDATE quiz_questions SET question = 'Comment s''appelle la distance entre deux notes ?' WHERE question = 'Comment s appelle la distance entre deux notes';
UPDATE quiz_questions SET question = 'Dans Do majeur (Do-Mi-Sol), comment s''appelle Mi ?' WHERE question = 'Dans Do majeur Do-Mi-Sol comment s appelle Mi';
UPDATE quiz_questions SET question = 'Que fait le bécarre sur une note ?' WHERE question = 'Que fait le becarre sur une note';
UPDATE quiz_questions SET options = '["Élève","Abaisse","Annule toutes les altérations","Double"]', bonne_reponse = 'Annule toutes les altérations' WHERE question = 'Que fait le bécarre sur une note ?';
UPDATE quiz_questions SET question = 'Combien de demi-tons entre fondamentale et quinte ?' WHERE question = 'Combien de demi-tons entre fondamentale et quinte';
UPDATE quiz_questions SET question = 'Un intervalle mélodique est joué simultanément.' WHERE question = 'Un intervalle melodique est joue simultanement';
UPDATE quiz_questions SET question = 'Combien de demi-tons entre fondamentale et tierce majeure ?' WHERE question = 'Combien de demi-tons entre fondamentale et tierce majeure';
UPDATE quiz_questions SET question = 'Comment s''appelle la 8ème note d''une gamme ?' WHERE question = 'Comment s appelle la 8eme note d une gamme';

-- Quiz 3 : Construction des gammes
UPDATE quiz_questions SET question = 'Quelle est la formule pour construire une gamme majeure ?' WHERE question = 'Quelle est la formule pour construire une gamme majeure';
UPDATE quiz_questions SET question = 'Dans la gamme de Do majeur, quelle est la 4ème note ?' WHERE question = 'Dans la gamme de Do majeur quelle est la 4eme note';
UPDATE quiz_questions SET question = 'Combien d''altérations dans la gamme de Do majeur ?' WHERE question = 'Combien d alterations dans la gamme de Do majeur';
UPDATE quiz_questions SET question = 'Quelle gamme majeure contient Fa dièse ?' WHERE question = 'Quelle gamme majeure contient Fa diese';
UPDATE quiz_questions SET question = 'Entre Mi et Fa, quel est l''intervalle ?' WHERE question = 'Entre Mi et Fa quel est l intervalle';
UPDATE quiz_questions SET question = 'La gamme pentatonique contient 7 notes.' WHERE question = 'La gamme pentatonique contient 7 notes';
UPDATE quiz_questions SET question = 'Doigté correct gamme Do majeur main droite ?' WHERE question = 'Doigte correct gamme Do majeur main droite';
UPDATE quiz_questions SET question = 'Dans une gamme majeure, quel degré est toujours diminué ?' WHERE question = 'Dans une gamme majeure quel degre est toujours diminue';
UPDATE quiz_questions SET options = '["5ème","6ème","7ème","2ème"]', bonne_reponse = '7ème' WHERE question = 'Dans une gamme majeure, quel degré est toujours diminué ?';
UPDATE quiz_questions SET question = 'Que signifie T dans la formule T-T-D ?' WHERE question = 'Que signifie T dans la formule T-T-D';
UPDATE quiz_questions SET question = 'Combien de notes dans une gamme majeure ?' WHERE question = 'Combien de notes dans une gamme majeure';

-- Quiz 4 : Accords majeurs et mineurs
UPDATE quiz_questions SET question = 'Formule pour construire un accord majeur ?' WHERE question = 'Formule pour construire un accord majeur';
UPDATE quiz_questions SET question = 'Notes de l''accord de Sol majeur ?' WHERE question = 'Notes de l accord de Sol majeur';
UPDATE quiz_questions SET options = '["Sol-La-Ré","Sol-Si-Ré","Sol-Si-Mi","Sol-La-Mi"]', bonne_reponse = 'Sol-Si-Ré' WHERE question = 'Notes de l''accord de Sol majeur ?';
UPDATE quiz_questions SET question = 'Différence entre accord majeur et mineur ?' WHERE question = 'Difference entre accord majeur et mineur';
UPDATE quiz_questions SET options = '["Quinte différente","Fondamentale change","Tierce abaissée d''un demi-ton","Nombre de notes différent"]', bonne_reponse = 'Tierce abaissée d''un demi-ton' WHERE question = 'Différence entre accord majeur et mineur ?';
UPDATE quiz_questions SET question = 'Comment noter un accord mineur en anglais ?' WHERE question = 'Comment noter un accord mineur en anglais';
UPDATE quiz_questions SET question = 'Notes de l''accord de La mineur ?' WHERE question = 'Notes de l accord de La mineur';
UPDATE quiz_questions SET options = '["La-Do#-Mi","La-Do-Mi","La-Si-Mi","La-Do-Ré"]', bonne_reponse = 'La-Do-Mi' WHERE question = 'Notes de l''accord de La mineur ?';
UPDATE quiz_questions SET question = 'Un accord majeur produit une sonorité mélancolique.' WHERE question = 'Un accord majeur produit une sonorite melancolique';
UPDATE quiz_questions SET question = 'Comment s''écrit Ré mineur en anglais ?' WHERE question = 'Comment s ecrit Re mineur en anglais';
UPDATE quiz_questions SET question = 'Notes de l''accord de Fa majeur ?' WHERE question = 'Notes de l accord de Fa majeur';
UPDATE quiz_questions SET options = '["Fa-La-Do","Fa-Sol-Do","Fa-La-Ré","Fa-Si-Do"]', bonne_reponse = 'Fa-La-Do' WHERE question = 'Notes de l''accord de Fa majeur ?';
UPDATE quiz_questions SET question = 'Qu''est-ce qu''une triade ?' WHERE question = 'Qu est-ce qu une triade';
UPDATE quiz_questions SET question = 'Notes de l''accord de Mi mineur ?' WHERE question = 'Notes de l accord de Mi mineur';

-- Quiz 5 : Renversements et progressions
UPDATE quiz_questions SET question = 'Dans le 1er renversement de Do majeur, quelle note est en bas ?' WHERE question = 'Dans le 1er renversement de Do majeur quelle note est en bas';
UPDATE quiz_questions SET options = '["Do","Sol","Mi","Ré"]' WHERE question = 'Dans le 1er renversement de Do majeur, quelle note est en bas ?';
UPDATE quiz_questions SET question = 'Dans le 2ème renversement de Do majeur, quelle note est en bas ?' WHERE question = 'Dans le 2eme renversement de Do majeur quelle note est en bas';
UPDATE quiz_questions SET question = 'Quelle est la progression magique la plus populaire ?' WHERE question = 'Quelle est la progression magique la plus populaire';
UPDATE quiz_questions SET question = 'En Do majeur, quelle est la progression 1-5-6-4 ?' WHERE question = 'En Do majeur quelle est la progression 1-5-6-4';
UPDATE quiz_questions SET question = 'Les renversements évitent les grands déplacements de la main.' WHERE question = 'Les renversements evitent les grands deplacements de la main';
UPDATE quiz_questions SET question = 'Dans la progression 1-5-6-4, quel accord est mineur ?' WHERE question = 'Dans la progression 1-5-6-4 quel accord est mineur';
UPDATE quiz_questions SET question = 'Avantage principal des renversements ?' WHERE question = 'Avantage principal des renversements';
UPDATE quiz_questions SET options = '["Changer la tonalité","Améliorer la fluidité","Ajouter des notes","Changer le rythme"]', bonne_reponse = 'Améliorer la fluidité' WHERE question = 'Avantage principal des renversements ?';
UPDATE quiz_questions SET question = 'En Do majeur, progression 1-6-4-5 ?' WHERE question = 'En Do majeur progression 1-6-4-5';
UPDATE quiz_questions SET question = 'Combien de renversements pour un accord à 3 sons ?' WHERE question = 'Combien de renversements pour un accord a 3 sons';
UPDATE quiz_questions SET question = 'En position fondamentale, quelle note est en bas ?' WHERE question = 'En position fondamentale quelle note est en bas';

-- Quiz 6 : Développement de l'oreille
UPDATE quiz_questions SET question = 'Comment identifier la tonalité d''un chant ?' WHERE question = 'Comment identifier la tonalite d un chant';
UPDATE quiz_questions SET options = '["Première note","Note finale","Compter les notes","Regarder la partition"]', bonne_reponse = 'Note finale' WHERE question = 'Comment identifier la tonalité d''un chant ?';
UPDATE quiz_questions SET question = 'Quel accord produit un son joyeux et stable ?' WHERE question = 'Quel accord produit un son joyeux et stable';
UPDATE quiz_questions SET question = 'Quel accord produit une tension qui appelle une résolution ?' WHERE question = 'Quel accord produit une tension qui appelle une resolution';
UPDATE quiz_questions SET question = 'Pour retrouver une mélodie, il faut d''abord trouver la première note.' WHERE question = 'Pour retrouver une melodie il faut d abord trouver la premiere note';
UPDATE quiz_questions SET question = 'Tonalité la plus courante en musique de louange ?' WHERE question = 'Tonalite la plus courante en musique de louange';
UPDATE quiz_questions SET options = '["Sib majeur","Do majeur","Fa dièse majeur","Réb majeur"]', bonne_reponse = 'Do majeur' WHERE question = 'Tonalité la plus courante en musique de louange ?';
UPDATE quiz_questions SET question = 'Comment reconnaître un accord mineur à l''oreille ?' WHERE question = 'Comment reconnaitre un accord mineur a l oreille';
UPDATE quiz_questions SET options = '["Son lumineux","Son sombre et mélancolique","Son tendu","Son ouvert"]', bonne_reponse = 'Son sombre et mélancolique' WHERE question = 'Comment reconnaître un accord mineur à l''oreille ?';
UPDATE quiz_questions SET question = 'Première étape pour retrouver une mélodie à l''oreille ?' WHERE question = 'Premiere etape pour retrouver une melodie a l oreille';
UPDATE quiz_questions SET options = '["Jouer directement","Écouter plusieurs fois","Chercher la partition","Demander à quelqu''un"]', bonne_reponse = 'Écouter plusieurs fois' WHERE question = 'Première étape pour retrouver une mélodie à l''oreille ?';
UPDATE quiz_questions SET question = 'Quel accord produit un son instable et dissonant ?' WHERE question = 'Quel accord produit un son instable et dissonant';
UPDATE quiz_questions SET question = 'Comment s''appelle la capacité à percevoir et reproduire les sons ?' WHERE question = 'Comment s appelle la capacite a percevoir et reproduire les sons';
UPDATE quiz_questions SET options = '["La technique","L''oreille musicale","La mémoire","Le rythme"]', bonne_reponse = 'L''oreille musicale' WHERE question = 'Comment s''appelle la capacité à percevoir et reproduire les sons ?';
UPDATE quiz_questions SET question = 'Citez une tonalité courante en musique de louange.' WHERE question = 'Citez une tonalite courante en musique de louange';

-- Quiz 7 : Harmonie avancée
UPDATE quiz_questions SET question = 'Notes de l''accord Cmaj7 ?' WHERE question = 'Notes de l accord Cmaj7';
UPDATE quiz_questions SET options = '["Do-Mi-Sol-La","Do-Mi-Sol-Si","Do-Ré-Sol-Si","Do-Mi-Fa-Si"]', bonne_reponse = 'Do-Mi-Sol-Si' WHERE question = 'Notes de l''accord Cmaj7 ?';
UPDATE quiz_questions SET question = 'Différence entre maj7 et 7 dominante ?' WHERE question = 'Difference entre maj7 et 7 dominante';
UPDATE quiz_questions SET options = '["Quinte différente","7e mineure dans la dominante","Fondamentale change","Tierce différente"]', bonne_reponse = '7e mineure dans la dominante' WHERE question = 'Différence entre maj7 et 7 dominante ?';
UPDATE quiz_questions SET question = 'Dans un accord sus4, quelle note remplace la tierce ?' WHERE question = 'Dans un accord sus4 quelle note remplace la tierce';
UPDATE quiz_questions SET question = 'Quel accord produit un son suspendu ?' WHERE question = 'Quel accord produit un son suspendu';
UPDATE quiz_questions SET question = 'Qu''est-ce qu''un voicing ?' WHERE question = 'Qu est-ce qu un voicing';
UPDATE quiz_questions SET options = '["Type de gamme","Disposition des notes d''un accord","Rythme particulier","Type d''arpège"]', bonne_reponse = 'Disposition des notes d''un accord' WHERE question = 'Qu''est-ce qu''un voicing ?';
UPDATE quiz_questions SET question = 'Notes de l''accord Am7 ?' WHERE question = 'Notes de l accord Am7';
UPDATE quiz_questions SET question = 'Couleur musicale des accords majeurs ?' WHERE question = 'Couleur musicale des accords majeurs';
UPDATE quiz_questions SET options = '["Mélancolie","Tension","Joie, lumière, stabilité","Suspension"]', bonne_reponse = 'Joie, lumière, stabilité' WHERE question = 'Couleur musicale des accords majeurs ?';
UPDATE quiz_questions SET question = 'Qu''est-ce qu''une substitution d''accord ?' WHERE question = 'Qu est-ce qu une substitution d accord';
UPDATE quiz_questions SET options = '["Jouer plus fort","Remplacer un accord par un autre de même fonction","Changer de tonalité","Ajouter une note"]', bonne_reponse = 'Remplacer un accord par un autre de même fonction' WHERE question = 'Qu''est-ce qu''une substitution d''accord ?';
UPDATE quiz_questions SET question = 'Notes de Csus2 ?' WHERE question = 'Notes de Csus2';
UPDATE quiz_questions SET options = '["Do-Mi-Sol","Do-Fa-Sol","Do-Ré-Sol","Do-Mi-La"]', bonne_reponse = 'Do-Ré-Sol' WHERE question = 'Notes de Csus2 ?';
UPDATE quiz_questions SET question = 'Répartition des notes en voicing moderne ?' WHERE question = 'Repartition des notes en voicing moderne';
UPDATE quiz_questions SET options = '["Tout à la main droite","Main gauche = fondamentale, droite = reste","Tout à la main gauche","Alterner"]', bonne_reponse = 'Main gauche = fondamentale, droite = reste' WHERE question = 'Répartition des notes en voicing moderne ?';

-- Quiz 8 : Improvisation et créativité
UPDATE quiz_questions SET question = 'Sur quoi repose l''improvisation musicale ?' WHERE question = 'Sur quoi repose l improvisation musicale';
UPDATE quiz_questions SET options = '["Lecture de partitions","Connaissance des gammes, accords et rythme","Mémorisation de morceaux","Vitesse de jeu"]', bonne_reponse = 'Connaissance des gammes, accords et rythme' WHERE question = 'Sur quoi repose l''improvisation musicale ?';
UPDATE quiz_questions SET question = 'Quelle gamme pour débuter l''improvisation ?' WHERE question = 'Quelle gamme pour debuter l improvisation';
UPDATE quiz_questions SET question = 'Qu''est-ce qu''un fill musical ?' WHERE question = 'Qu est-ce qu un fill musical';
UPDATE quiz_questions SET options = '["Accord enrichi","Court passage entre deux phrases","Type de gamme","Rythme syncopé"]', bonne_reponse = 'Court passage entre deux phrases' WHERE question = 'Qu''est-ce qu''un fill musical ?';
UPDATE quiz_questions SET question = 'Pendant la louange, le piano doit jouer en continu.' WHERE question = 'Pendant la louange le piano doit jouer en continu';
UPDATE quiz_questions SET question = 'Première étape pour improviser sur une grille ?' WHERE question = 'Premiere etape pour improviser sur une grille';
UPDATE quiz_questions SET options = '["Jouer vite","Maîtriser la gamme de la tonalité","Inventer des accords","Ignorer la grille"]', bonne_reponse = 'Maîtriser la gamme de la tonalité' WHERE question = 'Première étape pour improviser sur une grille ?';
UPDATE quiz_questions SET question = 'Durée typique d''une introduction musicale ?' WHERE question = 'Duree typique d une introduction musicale';
UPDATE quiz_questions SET question = 'Principe essentiel du jeu spontané en louange ?' WHERE question = 'Principe essentiel du jeu spontane en louange';
UPDATE quiz_questions SET options = '["Jouer fort","Écouter avant de jouer","Jouer en continu","Improviser rapidement"]', bonne_reponse = 'Écouter avant de jouer' WHERE question = 'Principe essentiel du jeu spontané en louange ?';
UPDATE quiz_questions SET question = 'Qu''est-ce qu''un arrangement musical ?' WHERE question = 'Qu est-ce qu un arrangement musical';
UPDATE quiz_questions SET question = 'Comment développer son propre style musical ?' WHERE question = 'Comment developper son propre style musical';
UPDATE quiz_questions SET options = '["Copier un pianiste","Écouter, expérimenter et jouer régulièrement","Jouer uniquement des gammes","Éviter d''autres styles"]', bonne_reponse = 'Écouter, expérimenter et jouer régulièrement' WHERE question = 'Comment développer son propre style musical ?';
UPDATE quiz_questions SET question = 'Citez un principe du jeu spontané pendant la louange.' WHERE question = 'Citez un principe du jeu spontane pendant la louange';
UPDATE quiz_questions SET bonne_reponse = 'Écouter avant de jouer' WHERE question = 'Citez un principe du jeu spontané pendant la louange.';

SELECT 'Accents corrigés avec succès' as status;
