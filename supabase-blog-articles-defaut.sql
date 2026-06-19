-- ═══════════════════════════════════════════════════════════
-- ARTICLES DE BLOG PAR DÉFAUT
-- À exécuter dans Supabase SQL Editor
-- Ces 3 articles seront gérables depuis l'admin
-- ═══════════════════════════════════════════════════════════

INSERT INTO blog_articles (titre, slug, extrait, contenu, categorie, temps_lecture, est_publie, created_at)
VALUES
(
  'Apprendre le piano à l''âge adulte : mythe ou réalité ?',
  'apprendre-piano-adulte',
  'Beaucoup pensent qu''il est trop tard pour apprendre le piano passé un certain âge. Découvrez pourquoi c''est faux et comment commencer efficacement.',
  'Beaucoup de personnes pensent qu''il est trop tard pour apprendre le piano une fois adulte. Cette idée reçue décourage de nombreux passionnés de musique. Pourtant, la réalité est bien différente.

## Le cerveau adulte apprend différemment, pas moins bien

Contrairement aux enfants, les adultes ont une capacité de concentration plus développée et une motivation intrinsèque plus forte. Vous savez pourquoi vous voulez apprendre, ce qui est un avantage considérable.

## Les avantages d''apprendre adulte

La lecture musicale est souvent plus rapide à acquérir pour un adulte. Votre compréhension théorique est facilitée par votre expérience générale. Vous pouvez pratiquer de manière plus autonome et ciblée.

## Combien de temps faut-il ?

Avec 30 minutes de pratique quotidienne, la plupart des adultes peuvent jouer leurs premières mélodies en quelques semaines et accompagner des chansons simples en quelques mois.

## Nos conseils pour commencer

Commencez par un cours d''essai gratuit pour évaluer votre niveau et définir vos objectifs. Choisissez un répertoire qui vous motive. La régularité prime sur la durée des sessions.

Il n''est jamais trop tard pour commencer le piano. La seule condition est de le vouloir vraiment.',
  'Conseils',
  '5 min',
  true,
  now() - interval '10 days'
),
(
  'Comment choisir son premier clavier ou piano numérique ?',
  'choisir-clavier-piano',
  'Toucher dynamique, nombre de touches, polyphonie... Voici les critères essentiels pour choisir l''instrument idéal pour débuter.',
  'Le choix de votre premier instrument est crucial pour votre apprentissage. Voici les critères essentiels à considérer.

## Le toucher dynamique : indispensable

Un clavier avec toucher dynamique (ou vélocité) reproduit le comportement d''un vrai piano : plus vous appuyez fort, plus le son est fort. C''est essentiel pour développer une bonne technique.

## Le nombre de touches

Un piano complet possède 88 touches. Pour débuter, 61 touches suffisent pour la plupart des morceaux. Idéalement, visez 76 ou 88 touches pour ne pas être limité.

## La polyphonie

La polyphonie désigne le nombre de notes pouvant sonner simultanément. Visez au minimum 64 voix de polyphonie pour éviter les coupures de son.

## Notre recommandation pour débuter

Pour un budget de 200-400€, des marques comme Yamaha (P-45), Roland (FP-30) ou Casio (PX-S1100) offrent d''excellentes options avec toucher dynamique et 88 touches.

## L''accessoire indispensable : le pédalier

N''oubliez pas d''inclure une pédale de sustain dans votre budget. Elle est essentielle dès les premières semaines d''apprentissage.',
  'Matériel',
  '7 min',
  true,
  now() - interval '7 days'
),
(
  '5 conseils pour progresser rapidement au piano en ligne',
  'progresser-piano-en-ligne',
  'Les cours en ligne offrent une flexibilité incomparable. Voici comment en tirer le meilleur parti pour progresser efficacement.',
  'Les cours de piano en ligne offrent une flexibilité incomparable. Voici comment en tirer le meilleur parti.

## 1. Préparez votre espace de pratique

Installez votre clavier dans un endroit calme, bien éclairé, avec votre ordinateur ou tablette bien positionné pour que votre professeur puisse vous voir jouer. Une bonne caméra fait toute la différence.

## 2. Pratiquez régulièrement entre les cours

30 minutes par jour valent mieux que 3 heures le week-end. La régularité est la clé du progrès musical. Utilisez les notes de cours envoyées après chaque séance comme guide.

## 3. Enregistrez-vous

Filmez-vous en train de jouer. Cela vous permet d''identifier vos erreurs et de mesurer votre progression. Partagez ces enregistrements avec votre professeur via l''espace élève.

## 4. Utilisez un métronome

Le sens du rythme s''acquiert avec la pratique. Commencez toujours lentement avec un métronome, puis augmentez progressivement le tempo.

## 5. Jouez de la musique que vous aimez

La motivation est le carburant de l''apprentissage. Demandez à votre professeur d''intégrer des morceaux que vous appréciez dans votre programme.',
  'Pédagogie',
  '6 min',
  true,
  now() - interval '3 days'
)
ON CONFLICT (slug) DO NOTHING;

SELECT 'Articles de blog par défaut insérés avec succès' AS status;