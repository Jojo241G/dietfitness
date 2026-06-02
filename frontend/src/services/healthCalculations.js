/**
 * Moteur de calcul santé — source unique de vérité.
 * Utilisé par l'Onboarding (au moment du calcul du profil) ET par le HomeScreen
 * (affichage). Ne PAS dupliquer ces formules ailleurs.
 *
 * Références :
 *  - IMC = poids(kg) / taille(m)²   (OMS)
 *  - Métabolisme de base : équation de Mifflin-St Jeor (1990)
 *  - TDEE = MB × facteur d'activité
 */

// ── Facteurs d'activité (Mifflin-St Jeor) ──
export const FACTEURS_ACTIVITE = {
  'Sédentaire': 1.2,    // peu ou pas d'exercice
  'Peu actif' : 1.375,  // exercice léger 1-3 j/sem
  'Actif'     : 1.55,   // exercice modéré 3-5 j/sem
  'Très actif': 1.725,  // exercice intense 6-7 j/sem
};

// ── Ajustement calorique selon l'objectif ──
const AJUSTEMENT_OBJECTIF = {
  'Perte de poids'   : -400,  // déficit
  'Prise de masse'   : +300,  // surplus
  'Maintien de forme': 0,
};

/** IMC arrondi à une décimale. Retourne null si données manquantes. */
export function calculerIMC(poids, taille) {
  if (!poids || !taille) return null;
  const m = taille / 100;
  return Math.round((poids / (m * m)) * 10) / 10;
}

/** Catégorie OMS correspondant à l'IMC. */
export function categorieIMC(imc) {
  if (imc == null) return '—';
  if (imc < 18.5) return 'Insuffisance pondérale';
  if (imc < 25)   return 'Poids normal';
  if (imc < 30)   return 'Surpoids';
  if (imc < 35)   return 'Obésité modérée';
  return            'Obésité sévère';
}

/** Métabolisme de base (kcal/jour) — Mifflin-St Jeor. */
export function calculerMetabolismeBase({ sexe, poids, taille, age }) {
  if (!poids || !taille || !age) return null;
  const base = 10 * poids + 6.25 * taille - 5 * age;
  return Math.round(sexe === 'Femme' ? base - 161 : base + 5);
}

/** Dépense énergétique totale (TDEE) = MB × facteur d'activité. */
export function calculerTDEE(profil) {
  const mb = calculerMetabolismeBase(profil);
  if (mb == null) return null;
  const facteur = FACTEURS_ACTIVITE[profil?.niveauActivite] ?? 1.375;
  return Math.round(mb * facteur);
}

/**
 * Objectif calorique journalier = TDEE + ajustement selon l'objectif.
 * C'est la valeur affichée comme « Besoins caloriques » et utilisée pour
 * la jauge « calories restantes » du Home.
 */
export function calculerCaloriesObjectif(profil) {
  const tdee = calculerTDEE(profil);
  if (tdee == null) return null;
  const ajust = AJUSTEMENT_OBJECTIF[profil?.objectif] ?? 0;
  return Math.max(1200, Math.round(tdee + ajust)); // plancher de sécurité
}

/** Répartition indicative des macros (g/jour) à partir des calories objectif. */
export function repartitionMacros(caloriesObjectif, objectif) {
  if (!caloriesObjectif) return null;
  // Ratios protéines / glucides / lipides selon l'objectif
  let pP = 0.30, pG = 0.40, pL = 0.30;
  if (objectif === 'Prise de masse')   { pP = 0.30; pG = 0.50; pL = 0.20; }
  if (objectif === 'Perte de poids')   { pP = 0.35; pG = 0.35; pL = 0.30; }
  return {
    proteines: Math.round((caloriesObjectif * pP) / 4), // 4 kcal/g
    glucides : Math.round((caloriesObjectif * pG) / 4), // 4 kcal/g
    lipides  : Math.round((caloriesObjectif * pL) / 9), // 9 kcal/g
  };
}
