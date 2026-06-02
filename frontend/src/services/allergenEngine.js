/**
 * Moteur d'analyse strict des allergènes et contre-indications.
 *
 * Problème résolu (bug Ndolè / Eru) : les libellés ne correspondaient pas
 * (casse, accents, pluriels). Ex : profil = "Crevettes" vs plat = "crevette".
 *
 * normaliser() applique :
 *   - minuscules
 *   - suppression des accents (é/è/ê/ë → e, à/â → a, etc.)
 *   - trim + espaces multiples réduits
 *   - suppression du « s » final (pluriel naïf) → crevettes ⇒ crevette
 */

export function normaliser(valeur) {
  return String(valeur || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les diacritiques
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/s$/, '');              // pluriel naïf
}

/** Normalise une liste (tableau OU chaîne séparée par virgules). */
export function normaliserListe(entree) {
  if (!entree) return [];
  const arr = Array.isArray(entree) ? entree : String(entree).split(',');
  return arr.map(normaliser).filter(Boolean);
}

/**
 * Évalue si un plat est déconseillé pour un profil donné.
 * Champs plat attendus : { allergene (string|array), contre_indications (array) }
 * Champs profil : { allergies (array), conditions (array) }
 *
 * Retour : { risque:boolean, motif:string|null, type:'allergie'|'condition'|null }
 */
export function evaluerRisquePlat(plat, profil) {
  const allergiesProfil  = normaliserListe(profil?.allergies);
  const conditionsProfil = normaliserListe(profil?.conditions);

  // Allergènes du plat (gère string unique "crevettes" ou tableau)
  const allergenesPlat = normaliserListe(plat?.allergene)
    .filter((a) => a && a !== 'aucun');

  const ciPlat = normaliserListe(plat?.contre_indications);

  // Correspondance allergène
  const allergeneTrouve = allergenesPlat.find((a) => allergiesProfil.includes(a));
  if (allergeneTrouve) {
    return { risque: true, type: 'allergie', motif: `Allergène : ${allergeneTrouve}` };
  }

  // Correspondance condition médicale
  const conditionTrouvee = ciPlat.find((c) => conditionsProfil.includes(c));
  if (conditionTrouvee) {
    return { risque: true, type: 'condition', motif: `Déconseillé (${conditionTrouvee})` };
  }

  return { risque: false, type: null, motif: null };
}

/** Vrai si le plat est SÛR pour le profil (utilisé par le planning). */
export function platSansRisque(plat, profil) {
  return !evaluerRisquePlat(plat, profil).risque;
}
