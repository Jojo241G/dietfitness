import { KEYS, loadItem, saveItem } from './storage';

/**
 * Défis entre amis — stockés localement (AsyncStorage) car le backend n'expose
 * pas encore d'endpoint dédié. Conçu pour être remplacé par des appels API
 * (POST /api/challenges …) le jour où le backend les fournira : il suffira de
 * réimplémenter ces fonctions sans toucher aux écrans.
 *
 * Forme d'un défi :
 * {
 *   id, amiId, amiPrenom, type ('pas'|'calories'|'distance'),
 *   cible (nombre), unite, dateCreation, dateFin, statut ('en_cours'|'termine'),
 *   progresMoi (nombre)   // mis à jour manuellement ou via les compteurs du jour
 * }
 */

export const TYPES_DEFI = [
  { cle: 'pas',      label: 'Pas',       unite: 'pas',  icone: 'directions-walk', valeurs: [5000, 8000, 10000, 15000] },
  { cle: 'calories', label: 'Calories',  unite: 'kcal', icone: 'local-fire-department', valeurs: [200, 400, 600, 1000] },
  { cle: 'distance', label: 'Distance',  unite: 'm',    icone: 'route', valeurs: [2000, 5000, 8000, 10000] },
];

async function lireTous() {
  const data = await loadItem(KEYS.DEFIS, { parse: true });
  return Array.isArray(data) ? data : [];
}

export async function listerDefis() {
  return lireTous();
}

export async function creerDefi(defi) {
  const tous = await lireTous();
  const nouveau = {
    id: `defi_${Date.now()}`,
    statut: 'en_cours',
    progresMoi: 0,
    dateCreation: new Date().toISOString(),
    ...defi,
  };
  tous.unshift(nouveau);
  await saveItem(KEYS.DEFIS, tous);
  return nouveau;
}

export async function majProgres(defiId, progresMoi) {
  const tous = await lireTous();
  const maj = tous.map((d) => {
    if (d.id !== defiId) return d;
    const statut = progresMoi >= d.cible ? 'termine' : d.statut;
    return { ...d, progresMoi, statut };
  });
  await saveItem(KEYS.DEFIS, maj);
  return maj;
}

export async function supprimerDefi(defiId) {
  const tous = await lireTous();
  const reste = tous.filter((d) => d.id !== defiId);
  await saveItem(KEYS.DEFIS, reste);
  return reste;
}
