import { useState, useEffect, useRef } from 'react';
import { Pedometer } from 'expo-sensors';

/**
 * Hook podomètre temps réel basé sur Expo Pedometer (expo-sensors).
 *
 * - Demande la permission ACTIVITY_RECOGNITION (Android) / Motion (iOS).
 * - Charge le total de pas depuis minuit (getStepCountAsync, iOS surtout).
 * - S'abonne à watchStepCount pour incrémenter en direct à chaque pas.
 *
 * Retour :
 *   { pas, disponible, permission, erreur }
 *   - pas        : nombre de pas du jour (live)
 *   - disponible : capteur présent sur l'appareil
 *   - permission : 'granted' | 'denied' | 'pending'
 *   - erreur     : message éventuel
 *
 * NB : sous Expo Go, watchStepCount fonctionne ; getStepCountAsync (historique)
 * n'est dispo que sur iOS. Sur Android on part donc de 0 et on incrémente.
 */
export function usePedometer(pasInitial = 0, onChange) {
  const [pas, setPas]               = useState(pasInitial);
  const [disponible, setDispo]      = useState(null);
  const [permission, setPermission] = useState('pending');
  const [erreur, setErreur]         = useState(null);

  const baseRef = useRef(pasInitial); // pas déjà comptés avant l'abonnement
  const subRef  = useRef(null);

  // Démarre l'écoute des pas une fois la permission accordée.
  async function demarrerSuivi() {
    try {
      const debutJour = new Date();
      debutJour.setHours(0, 0, 0, 0);
      const res = await Pedometer.getStepCountAsync(debutJour, new Date());
      if (res?.steps != null) {
        baseRef.current = pasInitial + res.steps;
        setPas(baseRef.current);
        onChange?.(baseRef.current);
      }
    } catch {
      /* getStepCountAsync non supporté (Android) — on continue en live */
    }
    subRef.current?.remove?.();
    subRef.current = Pedometer.watchStepCount((result) => {
      const total = baseRef.current + (result?.steps || 0);
      setPas(total);
      onChange?.(total);
    });
  }

  // Déclenche explicitement le pop-up système de permission, puis démarre le suivi.
  async function demanderPermission() {
    try {
      const { status } = await Pedometer.requestPermissionsAsync();
      setPermission(status);
      if (status === 'granted') {
        setErreur(null);
        await demarrerSuivi();
        return true;
      }
      setErreur("Permission de suivi d'activité refusée.");
      return false;
    } catch {
      setErreur("Impossible de demander la permission.");
      return false;
    }
  }

  useEffect(() => {
    let actif = true;

    (async () => {
      try {
        const dispo = await Pedometer.isAvailableAsync();
        if (!actif) return;
        setDispo(dispo);
        if (!dispo) {
          setErreur("Capteur de pas indisponible sur cet appareil.");
          return;
        }

        // Demande la permission au montage (pop-up système).
        const { status } = await Pedometer.requestPermissionsAsync();
        if (!actif) return;
        setPermission(status);
        if (status !== 'granted') {
          setErreur("Permission de suivi d'activité refusée.");
          return; // l'utilisateur pourra réessayer via demanderPermission()
        }

        await demarrerSuivi();
      } catch (e) {
        if (actif) setErreur("Erreur d'initialisation du podomètre.");
      }
    })();

    return () => {
      actif = false;
      subRef.current?.remove?.();
    };
    // onChange volontairement hors deps pour ne pas relancer l'abonnement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pas, disponible, permission, erreur, demanderPermission };
}
