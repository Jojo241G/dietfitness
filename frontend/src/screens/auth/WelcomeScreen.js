import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

/**
 * Écran d'accueil épuré : deux actions seulement.
 * « S'inscrire » → Onboarding   |   « Se connecter » → Login
 */
export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.forest} />

      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <MaterialIcons name="eco" size={44} color={COLORS.cream} />
        </View>
        <Text style={styles.brand}>DietFitness</Text>
        <Text style={styles.tagline}>
          Ta santé, nos saveurs.{'\n'}Nutrition & fitness pensés pour l'Afrique.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.primaryTxt}>S'inscrire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryTxt}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe : { flex: 1, backgroundColor: COLORS.forest },
  hero : { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.sage,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  brand   : { fontSize: 34, fontWeight: '700', color: COLORS.cream, letterSpacing: 0.5 },
  tagline : { fontSize: 15, color: COLORS.creamMuted, textAlign: 'center', marginTop: 12, lineHeight: 22 },

  actions : { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  primaryBtn: {
    backgroundColor: COLORS.cream,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  primaryTxt : { color: COLORS.forest, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: COLORS.creamMuted,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  secondaryTxt: { color: COLORS.cream, fontSize: 16, fontWeight: '600' },
});
