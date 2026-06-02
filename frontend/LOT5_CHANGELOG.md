# Lot 5 — Allergènes stricts + PDF + Hybride + Planning 7 jours

## 1. Moteur d'allergènes STRICT (bug Ndolè / Eru résolu)
- Nouveau : src/services/allergenEngine.js
  normaliser() : minuscules + suppression accents (é/è/ê→e) + trim +
  pluriel naïf (s final retiré). « Crevettes » matche « crevette ».
  evaluerRisquePlat(plat, profil) + platSansRisque(plat, profil).
- Vérifié en exécution réelle :
  • Ndolè + allergie « Crevettes » → ALERTE ✅
  • Eru + « Hypertension » → ALERTE ✅
  • « arachide » (sing.) matche « arachides » (plur.) ✅
- NutritionScreen et PlanningScreen utilisent ce moteur partagé.

## 2. Export PDF (expo-print + expo-sharing, 100% Expo Go)
- Nouveau : src/services/pdfService.js
  • exporterRecettePDF(plat)  → PDF stylé d'une recette
  • exporterPlanningPDF(plan) → PDF tableau de la semaine
- Bouton PDF sur chaque carte plat (icône) + bouton PDF dans le Planning.

## 3. Base hybride (offline-first, SANS clé exposée)
- Nouveau : src/services/foodService.js
  • Les 30 plats locaux marchent toujours, même hors-ligne.
  • Si recherche introuvable en local + réseau OK → GET /api/plats (backend).
  • Cache mémoire des plats distants pour la session.
- ⚠️ DÉCISION DE SÉCURITÉ : la requête passe par TON backend Spring Boot
  (qui détient déjà la clé Gemini côté serveur via GeminiService), JAMAIS
  par une clé Gemini embarquée dans l'app. Une clé dans un bundle mobile est
  extractible par n'importe qui → facturation/abus sur ton compte.
  Pour activer la génération IA d'un plat inconnu : ajoute un endpoint backend
  (ex: GET /api/plats/generer?nom=...) qui appelle GeminiService ; le front y
  est déjà préparé (il suffira d'ajuster l'URL dans foodService).

## 4. Algorithme de planning 7 jours
- Nouveau : src/services/planningService.js + src/screens/nutrition/PlanningScreen.js
  • 7 jours × 3 repas, répartition 25% / 40% / 35% de l'objectif calorique.
  • Exclut STRICTEMENT les plats à risque (moteur d'allergènes).
  • Rotation pour varier les plats sur la semaine.
  • Vérifié : 0 plat à risque dans un plan pour profil allergique crevettes + hypertension.
- Accès : onglet Nutrition → bouton « Planning 7 j » (nouvelle sous-navigation stack).
- Régénération + export PDF depuis l'écran.

## Navigation
- RootNavigator : l'onglet Nutrition devient un petit stack
  (NutritionListe + Planning) pour permettre la navigation interne.

## ⚠️ npm install REQUIS
Ajout de expo-print et expo-sharing.
→ Dans frontend/ : npm install puis npx expo start.

## Limite connue (honnête)
Les totaux journaliers du plan peuvent rester sous l'objectif (plats locaux
petit-déj/dîner peu caloriques). Pistes lot suivant : viser le total du jour
plutôt que chaque repas, ou autoriser portions multiples.
