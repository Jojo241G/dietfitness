import axios from 'axios';

/**
 * Adresse de base du backend. Source de vérité unique de l'app.
 * ⚠️ Adapte l'IP à celle de TA machine (ipconfig/ifconfig).
 * Émulateur Android : 10.0.2.2 = localhost de l'hôte.
 */
export const BASE_URL = 'http://192.168.159.225:8080';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Le token est injecté ici par AuthContext au démarrage et au login.
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default api;
