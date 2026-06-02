/**
 * Utilitaires géographiques pour le module Parcours (purs, sans dépendance RN).
 */

/** Distance Haversine entre deux points GPS, en mètres. */
export function distanceMetres(a, b) {
  if (!a || !b) return 0;
  const R = 6371000; // rayon terrestre (m)
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Somme des distances d'un tracé (liste de points). */
export function distanceTotale(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distanceMetres(points[i - 1], points[i]);
  return total;
}

/** Allure min/km à partir de distance (m) et durée (s). Renvoie 'mm:ss' ou '--:--'. */
export function allureMinKm(metres, secondes) {
  if (!metres || metres < 1 || !secondes) return '--:--';
  const secParKm = secondes / (metres / 1000);
  const min = Math.floor(secParKm / 60);
  const sec = Math.round(secParKm % 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

/** Estimation des calories brûlées (MET marche/course ≈ selon allure). */
export function caloriesCourse(metres, secondes, poidsKg = 70) {
  if (!metres || !secondes) return 0;
  const vitesseKmh = (metres / 1000) / (secondes / 3600);
  // MET approximatif : marche ~3.5, jogging ~7, course ~9.8
  const met = vitesseKmh < 5 ? 3.5 : vitesseKmh < 8 ? 7 : 9.8;
  const heures = secondes / 3600;
  return Math.round(met * poidsKg * heures);
}

/** Formate une durée en secondes → 'HH:MM:SS' ou 'MM:SS'. */
export function formaterDuree(secondes) {
  const s = Math.max(0, Math.floor(secondes));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Distance lisible : '850 m' ou '2.34 km'. */
export function formaterDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(2)} km`;
}
