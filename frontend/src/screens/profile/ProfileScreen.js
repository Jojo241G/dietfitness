import React, { useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext }    from '../../context/AuthContext';
import { ProfileContext } from '../../context/ProfileContext';
import {
  calculerIMC, categorieIMC, calculerCaloriesObjectif,
} from '../../services/healthCalculations';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  forest : '#1c3a2e',
  sage   : '#3d6b52',
  cream  : '#f7f3ec',
  white  : '#ffffff',
  muted  : '#6b7a6e',
  border : 'rgba(28,58,46,0.08)',
  danger : '#c0392b',
  warning: '#d4a017',
};

// ─── Calculs (délégués au moteur partagé) ────────────────────────────────────
function labelIMC(imc) {
  const label = categorieIMC(imc);
  if (imc == null) return { label: '—', color: C.muted };
  if (imc < 18.5) return { label, color: C.warning };
  if (imc < 25)   return { label, color: C.sage   };
  if (imc < 30)   return { label, color: C.warning };
  return            { label, color: C.danger  };
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelRow}>
        <MaterialIcons name={icon} size={16} color={C.muted} style={{ marginRight: 8 }} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value || '—'}</Text>
    </View>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.divider} />
      {children}
    </View>
  );
}

function TagRow({ items }) {
  if (!items || items.length === 0) return <Text style={styles.tagNone}>Aucune</Text>;
  return (
    <View style={styles.tagRow}>
      {items.map((item, i) => (
        <View key={i} style={styles.tag}>
          <Text style={styles.tagText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { logout }  = useContext(AuthContext);
  const { profil }  = useContext(ProfileContext);

  const imc         = calculerIMC(profil?.poids, profil?.taille);
  const { label: imcLabel, color: imcColor } = labelIMC(imc);
  const besoins     = profil?.caloriesObjectif || calculerCaloriesObjectif(profil);

  // Initiales pour l'avatar
  const initiales = profil?.prenom
    ? profil.prenom.substring(0, 2).toUpperCase()
    : 'DF';

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Es-tu sûr(e) de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── En-tête vert forêt ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initiales}</Text>
        </View>
        <Text style={styles.headerName}>
          {profil?.prenom ? `${profil.prenom}` : 'Mon profil'}
        </Text>
        <View style={styles.objectifBadge}>
          <Text style={styles.objectifText}>
            {profil?.objectif || 'Objectif non défini'}
          </Text>
        </View>

        {/* IMC + Calories dans l'en-tête */}
        {(imc || besoins) && (
          <View style={styles.statsRow}>
            {imc && (
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{imc}</Text>
                <Text style={styles.statLabel}>IMC</Text>
                <View style={[styles.imcBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Text style={styles.imcBadgeText}>{imcLabel}</Text>
                </View>
              </View>
            )}
            {besoins && (
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{besoins.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Besoins caloriques</Text>
                <View style={[styles.imcBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Text style={styles.imcBadgeText}>kcal/jour</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Corps défilable ── */}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <SectionCard title="Mes informations">
          <InfoRow icon="person"          label="Sexe"    value={profil?.sexe} />
          <InfoRow icon="cake"            label="Âge"     value={profil?.age ? `${profil.age} ans` : null} />
          <InfoRow icon="monitor-weight"  label="Poids"   value={profil?.poids ? `${profil.poids} kg` : null} />
          <InfoRow icon="straighten"      label="Taille"  value={profil?.taille ? `${profil.taille} cm` : null} />
        </SectionCard>

        <SectionCard title="Santé & activité">
          <InfoRow icon="directions-run"  label="Niveau d'activité"    value={profil?.niveauActivite} />
          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <MaterialIcons name="medical-services" size={16} color={C.muted} style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>Conditions médicales</Text>
            </View>
          </View>
          <TagRow items={profil?.conditionsMedicales} />
          <View style={[styles.infoRow, { marginTop: 10 }]}>
            <View style={styles.infoLabelRow}>
              <MaterialIcons name="warning" size={16} color={C.muted} style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>Allergies</Text>
            </View>
          </View>
          <TagRow items={profil?.allergies} />
        </SectionCard>

        <SectionCard title="Progression">
          <InfoRow icon="event-available" label="Membre depuis"        value="Mai 2026" />
          <InfoRow icon="emoji-events"    label="Séances complétées"   value="14" />
          <InfoRow icon="trending-down"   label="Poids perdu"          value="-1.8 kg" valueColor={C.sage} />
        </SectionCard>

        {/* ── Bouton déconnexion ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={18} color={C.danger} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>DietFitness v1.0 · © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  header: {
    backgroundColor : C.forest,
    paddingHorizontal: 20,
    paddingTop       : 28,
    paddingBottom    : 24,
    alignItems       : 'center',
  },
  avatar: {
    width          : 68,
    height         : 68,
    borderRadius   : 20,
    backgroundColor: C.sage,
    justifyContent : 'center',
    alignItems     : 'center',
    marginBottom   : 12,
  },
  avatarText   : { color: C.cream, fontSize: 22, fontWeight: '600' },
  headerName   : { color: C.cream, fontSize: 20, fontWeight: '600', marginBottom: 6 },

  objectifBadge: {
    backgroundColor: 'rgba(61,107,82,0.5)',
    borderRadius   : 20,
    paddingHorizontal: 14,
    paddingVertical  : 4,
    marginBottom   : 16,
  },
  objectifText: { color: C.cream, fontSize: 12 },

  statsRow: {
    flexDirection  : 'row',
    gap            : 12,
    width          : '100%',
  },
  statCard: {
    flex            : 1,
    backgroundColor : 'rgba(247,243,236,0.12)',
    borderRadius    : 14,
    padding         : 14,
    alignItems      : 'center',
  },
  statValue : { color: C.cream, fontSize: 24, fontWeight: '500' },
  statLabel : { color: 'rgba(247,243,236,0.65)', fontSize: 10, marginTop: 2 },
  imcBadge  : { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  imcBadgeText: { color: C.cream, fontSize: 10 },

  body: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: C.white,
    borderRadius   : 16,
    padding        : 16,
    borderWidth    : 1,
    borderColor    : C.border,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: C.forest, marginBottom: 10 },
  divider  : { height: 0.5, backgroundColor: C.border, marginBottom: 10 },

  infoRow: {
    flexDirection  : 'row',
    justifyContent : 'space-between',
    alignItems     : 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel  : { fontSize: 13, color: C.muted },
  infoValue  : { fontSize: 13, fontWeight: '500', color: C.forest },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  tag   : {
    backgroundColor: C.cream,
    borderRadius   : 8,
    paddingHorizontal: 10,
    paddingVertical  : 4,
    borderWidth    : 1,
    borderColor    : 'rgba(28,58,46,0.12)',
  },
  tagText: { fontSize: 11, color: C.forest },
  tagNone: { fontSize: 12, color: C.muted, fontStyle: 'italic', marginBottom: 4 },

  logoutBtn: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'center',
    gap            : 8,
    borderWidth    : 1.5,
    borderColor    : C.danger,
    borderRadius   : 16,
    padding        : 14,
    marginTop      : 8,
  },
  logoutText: { color: C.danger, fontSize: 14, fontWeight: '500' },

  version: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 8 },
});