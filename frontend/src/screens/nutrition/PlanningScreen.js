import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import { genererPlanning } from '../../services/planningService';
import { exporterPlanningPDF } from '../../services/pdfService';
import { evaluerRisquePlat } from '../../services/allergenEngine';
import { COLORS } from '../../theme/colors';

const ICONES_REPAS = {
  'Petit-déjeuner': 'free-breakfast',
  'Déjeuner': 'lunch-dining',
  'Dîner': 'dinner-dining',
};

export default function PlanningScreen({ navigation }) {
  const { profil } = useContext(ProfileContext);
  const [planning, setPlanning] = useState(() => genererPlanning(profil));
  const [jourActif, setJourActif] = useState(0);

  const regenerer = useCallback(() => {
    setPlanning(genererPlanning(profil));
    setJourActif(0);
  }, [profil]);

  const exporter = useCallback(async () => {
    try {
      await exporterPlanningPDF(planning, profil?.prenom);
    } catch (e) {
      Alert.alert('Export PDF', "Impossible de générer le PDF pour le moment.");
    }
  }, [planning, profil]);

  const jour = planning.jours[jourActif];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.cream} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: navigation ? 12 : 0 }}>
          <Text style={styles.title}>Planning de la semaine</Text>
          <Text style={styles.subtitle}>Objectif : {planning.objectif.toLocaleString()} kcal/jour</Text>
        </View>
        <TouchableOpacity onPress={exporter} style={styles.iconBtn}>
          <MaterialIcons name="picture-as-pdf" size={22} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      {/* Sélecteur de jour */}
      <View style={styles.daysWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
          {planning.jours.map((j, i) => (
            <TouchableOpacity
              key={j.jour}
              style={[styles.dayTab, i === jourActif && styles.dayTabOn]}
              onPress={() => setJourActif(i)}
            >
              <Text style={[styles.dayTxt, i === jourActif && styles.dayTxtOn]}>{j.jour.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{jour.jour}</Text>
          <Text style={styles.dayTotal}>{jour.total.toLocaleString()} kcal</Text>
        </View>

        {jour.repas.map((r) => {
          const risque = r.plat ? evaluerRisquePlat(r.plat, profil).risque : false;
          return (
            <View key={r.type} style={styles.repasCard}>
              <View style={styles.repasIcon}>
                <MaterialIcons name={ICONES_REPAS[r.type] || 'restaurant'} size={20} color={COLORS.sage} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.repasType}>{r.type}</Text>
                <Text style={styles.repasPlat}>{r.plat ? r.plat.nom : 'Aucun plat adapté disponible'}</Text>
                {r.plat && <Text style={styles.repasOrigine}>{r.plat.origine}</Text>}
              </View>
              <View style={styles.repasKcal}>
                <Text style={styles.repasKcalVal}>{r.plat ? r.plat.calories : '—'}</Text>
                <Text style={styles.repasKcalLbl}>kcal</Text>
              </View>
            </View>
          );
        })}

        <Text style={styles.note}>
          Plan généré localement à partir des {planning.nbPlatsSurs} plats compatibles avec ton profil
          (allergènes et contre-indications exclus automatiquement).
        </Text>

        <TouchableOpacity style={styles.regen} onPress={regenerer} activeOpacity={0.85}>
          <MaterialIcons name="autorenew" size={18} color={COLORS.forest} />
          <Text style={styles.regenTxt}>Régénérer un nouveau plan</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: { backgroundColor: COLORS.forest, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  title: { color: COLORS.cream, fontSize: 18, fontWeight: '700' },
  subtitle: { color: COLORS.creamMuted, fontSize: 12, marginTop: 2 },
  iconBtn: { backgroundColor: 'rgba(247,243,236,0.15)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  daysWrap: { backgroundColor: COLORS.forest, paddingBottom: 12 },
  days: { paddingHorizontal: 16, gap: 8 },
  dayTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(247,243,236,0.12)' },
  dayTabOn: { backgroundColor: COLORS.cream },
  dayTxt: { color: COLORS.creamMuted, fontWeight: '600', fontSize: 13 },
  dayTxtOn: { color: COLORS.forest },

  body: { padding: 16 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayTitle: { fontSize: 20, fontWeight: '700', color: COLORS.forest },
  dayTotal: { fontSize: 14, fontWeight: '600', color: COLORS.sage },

  repasCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  repasIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef5f1', justifyContent: 'center', alignItems: 'center' },
  repasType: { fontSize: 12, color: COLORS.muted },
  repasPlat: { fontSize: 15, fontWeight: '600', color: COLORS.forest, marginTop: 2 },
  repasOrigine: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  repasKcal: { alignItems: 'center' },
  repasKcalVal: { fontSize: 16, fontWeight: '700', color: COLORS.forest },
  repasKcalLbl: { fontSize: 9, color: COLORS.muted },

  note: { fontSize: 12, color: COLORS.muted, lineHeight: 18, marginTop: 8, marginBottom: 16 },
  regen: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.sage, borderRadius: 12, paddingVertical: 13 },
  regenTxt: { color: COLORS.forest, fontWeight: '700', fontSize: 14 },
});
