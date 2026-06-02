/**
 * Analyse des exercices : transforme le champ texte "duration" en séquence de
 * phases chronométrées exploitables par le lecteur d'entraînement, et estime
 * les calories brûlées.
 *
 * Formats gérés :
 *   - "45 secondes"            → 1 phase de 45 s
 *   - "30 secondes"            → 1 phase de 30 s
 *   - "4 séries x 12"          → 4 phases d'effort (durée estimée par rép) + repos
 *   - "3 séries x 1 min"       → 3 phases de 60 s + repos
 *   - "3 séries x 20 alternées"→ 4? non : 3 séries, ~1.5 s/rép
 */

const SECONDES_PAR_REP = 3;   // estimation durée d'une répétition
const REPOS_ENTRE_SERIES = 20; // secondes de repos
const MET_PAR_DIFFICULTE = { 'Facile': 5, 'Intermédiaire': 7, 'Difficile': 9 };

/**
 * Retourne { phases: [{ type:'effort'|'repos', label, secondes }], totalSecondes }.
 */
export function analyserDuree(duration, title = 'Exercice') {
  const txt = String(duration || '').toLowerCase();

  // Cas 1 : "<n> secondes" / "<n> sec" / "<n> s"
  const secSimple = txt.match(/(\d+)\s*(secondes?|sec|s)\b/);
  const estSeries = txt.includes('série') || txt.includes('serie') || txt.includes(' x ');

  if (secSimple && !estSeries) {
    const s = parseInt(secSimple[1], 10);
    return { phases: [{ type: 'effort', label: title, secondes: s }], totalSecondes: s };
  }

  // Cas 2 : "<séries> séries x <reps|durée>"
  const series = txt.match(/(\d+)\s*s[ée]ries?/);
  const nbSeries = series ? parseInt(series[1], 10) : 1;

  // durée par série : soit "x 1 min" / "x 30 s", soit "x 12" (reps)
  let dureeSerie;
  const minParSerie = txt.match(/x\s*(\d+)\s*min/);
  const secParSerie = txt.match(/x\s*(\d+)\s*(secondes?|sec|s)\b/);
  const repsParSerie = txt.match(/x\s*(\d+)/);

  if (minParSerie) dureeSerie = parseInt(minParSerie[1], 10) * 60;
  else if (secParSerie) dureeSerie = parseInt(secParSerie[1], 10);
  else if (repsParSerie) dureeSerie = parseInt(repsParSerie[1], 10) * SECONDES_PAR_REP;
  else dureeSerie = 40;

  const phases = [];
  for (let i = 1; i <= nbSeries; i++) {
    phases.push({ type: 'effort', label: `Série ${i}/${nbSeries}`, secondes: dureeSerie });
    if (i < nbSeries) phases.push({ type: 'repos', label: 'Repos', secondes: REPOS_ENTRE_SERIES });
  }
  const totalSecondes = phases.reduce((s, p) => s + p.secondes, 0);
  return { phases, totalSecondes };
}

/** Durée d'effort seule (hors repos), pour l'estimation calorique. */
export function secondesEffort(duration, title) {
  return analyserDuree(duration, title).phases
    .filter((p) => p.type === 'effort')
    .reduce((s, p) => s + p.secondes, 0);
}

/** Calories estimées pour un exercice selon difficulté, durée d'effort, poids. */
export function caloriesExercice(exercice, poidsKg = 70) {
  const met = MET_PAR_DIFFICULTE[exercice.difficulty] || 6;
  const heures = secondesEffort(exercice.duration, exercice.title) / 3600;
  return Math.max(1, Math.round(met * poidsKg * heures));
}
