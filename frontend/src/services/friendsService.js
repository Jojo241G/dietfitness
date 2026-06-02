import api from './api';

/**
 * Service Amis & demandes — mappe com.dietfitness.controller.FriendshipController.
 *
 *   GET  /api/social/search?email=&currentUserId=  → trouver un user par email
 *   POST /api/friends/request   { senderId, receiverId }
 *   POST /api/friends/{id}/accept { userId }
 *   POST /api/friends/{id}/refuse { userId }
 *   GET  /api/friends/{userId}            → liste d'amis [{friendshipId,userId,prenom,nom,email,objectif}]
 *   GET  /api/friends/{userId}/pending    → demandes reçues [{friendshipId,senderId,prenom,...,dateDemande}]
 *   GET  /api/friends/status?userId1=&userId2=  → { statut }
 */

function msgErreur(e, fallback) {
  const d = e?.response?.data;
  if (d?.erreur) return d.erreur;
  if (e?.message === 'Network Error') return 'Serveur injoignable (hors-ligne ?).';
  return fallback;
}

export async function rechercherParEmail(email, currentUserId) {
  try {
    const { data } = await api.get('/social/search', { params: { email, currentUserId } });
    return { ok: true, user: data };
  } catch (e) {
    const status = e?.response?.status;
    if (status === 404) return { ok: false, introuvable: true, message: 'Aucun utilisateur avec cet email.' };
    return { ok: false, message: msgErreur(e, 'Recherche impossible.') };
  }
}

export async function envoyerDemande(senderId, receiverId) {
  try {
    const { data } = await api.post('/friends/request', { senderId, receiverId });
    return { ok: true, friendship: data };
  } catch (e) {
    return { ok: false, message: msgErreur(e, "Envoi de la demande impossible.") };
  }
}

export async function accepterDemande(friendshipId, userId) {
  try {
    const { data } = await api.post(`/friends/${friendshipId}/accept`, { userId });
    return { ok: true, friendship: data };
  } catch (e) {
    return { ok: false, message: msgErreur(e, "Impossible d'accepter la demande.") };
  }
}

export async function refuserDemande(friendshipId, userId) {
  try {
    const { data } = await api.post(`/friends/${friendshipId}/refuse`, { userId });
    return { ok: true, friendship: data };
  } catch (e) {
    return { ok: false, message: msgErreur(e, "Impossible de refuser la demande.") };
  }
}

export async function listerAmis(userId) {
  try {
    const { data } = await api.get(`/friends/${userId}`);
    return { ok: true, amis: Array.isArray(data) ? data : [] };
  } catch (e) {
    return { ok: false, amis: [], message: msgErreur(e, 'Chargement des amis impossible.') };
  }
}

export async function listerDemandes(userId) {
  try {
    const { data } = await api.get(`/friends/${userId}/pending`);
    return { ok: true, demandes: Array.isArray(data) ? data : [] };
  } catch (e) {
    return { ok: false, demandes: [], message: msgErreur(e, 'Chargement des demandes impossible.') };
  }
}
