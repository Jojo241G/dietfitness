import React, { useState, useContext, useMemo, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity,
  ScrollView, Image, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import { calculerCaloriesObjectif } from '../../services/healthCalculations';
import { evaluerRisquePlat } from '../../services/allergenEngine';
import { rechercherLocal, rechercherHybride } from '../../services/foodService';
import { exporterRecettePDF } from '../../services/pdfService';
import { COLORS } from '../../theme/colors';

const MOMENTS = ['Tous', 'Petit-déjeuner', 'Déjeuner', 'Dîner'];

export default function NutritionScreen({ navigation }) {
  const { profil, jour, ajouterCalories } = useContext(ProfileContext);

  const [recherche, setRecherche] = useState('');
  const [moment, setMoment]       = useState('Tous');

  const objectif      = profil?.caloriesObjectif || calculerCaloriesObjectif(profil) || 0;
  const consommees    = jour?.kcalConsommees || 0;
  const restantes     = objectif ? Math.max(objectif - consommees, 0) : 0;
  const pctConso      = objectif ? Math.min(Math.round((consommees / objectif) * 100), 100) : 0;
  const depassement   = objectif && consommees > objectif;

  const [resultats, setResultats]   = useState(rechercherLocal(''));
  const [chargement, setChargement] = useState(false);
  const [infoSource, setInfoSource] = useState(null);

  // Recherche hybride : local instantané, et si vide → tentative backend.
  React.useEffect(() => {
    let actif = true;
    const t = setTimeout(async () => {
      const locaux = rechercherLocal(recherche);
      if (locaux.length > 0 || !recherche.trim()) {
        if (actif) { setResultats(locaux); setInfoSource(null); }
        return;
      }
      // Rien en local → on tente le backend (base évolutive, offline-safe)
      setChargement(true);
      const res = await rechercherHybride(recherche);
      if (!actif) return;
      setResultats(res.plats);
      setInfoSource(res.source === 'backend'
        ? 'Résultat enrichi depuis le serveur.'
        : res.message || null);
      setChargement(false);
    }, 350); // léger debounce
    return () => { actif = false; clearTimeout(t); };
  }, [recherche]);

  const platsFiltres = useMemo(() => {
    return resultats.filter((p) => moment === 'Tous' || p.moment === moment);
  }, [resultats, moment]);

  const ajouterPlat = useCallback((plat) => {
    ajouterCalories(typeof plat.calories === 'number' ? plat.calories : parseInt(plat.calories, 10) || 0);
  }, [ajouterCalories]);

  const telechargerPDF = useCallback(async (plat) => {
    try {
      await exporterRecettePDF(plat);
    } catch (e) {
      Alert.alert('Export PDF', "Impossible de générer le PDF pour le moment.");
    }
  }, []);

  const renderPlat = useCallback(({ item }) => {
    const { risque, motif } = evaluerRisquePlat(item, profil);
    return (
      <View style={[styles.card, risque && styles.cardRisque]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        ) : null}

        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nom}>{item.nom}</Text>
            <Text style={styles.origine}>{item.origine} • <Text style={{ fontWeight: '600' }}>{item.moment}</Text></Text>
          </View>
          <View style={styles.calBadge}>
            <Text style={styles.calTxt}>{item.calories} kcal</Text>
          </View>
        </View>

        {risque && (
          <View style={styles.warning}>
            <MaterialIcons name="warning-amber" size={14} color={COLORS.danger} />
            <Text style={styles.warningTxt}>{motif}</Text>
          </View>
        )}

        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.details}>
          <Text style={styles.portion}><Text style={{ fontWeight: '700' }}>Portion : </Text>{item.portion_standard}</Text>
          <View style={styles.macros}>
            <Text style={styles.macroTag}>P {item.macros.proteines}</Text>
            <Text style={styles.macroTag}>G {item.macros.glucides}</Text>
            <Text style={styles.macroTag}>L {item.macros.lipides}</Text>
          </View>
        </View>

        <View style={styles.coach}>
          <Text style={styles.coachTitle}>💡 Conseil & recette</Text>
          <Text style={styles.recette}><Text style={{ fontWeight: '700' }}>Recette : </Text>{item.recette_explicite}</Text>
          <Text style={styles.coachTxt}>{item.conseil_coach}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.addBtn, { flex: 1 }]} onPress={() => ajouterPlat(item)} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color={COLORS.cream} />
            <Text style={styles.addTxt}>Ajouter à mes repas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pdfBtn} onPress={() => telechargerPDF(item)} activeOpacity={0.85}>
            <MaterialIcons name="picture-as-pdf" size={20} color={COLORS.forest} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [profil, ajouterPlat, telechargerPDF]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête calories synchronisé avec le Home */}
      <View style={styles.tracker}>
        <View style={styles.trackerTop}>
          <Text style={styles.trackerLbl}>Aujourd'hui</Text>
          <Text style={[styles.trackerVal, depassement && { color: COLORS.warning }]}>
            {consommees.toLocaleString()} / {objectif ? objectif.toLocaleString() : '—'} kcal
          </Text>
        </View>
        <View style={styles.trackBar}>
          <View style={[styles.trackFill, { width: `${pctConso}%`, backgroundColor: depassement ? COLORS.warning : COLORS.sage }]} />
        </View>
        <View style={styles.trackerBottom}>
          <Text style={styles.trackerSub}>
            {depassement
              ? `Objectif dépassé de ${(consommees - objectif).toLocaleString()} kcal`
              : `${restantes.toLocaleString()} kcal restantes pour ton objectif`}
          </Text>
          {navigation && (
            <TouchableOpacity style={styles.planBtn} onPress={() => navigation.navigate('Planning')} activeOpacity={0.85}>
              <MaterialIcons name="calendar-month" size={16} color={COLORS.forest} />
              <Text style={styles.planBtnTxt}>Planning 7 j</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.search}>
        <MaterialIcons name="search" size={20} color={COLORS.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher (Ndolé, Koki, Achu…)"
          placeholderTextColor={COLORS.muted}
          value={recherche}
          onChangeText={setRecherche}
        />
        {chargement && <ActivityIndicator size="small" color={COLORS.sage} />}
      </View>

      {infoSource && (
        <Text style={styles.infoSource}>{infoSource}</Text>
      )}

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {MOMENTS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.tab, moment === m && styles.tabOn]}
              onPress={() => setMoment(m)}
            >
              <Text style={[styles.tabTxt, moment === m && styles.tabTxtOn]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={platsFiltres}
        keyExtractor={(item) => item.id}
        renderItem={renderPlat}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={<Text style={styles.empty}>Aucun plat ne correspond.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },

  tracker: { backgroundColor: COLORS.forest, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  trackerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackerLbl: { color: COLORS.creamMuted, fontSize: 12 },
  trackerVal: { color: COLORS.cream, fontSize: 16, fontWeight: '700' },
  trackBar: { height: 8, backgroundColor: 'rgba(247,243,236,0.18)', borderRadius: 8, marginTop: 10 },
  trackFill: { height: 8, borderRadius: 8 },
  trackerSub: { color: COLORS.creamMuted, fontSize: 11, marginTop: 8 },
  trackerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.cream, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  planBtnTxt: { color: COLORS.forest, fontWeight: '700', fontSize: 12 },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, height: 48, margin: 16, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.forest },

  tabsWrap: { height: 44, marginBottom: 4 },
  tabs: { alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  tabOn: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  tabTxt: { color: COLORS.forest, fontWeight: '500', fontSize: 13 },
  tabTxtOn: { color: COLORS.cream },

  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardRisque: { borderLeftWidth: 4, borderLeftColor: COLORS.danger },
  image: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12, backgroundColor: '#e2ded7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  nom: { fontSize: 17, fontWeight: '700', color: COLORS.forest },
  origine: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  calBadge: { backgroundColor: '#eef5f1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  calTxt: { color: COLORS.forest, fontWeight: '700', fontSize: 13 },

  warning: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(192,57,43,0.07)', padding: 8, borderRadius: 8, marginBottom: 10 },
  warningTxt: { color: COLORS.danger, fontSize: 12, fontWeight: '600', flex: 1 },

  desc: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 12 },
  details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fcfbfa', padding: 8, borderRadius: 8, marginBottom: 12 },
  portion: { fontSize: 13, color: '#333', flex: 1 },
  macros: { flexDirection: 'row', gap: 6 },
  macroTag: { fontSize: 11, backgroundColor: '#e2ded7', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, color: COLORS.forest, fontWeight: '500' },

  coach: { backgroundColor: '#f1f6f3', padding: 12, borderRadius: 10, marginBottom: 14 },
  coachTitle: { fontSize: 13, fontWeight: '700', color: COLORS.sage, marginBottom: 4 },
  recette: { fontSize: 12, color: '#555', lineHeight: 16 },
  coachTxt: { fontSize: 12, color: '#444', fontStyle: 'italic', lineHeight: 16, marginTop: 6 },

  addBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: COLORS.forest, paddingVertical: 12, borderRadius: 12 },
  addTxt: { color: COLORS.cream, fontWeight: '700', fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  pdfBtn: { width: 48, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  infoSource: { fontSize: 11, color: COLORS.sage, paddingHorizontal: 20, marginBottom: 4 },

  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
