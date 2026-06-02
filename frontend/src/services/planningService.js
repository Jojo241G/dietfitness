import { PLATS_LOCAUX } from './foodService';
import { platSansRisque } from './allergenEngine';
import { calculerCaloriesObjectif } from './healthCalculations';

/**
 * Algorithme de planning nutritionnel 7 jours — 100% local, sans IA externe.
 *
 * Règles :
 *  - Respecte profil.caloriesObjectif (ou calcul via moteur santé).
 *  - Exclut STRICTEMENT les plats à risque (moteur d'allergènes strict).
 *  - Répartit l'objectif : petit-déjeuner 25%, déjeuner 40%, dîner 35%.
 *  - Pour chaque repas, choisit le plat du bon « moment » dont les calories
 *    sont les plus proches de la cible du repas, en évitant les répétitions
 *    immédiates (rotation) pour varier la semaine.
 */

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const REPAS = [
  { cle: 'Petit-déjeuner', part: 0.25, momentsAcceptes: ['Petit-déjeuner'] },
  { cle: 'Déjeuner',       part: 0.40, momentsAcceptes: ['Déjeuner'] },
  { cle: 'Dîner',          part: 0.35, momentsAcceptes: ['Dîner', 'Déjeuner'] }, // fallback déjeuner si peu de dîners
];

function caloriesNum(plat) {
  return typeof plat.calories === 'number' ? plat.calories : parseInt(plat.calories, 10) || 0;
}

/** Choisit le plat le plus proche de la cible, en pénalisant les récents. */
function choisirPlat(candidats, cible, recents) {
  if (candidats.length === 0) return null;
  let meilleur = null;
  let meilleurScore = Infinity;
  for (const plat of candidats) {
    const ecart = Math.abs(caloriesNum(plat) - cible);
    const penalite = recents.includes(plat.id) ? 400 : 0; // évite répétition
    const score = ecart + penalite;
    if (score < meilleurScore) { meilleurScore = score; meilleur = plat; }
  }
  return meilleur;
}

/**
 * Génère le planning.
 * @returns { objectif, jours: [{ jour, repas: [{ type, plat, cible }], total }] }
 */
export function genererPlanning(profil) {
  const objectif = profil?.caloriesObjectif || calculerCaloriesObjectif(profil) || 2000;

  // Base sûre = plats locaux sans risque pour ce profil
  const platsSurs = PLATS_LOCAUX.filter((p) => platSansRisque(p, profil));

  // Pré-trie par moment
  const parMoment = {};
  for (const r of REPAS) {
    parMoment[r.cle] = platsSurs.filter((p) => r.momentsAcceptes.includes(p.moment));
  }

  const recents = []; // ids récemment utilisés (fenêtre glissante)
  const jours = [];

  for (const nomJour of JOURS) {
    const repas = [];
    let total = 0;

    for (const r of REPAS) {
      const cible = Math.round(objectif * r.part);
      const candidats = parMoment[r.cle].length > 0 ? parMoment[r.cle] : platsSurs;
      const plat = choisirPlat(candidats, cible, recents);

      if (plat) {
        repas.push({ type: r.cle, plat, cible });
        total += caloriesNum(plat);
        recents.push(plat.id);
        if (recents.length > 5) recents.shift(); // fenêtre de 5
      } else {
        repas.push({ type: r.cle, plat: null, cible });
      }
    }

    jours.push({ jour: nomJour, repas, total });
  }

  return { objectif, jours, nbPlatsSurs: platsSurs.length };
}
