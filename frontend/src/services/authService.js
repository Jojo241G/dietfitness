import api from './api';

/**
 * Service d'authentification — encapsule les appels au backend Spring Boot.
 *
 * Contrat backend (com.dietfitness.controller.AuthController) :
 *   POST /api/auth/login    body { email, motDePasse }
 *   POST /api/auth/register body { prenom, nom, email, motDePasse, poids, taille, objectif }
 *   Réponse succès (AuthResponse) :
 *     { token, userId, prenom, email, objectif, poids, taille, caloriesObjectif }
 *   Réponse erreur : { erreur: "message" } (status 400/401/500)
 */

function extraireMessageErreur(error, fallback) {
  const data = error?.response?.data;
  if (data?.erreur) return data.erreur;
  if (error?.code === 'ECONNABORTED') return 'Le serveur ne répond pas (timeout).';
  if (error?.message === 'Network Error') {
    return "Impossible de joindre le serveur. Vérifie l'adresse IP et que le backend tourne.";
  }
  return fallback;
}

export async function loginRequest(email, motDePasse) {
  try {
    const { data } = await api.post('/auth/login', { email, motDePasse });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: extraireMessageErreur(error, 'Échec de la connexion.') };
  }
}

export async function registerRequest(payload) {
  try {
    const { data } = await api.post('/auth/register', payload);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: extraireMessageErreur(error, "Échec de l'inscription.") };
  }
}
