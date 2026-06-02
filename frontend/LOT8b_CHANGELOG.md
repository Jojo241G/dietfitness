# Lot 8b — Correctif « serveur injoignable » à l'ajout d'ami

## Vraie cause (ce n'était PAS le backend)
Le backend d'amis est complet et fonctionnel. Le bug était côté frontend :
l'identifiant `userId` renvoyé par le backend à la connexion/inscription
n'était JAMAIS sauvegardé dans le profil. Du coup :
- moiId valait toujours 1 (fallback),
- les requêtes partaient avec un senderId faux et/ou un receiverId/currentUserId
  incohérent → erreurs masquées par un message vague "serveur injoignable".

## Corrections
- ProfileContext : ajout du champ userId dans le profil.
- LoginScreen : sauvegarde d.userId à la connexion.
- OnboardingScreen : sauvegarde res.data.userId à l'inscription.
- FriendsScreen : si userId absent, message clair « Reconnecte-toi » au lieu
  d'appeler le backend avec un id bidon. Plus de fallback silencieux à 1.

## ⚠️ ACTION REQUISE DE TON CÔTÉ
Ta session actuelle a été créée AVANT ce correctif : ton profil stocké n'a pas
de userId. Donc :
  → Va dans Profil → Se déconnecter, puis reconnecte-toi (ou réinscris-toi).
Après reconnexion, le userId sera présent et l'ajout d'ami fonctionnera.

(Pour tester l'ajout d'ami il faut évidemment AU MOINS deux comptes différents
dans ta base : crée un 2e compte avec un autre email pour t'envoyer une demande.)

## npm install
Aucune nouvelle dépendance.
