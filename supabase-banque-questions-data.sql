-- ══════════════════════════════════════════════════════════════
-- BANQUE DE QUESTIONS — Lieu Secret Piano
-- 20 Fondamentaux | 30 Compréhension | 40 Expression
-- Tirage aléatoire recommandé : 7 + 10 + 8 = 25 questions/examen
-- ══════════════════════════════════════════════════════════════

-- Vider la banque existante avant insertion
TRUNCATE banque_questions RESTART IDENTITY;

-- ══════════════════════════════════════════════════════════════
-- NIVEAU 1 : FONDAMENTAUX (20 questions)
-- ══════════════════════════════════════════════════════════════

INSERT INTO banque_questions (categorie, type, question, options, bonne_reponse, explication, points, position) VALUES

-- QCM
('Fondamentaux', 'qcm', 'Combien y a-t-il de touches blanches sur un piano standard de 88 touches ?',
 '["52", "54", "56", "58"]', '52',
 'Un piano standard de 88 touches comporte 52 touches blanches et 36 touches noires.', 1, 1),

('Fondamentaux', 'qcm', 'Quelle est la note qui se trouve juste à gauche d''un groupe de 2 touches noires ?',
 '["Do", "Ré", "Mi", "Fa"]', 'Do',
 'Le Do se trouve toujours à gauche d''un groupe de 2 touches noires. C''est le repère principal sur le clavier.', 1, 2),

('Fondamentaux', 'qcm', 'Combien de demi-tons y a-t-il entre Do et Ré ?',
 '["1 demi-ton", "2 demi-tons", "3 demi-tons", "4 demi-tons"]', '2 demi-tons',
 'Entre Do et Ré il y a 2 demi-tons (un ton entier). La touche noire entre les deux correspond à Do# ou Réb.', 1, 3),

('Fondamentaux', 'qcm', 'Quel intervalle sépare Do et Sol ?',
 '["Une tierce", "Une quarte", "Une quinte", "Une sixte"]', 'Une quinte',
 'Do-Sol est une quinte juste (5 notes : Do, Ré, Mi, Fa, Sol). C''est l''un des intervalles les plus importants en harmonie.', 1, 4),

('Fondamentaux', 'qcm', 'Quelle est la formule en tons et demi-tons d''une gamme majeure ?',
 '["T-T-D-T-T-T-D", "T-D-T-T-D-T-T", "T-T-T-D-T-T-D", "D-T-T-T-D-T-T"]', 'T-T-D-T-T-T-D',
 'La gamme majeure suit le schéma : Ton-Ton-Demi-ton-Ton-Ton-Ton-Demi-ton. C''est la base de toute la musique tonale.', 1, 5),

('Fondamentaux', 'qcm', 'Combien de notes comporte un accord majeur ?',
 '["2 notes", "3 notes", "4 notes", "5 notes"]', '3 notes',
 'Un accord majeur (triade) est composé de 3 notes : la fondamentale, la tierce majeure et la quinte juste.', 1, 6),

('Fondamentaux', 'qcm', 'Quelle est la différence entre un accord majeur et un accord mineur ?',
 '["La quinte est différente", "La tierce est différente", "La fondamentale est différente", "Le nombre de notes est différent"]', 'La tierce est différente',
 'La tierce majeure (2 tons) devient tierce mineure (1 ton + 1 demi-ton) dans un accord mineur. C''est ce qui donne la couleur "triste" du mineur.', 1, 7),

('Fondamentaux', 'qcm', 'En notation anglo-saxonne, quelle lettre correspond à la note La ?',
 '["A", "B", "C", "D"]', 'A',
 'En notation anglo-saxonne : C=Do, D=Ré, E=Mi, F=Fa, G=Sol, A=La, B=Si.', 1, 8),

('Fondamentaux', 'qcm', 'Qu''est-ce qu''une altération bémol (b) ?',
 '["Elle monte la note d''un demi-ton", "Elle descend la note d''un demi-ton", "Elle double la durée de la note", "Elle annule une altération précédente"]', 'Elle descend la note d''un demi-ton',
 'Le bémol (b) abaisse la note d''un demi-ton. Par exemple, Réb est un demi-ton en dessous de Ré.', 1, 9),

('Fondamentaux', 'qcm', 'Quel doigt est désigné par le chiffre 1 en doigté de piano ?',
 '["L''auriculaire", "L''annulaire", "Le majeur", "Le pouce"]', 'Le pouce',
 'En doigté de piano : 1=pouce, 2=index, 3=majeur, 4=annulaire, 5=auriculaire. Cette numérotation est identique pour les deux mains.', 1, 10),

-- Vrai/Faux
('Fondamentaux', 'vrai_faux', 'Le Mi et le Si n''ont pas de touche noire entre eux et la note suivante.',
 NULL, 'Vrai',
 'C''est exact ! Mi-Fa et Si-Do sont des demi-tons naturels (sans touche noire entre eux). Ce sont les seuls cas sur le clavier.', 1, 11),

('Fondamentaux', 'vrai_faux', 'La gamme de Sol majeur contient un Fa dièse.',
 NULL, 'Vrai',
 'La gamme de Sol majeur est : Sol-La-Si-Do-Ré-Mi-Fa#-Sol. Le Fa# est nécessaire pour respecter la formule T-T-D-T-T-T-D.', 1, 12),

('Fondamentaux', 'vrai_faux', 'Un accord de Do majeur est composé des notes Do, Mi et Sol.',
 NULL, 'Vrai',
 'Do majeur = Do (fondamentale) + Mi (tierce majeure, 4 demi-tons) + Sol (quinte juste, 7 demi-tons). C''est l''accord de base.', 1, 13),

('Fondamentaux', 'vrai_faux', 'La note Fa# et la note Solb sont deux notes différentes sur le piano.',
 NULL, 'Faux',
 'Fa# et Solb sont la même touche noire sur le piano. On parle d''enharmonie : deux noms différents pour la même hauteur de son.', 1, 14),

('Fondamentaux', 'vrai_faux', 'Pour jouer la gamme de Do majeur, on utilise uniquement les touches blanches.',
 NULL, 'Vrai',
 'La gamme de Do majeur (Do-Ré-Mi-Fa-Sol-La-Si-Do) utilise uniquement les 7 touches blanches. C''est pourquoi on commence toujours par Do.', 1, 15),

-- Réponse courte
('Fondamentaux', 'reponse_courte', 'Citez les 3 notes de l''accord de La mineur.',
 NULL, 'La Do Mi',
 'La mineur = La (fondamentale) + Do (tierce mineure) + Mi (quinte juste). En notation : Am = A-C-E.', 2, 16),

('Fondamentaux', 'reponse_courte', 'Quelle note se trouve à une quinte au-dessus de Do ?',
 NULL, 'Sol',
 'Une quinte au-dessus de Do = Sol. Do(1)-Ré(2)-Mi(3)-Fa(4)-Sol(5). La quinte est l''intervalle le plus stable après l''octave.', 1, 17),

('Fondamentaux', 'reponse_courte', 'Combien de degrés comporte une gamme majeure ?',
 NULL, '7',
 'Une gamme majeure comporte 7 degrés différents (+ l''octave qui répète le 1er degré). Chaque degré a un nom : tonique, sus-tonique, médiante, sous-dominante, dominante, sus-dominante, sensible.', 1, 18),

('Fondamentaux', 'reponse_courte', 'Quel est le symbole de la notation anglo-saxonne pour l''accord de Ré mineur ?',
 NULL, 'Dm',
 'En notation anglo-saxonne : D=Ré, m=mineur. Donc Ré mineur = Dm. Les accords majeurs s''écrivent avec une majuscule seule (ex: D pour Ré majeur).', 1, 19),

('Fondamentaux', 'reponse_courte', 'Nommez les 5 touches noires d''une octave de gauche à droite.',
 NULL, 'Do# Ré# Fa# Sol# La#',
 'Les 5 touches noires d''une octave sont : Do#/Réb, Ré#/Mib, Fa#/Solb, Sol#/Lab, La#/Sib. Elles forment la gamme pentatonique noire.', 2, 20);

-- ══════════════════════════════════════════════════════════════
-- NIVEAU 2 : COMPRÉHENSION ET AUTONOMIE (30 questions)
-- ══════════════════════════════════════════════════════════════

INSERT INTO banque_questions (categorie, type, question, options, bonne_reponse, explication, points, position) VALUES

-- QCM
('Compréhension et autonomie', 'qcm', 'Qu''est-ce que le premier renversement d''un accord ?',
 '["On joue la tierce à la basse", "On joue la quinte à la basse", "On joue la fondamentale à la basse", "On ajoute une note à l''accord"]', 'On joue la tierce à la basse',
 'Le 1er renversement place la tierce à la basse. Pour Do majeur (Do-Mi-Sol), le 1er renversement est Mi-Sol-Do. Cela allège la progression harmonique.', 1, 1),

('Compréhension et autonomie', 'qcm', 'Qu''est-ce que le deuxième renversement d''un accord ?',
 '["On joue la tierce à la basse", "On joue la quinte à la basse", "On joue la fondamentale à la basse", "On supprime la tierce"]', 'On joue la quinte à la basse',
 'Le 2e renversement place la quinte à la basse. Pour Do majeur, c''est Sol-Do-Mi. Ce renversement crée une tension qui demande à être résolue.', 1, 2),

('Compréhension et autonomie', 'qcm', 'Quelle est la progression d''accords la plus courante dans la musique de louange ?',
 '["I-IV-V-I", "I-V-vi-IV", "ii-V-I", "I-IV-vi-V"]', 'I-V-vi-IV',
 'La progression I-V-vi-IV (ex: Do-Sol-Lam-Fa) est l''une des plus utilisées dans la musique contemporaine et de louange. Elle crée un sentiment d''élévation et d''espoir.', 2, 3),

('Compréhension et autonomie', 'qcm', 'Qu''est-ce qu''un arpège ?',
 '["Jouer toutes les notes d''un accord simultanément", "Jouer les notes d''un accord l''une après l''autre", "Répéter la même note rapidement", "Jouer un accord avec la pédale"]', 'Jouer les notes d''un accord l''une après l''autre',
 'Un arpège consiste à jouer les notes d''un accord successivement plutôt que simultanément. C''est une technique d''accompagnement très utilisée au piano.', 1, 4),

('Compréhension et autonomie', 'qcm', 'Comment trouver la tonalité d''un morceau à l''oreille ?',
 '["En comptant les dièses à la clé", "En cherchant la note sur laquelle le morceau se repose naturellement", "En regardant la dernière note", "En comptant les mesures"]', 'En cherchant la note sur laquelle le morceau se repose naturellement',
 'La tonique est la note de repos, celle vers laquelle la musique tend naturellement. C''est la note qui donne un sentiment de conclusion ou de stabilité.', 2, 5),

('Compréhension et autonomie', 'qcm', 'Qu''est-ce que les "accords magiques" en musique de louange ?',
 '["Les accords de 7e", "La progression I-IV-V dans toutes les tonalités", "Les accords sus2 et add9", "Les accords diminués"]', 'La progression I-IV-V dans toutes les tonalités',
 'Les "accords magiques" désignent souvent la progression I-IV-V qui fonctionne dans toutes les tonalités et permet d''accompagner de nombreux chants de louange.', 2, 6),

('Compréhension et autonomie', 'qcm', 'Quel est le rôle du métronome dans la pratique du piano ?',
 '["Indiquer la tonalité", "Maintenir un tempo régulier", "Indiquer la dynamique", "Transposer automatiquement"]', 'Maintenir un tempo régulier',
 'Le métronome est un outil indispensable pour développer la régularité rythmique. Il faut toujours commencer lentement avec le métronome avant d''accélérer progressivement.', 1, 7),

('Compréhension et autonomie', 'qcm', 'Qu''est-ce qu''un playback en musique ?',
 '["Un enregistrement de la mélodie seule", "Un accompagnement musical pré-enregistré sur lequel on joue", "Une technique de répétition", "Un type d''accord"]', 'Un accompagnement musical pré-enregistré sur lequel on joue',
 'Le playback (ou "backtracks") est un accompagnement instrumental pré-enregistré. Jouer avec un playback développe le sens du groove et de l''écoute.', 1, 8),

('Compréhension et autonomie', 'qcm', 'Comment identifier un accord à l''oreille ?',
 '["En comptant les notes", "En reconnaissant la couleur sonore (majeur=joyeux, mineur=mélancolique)", "En regardant les doigts", "En lisant la partition"]', 'En reconnaissant la couleur sonore (majeur=joyeux, mineur=mélancolique)',
 'L''oreille musicale se développe en associant des couleurs émotionnelles aux accords. Les accords majeurs sonnent généralement lumineux/joyeux, les mineurs plus sombres/mélancoliques.', 2, 9),

('Compréhension et autonomie', 'qcm', 'Qu''est-ce que la "main gauche" joue généralement dans un accompagnement de louange ?',
 '["La mélodie", "Les accords complets", "La basse et les accords", "Rien, elle est au repos"]', 'La basse et les accords',
 'Dans l''accompagnement de louange, la main gauche joue généralement la note basse (fondamentale ou basse de renversement) et soutient l''harmonie, pendant que la main droite joue la mélodie ou les accords.', 1, 10),

-- Vrai/Faux
('Compréhension et autonomie', 'vrai_faux', 'Le 1er renversement d''un accord de Sol majeur commence par la note Si.',
 NULL, 'Vrai',
 'Sol majeur = Sol-Si-Ré. Le 1er renversement place la tierce (Si) à la basse : Si-Ré-Sol. C''est correct.', 1, 11),

('Compréhension et autonomie', 'vrai_faux', 'On peut jouer avec un playback sans connaître la tonalité du morceau.',
 NULL, 'Faux',
 'Pour jouer avec un playback, il est essentiel de connaître la tonalité afin de choisir les bons accords et la bonne gamme. Jouer sans connaître la tonalité produira des fausses notes.', 1, 12),

('Compréhension et autonomie', 'vrai_faux', 'La progression I-V-vi-IV peut être jouée dans n''importe quelle tonalité.',
 NULL, 'Vrai',
 'Les chiffres romains indiquent des degrés relatifs à la tonalité. Cette progression fonctionne dans toutes les tonalités en adaptant les accords correspondants.', 1, 13),

('Compréhension et autonomie', 'vrai_faux', 'Un arpège se joue toujours de bas en haut (de la note la plus grave à la plus aiguë).',
 NULL, 'Faux',
 'Un arpège peut se jouer de bas en haut, de haut en bas, ou dans des patterns mixtes. La direction dépend du style musical et de l''effet recherché.', 1, 14),

('Compréhension et autonomie', 'vrai_faux', 'Pour accompagner un chant en autonomie, il suffit de connaître 3 accords.',
 NULL, 'Faux',
 'Bien que certains chants simples utilisent 3 accords, accompagner en autonomie nécessite de connaître la progression complète du morceau, les renversements et le rythme d''accompagnement adapté.', 1, 15),

-- Réponse courte
('Compréhension et autonomie', 'reponse_courte', 'Citez les 3 notes du 2e renversement de l''accord de Fa majeur.',
 NULL, 'Do Fa La',
 'Fa majeur = Fa-La-Do. Le 2e renversement place la quinte (Do) à la basse : Do-Fa-La. Ce renversement est très utilisé dans les progressions cadentielles.', 2, 16),

('Compréhension et autonomie', 'reponse_courte', 'Quelle est la tonalité relative mineure de Do majeur ?',
 NULL, 'La mineur',
 'La mineur est la relative mineure de Do majeur. Elles partagent les mêmes notes (pas d''altération). La relative mineure se trouve toujours une tierce mineure en dessous de la tonique majeure.', 1, 17),

('Compréhension et autonomie', 'reponse_courte', 'Nommez les 4 accords de la progression I-V-vi-IV en Do majeur.',
 NULL, 'Do Sol La mineur Fa',
 'En Do majeur : I=Do, V=Sol, vi=La mineur, IV=Fa. Cette progression est la base de centaines de chants de louange contemporains.', 2, 18),

('Compréhension et autonomie', 'reponse_courte', 'Qu''est-ce qu''un "groove" en musique ?',
 NULL, 'Le sentiment rythmique',
 'Le groove est le sentiment rythmique qui donne envie de bouger. C''est la façon dont les notes s''articulent dans le temps, créant une pulsation naturelle et entraînante.', 1, 19),

('Compréhension et autonomie', 'reponse_courte', 'Comment s''appelle la technique qui consiste à jouer une mélodie entendue sans partition ?',
 NULL, 'Jouer à l''oreille',
 'Jouer à l''oreille (ou "ear playing") consiste à reproduire une mélodie ou un accompagnement uniquement en se fiant à son oreille musicale, sans lire de partition.', 1, 20),

-- Questions supplémentaires
('Compréhension et autonomie', 'qcm', 'Quel rythme d''accompagnement est le plus adapté pour une ballade lente de louange ?',
 '["Croches rapides", "Arpèges lents ou accords tenus", "Rythme de samba", "Doubles croches"]', 'Arpèges lents ou accords tenus',
 'Pour une ballade lente, les arpèges lents ou les accords tenus créent une atmosphère de recueillement et d''adoration. Le rythme doit soutenir l''émotion du texte.', 1, 21),

('Compréhension et autonomie', 'qcm', 'Qu''est-ce que la "sensible" dans une gamme majeure ?',
 '["Le 1er degré", "Le 5e degré", "Le 7e degré", "Le 4e degré"]', 'Le 7e degré',
 'La sensible est le 7e degré de la gamme majeure. Elle est appelée ainsi car elle "tend" naturellement vers la tonique (1er degré) un demi-ton au-dessus. Ex: Si est la sensible de Do majeur.', 2, 22),

('Compréhension et autonomie', 'qcm', 'Comment transposer un morceau dans une autre tonalité ?',
 '["Jouer plus fort", "Décaler tous les accords du même intervalle", "Changer le rythme", "Jouer plus vite"]', 'Décaler tous les accords du même intervalle',
 'Transposer consiste à déplacer tous les accords du même intervalle. Ex: passer de Do à Ré majeur = monter tous les accords d''un ton. Les relations entre les accords restent identiques.', 2, 23),

('Compréhension et autonomie', 'vrai_faux', 'La dominante (5e degré) crée une tension qui se résout naturellement sur la tonique.',
 NULL, 'Vrai',
 'La dominante (V) est le degré le plus tendu de la gamme. Elle contient la sensible qui attire vers la tonique. La cadence V-I est la résolution harmonique la plus forte en musique tonale.', 2, 24),

('Compréhension et autonomie', 'vrai_faux', 'Pour jouer en situation réelle (culte, concert), il faut avoir mémorisé tous les accords.',
 NULL, 'Vrai',
 'En situation réelle, regarder ses mains ou une partition limite la connexion avec les autres musiciens et l''assemblée. La mémorisation permet de jouer avec liberté et expressivité.', 1, 25),

('Compréhension et autonomie', 'reponse_courte', 'Quel est le nom du 4e degré d''une gamme majeure ?',
 NULL, 'Sous-dominante',
 'Les degrés de la gamme majeure : I=Tonique, II=Sus-tonique, III=Médiante, IV=Sous-dominante, V=Dominante, VI=Sus-dominante, VII=Sensible. La sous-dominante joue un rôle important dans les cadences.', 1, 26),

('Compréhension et autonomie', 'reponse_courte', 'Citez 2 avantages de jouer avec un métronome.',
 NULL, 'Régularité du tempo et conscience du rythme',
 'Le métronome développe : 1) La régularité du tempo (ne pas accélérer dans les passages faciles ni ralentir dans les difficiles), 2) La conscience rythmique et le sens de la pulsation.', 2, 27),

('Compréhension et autonomie', 'qcm', 'Qu''est-ce qu''une cadence parfaite ?',
 '["La progression IV-I", "La progression V-I", "La progression I-IV", "La progression vi-IV"]', 'La progression V-I',
 'La cadence parfaite (V-I) est la résolution harmonique la plus conclusive. Elle donne un sentiment d''achèvement et de repos. C''est la fin naturelle de la plupart des morceaux.', 2, 28),

('Compréhension et autonomie', 'vrai_faux', 'Un musicien qui joue à l''oreille n''a pas besoin de connaître la théorie musicale.',
 NULL, 'Faux',
 'La théorie musicale et l''oreille se complètent. La théorie donne les outils pour comprendre ce qu''on entend, et l''oreille permet d''appliquer la théorie de façon intuitive. Les deux se renforcent mutuellement.', 2, 29),

('Compréhension et autonomie', 'reponse_courte', 'Qu''est-ce qu''un "fill" en musique ?',
 NULL, 'Une courte phrase musicale de transition',
 'Un fill est une courte phrase musicale improvisée qui remplit un espace entre deux phrases ou sections. Il sert de transition et ajoute de l''intérêt musical sans perturber la structure du morceau.', 1, 30);

-- ══════════════════════════════════════════════════════════════
-- NIVEAU 3 : EXPRESSION ET MAÎTRISE (40 questions)
-- ══════════════════════════════════════════════════════════════

INSERT INTO banque_questions (categorie, type, question, options, bonne_reponse, explication, points, position) VALUES

-- QCM
('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un accord de 7e de dominante ?',
 '["Un accord majeur avec une 7e mineure ajoutée", "Un accord mineur avec une 7e majeure", "Un accord diminué", "Un accord avec 4 quintes"]', 'Un accord majeur avec une 7e mineure ajoutée',
 'L''accord de 7e de dominante (ex: Sol7 = Sol-Si-Ré-Fa) est un accord majeur auquel on ajoute une 7e mineure. Il crée une forte tension qui se résout sur la tonique.', 2, 1),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un accord sus2 ?',
 '["Un accord où la tierce est remplacée par la seconde", "Un accord avec une 2e ajoutée", "Un accord suspendu à la 4e", "Un accord de 9e"]', 'Un accord où la tierce est remplacée par la seconde',
 'Un accord sus2 (suspendu 2) remplace la tierce par la seconde majeure. Ex: Dosus2 = Do-Ré-Sol. Il crée une couleur ouverte et moderne très utilisée dans la louange contemporaine.', 2, 2),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un accord add9 ?',
 '["Un accord où la tierce est remplacée par la 9e", "Un accord majeur avec la 9e ajoutée en plus de la tierce", "Un accord de 7e avec la 9e", "Un accord sans quinte"]', 'Un accord majeur avec la 9e ajoutée en plus de la tierce',
 'L''accord add9 conserve la tierce et ajoute la 9e (= 2e à l''octave supérieure). Ex: Do add9 = Do-Mi-Sol-Ré. Contrairement au sus2, la tierce est maintenue, donnant une couleur plus riche.', 2, 3),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''une substitution d''accord ?',
 '["Jouer un accord à la place d''un autre pour créer une couleur différente", "Changer la tonalité", "Supprimer un accord", "Répéter le même accord"]', 'Jouer un accord à la place d''un autre pour créer une couleur différente',
 'La substitution harmonique consiste à remplacer un accord par un autre qui remplit la même fonction harmonique mais avec une couleur différente. Ex: remplacer V par VII pour une résolution plus douce.', 2, 4),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un voicing ?',
 '["La façon dont les notes d''un accord sont disposées et réparties entre les mains", "Le volume sonore", "La vitesse de jeu", "Le nombre de notes dans un accord"]', 'La façon dont les notes d''un accord sont disposées et réparties entre les mains',
 'Le voicing désigne la disposition des notes d''un accord. Un même accord peut avoir de nombreux voicings différents selon l''octave et la répartition des notes entre les deux mains.', 2, 5),

('Expression et maîtrise', 'qcm', 'Qu''est-ce que l''improvisation en musique ?',
 '["Jouer sans partition en créant spontanément", "Jouer très vite", "Jouer sans métronome", "Jouer des gammes"]', 'Jouer sans partition en créant spontanément',
 'L''improvisation est l''art de créer de la musique spontanément, en temps réel. Elle repose sur la connaissance des gammes, des accords et des patterns rythmiques internalisés.', 2, 6),

('Expression et maîtrise', 'qcm', 'Sur quelle gamme peut-on improviser sur un accord de Do majeur ?',
 '["Gamme de Do mineur", "Gamme de Do majeur ou pentatonique de Do", "Gamme de Sol majeur", "Gamme chromatique uniquement"]', 'Gamme de Do majeur ou pentatonique de Do',
 'Sur un accord de Do majeur, on peut improviser avec la gamme de Do majeur (7 notes) ou la gamme pentatonique majeure de Do (5 notes : Do-Ré-Mi-Sol-La). La pentatonique est plus facile pour débuter.', 2, 7),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''une introduction au piano ?',
 '["La dernière section d''un morceau", "Une phrase musicale qui précède le chant et établit la tonalité et le tempo", "Un accord de 7e", "Une gamme jouée rapidement"]', 'Une phrase musicale qui précède le chant et établit la tonalité et le tempo',
 'L''introduction prépare les chanteurs et l''assemblée en établissant la tonalité, le tempo et l''atmosphère du morceau. Elle peut être de 2 à 8 mesures selon le style.', 1, 8),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un arrangement musical ?',
 '["Jouer plus fort", "Adapter et enrichir un morceau existant pour un instrument ou un ensemble", "Mémoriser un morceau", "Jouer sans partition"]', 'Adapter et enrichir un morceau existant pour un instrument ou un ensemble',
 'Arranger un morceau consiste à l''adapter pour un instrument ou un ensemble spécifique, en ajoutant des voix, des contre-mélodies, des ornements ou en modifiant la structure.', 2, 9),

('Expression et maîtrise', 'qcm', 'Qu''est-ce que la "couleur harmonique" d''un accord ?',
 '["La hauteur de l''accord", "La sensation émotionnelle et sonore créée par les intervalles de l''accord", "Le nombre de notes", "La durée de l''accord"]', 'La sensation émotionnelle et sonore créée par les intervalles de l''accord',
 'La couleur harmonique est la qualité sonore et émotionnelle d''un accord. Les accords de 7e, 9e, sus2, add9 ont chacun une couleur particulière qui enrichit l''expression musicale.', 2, 10),

-- Vrai/Faux
('Expression et maîtrise', 'vrai_faux', 'Un accord de 9e contient 5 notes.',
 NULL, 'Vrai',
 'Un accord de 9e complet contient : fondamentale, tierce, quinte, 7e et 9e = 5 notes. En pratique, on omet souvent la quinte pour faciliter le jeu.', 2, 11),

('Expression et maîtrise', 'vrai_faux', 'L''improvisation nécessite de connaître les gammes par cœur.',
 NULL, 'Vrai',
 'Pour improviser librement, les gammes doivent être automatisées (jouées sans réfléchir). C''est seulement quand les gammes sont internalisées qu''on peut se concentrer sur l''expression musicale.', 2, 12),

('Expression et maîtrise', 'vrai_faux', 'Un accord sus4 contient une tierce.',
 NULL, 'Faux',
 'Un accord sus4 (suspendu 4) remplace la tierce par la quarte. Ex: Dosus4 = Do-Fa-Sol. Il n''y a pas de tierce, ce qui crée une ambiguïté entre majeur et mineur.', 2, 13),

('Expression et maîtrise', 'vrai_faux', 'On peut créer une fin de morceau (outro) en répétant simplement le dernier accord.',
 NULL, 'Faux',
 'Une fin musicale efficace nécessite une cadence conclusive (généralement V-I), un ralentissement progressif (ritardando) et/ou une diminution du volume. Simplement répéter le dernier accord crée une fin abrupte.', 1, 14),

('Expression et maîtrise', 'vrai_faux', 'Le style musical influence le choix des voicings d''accords.',
 NULL, 'Vrai',
 'Absolument. La louange contemporaine utilise des voicings ouverts avec des 9e et sus2. Le jazz utilise des voicings complexes avec des 7e et 9e. Le classique utilise des voicings plus serrés. Chaque style a ses codes.', 2, 15),

-- Réponse courte
('Expression et maîtrise', 'reponse_courte', 'Citez les 5 notes de l''accord de Sol avec 7e de dominante (Sol7).',
 NULL, 'Sol Si Ré Fa',
 'Sol7 = Sol (fondamentale) + Si (tierce majeure) + Ré (quinte) + Fa (7e mineure). C''est 4 notes, pas 5. La 7e de dominante est l''accord le plus tendu, il résout naturellement sur Do majeur.', 2, 16),

('Expression et maîtrise', 'reponse_courte', 'Qu''est-ce que la gamme pentatonique et combien de notes contient-elle ?',
 NULL, '5 notes',
 'La gamme pentatonique contient 5 notes (penta = 5). La pentatonique majeure de Do : Do-Ré-Mi-Sol-La. Elle évite les demi-tons, ce qui la rend très mélodieuse et facile à utiliser pour l''improvisation.', 2, 17),

('Expression et maîtrise', 'reponse_courte', 'Donnez un exemple de substitution d''accord pour remplacer Sol majeur (V de Do).',
 NULL, 'Si diminué ou Ré mineur',
 'On peut substituer Sol (V) par Si diminué (VII°) qui partage 3 notes avec Sol7, ou par Ré mineur (ii) qui prépare la dominante. Ces substitutions créent des progressions plus sophistiquées.', 3, 18),

('Expression et maîtrise', 'reponse_courte', 'Qu''est-ce qu''un "lick" en musique ?',
 NULL, 'Une courte phrase mélodique mémorisée',
 'Un lick est une courte phrase mélodique caractéristique qu''un musicien a mémorisée et peut réutiliser dans ses improvisations. Accumuler des licks est une façon d''enrichir son vocabulaire musical.', 1, 19),

('Expression et maîtrise', 'reponse_courte', 'Comment créer une introduction efficace pour un chant de louange ?',
 NULL, 'Jouer la progression harmonique du refrain ou du couplet',
 'Une introduction efficace joue généralement la progression harmonique principale du morceau (refrain ou couplet), établit le tempo et la dynamique, et prépare les chanteurs à entrer au bon moment.', 2, 20),

-- Questions supplémentaires
('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un accord de 7e majeure (maj7) ?',
 '["Un accord majeur avec une 7e mineure", "Un accord majeur avec une 7e majeure", "Un accord de 7e de dominante", "Un accord diminué"]', 'Un accord majeur avec une 7e majeure',
 'L''accord maj7 (ex: Do maj7 = Do-Mi-Sol-Si) ajoute la 7e majeure à un accord majeur. Il crée une couleur douce et sophistiquée, très utilisée dans la musique contemporaine et le jazz.', 2, 21),

('Expression et maîtrise', 'qcm', 'Qu''est-ce que la "dynamique" en musique ?',
 '["La vitesse du morceau", "Les variations de volume et d''intensité", "Le nombre d''accords", "La tonalité"]', 'Les variations de volume et d''intensité',
 'La dynamique désigne les variations de volume (forte, piano, crescendo, decrescendo). Maîtriser la dynamique est essentiel pour l''expression musicale et pour créer des moments d''impact émotionnel.', 1, 22),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un "bridge" dans la structure d''un chant ?',
 '["L''introduction", "Une section contrastante qui apporte une nouvelle perspective harmonique ou mélodique", "Le refrain", "La coda"]', 'Une section contrastante qui apporte une nouvelle perspective harmonique ou mélodique',
 'Le bridge (pont) est une section qui contraste avec le couplet et le refrain. Il apporte une nouvelle couleur harmonique ou mélodique et crée un moment de tension avant le retour du refrain.', 2, 23),

('Expression et maîtrise', 'qcm', 'Comment développer son propre style musical ?',
 '["Copier exactement un musicien", "Écouter et analyser de nombreux styles, puis expérimenter", "Jouer toujours les mêmes morceaux", "Éviter d''écouter d''autres musiciens"]', 'Écouter et analyser de nombreux styles, puis expérimenter',
 'Le style personnel se développe en absorbant de nombreuses influences (écoute active), en analysant ce qu''on entend, et en expérimentant pour trouver sa propre voix musicale.', 2, 24),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un accord "slash" (ex: Do/Sol) ?',
 '["Un accord joué très rapidement", "Un accord avec une basse spécifique indiquée après la barre oblique", "Un accord diminué", "Un accord joué avec la pédale"]', 'Un accord avec une basse spécifique indiquée après la barre oblique',
 'La notation Do/Sol signifie : accord de Do majeur avec Sol à la basse. C''est souvent un renversement ou une pédale de basse. Ex: Do/Sol = Sol-Do-Mi-Sol (2e renversement de Do).', 2, 25),

('Expression et maîtrise', 'vrai_faux', 'Un musicien expressif peut communiquer des émotions même avec des accords simples.',
 NULL, 'Vrai',
 'L''expression musicale ne dépend pas de la complexité des accords mais de la façon dont on les joue : dynamique, timing, toucher, phrasé. Un accord simple joué avec intention peut être très émouvant.', 2, 26),

('Expression et maîtrise', 'vrai_faux', 'La gamme de blues est identique à la gamme pentatonique mineure.',
 NULL, 'Faux',
 'La gamme de blues est la gamme pentatonique mineure avec une note supplémentaire : la "blue note" (quinte diminuée). Ex: Do blues = Do-Mib-Fa-Solb-Sol-Sib-Do (6 notes au lieu de 5).', 2, 27),

('Expression et maîtrise', 'vrai_faux', 'Improviser pendant la louange nécessite d''écouter les autres musiciens.',
 NULL, 'Vrai',
 'L''improvisation en contexte de louange est un dialogue musical. Il faut écouter les autres instruments, le chanteur et l''assemblée pour créer quelque chose qui soutient l''ensemble plutôt que de se mettre en avant.', 2, 28),

('Expression et maîtrise', 'vrai_faux', 'Un arrangement peut simplifier un morceau complexe pour le rendre accessible.',
 NULL, 'Vrai',
 'L''arrangement peut aller dans les deux sens : enrichir un morceau simple ou simplifier un morceau complexe. L''objectif est toujours de servir le morceau et le contexte musical.', 1, 29),

('Expression et maîtrise', 'reponse_courte', 'Qu''est-ce que le "comping" au piano ?',
 NULL, 'Accompagnement harmonique et rythmique',
 'Le comping (de "accompanying") désigne l''art d''accompagner harmoniquement et rythmiquement un soliste ou un chanteur. Le pianiste joue des accords de façon rythmique et réactive, en laissant de l''espace au soliste.', 2, 30),

('Expression et maîtrise', 'reponse_courte', 'Citez 3 types d''ornements que l''on peut utiliser au piano.',
 NULL, 'Trille mordant glissando',
 'Les ornements principaux au piano : trille (alternance rapide de deux notes), mordant (note principale + note voisine), glissando (glissement rapide sur les touches), appoggiature (note d''appui), gruppetto (groupe de notes ornementales).', 2, 31),

('Expression et maîtrise', 'qcm', 'Qu''est-ce que la "résolution" en harmonie ?',
 '["Jouer plus fort", "Le mouvement d''un accord tendu vers un accord de repos", "Changer de tonalité", "Répéter un accord"]', 'Le mouvement d''un accord tendu vers un accord de repos',
 'La résolution est le mouvement d''un accord créant de la tension (comme la dominante V) vers un accord de repos (comme la tonique I). C''est le principe fondamental de la tension-détente en musique tonale.', 2, 32),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''une "pédale" harmonique ?',
 '["La pédale de sustain du piano", "Une note tenue à la basse pendant que les accords changent au-dessus", "Un accord répété", "Une technique de doigté"]', 'Une note tenue à la basse pendant que les accords changent au-dessus',
 'La pédale harmonique (ou pédale de basse) est une note grave tenue ou répétée pendant que les harmonies changent au-dessus. Elle crée une tension ou une stabilité selon le contexte.', 2, 33),

('Expression et maîtrise', 'vrai_faux', 'Le style de jeu doit s''adapter au contexte (culte intime, grand concert, enregistrement).',
 NULL, 'Vrai',
 'Un musicien mature adapte son jeu au contexte : plus doux et contemplatif pour un culte intime, plus dynamique pour un grand concert, plus précis pour un enregistrement. L''adaptabilité est une marque de maturité musicale.', 2, 34),

('Expression et maîtrise', 'reponse_courte', 'Qu''est-ce que le "voice leading" (conduite des voix) ?',
 NULL, 'Mouvement fluide des notes entre les accords',
 'Le voice leading est l''art de faire évoluer chaque note d''un accord vers la note la plus proche de l''accord suivant. Un bon voice leading crée des progressions harmoniques fluides et naturelles.', 3, 35),

('Expression et maîtrise', 'qcm', 'Qu''est-ce qu''un accord diminué ?',
 '["Un accord avec une tierce mineure et une quinte diminuée", "Un accord sans quinte", "Un accord de 4 notes", "Un accord majeur joué doucement"]', 'Un accord avec une tierce mineure et une quinte diminuée',
 'L''accord diminué (ex: Si dim = Si-Ré-Fa) est composé de deux tierces mineures superposées. Il crée une forte tension et est souvent utilisé comme accord de passage ou de substitution de la dominante.', 2, 36),

('Expression et maîtrise', 'qcm', 'Comment créer une variation rythmique dans un accompagnement ?',
 '["Jouer toujours les mêmes croches", "Varier les patterns rythmiques, les syncopes et les silences", "Jouer plus vite", "Changer de tonalité"]', 'Varier les patterns rythmiques, les syncopes et les silences',
 'La variation rythmique s''obtient en alternant différents patterns (croches, syncopes, contretemps), en utilisant des silences expressifs et en adaptant le groove à l''énergie du moment.', 2, 37),

('Expression et maîtrise', 'vrai_faux', 'Un pianiste de louange doit savoir jouer dans toutes les tonalités.',
 NULL, 'Vrai',
 'Les chanteurs choisissent souvent la tonalité selon leur tessiture. Un pianiste polyvalent doit pouvoir transposer rapidement dans n''importe quelle tonalité pour s''adapter aux besoins du chanteur.', 2, 38),

('Expression et maîtrise', 'reponse_courte', 'Qu''est-ce que la "tessiture" d''un chanteur ?',
 NULL, 'L''étendue des notes qu''il peut chanter confortablement',
 'La tessiture est l''étendue des notes qu''un chanteur peut produire confortablement, de la note la plus grave à la plus aiguë. Elle détermine la tonalité idéale pour chaque chanteur.', 1, 39),

('Expression et maîtrise', 'reponse_courte', 'Citez 2 façons de créer une fin de morceau (outro) au piano.',
 NULL, 'Cadence finale et ritardando',
 'Pour créer une fin efficace : 1) Cadence parfaite (V-I) avec un accord final tenu, 2) Ritardando (ralentissement progressif), 3) Diminuendo (diminution du volume), 4) Répétition du dernier accord en s''estompant (fade out).', 2, 40);


-- ══════════════════════════════════════════════════════════════
-- FONDAMENTAUX — 10 questions supplémentaires (total = 30)
-- ══════════════════════════════════════════════════════════════

INSERT INTO banque_questions (categorie, type, question, options, bonne_reponse, explication, points, position) VALUES

('Fondamentaux', 'qcm', 'Combien y a-t-il de touches noires sur un piano standard de 88 touches ?',
 '["32", "34", "36", "38"]', '36',
 'Un piano standard de 88 touches comporte 36 touches noires réparties en groupes de 2 et 3 sur toute l''étendue du clavier.', 1, 21),

('Fondamentaux', 'qcm', 'Quelle note se trouve juste à gauche d''un groupe de 3 touches noires ?',
 '["Do", "Fa", "Sol", "La"]', 'Fa',
 'Le Fa se trouve toujours à gauche d''un groupe de 3 touches noires. Avec le Do (à gauche des 2 touches noires), ce sont les deux repères principaux du clavier.', 1, 22),

('Fondamentaux', 'qcm', 'Qu''est-ce qu''une octave ?',
 '["Un intervalle de 5 notes", "Un intervalle de 7 notes", "La répétition de la même note 8 degrés plus haut ou plus bas", "Un accord de 8 notes"]', 'La répétition de la même note 8 degrés plus haut ou plus bas',
 'Une octave est l''intervalle entre deux notes portant le même nom, séparées de 12 demi-tons. Le son est identique mais à une hauteur différente (plus grave ou plus aigu).', 1, 23),

('Fondamentaux', 'qcm', 'Quel est le nom du 5e degré d''une gamme majeure ?',
 '["Tonique", "Médiante", "Dominante", "Sensible"]', 'Dominante',
 'Le 5e degré s''appelle la dominante. C''est le degré le plus important après la tonique (1er degré). La dominante crée une tension qui se résout naturellement sur la tonique.', 1, 24),

('Fondamentaux', 'qcm', 'Combien de demi-tons y a-t-il dans une octave ?',
 '["10", "11", "12", "13"]', '12',
 'Une octave contient exactement 12 demi-tons (touches blanches et noires confondues). C''est la base du système tempéré utilisé dans la musique occidentale.', 1, 25),

('Fondamentaux', 'vrai_faux', 'La gamme de Ré majeur contient deux dièses : Fa# et Do#.',
 NULL, 'Vrai',
 'La gamme de Ré majeur est : Ré-Mi-Fa#-Sol-La-Si-Do#-Ré. Elle contient bien Fa# et Do# pour respecter la formule T-T-D-T-T-T-D.', 1, 26),

('Fondamentaux', 'vrai_faux', 'Un accord de Mi mineur est composé des notes Mi, Sol et Si.',
 NULL, 'Vrai',
 'Mi mineur = Mi (fondamentale) + Sol (tierce mineure, 3 demi-tons) + Si (quinte juste, 7 demi-tons). En notation : Em = E-G-B.', 1, 27),

('Fondamentaux', 'vrai_faux', 'Le dièse (#) monte la note d''un ton entier.',
 NULL, 'Faux',
 'Le dièse (#) monte la note d''un demi-ton seulement (pas d''un ton entier). Par exemple, Do# est un demi-ton au-dessus de Do, pas un ton.', 1, 28),

('Fondamentaux', 'reponse_courte', 'Quelle est la note enharmonique de Do# ?',
 NULL, 'Réb',
 'Do# et Réb sont deux noms différents pour la même touche noire sur le piano. On parle d''enharmonie. Le choix entre les deux dépend du contexte harmonique.', 1, 29),

('Fondamentaux', 'reponse_courte', 'Nommez les 7 notes de la gamme de Sol majeur dans l''ordre.',
 NULL, 'Sol La Si Do Ré Mi Fa#',
 'La gamme de Sol majeur : Sol-La-Si-Do-Ré-Mi-Fa#-Sol. Elle ne contient qu''une seule altération : Fa#. C''est l''une des premières gammes à apprendre après Do majeur.', 2, 30);

SELECT categorie, COUNT(*) as nb_questions FROM banque_questions GROUP BY categorie ORDER BY categorie;

