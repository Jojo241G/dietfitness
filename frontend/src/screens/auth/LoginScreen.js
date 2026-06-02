import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { ProfileContext } from '../../context/ProfileContext';
import { COLORS } from '../../theme/colors';

/**
 * Connexion réelle au backend Spring Boot via AuthContext.login().
 * En cas de succès, on alimente le ProfileContext avec les champs renvoyés
 * par l'AuthResponse, puis RootNavigator bascule automatiquement vers Main.
 */
export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const { updateProfil } = useContext(ProfileContext);

  const [email, setEmail]         = useState('');
  const [motDePasse, setMdp]      = useState('');
  const [showMdp, setShowMdp]     = useState(false);
  const [erreur, setErreur]       = useState(null);
  const [loading, setLoading]     = useState(false);

  async function handleLogin() {
    setErreur(null);
    if (!email.trim() || !motDePasse) {
      setErreur('Renseigne ton email et ton mot de passe.');
      return;
    }
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), motDePasse);
    setLoading(false);

    if (!res.ok) {
      setErreur(res.message);
      return;
    }
    // Pré-remplit le profil local avec ce que renvoie le backend
    const d = res.data;
    updateProfil({
      userId: d.userId,
      prenom: d.prenom, email: d.email, objectif: d.objectif,
      poids: d.poids, taille: d.taille, caloriesObjectif: d.caloriesObjectif,
    });
    // Pas de navigation manuelle : RootNavigator réagit à isAuthenticated.
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.forest} />
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.title}>Bon retour 👋</Text>
          <Text style={styles.subtitle}>Connecte-toi pour continuer ta progression.</Text>

          {/* Email */}
          <View style={styles.field}>
            <MaterialIcons name="mail-outline" size={20} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.field}>
            <MaterialIcons name="lock-outline" size={20} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showMdp}
              value={motDePasse}
              onChangeText={setMdp}
            />
            <TouchableOpacity onPress={() => setShowMdp((v) => !v)}>
              <MaterialIcons
                name={showMdp ? 'visibility-off' : 'visibility'}
                size={20}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          </View>

          {erreur && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={COLORS.danger} />
              <Text style={styles.errorTxt}>{erreur}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={COLORS.cream} />
              : <Text style={styles.btnTxt}>Se connecter</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
            <Text style={styles.link}>
              Pas encore de compte ? <Text style={styles.linkBold}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe : { flex: 1, backgroundColor: COLORS.cream },
  back : { padding: 16 },
  body : { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.forest },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 6, marginBottom: 28 },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, height: 54, marginBottom: 14,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.forest },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(192,57,43,0.08)',
    borderRadius: 10, padding: 10, marginBottom: 14,
  },
  errorTxt: { color: COLORS.danger, fontSize: 13, flex: 1 },

  btn: {
    backgroundColor: COLORS.forest,
    borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center',
    marginTop: 6,
  },
  btnTxt: { color: COLORS.cream, fontSize: 16, fontWeight: '700' },

  link    : { textAlign: 'center', color: COLORS.muted, marginTop: 22, fontSize: 14 },
  linkBold: { color: COLORS.sage, fontWeight: '700' },
});
