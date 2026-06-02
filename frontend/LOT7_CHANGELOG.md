# Lot 7 — Correctif chrono + Exercices interactifs + Espace social optimisé

## 0. Correctif du chronomètre Parcours (bug "1h14" au lieu de "1min14")
- useRunTracker : le chrono est désormais basé sur l'horloge réelle
  (Date.now() - t0) au lieu d'incréments d'intervalle, et demarrer() appelle
  nettoyer() d'abord pour éliminer tout timer résiduel (qui faisait gonfler la
  durée → double/triple comptage). Vérifié : 74 s → "1:14" exact.

## 1. Exercices fitness INTERACTIFS
- Nouveau : src/services/exerciseUtils.js
   analyserDuree() transforme "45 secondes" / "4 séries x 12" / "3 séries x 1 min"
   en séquence de phases chronométrées (effort + repos). Vérifié sur tes 8 exos.
   caloriesExercice() : estimation MET selon difficulté + durée d'effort + poids.
- Nouveau : src/screens/fitness/ExercisePlayerScreen.js
   • Décompte vocal 3-2-1 avant le départ.
   • Minuteur par phase avec jauge circulaire SVG ; pour un exo de 45 s, il
     s'arrête à 45 s NET (horloge réelle).
   • Voix d'accompagnement : début de phase, encouragement à mi-parcours,
     "encore 3 secondes", bilan final. Bouton voix on/off.
   • Séries multiples : enchaîne effort → repos → effort… automatiquement.
   • Pause/reprise.
   • À la fin : calories ajoutées au ProfileContext → visibles dans le résumé Home.
- FitnessScreen : les cartes d'exercice sont maintenant CLIQUABLES (overlay play),
   affichent les calories estimées, et ouvrent le lecteur.

## 2. Espace social OPTIMISÉ et professionnel
- Nouveau : src/services/socialService.js (GET/POST /api/posts, like).
- Nouveau : src/components/social/PostCard.js — carte mémoïsée (React.memo) :
   ne se re-render que si son like/contenu change → défilement fluide.
- Nouveau : src/screens/social/SocialScreen.js :
   • FlatList optimisée : initialNumToRender, maxToRenderPerBatch, windowSize,
     removeClippedSubviews, renderItem/keyExtractor stables (useCallback).
   • PAGINATION côté client (tranches de 8) avec chargement à la fin du scroll
     (onEndReached) — résout les lenteurs même si le backend renvoie tout d'un bloc.
   • Likes OPTIMISTES : l'UI réagit instantanément, rollback si échec réseau.
   • Composer en modal (catégories General / Recettes / Motivation).
   • Pull-to-refresh, filtres par catégorie, états vides/hors-ligne propres.
- Navigation : l'onglet "Coach IA" (ancien chatbot) est remplacé par "Communauté".
   ChatScreen n'est plus monté (le chatbot reste retiré, conforme au cahier).

## ⚠️ Note backend (perf)
GET /api/posts n'est PAS paginé côté serveur ; on pagine côté client. Pour de
très gros volumes, ajouter une vraie pagination Spring (Pageable) + index SQL
sur date_publication serait l'étape suivante (lot backend).

## ⚠️ npm install
Aucune nouvelle dépendance vs lot 6 (réutilise expo-speech, react-native-svg).
Si tu sautes des lots : npm install par sécurité.
