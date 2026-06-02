# Lot 3 — Podomètre réel + Jauge SVG + Correctif ICÔNES

## ⚠️ Correctif majeur : les icônes
CAUSE : react-native-vector-icons n'est PAS auto-lié dans Expo Go → aucune icône.
SOLUTION : migration de TOUS les écrans vers @expo/vector-icons (fourni avec Expo,
zéro configuration, même jeu MaterialIcons). C'est pourquoi tu ne voyais rien.
→ Les icônes s'afficheront désormais partout (onglets, onboarding, login, home…).

## Nouveaux fichiers
- src/hooks/usePedometer.js
   Hook podomètre temps réel (Expo Pedometer / expo-sensors) :
   • isAvailableAsync → détecte le capteur
   • requestPermissionsAsync → permission ACTIVITY_RECOGNITION / Motion
   • getStepCountAsync → total depuis minuit (iOS)
   • watchStepCount → incrément live à chaque pas
   • Retour : { pas, disponible, permission, erreur } + callback de persistance
- src/components/ProgressRing.js
   VRAIE jauge circulaire en react-native-svg (remplace le faux anneau en <View>).
   Arc proportionnel exact via strokeDasharray/strokeDashoffset, contenu central libre.

## Modifs
- src/screens/home/HomeScreen.js
   • Supprime l'ancien faux ProgressRing.
   • Branche usePedometer → les pas sont réels et re-persistés dans ProfileContext.
   • Utilise le nouveau ProgressRing SVG (icône marche au centre).
   • Affiche un message si capteur indisponible / permission refusée.
- Les 7 écrans : import d'icônes migré vers @expo/vector-icons.
- app.json : message de permission mouvement pour expo-sensors.

## package.json
  + @expo/vector-icons        (icônes Expo)
  + expo-haptics              (vibration légère, usages à venir)
  - react-native-vector-icons (retiré : source du bug d'icônes)

## ⚠️ npm install REQUIS cette fois
Ce lot ajoute @expo/vector-icons et expo-haptics et retire vector-icons.
→ Dans le dossier frontend : `npm install` puis `npx expo start`.

## Test podomètre
Le capteur de pas ne fonctionne PAS sur simulateur/émulateur ni dans un navigateur :
teste sur un VRAI téléphone via Expo Go (secoue/marche avec le téléphone).
