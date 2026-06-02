import { useState, useRef, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { distanceMetres } from '../services/geoUtils';

/**
 * Hook de suivi de course/marche.
 *
 * Source principale : GPS (expo-location, watchPositionAsync) → distance réelle
 * via Haversine, tracé conservé pour affichage.
 * Source de secours : podomètre (si GPS refusé/indispo) → distance estimée par
 * pas × longueur de foulée.
 *
 * ⚠️ Expo Go : le suivi en arrière-plan n'est PAS supporté. Le tracé ne progresse
 * que lorsque l'app est au premier plan (écran allumé).
 *
 * État : enCours, distance(m), duree(s), points[], source('gps'|'podometre'|null),
 *        permission, erreur. Actions : demarrer(), arreter(), reset().
 */
const LONGUEUR_FOULEE_M = 0.75; // estimation moyenne marche/jogging

export function useRunTracker(poidsKg = 70) {
  const [enCours, setEnCours]       = useState(false);
  const [distance, setDistance]     = useState(0);
  const [duree, setDuree]           = useState(0);
  const [points, setPoints]         = useState([]);
  const [source, setSource]         = useState(null);
  const [permission, setPermission] = useState('pending');
  const [erreur, setErreur]         = useState(null);

  const locSubRef   = useRef(null);
  const pasSubRef   = useRef(null);
  const timerRef    = useRef(null);
  const dernierPt   = useRef(null);
  const pasDebut    = useRef(0);

  const nettoyer = useCallback(() => {
    locSubRef.current?.remove?.();
    pasSubRef.current?.remove?.();
    if (timerRef.current) clearInterval(timerRef.current);
    locSubRef.current = null;
    pasSubRef.current = null;
    timerRef.current = null;
  }, []);

  useEffect(() => nettoyer, [nettoyer]);

  const demarrer = useCallback(async () => {
    nettoyer(); // garde-fou : stoppe tout timer/abonnement résiduel (évite double comptage)
    setErreur(null);
    setDistance(0);
    setDuree(0);
    setPoints([]);
    dernierPt.current = null;

    // Chrono (1 s) — basé sur l'horloge réelle pour rester exact même si le JS lague
    const t0 = Date.now();
    timerRef.current = setInterval(() => {
      setDuree(Math.floor((Date.now() - t0) / 1000));
    }, 500);

    // Tentative GPS
    let gpsOk = false;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(status);
      if (status === 'granted') {
        gpsOk = true;
        setSource('gps');
        locSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
          (loc) => {
            const pt = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setPoints((prev) => [...prev, pt]);
            if (dernierPt.current) {
              const d = distanceMetres(dernierPt.current, pt);
              // filtre le bruit GPS (<1.5 m) et les sauts aberrants (>50 m/ tick)
              if (d >= 1.5 && d < 50) setDistance((prev) => prev + d);
            }
            dernierPt.current = pt;
          }
        );
      }
    } catch (e) {
      gpsOk = false;
    }

    // Repli podomètre si GPS indispo
    if (!gpsOk) {
      try {
        const dispo = await Pedometer.isAvailableAsync();
        if (dispo) {
          const { status } = await Pedometer.requestPermissionsAsync();
          if (status === 'granted') {
            setSource('podometre');
            pasDebut.current = 0;
            pasSubRef.current = Pedometer.watchStepCount((r) => {
              const pas = r?.steps || 0;
              setDistance(pas * LONGUEUR_FOULEE_M);
            });
          } else {
            setErreur("Ni GPS ni podomètre autorisés : distance indisponible.");
          }
        } else {
          setErreur("GPS refusé et capteur de pas indisponible.");
        }
      } catch {
        setErreur("Impossible de démarrer le suivi.");
      }
    }

    setEnCours(true);
  }, []);

  const arreter = useCallback(() => {
    nettoyer();
    setEnCours(false);
  }, [nettoyer]);

  const reset = useCallback(() => {
    nettoyer();
    setEnCours(false);
    setDistance(0);
    setDuree(0);
    setPoints([]);
    setSource(null);
    dernierPt.current = null;
  }, [nettoyer]);

  return { enCours, distance, duree, points, source, permission, erreur, demarrer, arreter, reset };
}
