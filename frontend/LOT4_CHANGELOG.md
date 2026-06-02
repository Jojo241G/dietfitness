# Lot 4 — Permission Android 14 + Nutrition (déduction calories temps réel)

## Permission podomètre (Android 14)
- app.json : permissions Android en forme pleinement qualifiée
  ("android.permission.ACTIVITY_RECOGNITION", …). Nécessaire dès qu'on build.
- usePedometer.js : nouvelle fonction demanderPermission() qui force le
  pop-up système (Pedometer.requestPermissionsAsync) puis démarre le suivi.
- HomeScreen : bouton « Activer le suivi des pas » quand la permission
  n'est pas accordée → déclenche le pop-up réel.

⚠️ RAPPEL EXPO GO : dans Expo Go, app.json n'altère PAS le manifest réel
(Expo Go a son propre manifest figé). La permission n'apparaîtra dans les
réglages Android que dans un BUILD dev (expo-dev-client / EAS build).
Le pop-up déclenché par le bouton reste le moyen le plus fiable de tester.

## Nutrition — corrections critiques + nouveautés
NutritionScreen réécrit. Bugs corrigés (l'ajout de plat ne marchait pas) :
  • lisait `profile` / `ajouterCaloriesDuJour` → INEXISTANTS dans le contexte.
    Corrigé en `profil` / `ajouterCalories`.
  • lisait profil.allergie / profil.contreIndications (chaînes) alors que
    l'onboarding stocke des TABLEAUX `allergies` / `conditions`. Corrigé +
    comparaison insensible casse/accents.
Nouveautés :
  • En-tête « tracker » synchronisé avec le Home : kcal consommées / objectif,
    barre de progression, kcal restantes (ou dépassement signalé).
  • Ajouter un plat → ajouterCalories() → jauge du Home mise à jour EN TEMPS RÉEL
    (même ProfileContext, persistant).
  • Badge « déconseillé » fiable selon allergies/conditions réelles du profil.
  • FlatList optimisée (initialNumToRender, windowSize, removeClippedSubviews).
  • 30 plats locaux : Ndolé, Koki, Achu, Eru, Mbongo, Okok, Taro… déjà dans
    donnees_nutrition.json (inchangé).

## Correctif bonus
- FitnessScreen lisait aussi `profile.objective` (mauvaise clé/langue) →
  corrigé en `profil.objectif`. Le filtrage par objectif fonctionne enfin.

## Lancement
Pas de nouvelle dépendance vs lot 3. Si tu viens du lot 2, fais `npm install`.
