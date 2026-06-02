import React, { createContext, useState, useEffect, useCallback } from 'react';
import { KEYS, saveItem, loadItem } from '../services/storage';

export const ProfileContext = createContext();

/**
 * Profil utilisateur + compteurs du jour (eau, calories consommées, pas).
 *
 * IMPORTANT : la clé exposée est `profil` (français) — les écrans (HomeScreen…)
 * lisent `const { profil } = useContext(ProfileContext)`. Ne pas renommer en
 * `profile` sous peine de casser les calculs IMC / besoins caloriques.
 */

const PROFIL_VIDE = {
  userId        : null,        // identifiant backend (indispensable pour les amis)
  prenom        : '',
  nom           : '',
  email         : '',
  sexe          : null,        // 'Homme' | 'Femme'
  age           : null,
  poids         : null,        // kg
  taille        : null,        // cm
  objectif      : null,        // 'Perte de poids' | 'Prise de masse' | 'Maintien de forme'
  niveauActivite: null,        // 'Sédentaire' | 'Peu actif' | 'Actif' | 'Très actif'
  conditions    : [],          // ex: ['hypertension']
  allergies     : [],          // ex: ['arachides']
  caloriesObjectif: null,      // calculé à l'onboarding
};

function aujourdhui() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

const JOUR_VIDE = () => ({
  date          : aujourdhui(),
  eauConsommee  : 0,    // litres
  kcalConsommees: 0,    // kcal
  kcalBrulees   : 0,    // kcal
  pas           : 0,
});

export function ProfileProvider({ children }) {
  const [profil, setProfil] = useState(PROFIL_VIDE);
  const [jour, setJour]     = useState(JOUR_VIDE());
  const [hydrate, setHydrate] = useState(false);

  // ── Hydratation au démarrage ──
  useEffect(() => {
    (async () => {
      const stored = await loadItem(KEYS.PROFIL, { parse: true });
      if (stored?.profil) setProfil({ ...PROFIL_VIDE, ...stored.profil });
      // Les compteurs du jour ne survivent qu'à la journée en cours.
      if (stored?.jour && stored.jour.date === aujourdhui()) {
        setJour(stored.jour);
      }
      setHydrate(true);
    })();
  }, []);

  // ── Persistance automatique dès qu'une valeur change ──
  useEffect(() => {
    if (hydrate) saveItem(KEYS.PROFIL, { profil, jour });
  }, [profil, jour, hydrate]);

  // ── Mise à jour partielle du profil ──
  const updateProfil = useCallback((data) => {
    setProfil((prev) => ({ ...prev, ...data }));
  }, []);

  const resetProfil = useCallback(() => {
    setProfil(PROFIL_VIDE);
    setJour(JOUR_VIDE());
  }, []);

  // ── Compteurs du jour (widgets Home temps réel) ──
  const ajouterEau = useCallback((litres) => {
    setJour((j) => ({ ...j, eauConsommee: Math.max(0, +(j.eauConsommee + litres).toFixed(2)) }));
  }, []);

  const ajouterCalories = useCallback((kcal) => {
    setJour((j) => ({ ...j, kcalConsommees: Math.max(0, j.kcalConsommees + kcal) }));
  }, []);

  const ajouterCaloriesBrulees = useCallback((kcal) => {
    setJour((j) => ({ ...j, kcalBrulees: Math.max(0, j.kcalBrulees + kcal) }));
  }, []);

  const setPas = useCallback((pas) => {
    setJour((j) => ({ ...j, pas }));
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profil, jour,
        updateProfil, resetProfil,
        ajouterEau, ajouterCalories, ajouterCaloriesBrulees, setPas,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
