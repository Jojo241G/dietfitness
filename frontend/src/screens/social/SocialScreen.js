import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import PostCard from '../../components/social/PostCard';
import {
  CATEGORIES, chargerPosts, publierPost, basculerLike,
} from '../../services/socialService';
import { COLORS } from '../../theme/colors';

const FILTRES = ['Tous', ...CATEGORIES];
const PAGE = 8; // taille d'une tranche (pagination côté client)

export default function SocialScreen({ navigation }) {
  const { profil } = useContext(ProfileContext);

  const [tous, setTous]         = useState([]);   // tous les posts chargés
  const [visibles, setVisibles] = useState([]);   // tranche affichée (pagination)
  const [page, setPage]         = useState(1);
  const [filtre, setFiltre]     = useState('Tous');
  const [chargement, setChargement] = useState(true);
  const [refresh, setRefresh]   = useState(false);
  const [message, setMessage]   = useState(null);

  const [likes, setLikes]       = useState({});   // { [postId]: true } optimiste
  const [composerOuvert, setComposer] = useState(false);
  const [nouveauTexte, setNouveauTexte] = useState('');
  const [nouvelleCat, setNouvelleCat]   = useState('General');
  const [envoi, setEnvoi]       = useState(false);

  const charger = useCallback(async (cat) => {
    const res = await chargerPosts(cat === 'Tous' ? null : cat);
    setTous(res.posts);
    setVisibles(res.posts.slice(0, PAGE));
    setPage(1);
    setMessage(res.ok ? null : res.message);
  }, []);

  useEffect(() => {
    setChargement(true);
    charger(filtre).finally(() => setChargement(false));
  }, [filtre, charger]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await charger(filtre);
    setRefresh(false);
  }, [filtre, charger]);

  // Pagination : charge la tranche suivante en fin de liste.
  const chargerPlus = useCallback(() => {
    if (visibles.length >= tous.length) return;
    const next = page + 1;
    setVisibles(tous.slice(0, next * PAGE));
    setPage(next);
  }, [visibles.length, tous, page]);

  // Like optimiste : on met à jour l'UI immédiatement, puis on confirme côté serveur.
  const onLike = useCallback(async (post) => {
    const dejaLike = !!likes[post.id];
    const nouveau = !dejaLike;
    setLikes((m) => ({ ...m, [post.id]: nouveau }));
    setTous((arr) => arr.map((p) => p.id === post.id ? { ...p, likes: (p.likes ?? 0) + (nouveau ? 1 : -1) } : p));
    setVisibles((arr) => arr.map((p) => p.id === post.id ? { ...p, likes: (p.likes ?? 0) + (nouveau ? 1 : -1) } : p));

    const res = await basculerLike(post.id, nouveau);
    if (!res.ok) {
      // rollback en cas d'échec réseau
      setLikes((m) => ({ ...m, [post.id]: dejaLike }));
      setTous((arr) => arr.map((p) => p.id === post.id ? { ...p, likes: post.likes } : p));
      setVisibles((arr) => arr.map((p) => p.id === post.id ? { ...p, likes: post.likes } : p));
    }
  }, [likes]);

  const publier = useCallback(async () => {
    if (!nouveauTexte.trim()) return;
    setEnvoi(true);
    const res = await publierPost({
      userId: profil?.userId || 1,
      auteurPrenom: profil?.prenom || 'Anonyme',
      categorie: nouvelleCat,
      contenu: nouveauTexte.trim(),
    });
    setEnvoi(false);
    if (res.ok) {
      setComposer(false);
      setNouveauTexte('');
      setNouvelleCat('General');
      onRefresh();
    } else {
      setMessage(res.message);
    }
  }, [nouveauTexte, nouvelleCat, profil, onRefresh]);

  // renderItem stable + clé stable = perf FlatList
  const renderItem = useCallback(({ item }) => (
    <PostCard post={item} liked={!!likes[item.id]} onLike={onLike} />
  ), [likes, onLike]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Communauté</Text>
          <Text style={styles.subtitle}>Partage tes performances et défis</Text>
        </View>
        {navigation && (
          <TouchableOpacity style={styles.amisBtn} onPress={() => navigation.navigate('Amis')} activeOpacity={0.85}>
            <MaterialIcons name="groups" size={20} color={COLORS.forest} />
            <Text style={styles.amisBtnTxt}>Mes amis</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtresWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtres}>
          {FILTRES.map((f) => (
            <TouchableOpacity key={f} style={[styles.filtre, filtre === f && styles.filtreOn]} onPress={() => setFiltre(f)}>
              <Text style={[styles.filtreTxt, filtre === f && styles.filtreTxtOn]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {chargement ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.sage} /></View>
      ) : (
        <FlatList
          data={visibles}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={COLORS.sage} />}
          onEndReached={chargerPlus}
          onEndReachedThreshold={0.5}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListFooterComponent={
            visibles.length < tous.length
              ? <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.muted} />
              : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialIcons name="forum" size={40} color={COLORS.muted} />
              <Text style={styles.vide}>{message || 'Aucune publication pour le moment.'}</Text>
            </View>
          }
        />
      )}

      {/* Bouton flottant de composition */}
      <TouchableOpacity style={styles.fab} onPress={() => setComposer(true)} activeOpacity={0.85}>
        <MaterialIcons name="edit" size={24} color={COLORS.cream} />
      </TouchableOpacity>

      {/* Composer */}
      <Modal visible={composerOuvert} animationType="slide" transparent onRequestClose={() => setComposer(false)}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Nouvelle publication</Text>
              <TouchableOpacity onPress={() => setComposer(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.forest} />
              </TouchableOpacity>
            </View>

            <View style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.catChip, nouvelleCat === c && styles.catChipOn]} onPress={() => setNouvelleCat(c)}>
                  <Text style={[styles.catChipTxt, nouvelleCat === c && styles.catChipTxtOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Quoi de neuf dans ton parcours ?"
              placeholderTextColor={COLORS.muted}
              multiline
              value={nouveauTexte}
              onChangeText={setNouveauTexte}
              maxLength={500}
            />

            <TouchableOpacity
              style={[styles.publierBtn, (!nouveauTexte.trim() || envoi) && { opacity: 0.5 }]}
              onPress={publier}
              disabled={!nouveauTexte.trim() || envoi}
              activeOpacity={0.85}
            >
              {envoi ? <ActivityIndicator color={COLORS.cream} /> : <Text style={styles.publierTxt}>Publier</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: { backgroundColor: COLORS.forest, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  title: { color: COLORS.cream, fontSize: 22, fontWeight: '700' },
  subtitle: { color: COLORS.creamMuted, fontSize: 13, marginTop: 2 },
  amisBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.cream, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  amisBtnTxt: { color: COLORS.forest, fontWeight: '700', fontSize: 13 },

  filtresWrap: { backgroundColor: COLORS.forest, paddingBottom: 14 },
  filtres: { paddingHorizontal: 16, gap: 8 },
  filtre: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(247,243,236,0.12)' },
  filtreOn: { backgroundColor: COLORS.cream },
  filtreTxt: { color: COLORS.creamMuted, fontWeight: '600', fontSize: 13 },
  filtreTxtOn: { color: COLORS.forest },

  liste: { padding: 16, paddingBottom: 90 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  vide: { color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.sage, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.forest },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  catChipOn: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  catChipTxt: { color: COLORS.forest, fontWeight: '600', fontSize: 13 },
  catChipTxtOn: { color: COLORS.cream },
  modalInput: { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, minHeight: 110, fontSize: 15, color: COLORS.forest, textAlignVertical: 'top', marginBottom: 16 },
  publierBtn: { backgroundColor: COLORS.forest, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  publierTxt: { color: COLORS.cream, fontSize: 16, fontWeight: '700' },
});
