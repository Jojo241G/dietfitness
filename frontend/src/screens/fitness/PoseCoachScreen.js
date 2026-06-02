import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import { COLORS } from '../../theme/colors';
import { detectPoseFromUri, evaluateExercisePose, getCoachLabel } from '../../services/poseCoach';

const AUTO_INTERVAL_MS = 2200;

export default function PoseCoachScreen({ route, navigation }) {
  const exercice = route?.params?.exercice;
  const { profil } = useContext(ProfileContext);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const intervalRef = useRef(null);
  const analyzingRef = useRef(false);

  const [isRunning, setIsRunning] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState('neutral');
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Place-toi bien dans le cadre, puis laisse le coach analyser ta posture.');
  const [lastCheck, setLastCheck] = useState('En attente');
  const [error, setError] = useState(null);

  const coachLabel = useMemo(() => getCoachLabel(exercice), [exercice]);
  const poids = profil?.poids || 70;

  const takeSnapshot = useCallback(async () => {
    if (!cameraRef.current || analyzingRef.current) return;
    analyzingRef.current = true;
    setIsAnalyzing(true);
    setError(null);

    try {
      const shot = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        base64: true,
        exif: false,
        skipProcessing: true,
      });

      const source = shot?.base64 ? `data:image/jpeg;base64,${shot.base64}` : shot?.uri;
      if (!source) throw new Error('Impossible de capturer l’image.');
      const pose = await detectPoseFromUri(source);
      const result = evaluateExercisePose(exercice, pose);

      setStatus(result.status);
      setScore(result.score ?? 0);
      setMessage(result.message);
      setLastCheck(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err?.message || 'Échec de l’analyse caméra.');
      setStatus('neutral');
      setScore(0);
    } finally {
      analyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [exercice]);

  useEffect(() => {
    if (!isRunning || !permission?.granted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    takeSnapshot();
    intervalRef.current = setInterval(() => {
      takeSnapshot();
    }, AUTO_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isRunning, permission?.granted, takeSnapshot]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const requestCamera = useCallback(async () => {
    const res = await requestPermission();
    if (!res.granted) setMessage('La caméra est nécessaire pour analyser ta posture en direct.');
  }, [requestPermission]);

  const statusColor = status === 'good' ? COLORS.sage : status === 'correction' ? COLORS.warning : COLORS.muted;
  const statusLabel = status === 'good' ? 'Bonne posture' : status === 'correction' ? 'Correction nécessaire' : 'Analyse en cours';

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionBox}>
          <MaterialIcons name="videocam-off" size={52} color={COLORS.forest} />
          <Text style={styles.title}>Coach IA caméra</Text>
          <Text style={styles.subtitle}>
            Autorise la caméra pour obtenir une vérification visuelle en temps réel sur {coachLabel}.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestCamera} activeOpacity={0.85}>
            <MaterialIcons name="camera-alt" size={20} color={COLORS.cream} />
            <Text style={styles.primaryBtnTxt}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnTxt}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.85}>
          <MaterialIcons name="close" size={24} color={COLORS.cream} />
        </TouchableOpacity>
        <View style={styles.headerTxtWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{coachLabel}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Coach IA caméra · correction visuelle</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsRunning((v) => !v)}
          style={styles.iconBtn}
          activeOpacity={0.85}
        >
          <MaterialIcons name={isRunning ? 'pause' : 'play-arrow'} size={24} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraShell}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          animateShutter={false}
        />
        <View style={styles.overlay}>
          <View style={styles.frame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>

          <View style={styles.statusCard}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusTxt}>{statusLabel}</Text>
            <Text style={styles.statusScore}>{score > 0 ? `${score}/100` : '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Retour du coach</Text>
          <Text style={styles.feedbackMsg}>{message}</Text>
          <Text style={styles.meta}>
            Poids pris en compte : {poids} kg · dernière analyse : {lastCheck}
          </Text>
          {error && <Text style={styles.errorTxt}>{error}</Text>}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={takeSnapshot} activeOpacity={0.85}>
            {isAnalyzing ? (
              <ActivityIndicator color={COLORS.cream} />
            ) : (
              <MaterialIcons name="center-focus-strong" size={20} color={COLORS.cream} />
            )}
            <Text style={styles.actionTxt}>Analyser maintenant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => setIsRunning((v) => !v)}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name={isRunning ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={COLORS.forest}
            />
            <Text style={styles.actionTxtSecondary}>{isRunning ? 'Pause' : 'Reprendre'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Astuce : garde tout ton corps visible, tiens ton téléphone à hauteur de poitrine et reste face à la lumière.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    backgroundColor: COLORS.forest,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(247,243,236,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTxtWrap: { flex: 1 },
  headerTitle: { color: COLORS.cream, fontSize: 17, fontWeight: '700' },
  headerSubtitle: { color: COLORS.creamMuted, fontSize: 12, marginTop: 2 },

  cameraShell: {
    height: 330,
    margin: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#dfe7e0',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  frame: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(247,243,236,0.8)',
    margin: 10,
  },
  cornerTopLeft: { position: 'absolute', top: -2, left: -2, width: 34, height: 34, borderTopWidth: 5, borderLeftWidth: 5, borderColor: COLORS.sage },
  cornerTopRight: { position: 'absolute', top: -2, right: -2, width: 34, height: 34, borderTopWidth: 5, borderRightWidth: 5, borderColor: COLORS.sage },
  cornerBottomLeft: { position: 'absolute', bottom: -2, left: -2, width: 34, height: 34, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: COLORS.sage },
  cornerBottomRight: { position: 'absolute', bottom: -2, right: -2, width: 34, height: 34, borderBottomWidth: 5, borderRightWidth: 5, borderColor: COLORS.sage },

  statusCard: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(247,243,236,0.95)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTxt: { color: COLORS.forest, fontSize: 12, fontWeight: '700' },
  statusScore: { color: COLORS.sage, fontSize: 12, fontWeight: '800' },

  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  feedbackCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feedbackTitle: { fontSize: 16, fontWeight: '700', color: COLORS.forest },
  feedbackMsg: { marginTop: 8, fontSize: 14, color: COLORS.forest, lineHeight: 20 },
  meta: { marginTop: 10, fontSize: 12, color: COLORS.muted },
  errorTxt: { marginTop: 8, fontSize: 12, color: COLORS.danger },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.sage,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionTxt: { color: COLORS.cream, fontSize: 14, fontWeight: '700' },
  actionTxtSecondary: { color: COLORS.forest, fontSize: 14, fontWeight: '700' },

  hint: { marginTop: 12, fontSize: 12, color: COLORS.muted, lineHeight: 18, textAlign: 'center' },

  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { marginTop: 14, fontSize: 24, fontWeight: '800', color: COLORS.forest, textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.forest,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtnTxt: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
  secondaryBtn: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 18 },
  secondaryBtnTxt: { color: COLORS.sage, fontSize: 14, fontWeight: '700' },
});
