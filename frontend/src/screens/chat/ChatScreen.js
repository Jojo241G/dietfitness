import React, { useState, useRef, useContext, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import { BASE_URL } from '../../../api';
// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  forest : '#1c3a2e',
  sage   : '#3d6b52',
  cream  : '#f7f3ec',
  white  : '#ffffff',
  muted  : '#6b7a6e',
  border : 'rgba(28,58,46,0.1)',
  danger : '#c0392b',
};

// ─── Bulle de message ─────────────────────────────────────────────────────────
const MessageBubble = React.memo(({ item }) => {
  const isAI = item.role === 'assistant';
  return (
    <View style={[styles.bubbleRow, isAI ? styles.bubbleRowAI : styles.bubbleRowUser]}>
      {isAI && (
        <View style={styles.avatarSmall}>
          <MaterialIcons name="smart-toy" size={14} color={C.cream} />
        </View>
      )}
      <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, isAI ? styles.bubbleTextAI : styles.bubbleTextUser]}>
          {item.content}
          {/* Curseur clignotant pendant la génération */}
          {item.isStreaming && <Text style={styles.cursor}>▌</Text>}
        </Text>
      </View>
    </View>
  );
});

// ─── Message d'erreur ─────────────────────────────────────────────────────────
const ErrorBubble = ({ message, onRetry }) => (
  <View style={styles.errorRow}>
    <MaterialIcons name="error-outline" size={16} color={C.danger} />
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Réessayer</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ChatScreen() {
  const { profil } = useContext(ProfileContext);
  const [messages, setMessages]     = useState([
    {
      id     : 'welcome',
      role   : 'assistant',
      content: profil
        ? `Bonjour ${profil.prenom || ''} ! Je suis ton coach DietFitness. Je connais ton profil (Objectif : ${profil.objectif || 'non défini'}, IMC : ${profil.poids && profil.taille ? (profil.poids / Math.pow(profil.taille / 100, 2)).toFixed(1) : '—'}) et je maîtrise la nutrition camerounaise. Pose-moi tes questions sur ton alimentation ou tes séances de sport !`
        : "Bonjour ! Je suis ton coach DietFitness, spécialiste de la nutrition camerounaise. Comment puis-je t'aider aujourd'hui ?",
    },
  ]);
  const [inputText, setInputText]   = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState(null);
  const [lastUserMsg, setLastUserMsg] = useState(null);

  const flatListRef = useRef(null);
  const abortRef    = useRef(null); // Pour annuler le stream si besoin

  // ─── Envoi du message et streaming SSE ──────────────────────────────────────
  const envoyerMessage = useCallback(async (texte) => {
    const msgUser = texte.trim();
    if (!msgUser || isLoading) return;

    setError(null);
    setLastUserMsg(msgUser);
    setInputText('');
    setIsLoading(true);

    // Ajouter la bulle utilisateur
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: msgUser }]);

    // Préparer la bulle IA vide (sera remplie chunk par chunk)
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', isStreaming: true }]);

    // Scroll automatique
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // ── Requête fetch avec ReadableStream ──
      // fetch() supporte le streaming là où axios ne le fait pas dans React Native
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(`${BASE_URL}/api/chat/stream`, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({
          message: msgUser,
          profil : profil || null,
        }),
        signal  : controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      // ── Lecture du stream SSE chunk par chunk ──
      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Découper le buffer en lignes SSE
        const lines = buffer.split('\n');
        buffer = lines.pop(); // La dernière ligne peut être incomplète

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const fragment = trimmed.slice(5); // Retirer "data:"
          if (!fragment || fragment === '[DONE]') continue;

          // Concaténer le fragment dans la bulle IA
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId
              ? { ...m, content: m.content + fragment }
              : m
          ));

          // Scroll progressif
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }

      // Finaliser : retirer le curseur
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, isStreaming: false } : m
      ));

    } catch (err) {
      if (err.name === 'AbortError') {
        // Annulation volontaire — on ne montre pas d'erreur
        setMessages(prev => prev.filter(m => m.id !== aiMsgId));
      } else {
        console.error('[CHAT] Erreur stream :', err.message);
        // Supprimer la bulle vide et afficher l'erreur
        setMessages(prev => prev.filter(m => m.id !== aiMsgId));
        setError('Le coach est indisponible. Vérifie ta connexion ou le serveur.');
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading, profil]);

  const handleRetry = useCallback(() => {
    if (lastUserMsg) envoyerMessage(lastUserMsg);
  }, [lastUserMsg, envoyerMessage]);

  // ─── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiAvatar}>
          <MaterialIcons name="smart-toy" size={20} color={C.cream} />
        </View>
        <View>
          <Text style={styles.headerName}>Coach DietFitness</Text>
          <Text style={styles.headerStatus}>
            {isLoading ? 'En train de répondre…' : '● En ligne · Spécialiste nutrition camerounaise'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          error
            ? <ErrorBubble message={error} onRetry={handleRetry} />
            : null
        }
      />

      {/* Barre de saisie */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Pose ta question au coach…"
            placeholderTextColor={C.muted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => envoyerMessage(inputText)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => envoyerMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator size="small" color={C.cream} />
              : <MaterialIcons name="send" size={18} color={C.cream} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  header: {
    backgroundColor : C.forest,
    paddingHorizontal: 20,
    paddingVertical  : 14,
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 12,
  },
  aiAvatar: {
    width           : 38,
    height          : 38,
    borderRadius    : 12,
    backgroundColor : C.sage,
    justifyContent  : 'center',
    alignItems      : 'center',
  },
  headerName   : { color: C.cream, fontSize: 15, fontWeight: '600' },
  headerStatus : { color: 'rgba(247,243,236,0.65)', fontSize: 11, marginTop: 2 },

  listContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },

  bubbleRow    : { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowAI  : { justifyContent: 'flex-start' },
  bubbleRowUser: { justifyContent: 'flex-end' },

  avatarSmall: {
    width          : 28,
    height         : 28,
    borderRadius   : 8,
    backgroundColor: C.sage,
    justifyContent : 'center',
    alignItems     : 'center',
    marginBottom   : 2,
  },

  bubble: {
    maxWidth     : '78%',
    paddingVertical  : 11,
    paddingHorizontal: 14,
    borderRadius : 16,
  },
  bubbleAI: {
    backgroundColor: C.white,
    borderWidth    : 1,
    borderColor    : C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor     : C.forest,
    borderBottomRightRadius: 4,
  },

  bubbleText    : { fontSize: 14, lineHeight: 21 },
  bubbleTextAI  : { color: '#1a1a1a' },
  bubbleTextUser: { color: C.cream },

  cursor: { color: C.sage, opacity: 0.8 },

  errorRow: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 8,
    backgroundColor: '#fde8e8',
    borderRadius   : 10,
    padding        : 12,
    marginHorizontal: 16,
    marginBottom   : 8,
  },
  errorText : { flex: 1, fontSize: 12, color: C.danger },
  retryBtn  : { backgroundColor: C.danger, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  retryText : { color: C.cream, fontSize: 11, fontWeight: '600' },

  inputBar: {
    flexDirection    : 'row',
    alignItems       : 'flex-end',
    gap              : 8,
    paddingHorizontal: 14,
    paddingVertical  : 10,
    backgroundColor  : C.white,
    borderTopWidth   : 1,
    borderTopColor   : C.border,
  },
  input: {
    flex            : 1,
    backgroundColor : C.cream,
    borderRadius    : 20,
    paddingHorizontal: 16,
    paddingVertical  : 10,
    fontSize        : 14,
    color           : '#1a1a1a',
    maxHeight       : 100,
    borderWidth     : 1,
    borderColor     : 'rgba(28,58,46,0.15)',
  },
  sendBtn: {
    width          : 40,
    height         : 40,
    borderRadius   : 20,
    backgroundColor: C.forest,
    justifyContent : 'center',
    alignItems     : 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(28,58,46,0.35)' },
});