import React, { useState, useContext, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  forest:  '#1c3a2e',
  sage:    '#3d6b52',
  cream:   '#f7f3ec',
  white:   '#ffffff',
  muted:   '#6b7a6e',
  border:  'rgba(28,58,46,0.1)',
  orange:  '#e07b39',
  gold:    '#d4a017',
  blue:    '#2980b9',
  purple:  '#8e44ad',
  pink:    '#e91e8c',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tempsRelatif(date) {
  const diff = (Date.now() - date) / 1000;
  if (diff < 60)   return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

function avatarInitiales(nom) {
  if (!nom) return '?';
  return nom.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Posts fictifs de la communauté camerounaise ──────────────────────────────
const POSTS_COMMUNAUTE = [
  {
    id: 'c1',
    auteur: 'Ahmadou K.',
    couleurAvatar: C.orange,
    message: '🔥 Incroyable ! 450 kcal brûlées sur le parcours Débutant aujourd'hui. Le GPS ne ment pas !',
    temps: Date.now() - 12 * 60 * 1000,
    likes: 14,
    type: 'parcours',
    icone: 'directions-run',
    detail: '5,2 km · 45 min · Yaoundé-Centre',
  },
  {
    id: 'c2',
    auteur: 'Marie T.',
    couleurAvatar: C.pink,
    message: '💧 Objectif Eau du jour validé ! 2,5 litres bus. Santé avant tout, les amis.',
    temps: Date.now() - 35 * 60 * 1000,
    likes: 9,
    type: 'eau',
    icone: 'water-drop',
    detail: '2,5 L atteints',
  },
  {
    id: 'c3',
    auteur: 'Jean-Pierre N.',
    couleurAvatar: C.blue,
    message: '💪 5e jour consécutif de pompes ! 4 séries de 20 ce matin avant le travail. On ne s'arrête plus !',
    temps: Date.now() - 2 * 3600 * 1000,
    likes: 22,
    type: 'exercice',
    icone: 'fitness-center',
    detail: 'Pompes · 80 reps',
  },
  {
    id: 'c4',
    auteur: 'Fatima B.',
    couleurAvatar: C.purple,
    message: '🥗 Ndolè sans allergènes préparé selon les recommandations de l'app ! Merci pour le moteur d'allergies.',
    temps: Date.now() - 4 * 3600 * 1000,
    likes: 31,
    type: 'nutrition',
    icone: 'restaurant',
    detail: 'Ndolè · 320 kcal',
  },
  {
    id: 'c5',
    auteur: 'Samuel E.',
    couleurAvatar: C.sage,
    message: '🏃 10 km bouclés sur le parcours Intermédiaire de Douala. Nouveau record personnel !',
    temps: Date.now() - 6 * 3600 * 1000,
    likes: 18,
    type: 'parcours',
    icone: 'emoji-events',
    detail: '10 km · 58 min',
  },
  {
    id: 'c6',
    auteur: 'Brigitte A.',
    couleurAvatar: C.gold,
    message: '🎯 Semaine complète : 7 séances fitness validées ! Le coach IA m'a beaucoup aidée.',
    temps: Date.now() - 18 * 3600 * 1000,
    likes: 45,
    type: 'objectif',
    icone: 'star',
    detail: '7 séances · Semaine 22',
  },
];

// ─── Défis collectifs ─────────────────────────────────────────────────────────
const DEFIS_INITIAUX = [
  {
    id: 'd1',
    titre: 'Défi Yaoundé → Douala',
    description: 'Objectif communautaire : 100 000 pas cette semaine pour symboliser le trajet Yaoundé–Douala !',
    icone: 'directions-run',
    couleur: C.forest,
    objectif: 100000,
    progression: 67420,
    participants: 38,
    unite: 'pas',
    fin: 'Dimanche 23h59',
  },
  {
    id: 'd2',
    titre: 'Hydratation Collective',
    description: 'Ensemble, atteignons 200 litres d'eau consommée par la communauté cette semaine.',
    icone: 'water-drop',
    couleur: C.blue,
    objectif: 200,
    progression: 134,
    participants: 24,
    unite: 'litres',
    fin: 'Dimanche 23h59',
  },
  {
    id: 'd3',
    titre: 'Calories Brûlées Groupe',
    description: 'Brûler 50 000 kcal ensemble ce mois-ci. Chaque exercice validé compte !',
    icone: 'local-fire-department',
    couleur: C.orange,
    objectif: 50000,
    progression: 31850,
    participants: 52,
    unite: 'kcal',
    fin: '30 juin 23h59',
  },
];

// ─── Composant Carte Post ─────────────────────────────────────────────────────
function CartePost({ post, onLike }) {
  const [aime, setAime] = useState(false);
  const scaleRef = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(scaleRef, { toValue: 1.3, useNativeDriver: true, tension: 200 }),
      Animated.spring(scaleRef, { toValue: 1, useNativeDriver: true }),
    ]).start();
    setAime((v) => !v);
    onLike(post.id, !aime);
  };

  return (
    <View style={ps.carte}>
      {/* Avatar + nom + temps */}
      <View style={ps.entete}>
        <View style={[ps.avatar, { backgroundColor: post.couleurAvatar }]}>
          <Text style={ps.avatarTxt}>{avatarInitiales(post.auteur)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ps.auteur}>{post.auteur}</Text>
          <Text style={ps.temps}>{tempsRelatif(post.temps)}</Text>
        </View>
        <View style={[ps.typePuce, { backgroundColor: post.couleurAvatar + '22' }]}>
          <MaterialIcons name={post.icone} size={14} color={post.couleurAvatar} />
        </View>
      </View>

      {/* Message */}
      <Text style={ps.message}>{post.message}</Text>

      {/* Détail (chip) */}
      {post.detail && (
        <View style={ps.detailChip}>
          <MaterialIcons name={post.icone} size={13} color={C.sage} />
          <Text style={ps.detailTxt}>{post.detail}</Text>
        </View>
      )}

      {/* Bouton like */}
      <View style={ps.actions}>
        <TouchableOpacity style={ps.likeBtn} onPress={handleLike} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale: scaleRef }] }}>
            <MaterialIcons
              name={aime ? 'favorite' : 'favorite-border'}
              size={20}
              color={aime ? '#e74c3c' : C.muted}
            />
          </Animated.View>
          <Text style={[ps.likeTxt, aime && { color: '#e74c3c' }]}>
            {post.likes + (aime ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={ps.likeBtn} activeOpacity={0.8}>
          <MaterialIcons name="chat-bubble-outline" size={18} color={C.muted} />
          <Text style={ps.likeTxt}>Répondre</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  carte: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  entete:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar:    { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: C.white, fontWeight: '800', fontSize: 15 },
  auteur:    { fontWeight: '700', color: C.forest, fontSize: 14 },
  temps:     { color: C.muted, fontSize: 11, marginTop: 1 },
  typePuce:  { borderRadius: 20, padding: 6 },
  message:   { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 10 },
  detailChip:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.cream,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  detailTxt: { fontSize: 12, color: C.sage, fontWeight: '600' },
  actions:   { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  likeBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  likeTxt:   { color: C.muted, fontSize: 13 },
});

// ─── Composant Carte Défi ─────────────────────────────────────────────────────
function CarteDéfi({ defi, contribution }) {
  const pct = Math.min((defi.progression + contribution) / defi.objectif, 1);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const largeurBarre = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const valActuelle = defi.progression + contribution;
  const pctAffiche  = Math.min(Math.round(pct * 100), 100);

  return (
    <View style={ds.carte}>
      {/* En-tête */}
      <View style={[ds.entete, { backgroundColor: defi.couleur }]}>
        <MaterialIcons name={defi.icone} size={22} color={C.white} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={ds.titre}>{defi.titre}</Text>
          <Text style={ds.fin}>⏳ Fin : {defi.fin}</Text>
        </View>
        <View style={ds.participants}>
          <MaterialIcons name="group" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={ds.participantsTxt}>{defi.participants}</Text>
        </View>
      </View>

      {/* Corps */}
      <View style={ds.corps}>
        <Text style={ds.description}>{defi.description}</Text>

        {/* Barre de progression */}
        <View style={ds.barreWrapper}>
          <Animated.View
            style={[ds.barreRemplie, { width: largeurBarre, backgroundColor: defi.couleur }]}
          />
        </View>

        {/* Chiffres */}
        <View style={ds.chiffresRow}>
          <Text style={ds.chiffres}>
            {valActuelle.toLocaleString()} / {defi.objectif.toLocaleString()} {defi.unite}
          </Text>
          <Text style={[ds.pct, { color: defi.couleur }]}>{pctAffiche}%</Text>
        </View>

        {/* Ta contribution */}
        {contribution > 0 && (
          <View style={[ds.contribPuce, { borderColor: defi.couleur + '55' }]}>
            <MaterialIcons name="person" size={13} color={defi.couleur} />
            <Text style={[ds.contribTxt, { color: defi.couleur }]}>
              Ta contribution : +{contribution.toLocaleString()} {defi.unite}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  carte: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  entete:         { flexDirection: 'row', alignItems: 'center', padding: 14 },
  titre:          { color: C.white, fontWeight: '800', fontSize: 15 },
  fin:            { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  participants:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  participantsTxt:{ color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  corps:          { padding: 14 },
  description:    { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 12 },
  barreWrapper:   { height: 10, backgroundColor: '#e8e5df', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  barreRemplie:   { height: '100%', borderRadius: 5 },
  chiffresRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chiffres:       { fontSize: 13, color: C.muted },
  pct:            { fontWeight: '800', fontSize: 16 },
  contribPuce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  contribTxt:     { fontSize: 12, fontWeight: '600' },
});

// ─── Écran principal CommunityScreen ─────────────────────────────────────────
export default function CommunityScreen() {
  const { profil, jour } = useContext(ProfileContext) || {};
  const prenom = profil?.prenom || 'Moi';

  // Onglet actif : 'feed' | 'defis'
  const [onglet, setOnglet] = useState('feed');

  // Posts du fil (fixes + les siens)
  const [posts, setPosts]   = useState(POSTS_COMMUNAUTE);
  const [texte, setTexte]   = useState('');
  const [pubEnCours, setPubEnCours] = useState(false);

  // Défis + contribution temps réel depuis ProfileContext
  const [defis] = useState(DEFIS_INITIAUX);

  // Contribution calculée depuis le contexte du jour
  const contributionPas   = jour?.pas        || 0;
  const contributionKcal  = jour?.kcalBrulees || 0;
  const contributionEau   = jour?.eauConsommee || 0;

  const contribParDefi = {
    d1: contributionPas,
    d2: contributionEau,
    d3: contributionKcal,
  };

  // Publier un exploit manuellement
  const publier = useCallback(() => {
    if (!texte.trim()) return;
    setPubEnCours(true);
    const nouveauPost = {
      id: `user_${Date.now()}`,
      auteur: `${prenom} (Moi)`,
      couleurAvatar: C.forest,
      message: texte.trim(),
      temps: Date.now(),
      likes: 0,
      type: 'perso',
      icone: 'emoji-events',
      detail: null,
    };
    setPosts((prev) => [nouveauPost, ...prev]);
    setTexte('');
    setPubEnCours(false);
  }, [texte, prenom]);

  // Publier un exploit auto (depuis le contexte)
  const publierExploit = useCallback((typeExploit) => {
    let message = '';
    let icone   = 'emoji-events';
    let detail  = null;

    if (typeExploit === 'kcal' && contributionKcal > 0) {
      message = `🔥 Je viens de brûler ${contributionKcal} kcal aujourd'hui grâce à mes exercices fitness !`;
      icone   = 'local-fire-department';
      detail  = `${contributionKcal} kcal brûlées`;
    } else if (typeExploit === 'pas' && contributionPas > 0) {
      message = `🚶 ${contributionPas.toLocaleString()} pas effectués aujourd'hui. Je contribue au défi collectif !`;
      icone   = 'directions-walk';
      detail  = `${contributionPas.toLocaleString()} pas`;
    } else if (typeExploit === 'eau' && contributionEau > 0) {
      message = `💧 Objectif eau atteint : ${contributionEau} L consommés aujourd'hui. Hydratation réussie !`;
      icone   = 'water-drop';
      detail  = `${contributionEau} L`;
    } else {
      return; // rien à publier
    }

    const nouveauPost = {
      id: `auto_${typeExploit}_${Date.now()}`,
      auteur: `${prenom} (Moi)`,
      couleurAvatar: C.forest,
      message,
      temps: Date.now(),
      likes: 0,
      type: typeExploit,
      icone,
      detail,
    };
    setPosts((prev) => [nouveauPost, ...prev]);
    setOnglet('feed'); // basculer sur le fil
  }, [contributionKcal, contributionPas, contributionEau, prenom]);

  const handleLike = useCallback((postId, aime) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: Math.max(0, p.likes + (aime ? 1 : -1)) }
          : p
      )
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.forest} />

      {/* ── En-tête ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Communauté</Text>
          <Text style={styles.headerSub}>Espace social fitness · Cameroun 🇨🇲</Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialIcons name="group" size={16} color={C.cream} />
          <Text style={styles.headerBadgeTxt}>{posts.length + 114} membres</Text>
        </View>
      </View>

      {/* ── Barre de partage rapide (contexte live) ── */}
      <View style={styles.shareBar}>
        <Text style={styles.shareBarLabel}>Partage ton exploit :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shareScroll}>
          <TouchableOpacity
            style={[styles.shareChip, contributionKcal === 0 && styles.shareChipDisabled]}
            onPress={() => publierExploit('kcal')}
            disabled={contributionKcal === 0}
            activeOpacity={0.8}
          >
            <MaterialIcons name="local-fire-department" size={14} color={contributionKcal > 0 ? C.orange : C.muted} />
            <Text style={[styles.shareChipTxt, contributionKcal === 0 && { color: C.muted }]}>
              {contributionKcal > 0 ? `🔥 ${contributionKcal} kcal` : 'Kcal (vide)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareChip, contributionPas === 0 && styles.shareChipDisabled]}
            onPress={() => publierExploit('pas')}
            disabled={contributionPas === 0}
            activeOpacity={0.8}
          >
            <MaterialIcons name="directions-walk" size={14} color={contributionPas > 0 ? C.forest : C.muted} />
            <Text style={[styles.shareChipTxt, contributionPas === 0 && { color: C.muted }]}>
              {contributionPas > 0 ? `👟 ${contributionPas.toLocaleString()} pas` : 'Pas (vide)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareChip, contributionEau === 0 && styles.shareChipDisabled]}
            onPress={() => publierExploit('eau')}
            disabled={contributionEau === 0}
            activeOpacity={0.8}
          >
            <MaterialIcons name="water-drop" size={14} color={contributionEau > 0 ? C.blue : C.muted} />
            <Text style={[styles.shareChipTxt, contributionEau === 0 && { color: C.muted }]}>
              {contributionEau > 0 ? `💧 ${contributionEau} L` : 'Eau (vide)'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Onglets ── */}
      <View style={styles.onglets}>
        <TouchableOpacity
          style={[styles.onglet, onglet === 'feed' && styles.ongletActif]}
          onPress={() => setOnglet('feed')}
        >
          <MaterialIcons name="dynamic-feed" size={16} color={onglet === 'feed' ? C.forest : C.muted} />
          <Text style={[styles.ongletTxt, onglet === 'feed' && styles.ongletTxtActif]}>Fil d'actu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.onglet, onglet === 'defis' && styles.ongletActif]}
          onPress={() => setOnglet('defis')}
        >
          <MaterialIcons name="emoji-events" size={16} color={onglet === 'defis' ? C.forest : C.muted} />
          <Text style={[styles.ongletTxt, onglet === 'defis' && styles.ongletTxtActif]}>Défis collectifs</Text>
        </TouchableOpacity>
      </View>

      {/* ── Contenu ── */}
      {onglet === 'feed' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Zone de saisie libre */}
          <View style={styles.inputZone}>
            <TextInput
              style={styles.input}
              placeholder="Partage un exploit ou un conseil…"
              placeholderTextColor={C.muted}
              value={texte}
              onChangeText={setTexte}
              multiline
              maxLength={280}
            />
            <TouchableOpacity
              style={[styles.btnPub, (!texte.trim() || pubEnCours) && styles.btnPubDisabled]}
              onPress={publier}
              disabled={!texte.trim() || pubEnCours}
              activeOpacity={0.85}
            >
              <MaterialIcons name="send" size={18} color={C.white} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CartePost post={item} onLike={handleLike} />}
            contentContainerStyle={styles.liste}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={styles.liste} showsVerticalScrollIndicator={false}>
          <Text style={styles.defisTitre}>🏆 Challenges de la semaine</Text>
          <Text style={styles.defisUnder}>
            Tes pas, tes calories et ton eau s'ajoutent automatiquement à la progression collective.
          </Text>
          {defis.map((d) => (
            <CarteDéfi key={d.id} defi={d} contribution={contribParDefi[d.id] || 0} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f0ede6' },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    backgroundColor: C.forest,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle:      { fontSize: 22, fontWeight: '800', color: C.cream },
  headerSub:        { fontSize: 12, color: 'rgba(247,243,236,0.7)', marginTop: 2 },
  headerBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    backgroundColor:'rgba(255,255,255,0.12)',
    borderRadius:   20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerBadgeTxt:   { color: C.cream, fontSize: 12, fontWeight: '600' },

  shareBar: {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  shareBarLabel:    { fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  shareScroll:      { flexGrow: 0 },
  shareChip: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    backgroundColor: C.cream,
    borderRadius:   20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight:    8,
  },
  shareChipDisabled:{ opacity: 0.45 },
  shareChipTxt:     { fontSize: 13, color: C.forest, fontWeight: '600' },

  onglets: {
    flexDirection:  'row',
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  onglet: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  ongletActif:      { borderBottomColor: C.forest },
  ongletTxt:        { fontSize: 14, color: C.muted, fontWeight: '500' },
  ongletTxtActif:   { color: C.forest, fontWeight: '700' },

  inputZone: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    gap:            10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  input: {
    flex:           1,
    minHeight:      42,
    maxHeight:      100,
    backgroundColor: C.cream,
    borderRadius:   12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize:       14,
    color:          '#333',
  },
  btnPub: {
    backgroundColor: C.sage,
    borderRadius:   12,
    padding:        12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnPubDisabled:   { backgroundColor: '#b0c4b1' },

  liste:            { padding: 16 },

  defisTitre:       { fontSize: 18, fontWeight: '800', color: C.forest, marginBottom: 4 },
  defisUnder:       { fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 18 },
});