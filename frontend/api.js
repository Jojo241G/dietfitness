/**
 * Compatibilité : ce fichier racine ré-exporte le service centralisé
 * pour ne pas casser les anciens imports (ex: ChatScreen importe BASE_URL ici).
 * La VRAIE configuration vit désormais dans src/services/api.js.
 */
export { default, BASE_URL, setAuthToken } from './src/services/api';
