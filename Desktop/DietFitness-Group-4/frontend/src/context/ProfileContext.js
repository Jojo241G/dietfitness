import React, { createContext, useState, useContext } from 'react';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    prenom: 'Jean',
    poids: 75,       // kg
    taille: 175,     // cm
    age: 28,
    sexe: 'homme',
    objectif: 'perte_de_poids', // 'perte_de_poids' | 'prise_de_masse' | 'maintien'
    allergies: ['arachides'],   // ex: ['arachides', 'gluten', 'lactose']
    conditionsMedicales: [],    // ex: ['hypertension', 'diabete']
  });

  // Calcul automatique de l'IMC
  const imc = profile.poids && profile.taille
    ? (profile.poids / Math.pow(profile.taille / 100, 2)).toFixed(1)
    : null;

  const getImcLabel = (val) => {
    if (val < 18.5) return 'Insuffisance pondérale';
    if (val < 25) return 'Poids normal';
    if (val < 30) return 'Surpoids';
    return 'Obésité';
  };

  const updateProfile = (newData) => {
    setProfile(prev => ({ ...prev, ...newData }));
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      updateProfile,
      imc,
      imcLabel: imc ? getImcLabel(parseFloat(imc)) : '',
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);