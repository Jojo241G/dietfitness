import api from './api';
import localData from '../screens/nutrition/donnees_nutrition.json';
import { normaliser } from './allergenEngine';

/**
 * Service NUTRITION HYBRIDE (offline-first).
 *
 * Stratégie :
 *  1. Les 30 plats locaux (donnees_nutrition.json) sont TOUJOURS disponibles,
 *     même sans connexion → l'app reste fluide hors-ligne.
 *  2. Si l'utilisateur cherche un plat absent du local ET qu'il y a du réseau,
 *     on interroge le backend Spring Boot (GET /api/plats) pour récupérer des
 *     plats supplémentaires que le serveur peut servir (base évolutive).
 *  3. Les plats récupérés du backend sont mis en CACHE mémoire pour la session.
 *
 * ⚠️ Sécurité : AUCUNE clé API (Gemini ou autre) n'est embarquée dans l'app.
 *    Si un plat doit être généré via IA, c'est le BACKEND qui appelle Gemini
 *    (clé protégée côté serveur). Le frontend ne parle qu'à notre propre API.
 */

// Plats locaux (référence immuable)
export const PLATS_LOCAUX = localData.plats;

// Cache mémoire des plats venus du backend (vidé au redémarrage)
let cacheDistant = [];

/** Recherche locale par nom (insensible casse/accents). */
export function rechercherLocal(query) {
  const q = normaliser(query);
  if (!q) return PLATS_LOCAUX;
  return PLATS_LOCAUX.filter((p) => normaliser(p.nom).includes(q));
}

/** Tous les plats connus à l'instant T (local + cache distant). */
export function tousLesPlats() {
  return [...PLATS_LOCAUX, ...cacheDistant];
}

/**
 * Recherche hybride : si rien en local et réseau dispo, tente le backend.
 * Retour : { plats: [...], source: 'local'|'backend'|'local-offline', message? }
 */
export async function rechercherHybride(query) {
  const locaux = rechercherLocal(query);
  if (locaux.length > 0) {
    return { plats: locaux, source: 'local' };
  }

  // Rien en local → tentative backend (timeout court hérité d'axios)
  try {
    const { data } = await api.get('/plats');
    // Le backend renvoie une liste de Plat ; on mappe vers notre forme d'affichage.
    const distants = Array.isArray(data) ? data.map(adapterPlatBackend) : [];
    // Filtre sur la requête + mémorise dans le cache
    const q = normaliser(query);
    const trouves = distants.filter((p) => normaliser(p.nom).includes(q));
    fusionnerCache(trouves);
    if (trouves.length > 0) {
      return { plats: trouves, source: 'backend' };
    }
    return { plats: [], source: 'backend', message: 'Aucun plat trouvé, même en ligne.' };
  } catch (e) {
    // Hors-ligne ou backend injoignable → on reste sur le local (vide ici)
    return {
      plats: [],
      source: 'local-offline',
      message: "Hors-ligne : recherche limitée aux 30 plats locaux.",
    };
  }
}

/** Adapte un Plat backend (modèle Java) vers la forme d'affichage front. */
function adapterPlatBackend(p) {
  return {
    id: `srv_${p.id}`,
    nom: p.nom,
    origine: p.origine || 'Backend',
    moment: p.moment || p.categorie || 'Déjeuner',
    calories: p.calories ?? 0,
    macros: {
      proteines: `${p.proteines ?? '?'}g`,
      glucides: `${p.glucides ?? '?'}g`,
      lipides: `${p.lipides ?? '?'}g`,
    },
    allergene: Array.isArray(p.allergenes) ? p.allergenes.join(',') : (p.allergene || 'aucun'),
    contre_indications: p.contrindications || p.contre_indications || [],
    image: p.image && p.image.startsWith('http') ? p.image : null,
    portion_standard: p.portion_standard || '1 portion',
    description: p.description || '',
    conseil_coach: p.conseil_coach || '',
    recette_explicite: p.recette_explicite || 'Recette non disponible pour ce plat.',
  };
}

function fusionnerCache(nouveaux) {
  const idsConnus = new Set(cacheDistant.map((p) => p.id));
  nouveaux.forEach((p) => { if (!idsConnus.has(p.id)) cacheDistant.push(p); });
}

export function viderCacheDistant() {
  cacheDistant = [];
}
