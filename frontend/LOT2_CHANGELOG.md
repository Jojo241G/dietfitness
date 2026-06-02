# Lot 2 — Tunnel d'Onboarding + Moteur IMC / Calories

## Nouveau fichier
- src/services/healthCalculations.js
  Moteur de calcul SANTÉ partagé = source unique de vérité :
   • calculerIMC + categorieIMC (catégories OMS détaillées)
   • calculerMetabolismeBase (Mifflin-St Jeor, tient compte du sexe)
   • calculerTDEE (MB × facteur d'activité)
   • calculerCaloriesObjectif (TDEE + ajustement selon objectif, plancher 1200)
   • repartitionMacros (protéines/glucides/lipides selon l'objectif)

## Réécriture majeure
- src/screens/auth/OnboardingScreen.js  (placeholder → tunnel 7 étapes)
   1. Compte (prénom, nom, email, mot de passe)
   2. Sexe + âge
   3. Poids + taille
   4. Objectif (perte / maintien / prise de masse)
   5. Niveau d'activité
   6. Conditions médicales + allergies (chips multi-sélection)
   7. Récap calculé (IMC + calories) avant validation
   - Barre de progression, validation par étape, gestion loading/erreur
   - À la fin : registerRequest() vers le backend PUIS profil local complet
     PUIS setSession() → bascule auto vers Main.

## Alignement (suppression des formules dupliquées)
- src/screens/home/HomeScreen.js
   • Utilise désormais le moteur partagé (plus de calculerBesoins local).
   • Lit les compteurs du jour (eau / kcal / pas) depuis ProfileContext
     au lieu de valeurs codées en dur (1.5L, 1420 kcal, 320…).
   • Gouttes d'eau CLIQUABLES (+/- 0,5 L) → persistées et synchronisées.
- src/screens/profile/ProfileScreen.js
   • Local calculerIMC/calculerBesoinsKcal remplacés par le moteur partagé.
   • Affiche caloriesObjectif (ajusté à l'objectif), cohérent avec Home & Onboarding.

## Note importante sur le backend
RegisterRequest ne contient PAS sexe/âge/niveauActivité, et AuthService calcule
les calories avec age=25, sexe=Homme, activité=1.375 (valeurs figées).
→ Le frontend fait le calcul PRÉCIS localement (avec les vraies valeurs) et
  l'utilise partout ; le caloriesObjectif renvoyé par le backend est écrasé.
  RECOMMANDATION (lot backend) : enrichir RegisterRequest + User avec
  sexe, age, niveauActivite pour que le serveur calcule la même chose.

## Lancement
Aucune nouvelle dépendance. npm install (si pas déjà fait) puis npx expo start.
