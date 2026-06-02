import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import ProgressRing from '../../components/ProgressRing';
import { analyserDuree, caloriesExercice } from '../../services/exerciseUtils';
import { parler, stopVoix, setVoixActive } from '../../services/voiceGuide';
import { COLORS } from '../../theme/colors';

/**
 * Lecteur d'entraînement interactif.
 * Phases : 'pret' → décompte 3-2-1 → exécution des phases (effort/repos) → 'fini'.
 * Chronométrage à l'horloge réelle (Date.now) pour rester exact.
 * Voix : décompte, début/fin de chaque phase, encouragements à mi-parcours.
 * À la fin : calories ajoutées au ProfileContext (résumé Home).
 */
export default function ExercisePlayerScreen({ route, navigation }) {
  const exercice = route?.params?.exercice;
  const { profil, ajouterCaloriesBrulees } = useContext(ProfileContext);
  const poids = profil?.poids || 70;

  const { phases } = analyserDuree(exercice?.duration, exercice?.title);
  const calories = caloriesExercice(exercice, poids);

  const [etat, setEtat]         = useState('pret');   // pret | decompte | actif | pause | fini
  const [decompte, setDecompte] = useState(3);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [restant, setRestant]   = useState(phases[0]?.secondes || 0);
  const [voix, setVoix]         = useState(true);

  const timerRef = useRef(null);
  const finRef   = useRef(0);        // timestamp de fin de la phase courante
  const miDitRef = useRef(false);    // encouragement de mi-parcours déjà dit ?
  const caloriesLog = useRef(false);

  useEffect(() => setVoixActive(voix), [voix]);
  useEffect(() => () => { stopVoix(); if (timerRef.current) clearInterval(timerRef.current); }, []);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  // ─── Décompte de départ ───
  const lancerDecompte = useCallback(() => {
    setEtat('decompte');
    setDecompte(3);
    parler('Prêt ? 3, 2, 1, partez !');
    let n = 3;
    stopTimer();
    timerRef.current = setInterval(() => {
      n -= 1;
      if (n > 0) { setDecompte(n); }
      else { stopTimer(); demarrerPhase(0); }
    }, 1000);
  }, []);

  // ─── Démarre une phase ───
  const demarrerPhase = useCallback((idx) => {
    const phase = phases[idx];
    if (!phase) { terminer(); return; }
    setPhaseIdx(idx);
    setRestant(phase.secondes);
    setEtat('actif');
    miDitRef.current = false;
    finRef.current = Date.now() + phase.secondes * 1000;

    if (phase.type === 'effort') parler(`${phase.label}. C'est parti !`);
    else parler('Repos. Reprends ton souffle.');

    stopTimer();
    timerRef.current = setInterval(() => {
      const reste = Math.max(0, Math.round((finRef.current - Date.now()) / 1000));
      setRestant(reste);

      // Encouragement à mi-parcours (effort uniquement)
      if (phase.type === 'effort' && !miDitRef.current && reste <= Math.floor(phase.secondes / 2) && reste > 2) {
        miDitRef.current = true;
        parler('Tiens bon, tu es à la moitié !');
      }
      // Derniers 3 secondes
      if (reste === 3) parler('Encore 3 secondes.');

      if (reste <= 0) {
        stopTimer();
        if (idx + 1 < phases.length) demarrerPhase(idx + 1);
        else terminer();
      }
    }, 250);
  }, [phases]);

  // ─── Fin de séance ───
  const terminer = useCallback(() => {
    stopTimer();
    setEtat('fini');
    if (!caloriesLog.current) {
      ajouterCaloriesBrulees(calories);
      caloriesLog.current = true;
    }
    parler(`Exercice terminé ! Tu as brûlé environ ${calories} calories. Bravo !`);
  }, [calories, ajouterCaloriesBrulees]);

  // ─── Pause / reprise ───
  const basculerPause = useCallback(() => {
    if (etat === 'actif') {
      stopTimer();
      stopVoix();
      setEtat('pause');
    } else if (etat === 'pause') {
      setEtat('actif');
      finRef.current = Date.now() + restant * 1000;
      timerRef.current = setInterval(() => {
        const reste = Math.max(0, Math.round((finRef.current - Date.now()) / 1000));
        setRestant(reste);
        if (reste <= 0) {
          stopTimer();
          if (phaseIdx + 1 < phases.length) demarrerPhase(phaseIdx + 1);
          else terminer();
        }
      }, 250);
    }
  }, [etat, restant, phaseIdx, phases, demarrerPhase, terminer]);

  if (!exercice) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorTxt}>Aucun exercice sélectionné.</Text>
      </SafeAreaView>
    );
  }

  const phase = phases[phaseIdx];
  const pct = phase ? Math.round(((phase.secondes - restant) / phase.secondes) * 100) : 0;
  const estRepos = phase?.type === 'repos';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { stopTimer(); stopVoix(); navigation.goBack(); }}>
          <MaterialIcons name="close" size={26} color={COLORS.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{exercice.title}</Text>
        <TouchableOpacity onPress={() => setVoix((v) => !v)}>
          <MaterialIcons name={voix ? 'volume-up' : 'volume-off'} size={24} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      <View style={styles.gifWrap}>
        <Image source={{ uri: exercice.animationUrl }} style={styles.gif} resizeMode="cover" />
      </View>

      <View style={styles.center}>
        {etat === 'pret' && (
          <>
            <Text style={styles.meta}>{exercice.targetMuscles}</Text>
            <Text style={styles.metaSmall}>{exercice.duration} • {exercice.difficulty} • ~{calories} kcal</Text>
            <TouchableOpacity style={styles.bigBtn} onPress={lancerDecompte} activeOpacity={0.85}>
              <MaterialIcons name="play-arrow" size={26} color={COLORS.cream} />
              <Text style={styles.bigBtnTxt}>Commencer</Text>
            </TouchableOpacity>
          </>
        )}

        {etat === 'decompte' && (
          <View style={styles.decompteWrap}>
            <Text style={styles.decompteTxt}>{decompte}</Text>
            <Text style={styles.metaSmall}>Préparation…</Text>
          </View>
        )}

        {(etat === 'actif' || etat === 'pause') && (
          <>
            <ProgressRing percent={pct} size={170} strokeWidth={12} color={estRepos ? COLORS.warning : COLORS.sage}>
              <Text style={styles.timerTxt}>{restant}</Text>
              <Text style={styles.timerSub}>{estRepos ? 'repos' : 'secondes'}</Text>
            </ProgressRing>
            <Text style={styles.phaseLabel}>{phase?.label}</Text>
            <TouchableOpacity style={styles.pauseBtn} onPress={basculerPause} activeOpacity={0.85}>
              <MaterialIcons name={etat === 'pause' ? 'play-arrow' : 'pause'} size={22} color={COLORS.forest} />
              <Text style={styles.pauseTxt}>{etat === 'pause' ? 'Reprendre' : 'Pause'}</Text>
            </TouchableOpacity>
          </>
        )}

        {etat === 'fini' && (
          <>
            <View style={styles.doneCircle}>
              <MaterialIcons name="check" size={48} color={COLORS.cream} />
            </View>
            <Text style={styles.doneTxt}>Exercice terminé !</Text>
            <Text style={styles.metaSmall}>~{calories} kcal ajoutées à ta journée</Text>
            <TouchableOpacity style={styles.bigBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={styles.bigBtnTxt}>Retour aux exercices</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: { backgroundColor: COLORS.forest, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  headerTitle: { flex: 1, color: COLORS.cream, fontSize: 17, fontWeight: '700' },

  gifWrap: { height: 220, backgroundColor: '#e2ded7' },
  gif: { width: '100%', height: '100%' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  meta: { fontSize: 16, fontWeight: '600', color: COLORS.forest, textAlign: 'center' },
  metaSmall: { fontSize: 13, color: COLORS.muted, marginTop: 6, textAlign: 'center' },

  bigBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.sage, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 28, marginTop: 24 },
  bigBtnTxt: { color: COLORS.cream, fontSize: 16, fontWeight: '700' },

  decompteWrap: { alignItems: 'center' },
  decompteTxt: { fontSize: 110, fontWeight: '800', color: COLORS.forest },

  timerTxt: { fontSize: 54, fontWeight: '800', color: COLORS.forest },
  timerSub: { fontSize: 12, color: COLORS.muted, marginTop: -6 },
  phaseLabel: { fontSize: 18, fontWeight: '700', color: COLORS.forest, marginTop: 20 },

  pauseBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.sage, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 20 },
  pauseTxt: { color: COLORS.forest, fontWeight: '700', fontSize: 14 },

  doneCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.sage, justifyContent: 'center', alignItems: 'center' },
  doneTxt: { fontSize: 22, fontWeight: '700', color: COLORS.forest, marginTop: 16 },

  errorTxt: { textAlign: 'center', marginTop: 40, color: COLORS.muted },
});
