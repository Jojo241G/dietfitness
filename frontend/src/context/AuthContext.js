import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginRequest } from '../services/authService';
import { setAuthToken } from '../services/api';
import { KEYS, saveItem, loadItem, removeItem } from '../services/storage';

export const AuthContext = createContext();

/**
 * Gère l'état d'authentification global.
 * - Persiste le token JWT dans AsyncStorage (reste connecté après redémarrage).
 * - Expose `isLoading` pendant l'hydratation au démarrage (attendu par RootNavigator).
 * - Injecte le token dans l'instance Axios pour toutes les requêtes protégées.
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // hydratation initiale

  // ── Hydratation au démarrage : on relit le token persisté ──
  useEffect(() => {
    (async () => {
      const stored = await loadItem(KEYS.TOKEN);
      if (stored) {
        setAuthToken(stored);
        setToken(stored);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    })();
  }, []);

  // ── Pose un token (utilisé après login/register réussi) ──
  const setSession = useCallback(async (jwt) => {
    setAuthToken(jwt);
    await saveItem(KEYS.TOKEN, jwt);
    setToken(jwt);
    setIsAuthenticated(true);
  }, []);

  // ── Connexion via le backend ──
  const login = useCallback(async (email, motDePasse) => {
    const res = await loginRequest(email, motDePasse);
    if (!res.ok) return res;            // { ok:false, message }
    await setSession(res.data.token);
    return { ok: true, data: res.data }; // l'écran peut récupérer le profil renvoyé
  }, [setSession]);

  // ── Déconnexion ──
  const logout = useCallback(async () => {
    setAuthToken(null);
    await removeItem(KEYS.TOKEN);
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, isLoading, login, logout, setSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}
