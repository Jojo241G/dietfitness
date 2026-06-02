import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const COULEUR_CAT = {
  General: COLORS.sage,
  Recettes: '#c97b2c',
  Motivation: '#d4a017',
};

function tempsRelatif(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

function PostCard({ post, liked, onLike }) {
  const initiale = (post.auteurPrenom || 'A').charAt(0).toUpperCase();
  const couleur = COULEUR_CAT[post.categorie] || COLORS.sage;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: couleur }]}>
          <Text style={styles.avatarTxt}>{initiale}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.auteur}>{post.auteurPrenom || 'Anonyme'}</Text>
          <Text style={styles.temps}>{tempsRelatif(post.datePublication)}</Text>
        </View>
        <View style={[styles.catBadge, { backgroundColor: `${couleur}22` }]}>
          <Text style={[styles.catTxt, { color: couleur }]}>{post.categorie}</Text>
        </View>
      </View>

      <Text style={styles.contenu}>{post.contenu}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.likeBtn} onPress={() => onLike(post)} activeOpacity={0.7}>
          <MaterialIcons
            name={liked ? 'favorite' : 'favorite-border'}
            size={20}
            color={liked ? COLORS.danger : COLORS.muted}
          />
          <Text style={[styles.likeTxt, liked && { color: COLORS.danger }]}>{post.likes ?? 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Mémoïsation : ne re-render que si le post, son état "liked" changent.
export default React.memo(PostCard, (prev, next) =>
  prev.liked === next.liked &&
  prev.post.likes === next.post.likes &&
  prev.post.id === next.post.id &&
  prev.post.contenu === next.post.contenu
);

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: COLORS.cream, fontWeight: '700', fontSize: 17 },
  auteur: { fontSize: 15, fontWeight: '700', color: COLORS.forest },
  temps: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  catBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt: { fontSize: 11, fontWeight: '700' },
  contenu: { fontSize: 14, color: '#333', lineHeight: 21 },
  actions: { flexDirection: 'row', marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeTxt: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
});
