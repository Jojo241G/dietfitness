import * as Speech from 'expo-speech';

/**
 * Guidage vocal (expo-speech, compatible Expo Go).
 * Énonce les indications en français ; coupe toute parole en cours avant
 * d'enchaîner pour éviter les chevauchements.
 */
let actif = true;

export function setVoixActive(v) {
  actif = v;
  if (!v) Speech.stop();
}

export function parler(texte) {
  if (!actif || !texte) return;
  Speech.stop();
  Speech.speak(texte, { language: 'fr-FR', rate: 0.95, pitch: 1.0 });
}

export function stopVoix() {
  Speech.stop();
}
