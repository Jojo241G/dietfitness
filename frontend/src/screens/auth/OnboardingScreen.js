import React, { useState, useContext, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { ProfileContext } from '../../context/ProfileContext';
import { registerRequest } from '../../services/authService';
import {
  calculerIMC, categorieIMC, calculerCaloriesObjectif, FACTEURS_ACTIVITE,
} from '../../services/healthCalculations';
import { COLORS } from '../../theme/colors';

/* ───────────────────────── Données de référence ───────────────────────── */
const SEXES      = ['Homme', 'Femme'];
const OBJECTIFS  = ['Perte de poids', 'Maintien de forme', 'Prise de masse'];
const ACTIVITES  = Object.keys(FACTEURS_ACTIVITE); // Sédentaire … Très actif
const CONDITIONS = ['Hypertension', 'Diabète', 'Cholestérol', 'Aucune'];
const ALLERGIES  = ['Arachides', 'Crevettes', 'Gluten', 'Lactose', 'Aucune'];

const TOTAL_ETAPES = 7;

/* ───────────────────────── Petits composants UI ───────────────────────── */
function ChoiceCard({ label, icon, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.choice, selected && styles.choiceOn]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={22}
          color={selected ? COLORS.cream : COLORS.sage}
        />
      )}
      <Text style={[styles.choiceTxt, selected && styles.choiceTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipOn]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.chipTxt, selected && styles.chipTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function NumField({ icon, placeholder, suffix, value, onChange }) {
  return (
    <View style={styles.numField}>
      <MaterialIcons name={icon} size={20} color={COLORS.muted} />
      <TextInput
        style={styles.numInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        maxLength={3}
      />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

/* ─────────────────────────── Écran principal ───────────────────────────── */
export default function OnboardingScreen({ navigation }) {
  const { setSession } = useContext(AuthContext);
  const { updateProfil } = useContext(ProfileContext);

  const [etape, setEtape] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Données collectées
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', motDePasse: '',
    sexe: null, age: '', poids: '', taille: '',
    objectif: null, niveauActivite: null,
    conditions: [], allergies: [],
  });

  const set = (champ, val) => setForm((f) => ({ ...f, [champ]: val }));

  const toggleListe = (champ, val) => setForm((f) => {
    if (val === 'Aucune' || val === 'Aucun') return { ...f, [champ]: [] };
    const liste = f[champ].includes(val)
      ? f[champ].filter((x) => x !== val)
      : [...f[champ], val];
    return { ...f, [champ]: liste };
  });

  // Profil numérique dérivé pour les calculs du récap
  const profilCalcul = useMemo(() => ({
    sexe: form.sexe,
    age: Number(form.age) || null,
    poids: Number(form.poids) || null,
    taille: Number(form.taille) || null,
    objectif: form.objectif,
    niveauActivite: form.niveauActivite,
  }), [form]);

  const imc      = calculerIMC(profilCalcul.poids, profilCalcul.taille);
  const calories = calculerCaloriesObjectif(profilCalcul);

  /* ── Validation par étape ── */
  function etapeValide() {
    switch (etape) {
      case 0: return form.prenom.trim() && form.email.includes('@') && form.motDePasse.length >= 6;
      case 1: return !!form.sexe && Number(form.age) >= 10 && Number(form.age) <= 100;
      case 2: return Number(form.poids) >= 30 && Number(form.taille) >= 100;
      case 3: return !!form.objectif;
      case 4: return !!form.niveauActivite;
      case 5: return true; // conditions/allergies facultatives
      default: return true;
    }
  }

  function suivant() {
    setErreur(null);
    if (!etapeValide()) {
      setErreur('Merci de compléter correctement cette étape.');
      return;
    }
    if (etape < TOTAL_ETAPES - 1) setEtape((e) => e + 1);
  }

  function precedent() {
    setErreur(null);
    if (etape === 0) navigation.goBack();
    else setEtape((e) => e - 1);
  }

  /* ── Soumission finale ── */
  async function finaliser() {
    setErreur(null);
    setLoading(true);

    // 1) Inscription backend (champs acceptés par RegisterRequest)
    const res = await registerRequest({
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      email: form.email.trim().toLowerCase(),
      motDePasse: form.motDePasse,
      poids: Number(form.poids),
      taille: Number(form.taille),
      objectif: form.objectif,
    });

    if (!res.ok) {
      setLoading(false);
      setErreur(res.message);
      return;
    }

    // 2) Profil local complet (avec sexe/âge/activité que le backend ignore)
    updateProfil({
      userId: res.data?.userId,
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      email: form.email.trim().toLowerCase(),
      sexe: form.sexe,
      age: Number(form.age),
      poids: Number(form.poids),
      taille: Number(form.taille),
      objectif: form.objectif,
      niveauActivite: form.niveauActivite,
      conditions: form.conditions,
      allergies: form.allergies,
      caloriesObjectif: calories, // calcul précis local (prime sur le backend)
    });

    // 3) Session → RootNavigator bascule vers Main
    await setSession(res.data.token);
    setLoading(false);
  }

  /* ── Contenu par étape ── */
  function renderEtape() {
    switch (etape) {
      case 0:
        return (
          <>
            <Text style={styles.q}>Créons ton compte</Text>
            <Text style={styles.help}>Tes identifiants de connexion.</Text>
            <View style={styles.field}>
              <MaterialIcons name="person-outline" size={20} color={COLORS.muted} />
              <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor={COLORS.muted}
                value={form.prenom} onChangeText={(v) => set('prenom', v)} />
            </View>
            <View style={styles.field}>
              <MaterialIcons name="badge" size={20} color={COLORS.muted} />
              <TextInput style={styles.input} placeholder="Nom (facultatif)" placeholderTextColor={COLORS.muted}
                value={form.nom} onChangeText={(v) => set('nom', v)} />
            </View>
            <View style={styles.field}>
              <MaterialIcons name="mail-outline" size={20} color={COLORS.muted} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.muted}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                value={form.email} onChangeText={(v) => set('email', v)} />
            </View>
            <View style={styles.field}>
              <MaterialIcons name="lock-outline" size={20} color={COLORS.muted} />
              <TextInput style={styles.input} placeholder="Mot de passe (6+ caractères)"
                placeholderTextColor={COLORS.muted} secureTextEntry
                value={form.motDePasse} onChangeText={(v) => set('motDePasse', v)} />
            </View>
          </>
        );
      case 1:
        return (
          <>
            <Text style={styles.q}>Parle-nous de toi</Text>
            <Text style={styles.help}>Pour calculer ton métabolisme de base.</Text>
            <View style={styles.row}>
              {SEXES.map((s) => (
                <ChoiceCard key={s} label={s}
                  icon={s === 'Homme' ? 'male' : 'female'}
                  selected={form.sexe === s} onPress={() => set('sexe', s)} />
              ))}
            </View>
            <NumField icon="cake" placeholder="Âge" suffix="ans"
              value={form.age} onChange={(v) => set('age', v.replace(/[^0-9]/g, ''))} />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.q}>Tes mensurations</Text>
            <Text style={styles.help}>Indispensables pour l'IMC et les calories.</Text>
            <NumField icon="monitor-weight" placeholder="Poids" suffix="kg"
              value={form.poids} onChange={(v) => set('poids', v.replace(/[^0-9]/g, ''))} />
            <NumField icon="height" placeholder="Taille" suffix="cm"
              value={form.taille} onChange={(v) => set('taille', v.replace(/[^0-9]/g, ''))} />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.q}>Ton objectif</Text>
            <Text style={styles.help}>On adapte tes calories en conséquence.</Text>
            {OBJECTIFS.map((o) => (
              <ChoiceCard key={o} label={o}
                icon={o === 'Perte de poids' ? 'trending-down'
                  : o === 'Prise de masse' ? 'trending-up' : 'balance'}
                selected={form.objectif === o} onPress={() => set('objectif', o)} />
            ))}
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.q}>Ton niveau d'activité</Text>
            <Text style={styles.help}>Bouge-tu beaucoup au quotidien ?</Text>
            {ACTIVITES.map((a) => (
              <ChoiceCard key={a} label={a} icon="directions-run"
                selected={form.niveauActivite === a} onPress={() => set('niveauActivite', a)} />
            ))}
          </>
        );
      case 5:
        return (
          <>
            <Text style={styles.q}>Santé & allergies</Text>
            <Text style={styles.help}>On écartera les plats à risque pour toi.</Text>
            <Text style={styles.sub}>Conditions médicales</Text>
            <View style={styles.chipsWrap}>
              {CONDITIONS.map((c) => (
                <Chip key={c} label={c}
                  selected={c === 'Aucune' ? form.conditions.length === 0 : form.conditions.includes(c)}
                  onPress={() => toggleListe('conditions', c)} />
              ))}
            </View>
            <Text style={[styles.sub, { marginTop: 18 }]}>Allergies</Text>
            <View style={styles.chipsWrap}>
              {ALLERGIES.map((a) => (
                <Chip key={a} label={a}
                  selected={a === 'Aucune' ? form.allergies.length === 0 : form.allergies.includes(a)}
                  onPress={() => toggleListe('allergies', a)} />
              ))}
            </View>
          </>
        );
      case 6:
        return (
          <>
            <Text style={styles.q}>Ton profil est prêt 🎉</Text>
            <Text style={styles.help}>Voici ce qu'on a calculé pour toi.</Text>
            <View style={styles.recapRow}>
              <View style={styles.recapCard}>
                <Text style={styles.recapVal}>{imc ?? '—'}</Text>
                <Text style={styles.recapLbl}>IMC</Text>
                <Text style={styles.recapBadge}>{categorieIMC(imc)}</Text>
              </View>
              <View style={styles.recapCard}>
                <Text style={styles.recapVal}>{calories ? calories.toLocaleString() : '—'}</Text>
                <Text style={styles.recapLbl}>kcal / jour</Text>
                <Text style={styles.recapBadge}>{form.objectif}</Text>
              </View>
            </View>
            <Text style={styles.recapNote}>
              Tu pourras ajuster ces valeurs à tout moment depuis ton profil.
            </Text>
          </>
        );
      default: return null;
    }
  }

  const dernier = etape === TOTAL_ETAPES - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* En-tête : retour + barre de progression */}
        <View style={styles.top}>
          <TouchableOpacity onPress={precedent} style={styles.back}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.forest} />
          </TouchableOpacity>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${((etape + 1) / TOTAL_ETAPES) * 100}%` }]} />
          </View>
          <Text style={styles.progressTxt}>{etape + 1}/{TOTAL_ETAPES}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {renderEtape()}
          {erreur && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={COLORS.danger} />
              <Text style={styles.errorTxt}>{erreur}</Text>
            </View>
          )}
        </ScrollView>

        {/* Bouton d'action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, (!etapeValide() || loading) && { opacity: 0.55 }]}
            onPress={dernier ? finaliser : suivant}
            disabled={!etapeValide() || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={COLORS.cream} />
              : <Text style={styles.ctaTxt}>{dernier ? 'Démarrer mon parcours' : 'Continuer'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────── Styles ────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },

  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  back: { padding: 4 },
  progressBg: { flex: 1, height: 6, backgroundColor: 'rgba(28,58,46,0.1)', borderRadius: 6 },
  progressFill: { height: 6, backgroundColor: COLORS.sage, borderRadius: 6 },
  progressTxt: { fontSize: 12, color: COLORS.muted, width: 34, textAlign: 'right' },

  body: { padding: 24, paddingBottom: 8 },
  q: { fontSize: 26, fontWeight: '700', color: COLORS.forest, marginTop: 8 },
  help: { fontSize: 14, color: COLORS.muted, marginTop: 6, marginBottom: 24 },
  sub: { fontSize: 13, fontWeight: '600', color: COLORS.forest, marginBottom: 10 },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, height: 54, marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.forest },

  row: { flexDirection: 'row', gap: 12, marginBottom: 8 },

  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, padding: 16, marginBottom: 12, flex: 1,
  },
  choiceOn: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  choiceTxt: { fontSize: 15, fontWeight: '600', color: COLORS.forest },
  choiceTxtOn: { color: COLORS.cream },

  numField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, height: 56, marginBottom: 12,
  },
  numInput: { flex: 1, fontSize: 18, fontWeight: '600', color: COLORS.forest },
  suffix: { fontSize: 14, color: COLORS.muted },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9,
  },
  chipOn: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  chipTxt: { fontSize: 13, color: COLORS.forest, fontWeight: '500' },
  chipTxtOn: { color: COLORS.cream },

  recapRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  recapCard: {
    flex: 1, backgroundColor: COLORS.forest, borderRadius: 16, padding: 18, alignItems: 'center',
  },
  recapVal: { fontSize: 30, fontWeight: '700', color: COLORS.cream },
  recapLbl: { fontSize: 11, color: COLORS.creamMuted, marginTop: 2 },
  recapBadge: {
    fontSize: 11, color: COLORS.cream, backgroundColor: 'rgba(61,107,82,0.6)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 10, overflow: 'hidden',
  },
  recapNote: { fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: 20, lineHeight: 18 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 10, padding: 10, marginTop: 14,
  },
  errorTxt: { color: COLORS.danger, fontSize: 13, flex: 1 },

  footer: { padding: 24, paddingTop: 8 },
  cta: {
    backgroundColor: COLORS.forest, borderRadius: 14, height: 54,
    justifyContent: 'center', alignItems: 'center',
  },
  ctaTxt: { color: COLORS.cream, fontSize: 16, fontWeight: '700' },
});
