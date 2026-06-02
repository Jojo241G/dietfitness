import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert
} from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useProfile } from '../../context/ProfileContext';

const COLORS = {
  cream: '#f7f3ec',
  forest: '#1c3a2e',
  sage: '#3d6b52',
  white: '#ffffff',
  muted: '#6b7a6e',
};

export default function HomeScreen() {
  const { profile, imc, imcLabel } = useProfile();
  const [steps, setSteps] = useState(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const [verresDeau, setVerresDeau] = useState(0);
  const [caloriesJour, setCaloriesJour] = useState(0);
  const subscriptionRef = useRef(null);

  const objectifPas = 8000;
  const objectifVerres = 8;
  const objectifCalories = profile.objectif === 'prise_de_masse' ? 2500
    : profile.objectif === 'perte_de_poids' ? 1800 : 2000;

  useEffect(() => {
    const initPedometer = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(available);

        if (available) {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();

          const result = await Pedometer.getStepCountAsync(start, end);
          if (result) setSteps(result.steps);

          subscriptionRef.current = Pedometer.watchStepCount(result => {
            setSteps(s => s + result.steps);
          });
        }
      } catch (e) {
        console.log('Podomètre non disponible sur cet appareil');
      }
    };

    initPedometer();
    return () => subscriptionRef.current && subscriptionRef.current.remove();
  }, []);

  const ajouterVerre = () => {
    if (verresDeau < objectifVerres) setVerresDeau(v => v + 1);
    else Alert.alert('🎉 Bravo !', 'Objectif hydratation atteint !');
  };

  const ajouterCalories = (quantite) => {
    setCaloriesJour(c => Math.min(c + quantite, objectifCalories + 500));
  };

  const progressionPas = Math.min((steps / objectifPas) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.greetingName}>{profile.prenom}</Text>
        </View>
        <View style={styles.imcBadge}>
          <Text style={styles.imcValue}>{imc}</Text>
          <Text style={styles.imcLabel}>IMC</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* IMC DÉTAIL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Mon IMC</Text>
          <View style={styles.imcRow}>
            <View style={styles.imcItem}>
              <Text style={styles.imcBig}>{imc}</Text>
              <Text style={styles.imcSub}>{imcLabel}</Text>
            </View>
            <View style={styles.imcItem}>
              <Text style={styles.imcBig}>{profile.poids} kg</Text>
              <Text style={styles.imcSub}>Poids actuel</Text>
            </View>
            <View style={styles.imcItem}>
              <Text style={styles.imcBig}>{profile.taille} cm</Text>
              <Text style={styles.imcSub}>Taille</Text>
            </View>
          </View>
        </View>

        {/* PODOMÈTRE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👟 Pas du jour</Text>
          {!isPedometerAvailable && (
            <Text style={styles.warningText}>
              ⚠️ Podomètre non disponible — testez sur un vrai appareil Android
            </Text>
          )}
          <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
          <Text style={styles.stepsSub}>/ {objectifPas.toLocaleString()} pas</Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressionPas}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{progressionPas.toFixed(0)}% de l'objectif</Text>
        </View>

        {/* HYDRATATION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💧 Hydratation</Text>
          <View style={styles.verresRow}>
            {Array.from({ length: objectifVerres }).map((_, i) => (
              <Text key={i} style={[styles.verre, i < verresDeau && styles.verreActif]}>
                🥤
              </Text>
            ))}
          </View>
          <Text style={styles.verresTexte}>{verresDeau} / {objectifVerres} verres</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={ajouterVerre}>
            <Text style={styles.btnText}>+ Ajouter un verre</Text>
          </TouchableOpacity>
        </View>

        {/* CALORIES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔥 Calories du jour</Text>
          <View style={styles.caloriesRow}>
            <View>
              <Text style={styles.calBig}>{caloriesJour}</Text>
              <Text style={styles.calSub}>kcal consommées</Text>
            </View>
            <View>
              <Text style={styles.calBig}>{objectifCalories}</Text>
              <Text style={styles.calSub}>kcal objectif</Text>
            </View>
            <View>
              <Text style={[styles.calBig, { color: COLORS.sage }]}>
                {Math.max(0, objectifCalories - caloriesJour)}
              </Text>
              <Text style={styles.calSub}>kcal restantes</Text>
            </View>
          </View>
          <View style={styles.calBtns}>
            {[200, 350, 500].map(cal => (
              <TouchableOpacity
                key={cal}
                style={styles.calBtn}
                onPress={() => ajouterCalories(cal)}
              >
                <Text style={styles.calBtnText}>+{cal}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    backgroundColor: COLORS.forest,
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { color: 'rgba(247,243,236,0.7)', fontSize: 13 },
  greetingName: { color: COLORS.cream, fontSize: 22, fontWeight: '600' },
  imcBadge: {
    backgroundColor: 'rgba(247,243,236,0.15)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  imcValue: { color: COLORS.cream, fontSize: 20, fontWeight: '700' },
  imcLabel: { color: 'rgba(247,243,236,0.7)', fontSize: 10 },
  body: { flex: 1, padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.forest, marginBottom: 12 },
  imcRow: { flexDirection: 'row', justifyContent: 'space-around' },
  imcItem: { alignItems: 'center' },
  imcBig: { fontSize: 20, fontWeight: '700', color: COLORS.forest },
  imcSub: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  warningText: { color: '#d4a017', fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  stepsCount: { fontSize: 42, fontWeight: '700', color: COLORS.forest, textAlign: 'center' },
  stepsSub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginBottom: 12 },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(28,58,46,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.sage, borderRadius: 8 },
  progressPercent: { fontSize: 11, color: COLORS.muted, textAlign: 'right', marginTop: 4 },
  verresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  verre: { fontSize: 22, opacity: 0.3 },
  verreActif: { opacity: 1 },
  verresTexte: { fontSize: 13, color: COLORS.muted, marginBottom: 10 },
  btnPrimary: {
    backgroundColor: COLORS.forest,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: { color: COLORS.cream, fontSize: 14, fontWeight: '600' },
  caloriesRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  calBig: { fontSize: 22, fontWeight: '700', color: COLORS.forest, textAlign: 'center' },
  calSub: { fontSize: 10, color: COLORS.muted, textAlign: 'center', marginTop: 2 },
  calBtns: { flexDirection: 'row', gap: 8 },
  calBtn: {
    flex: 1,
    backgroundColor: 'rgba(28,58,46,0.08)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  calBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.forest },
});