import api from './api';

/**
 * Service Espace Social — appels au backend (com.dietfitness.controller.SocialController).
 *   GET  /api/posts[?categorie=]   → liste triée par date desc
 *   POST /api/posts                → { userId, auteurPrenom, categorie, contenu }
 *   POST /api/posts/{id}/like      → { liked: boolean }
 *
 * Le backend ne pagine pas : on récupère la liste puis on pagine côté client
 * pour un défilement fluide (chargement progressif par tranches).
 */

export const CATEGORIES = ['General', 'Recettes', 'Motivation'];

export async function chargerPosts(categorie) {
  try {
    const params = categorie && categorie !== 'Tous' ? { categorie } : {};
    const { data } = await api.get('/posts', { params });
    return { ok: true, posts: Array.isArray(data) ? data : [] };
  } catch (e) {
    return { ok: false, posts: [], message: "Connexion au fil impossible (hors-ligne ?)." };
  }
}

export async function publierPost({ userId, auteurPrenom, categorie, contenu }) {
  try {
    const { data } = await api.post('/posts', { userId, auteurPrenom, categorie, contenu });
    return { ok: true, post: data };
  } catch (e) {
    const msg = e?.response?.data || "Publication impossible pour le moment.";
    return { ok: false, message: typeof msg === 'string' ? msg : 'Erreur de publication.' };
  }
}

export async function basculerLike(postId, liked) {
  try {
    const { data } = await api.post(`/posts/${postId}/like`, { liked });
    return { ok: true, post: data };
  } catch (e) {
    return { ok: false };
  }
}
