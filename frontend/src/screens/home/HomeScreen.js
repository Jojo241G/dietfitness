// Développé par kalashmdg
import React, { useContext } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import ProgressRing from '../../components/ProgressRing';
import { usePedometer } from '../../hooks/usePedometer';
import {
  calculerIMC, categorieIMC as labelIMC, calculerCaloriesObjectif,
} from '../../services/healthCalculations';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  forest : '#1c3a2e',
  sage   : '#3d6b52',
  cream  : '#f7f3ec',
  white  : '#ffffff',
  muted  : '#6b7a6e',
  border : 'rgba(28,58,46,0.08)',
  warning: '#d4a017',
};

// ─── Carte générique ──────────────────────────────────────────────────────────
function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function HomeScreen() {
  const { profil, jour, ajouterEau, setPas: persistPas } = useContext(ProfileContext);

  // ── Valeurs calculées depuis le profil (moteur partagé) ──
  const imc      = calculerIMC(profil?.poids, profil?.taille);
  const besoins  = profil?.caloriesObjectif || calculerCaloriesObjectif(profil);
  const prenom   = profil?.prenom || 'toi';

  // ── Compteurs du jour (persistés dans ProfileContext) ──
  const eauConsommee     = jour?.eauConsommee || 0;
  const kcalConsommees   = jour?.kcalConsommees || 0;
  const kcalBrulees      = jour?.kcalBrulees || 0;
  const objectifPas = 10000;
  const objectifEau = 2.5; // litres
  const kcalRestantes = besoins ? Math.max(besoins - kcalConsommees, 0) : null;

  // ── Podomètre réel (Expo Pedometer) ──
  // Part du total déjà persisté du jour, puis incrémente en direct.
  // Chaque mise à jour est re-persistée dans le contexte (setPas).
  const { pas, disponible, permission, erreur, demanderPermission } = usePedometer(
    jour?.pas || 0,
    (total) => persistPas(total),
  );

  const percentPas = Math.min(Math.round((pas / objectifPas) * 100), 100);
  const percentEau = Math.min(Math.round((eauConsommee / objectifEau) * 100), 100);

  // Gouttes d'eau (5 = objectif 2.5L par tranches de 0.5L)
  const nbGouttes    = 5;
  const gouttesRemplies = Math.round(eauConsommee / (objectifEau / nbGouttes));

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── En-tête ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.greetingName}>{prenom} 👋</Text>
        </View>
        <MaterialIcons name="notifications-none" size={24} color="rgba(247,243,236,0.7)" />
      </View>

      {/* ── Cartes IMC + Calories ── */}
      <View style={styles.imcRow}>
        <View style={styles.imcCard}>
          <Text style={styles.imcValue}>{imc ?? '—'}</Text>
          <Text style={styles.imcLabel}>IMC</Text>
          <View style={styles.imcBadge}>
            <Text style={styles.imcBadgeText}>{imc ? labelIMC(imc) : 'Profil incomplet'}</Text>
          </View>
        </View>
        <View style={styles.imcCard}>
          <Text style={styles.imcValue}>{besoins ? besoins.toLocaleString() : '—'}</Text>
          <Text style={styles.imcLabel}>Besoins caloriques</Text>
          <View style={styles.imcBadge}>
            <Text style={styles.imcBadgeText}>kcal/jour</Text>
          </View>
        </View>
      </View>

      {/* ── Corps défilable ── */}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Podomètre */}
        <Text style={styles.sectionTitle}>Activité du jour</Text>
        <Card>
          <View style={styles.stepRow}>
            <ProgressRing percent={percentPas} size={92}>
              <MaterialIcons name="directions-walk" size={22} color={C.sage} />
            </ProgressRing>
            <View style={styles.stepInfo}>
              <Text style={styles.stepCount}>{pas.toLocaleString()}</Text>
              <Text style={styles.stepSub}>pas · objectif : {objectifPas.toLocaleString()}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${percentPas}%` }]} />
              </View>
              {disponible === false && (
                <Text style={styles.stepHint}>Capteur de pas indisponible sur cet appareil.</Text>
              )}
              {disponible && permission !== 'granted' && (
                <TouchableOpacity style={styles.permBtn} onPress={demanderPermission} activeOpacity={0.85}>
                  <MaterialIcons name="directions-walk" size={16} color={C.cream} />
                  <Text style={styles.permBtnTxt}>Activer le suivi des pas</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>

        {/* Hydratation */}
        <Text style={styles.sectionTitle}>Hydratation</Text>
        <Card>
          <View style={styles.eauHeader}>
            <Text style={styles.eauLabel}>Eau consommée</Text>
            <Text style={styles.eauValue}>{eauConsommee}L / {objectifEau}L</Text>
          </View>
          <View style={styles.gouttesRow}>
            {Array.from({ length: nbGouttes }).map((_, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => ajouterEau(i < gouttesRemplies ? -(objectifEau / nbGouttes) : (objectifEau / nbGouttes))}
                style={[styles.goutte, i < gouttesRemplies && styles.goutte_fill]}
              >
                <MaterialIcons
                  name="water-drop"
                  size={16}
                  color={i < gouttesRemplies ? C.cream : 'rgba(28,58,46,0.25)'}
                />
              </TouchableOpacity>
            ))}
            <Text style={styles.eauReste}>
              +{Math.max((objectifEau - eauConsommee) * 1000, 0).toFixed(0)} mL restants
            </Text>
          </View>
        </Card>

        {/* Résumé nutritionnel */}
        <Text style={styles.sectionTitle}>Résumé nutritionnel</Text>
        <Card>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{kcalConsommees.toLocaleString()}</Text>
              <Text style={styles.summaryLbl}>kcal consommées</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: C.warning }]}>
                {kcalRestantes !== null ? kcalRestantes.toLocaleString() : '—'}
              </Text>
              <Text style={styles.summaryLbl}>kcal restantes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{kcalBrulees.toLocaleString()}</Text>
              <Text style={styles.summaryLbl}>kcal brûlées</Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  header: {
    backgroundColor  : C.forest,
    paddingHorizontal: 20,
    paddingTop       : 20,
    paddingBottom    : 0,
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
  },
  greeting    : { color: 'rgba(247,243,236,0.7)', fontSize: 13 },
  greetingName: { color: C.cream, fontSize: 22, fontWeight: '600', marginBottom: 16 },

  imcRow: {
    backgroundColor: C.forest,
    flexDirection  : 'row',
    paddingHorizontal: 16,
    paddingBottom  : 20,
    gap            : 12,
  },
  imcCard: {
    flex           : 1,
    backgroundColor: 'rgba(247,243,236,0.12)',
    borderRadius   : 14,
    padding        : 14,
    alignItems     : 'center',
  },
  imcValue     : { color: C.cream, fontSize: 24, fontWeight: '500' },
  imcLabel     : { color: 'rgba(247,243,236,0.65)', fontSize: 10, marginTop: 2 },
  imcBadge     : { backgroundColor: 'rgba(61,107,82,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  imcBadgeText : { color: C.cream, fontSize: 10 },

  body        : { padding: 16, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: C.forest, marginBottom: 4, marginTop: 4 },

  card: {
    backgroundColor: C.white,
    borderRadius   : 16,
    padding        : 16,
    borderWidth    : 1,
    borderColor    : C.border,
    marginBottom   : 4,
  },

  stepRow : { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepInfo: { flex: 1 },
  stepCount: { fontSize: 24, fontWeight: '500', color: C.forest },
  stepSub  : { fontSize: 11, color: C.muted, marginTop: 2 },
  stepHint : { fontSize: 10, color: C.warning, marginTop: 6 },
  permBtn  : { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.sage, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 10, alignSelf: 'flex-start' },
  permBtnTxt: { color: C.cream, fontSize: 12, fontWeight: '600' },
  barBg    : { height: 6, backgroundColor: 'rgba(28,58,46,0.1)', borderRadius: 6, marginTop: 10 },
  barFill  : { height: 6, backgroundColor: C.sage, borderRadius: 6 },

  eauHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  eauLabel  : { fontSize: 13, color: '#1a1a1a' },
  eauValue  : { fontSize: 13, fontWeight: '500', color: C.forest },
  gouttesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goutte    : { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'rgba(28,58,46,0.2)', justifyContent: 'center', alignItems: 'center' },
  goutte_fill: { backgroundColor: C.sage, borderColor: C.sage },
  eauReste  : { fontSize: 11, color: C.muted, marginLeft: 4 },

  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryItem: { flex: 1, backgroundColor: 'rgba(247,243,236,0.8)', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(28,58,46,0.06)' },
  summaryVal : { fontSize: 16, fontWeight: '500', color: C.forest },
  summaryLbl : { fontSize: 9, color: C.muted, marginTop: 2, textAlign: 'center' },
});