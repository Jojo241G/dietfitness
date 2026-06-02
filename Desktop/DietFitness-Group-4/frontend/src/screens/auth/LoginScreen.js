import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';

const COLORS = {
  cream: '#f7f3ec',
  forest: '#1c3a2e',
  sage: '#3d6b52',
  white: '#ffffff',
  muted: '#6b7a6e',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { updateProfile } = useProfile();

  const [etape, setEtape] = useState('login'); // 'login' | 'profil'
  const [loading, setLoading] = useState(false);

  // Champs login
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  // Champs profil
  const [prenom, setPrenom] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [objectif, setObjectif] = useState('perte_de_poids');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');

  const objectifs = [
    { key: 'perte_de_poids', label: '🔥 Perte de poids' },
    { key: 'prise_de_masse', label: '💪 Prise de masse' },
    { key: 'maintien', label: '⚖️ Maintien' },
  ];

  const handleLogin = async () => {
    if (!email.trim() || !motDePasse.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Simulation
    login({ email: email.trim(), id: 1, isAuthenticated: true });
    setLoading(false);
    setEtape('profil');
  };

  const handleSaveProfil = () => {
    if (!prenom.trim() || !poids.trim() || !taille.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le prenom, poids et taille.');
      return;
    }

    const allergiesArray = allergies.trim()
      ? allergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean)
      : [];

    const conditionsArray = conditions.trim()
      ? conditions.split(',').map(c => c.trim().toLowerCase()).filter(Boolean)
      : [];

    updateProfile({
      prenom: prenom.trim(),
      poids: parseFloat(poids),
      taille: parseFloat(taille),
      objectif,
      allergies: allergiesArray,
      conditionsMedicales: conditionsArray,
    });
  };

  // ---------- ECRAN LOGIN ----------
  if (etape === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>

            {/* LOGO */}
            <View style={styles.logoZone}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌿</Text>
              </View>
              <Text style={styles.appName}>DietFitness</Text>
              <Text style={styles.appSlogan}>Bougez. Mangez local. Prouvez-le.</Text>
            </View>

            {/* FORMULAIRE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connexion</Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                value={motDePasse}
                onChangeText={setMotDePasse}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.cream} />
                  : <Text style={styles.btnText}>Se connecter</Text>
                }
              </TouchableOpacity>

              <Text style={styles.hint}>
                Demo : entrez n'importe quel email et mot de passe
              </Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------- ECRAN PROFIL ----------
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.logoZone}>
          <Text style={styles.appName}>Mon Profil</Text>
          <Text style={styles.appSlogan}>Configurez votre experience</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>

          <Text style={styles.label}>Prenom</Text>
          <TextInput
            style={styles.input}
            placeholder="Jean"
            placeholderTextColor={COLORS.muted}
            value={prenom}
            onChangeText={setPrenom}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Poids (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="75"
                placeholderTextColor={COLORS.muted}
                value={poids}
                onChangeText={setPoids}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Taille (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="175"
                placeholderTextColor={COLORS.muted}
                value={taille}
                onChangeText={setTaille}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Objectif</Text>
          <View style={styles.objectifsRow}>
            {objectifs.map(obj => (
              <TouchableOpacity
                key={obj.key}
                style={[
                  styles.objectifBtn,
                  objectif === obj.key && styles.objectifBtnActif
                ]}
                onPress={() => setObjectif(obj.key)}
              >
                <Text style={[
                  styles.objectifText,
                  objectif === obj.key && styles.objectifTextActif
                ]}>
                  {obj.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Allergies (separees par virgule)</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: arachides, gluten, lactose"
            placeholderTextColor={COLORS.muted}
            value={allergies}
            onChangeText={setAllergies}
          />

          <Text style={styles.label}>Conditions medicales (separees par virgule)</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: hypertension, diabete"
            placeholderTextColor={COLORS.muted}
            value={conditions}
            onChangeText={setConditions}
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveProfil}>
            <Text style={styles.btnText}>Commencer DietFitness</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },
  logoZone: { alignItems: 'center', paddingVertical: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '700', color: COLORS.forest },
  appSlogan: { fontSize: 13, color: COLORS.muted, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.forest, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.muted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(28,58,46,0.1)',
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  objectifsRow: { gap: 8 },
  objectifBtn: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(28,58,46,0.2)',
    backgroundColor: COLORS.cream,
  },
  objectifBtnActif: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.forest,
  },
  objectifText: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },
  objectifTextActif: { color: COLORS.cream, fontWeight: '600' },
  btnPrimary: {
    backgroundColor: COLORS.forest,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  btnDisabled: { backgroundColor: 'rgba(28,58,46,0.4)' },
  btnText: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 12 },
});