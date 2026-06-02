# Lot 1 — Socle Auth / Profile / Navigation stable

## Nouveaux fichiers
- src/theme/colors.js          → charte graphique centralisée (COLORS, SPACING, RADIUS)
- src/services/api.js          → instance Axios unique + injection du token + BASE_URL
- src/services/authService.js  → appels /api/auth/login & /register (contrat backend respecté)
- src/services/storage.js      → wrapper AsyncStorage (clés centralisées)

## Fichiers réécrits
- src/context/AuthContext.js   → ajoute isLoading (attendu par RootNavigator) + persistance
                                  du token (reste connecté) + login() réel + logout()
- src/context/ProfileContext.js→ clé unifiée `profil` (fr) + persistance + compteurs du jour
                                  (eau / kcal / pas) avec remise à zéro quotidienne
- src/screens/auth/WelcomeScreen.js → accueil épuré : « S'inscrire » / « Se connecter »
- src/screens/auth/LoginScreen.js   → connexion réelle au backend (états loading/erreur)
- api.js (racine)              → ré-exporte src/services/api.js (compat ChatScreen)

## Correctifs de bugs
1. AuthContext fournit enfin `isLoading` → le splash de RootNavigator fonctionne.
2. Conflit profile/profil résolu → IMC & besoins caloriques s'afficheront (clé `profil`).
3. Token persisté → plus de déconnexion au redémarrage de l'app.

## Dépendances ajoutées (package.json)
- @react-native-async-storage/async-storage  (persistance)
- react-native-svg                            (vraie jauge circulaire, lot suivant)

## À faire avant de lancer
1. Adapter l'IP du backend dans src/services/api.js (BASE_URL).
2. `npm install` puis `npx expo start`.

## OnboardingScreen
Toujours un placeholder (refonte = lot 2). Son bouton utilise désormais setSession()
pour rester cliquable sans casser, en attendant le vrai tunnel d'inscription.
