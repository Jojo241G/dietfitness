import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import { useRunTracker } from '../../hooks/useRunTracker';
import { PARCOURS } from './parcoursData';
import { parler, stopVoix, setVoixActive } from '../../services/voiceGuide';
import {
  formaterDistance, formaterDuree, allureMinKm, caloriesCourse,
} from '../../services/geoUtils';
import { COLORS } from '../../theme/colors';

export default function ParcoursScreen({ navigation }) {
  const { profil, ajouterCaloriesBrulees } = useContext(ProfileContext);
  const poids = profil?.poids || 70;

  const [parcours, setParcours] = useState(null);     // parcours choisi
  const [voix, setVoix]         = useState(true);
  const [indication, setIndication] = useState(null); // dernière indication affichée
  const etapeIndex = useRef(0);
  const caloriesEnregistrees = useRef(false);

  const { enCours, distance, duree, source, permission, erreur, demarrer, arreter, reset } =
    useRunTracker(poids);

  useEffect(() => setVoixActive(voix), [voix]);
  useEffect(() => () => stopVoix(), []);

  // Déclenche les indications du parcours au passage des paliers de distance.
  useEffect(() => {
    if (!enCours || !parcours) return;
    const etapes = parcours.etapes;
    while (etapeIndex.current < etapes.length && distance >= etapes[etapeIndex.current].a) {
      const e = etapes[etapeIndex.current];
      setIndication(e.texte);
      parler(e.texte);
      etapeIndex.current += 1;
    }
  }, [distance, enCours, parcours]);

  const calories = caloriesCourse(distance, duree, poids);
  const allure   = allureMinKm(distance, duree);
  const cible    = parcours?.distanceCible || 0;
  const pct      = cible ? Math.min(Math.round((distance / cible) * 100), 100) : 0;

  const lancer = useCallback(() => {
    etapeIndex.current = 0;
    caloriesEnregistrees.current = false;
    setIndication(null);
    demarrer();
    if (parcours?.etapes?.[0]) {
      // la 1re indication (a:0) sera émise par l'effet ci-dessus
    }
  }, [demarrer, parcours]);

  const terminer = useCallback(() => {
    arreter();
    stopVoix();
    if (!caloriesEnregistrees.current && calories > 0) {
      ajouterCaloriesBrulees(calories);
      caloriesEnregistrees.current = true;
    }
    const bilan = `Séance terminée. ${formaterDistance(distance)} en ${formaterDuree(duree)}, environ ${calories} calories brûlées.`;
    setIndication(bilan);
    if (voix) parler(bilan);
  }, [arreter, calories, distance, duree, ajouterCaloriesBrulees, voix]);

  // ─── Choix du parcours ───
  if (!parcours) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          {navigation && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color={COLORS.cream} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Choisir un parcours</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {PARCOURS.map((p) => (
            <TouchableOpacity key={p.id} style={styles.parcCard} onPress={() => setParcours(p)} activeOpacity={0.85}>
              <View style={styles.parcIcon}>
                <MaterialIcons name="directions-run" size={24} color={COLORS.sage} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.parcNom}>{p.nom}</Text>
                <Text style={styles.parcMeta}>{p.niveau} • {p.duree}</Text>
                <Text style={styles.parcDesc}>{p.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
          <Text style={styles.note}>
            Le GPS suit ta distance réelle quand l'app est ouverte. Si le GPS est
            refusé, le podomètre prend le relais pour estimer la distance.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Séance active ───
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { reset(); setParcours(null); }}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{parcours.nom}</Text>
        <TouchableOpacity onPress={() => setVoix((v) => !v)} style={styles.voixBtn}>
          <MaterialIcons name={voix ? 'volume-up' : 'volume-off'} size={22} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Distance principale */}
        <View style={styles.bigStat}>
          <Text style={styles.bigVal}>{formaterDistance(distance)}</Text>
          <Text style={styles.bigLbl}>distance · objectif {formaterDistance(cible)}</Text>
          <View style={styles.progBg}>
            <View style={[styles.progFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {/* Stats secondaires */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{formaterDuree(duree)}</Text>
            <Text style={styles.statLbl}>durée</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{allure}</Text>
            <Text style={styles.statLbl}>min/km</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{calories}</Text>
            <Text style={styles.statLbl}>kcal</Text>
          </View>
        </View>

        {/* Source de suivi */}
        {enCours && (
          <View style={styles.sourceBadge}>
            <MaterialIcons
              name={source === 'gps' ? 'gps-fixed' : source === 'podometre' ? 'directions-walk' : 'gps-off'}
              size={14}
              color={COLORS.sage}
            />
            <Text style={styles.sourceTxt}>
              {source === 'gps' ? 'Suivi GPS actif' : source === 'podometre' ? 'Suivi par podomètre' : 'En attente du signal…'}
            </Text>
          </View>
        )}

        {/* Indication courante */}
        {indication && (
          <View style={styles.indicCard}>
            <MaterialIcons name="campaign" size={20} color={COLORS.forest} />
            <Text style={styles.indicTxt}>{indication}</Text>
          </View>
        )}

        {erreur && (
          <View style={styles.errBox}>
            <MaterialIcons name="error-outline" size={16} color={COLORS.danger} />
            <Text style={styles.errTxt}>{erreur}</Text>
          </View>
        )}

        {/* Contrôles */}
        {!enCours ? (
          <TouchableOpacity style={styles.startBtn} onPress={lancer} activeOpacity={0.85}>
            <MaterialIcons name="play-arrow" size={24} color={COLORS.cream} />
            <Text style={styles.startTxt}>Démarrer la séance</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopBtn} onPress={terminer} activeOpacity={0.85}>
            <MaterialIcons name="stop" size={24} color={COLORS.cream} />
            <Text style={styles.startTxt}>Terminer</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          Astuce : garde l'application ouverte pendant la course. Sur Expo Go,
          le suivi se met en pause si l'écran se verrouille.
        </Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: { backgroundColor: COLORS.forest, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  headerTitle: { color: COLORS.cream, fontSize: 18, fontWeight: '700', flex: 1 },
  voixBtn: { backgroundColor: 'rgba(247,243,236,0.15)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  body: { padding: 16 },

  parcCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  parcIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#eef5f1', justifyContent: 'center', alignItems: 'center' },
  parcNom: { fontSize: 16, fontWeight: '700', color: COLORS.forest },
  parcMeta: { fontSize: 12, color: COLORS.sage, marginTop: 2, fontWeight: '600' },
  parcDesc: { fontSize: 12, color: COLORS.muted, marginTop: 4 },

  bigStat: { backgroundColor: COLORS.forest, borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 12 },
  bigVal: { color: COLORS.cream, fontSize: 44, fontWeight: '700' },
  bigLbl: { color: COLORS.creamMuted, fontSize: 12, marginTop: 4 },
  progBg: { height: 8, width: '100%', backgroundColor: 'rgba(247,243,236,0.18)', borderRadius: 8, marginTop: 16 },
  progFill: { height: 8, backgroundColor: COLORS.sage, borderRadius: 8 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statVal: { fontSize: 18, fontWeight: '700', color: COLORS.forest },
  statLbl: { fontSize: 10, color: COLORS.muted, marginTop: 2 },

  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', backgroundColor: '#eef5f1', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
  sourceTxt: { fontSize: 12, color: COLORS.sage, fontWeight: '600' },

  indicCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.sage },
  indicTxt: { flex: 1, fontSize: 14, color: COLORS.forest, lineHeight: 20 },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 10, padding: 10, marginBottom: 12 },
  errTxt: { color: COLORS.danger, fontSize: 13, flex: 1 },

  startBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: COLORS.sage, borderRadius: 14, paddingVertical: 16 },
  stopBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: COLORS.danger, borderRadius: 14, paddingVertical: 16 },
  startTxt: { color: COLORS.cream, fontSize: 16, fontWeight: '700' },

  note: { fontSize: 12, color: COLORS.muted, lineHeight: 18, marginTop: 16, textAlign: 'center' },
});
