# Lot 6 — Module Parcours / GPS (course & marche) + guidage vocal

## Approche : GPS réel + repli podomètre + voix
GPS premier plan (expo-location) pour la distance réelle ; si le GPS est
refusé/indispo, le podomètre prend le relais (pas × foulée). Guidage vocal
des indications via expo-speech (français).

## Nouveaux fichiers
- src/services/geoUtils.js
   Haversine (distance GPS), distance totale d'un tracé, allure min/km,
   estimation calories (MET selon vitesse), formatage durée/distance.
   → Vérifié en exécution : 0.001° lat = 111 m (exact), allure 6:00, etc.
- src/hooks/useRunTracker.js
   Suivi de séance : GPS watchPositionAsync (filtre bruit <1,5 m et sauts >50 m),
   chrono 1 s, repli podomètre automatique. Actions demarrer/arreter/reset.
- src/services/voiceGuide.js
   parler()/stopVoix()/setVoixActive() autour d'expo-speech (fr-FR).
- src/screens/fitness/parcoursData.js
   3 parcours guidés (2 km débutant, 5 km intermédiaire, 8 km avancé) avec
   indications déclenchées par paliers de distance.
- src/screens/fitness/ParcoursScreen.js
   Choix du parcours → séance live : grande distance, durée, allure, calories,
   barre de progression vers la cible, badge source (GPS/podomètre), indication
   courante (texte + voix), bouton voix on/off, démarrer/terminer.
   À la fin : calories brûlées ajoutées au ProfileContext (résumé Home).

## Navigation
- RootNavigator : l'onglet Fitness devient un stack (FitnessAccueil + Parcours).
- FitnessScreen : bouton « Parcours course / marche (GPS) » dans l'en-tête.
  (Correctif au passage : imports TouchableOpacity + MaterialIcons ajoutés.)

## Permissions (app.json)
+ ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION
+ plugin expo-location avec message de permission FR.

## ⚠️ Limites Expo Go (important)
- Le suivi GPS ne fonctionne QU'EN PREMIER PLAN sur Expo Go : si l'écran se
  verrouille ou l'app passe en fond, le tracé se met en pause. Le suivi en
  arrière-plan nécessite un build de développement (expo-dev-client / EAS).
- Comme pour le podomètre, la permission de localisation déclarée dans app.json
  n'apparaît dans les réglages système qu'en build dev, pas dans Expo Go
  (mais le pop-up de permission au démarrage de la séance, lui, fonctionne).

## ⚠️ npm install REQUIS
Ajout de expo-location et expo-speech.
→ frontend/ : npm install puis npx expo start. Teste sur un VRAI téléphone,
  en extérieur, app ouverte à l'écran.
