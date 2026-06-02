# Lot 8 — Amis (demande/acceptation), comparatif & défis

## Système d'amis avec acceptation (tout passe par TON backend)
Ton backend possédait DÉJÀ tout le nécessaire (FriendshipController + service) :
recherche par email, demande PENDING, accept/refuse, liste d'amis, notifications.
Il ne manquait que l'interface — la voici.

- Nouveau : src/services/friendsService.js
   Mappe : /api/social/search, /api/friends/request, /accept, /refuse,
   /api/friends/{id}, /api/friends/{id}/pending.
- Nouveau : src/screens/social/FriendsScreen.js — 3 onglets :
   • AMIS : on saisit l'email d'une personne → recherche → bouton « ajouter »
     qui envoie une demande. La personne n'est PAS amie tant qu'elle n'a pas
     accepté (statut NONE/PENDING/ACCEPTED géré et affiché).
     Liste des amis avec leur objectif (comparatif) + bouton « Défier ».
   • DEMANDES : demandes reçues, avec accepter ✓ / refuser ✗ (badge compteur).
   • DÉFIS : défis en cours avec barre de progression.

## Défis entre amis
- Nouveau : src/services/challengesService.js (persistant local).
   Types : Pas, Calories, Distance ; cibles prédéfinies.
   Création, suivi de progression, complétion auto, suppression.
   Vérifié en exécution : 10500/10000 pas → statut "termine".
- Le progrès « moi » se synchronise avec les compteurs du jour (pas, kcal brûlées)
   du ProfileContext via le bouton sync.

## Navigation
- L'onglet Communauté devient un stack : Feed (fil) + Amis.
- Bouton « Mes amis » dans l'en-tête du fil.

## ⚠️ Limite honnête : comparatif de performances
Le backend n'expose PAS encore les stats (pas/calories) des amis : /api/friends
et /api/social/search ne renvoient que prénom/nom/email/objectif. Le comparatif
se base donc aujourd'hui sur l'OBJECTIF partagé + les défis (dont TON progrès est
réel via tes compteurs). Pour un vrai classement chiffré ami par ami, il faudra
un endpoint backend exposant ces stats (ex: GET /api/friends/{userId}/stats) —
l'écran est déjà structuré pour les afficher dès qu'ils existeront.

## ⚠️ Aussi
Les défis sont stockés localement (le backend n'a pas d'endpoint défis). Conçu
pour bascule facile vers une API plus tard, sans toucher aux écrans.

## npm install
Aucune nouvelle dépendance. Si tu sautes des lots, lance npm install par sécurité.
