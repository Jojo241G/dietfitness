import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import {
  rechercherParEmail, envoyerDemande, accepterDemande, refuserDemande,
  listerAmis, listerDemandes,
} from '../../services/friendsService';
import {
  listerDefis, creerDefi, majProgres, supprimerDefi, TYPES_DEFI,
} from '../../services/challengesService';
import { COLORS } from '../../theme/colors';

const ONGLETS = ['Amis', 'Demandes', 'Défis'];

export default function FriendsScreen({ navigation }) {
  const { profil, jour } = useContext(ProfileContext);
  const moiId = profil?.userId || null;

  const [onglet, setOnglet]     = useState('Amis');
  const [amis, setAmis]         = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [defis, setDefis]       = useState([]);
  const [chargement, setChargement] = useState(true);
  const [refresh, setRefresh]   = useState(false);
  const [message, setMessage]   = useState(null);

  // Ajout d'ami
  const [emailRecherche, setEmail] = useState('');
  const [resultat, setResultat]    = useState(null);
  const [recherche, setRecherche]  = useState(false);

  // Défi
  const [defiModal, setDefiModal] = useState(null); // ami ciblé
  const [typeDefi, setTypeDefi]   = useState(TYPES_DEFI[0]);
  const [cibleDefi, setCibleDefi] = useState(TYPES_DEFI[0].valeurs[2]);

  const recharger = useCallback(async () => {
    if (!moiId) {
      setMessage("Reconnecte-toi pour activer les amis (identifiant de compte manquant).");
      return;
    }
    const [a, d, df] = await Promise.all([
      listerAmis(moiId), listerDemandes(moiId), listerDefis(),
    ]);
    setAmis(a.amis);
    setDemandes(d.demandes);
    setDefis(df);
    if (!a.ok) setMessage(a.message);
    else setMessage(null);
  }, [moiId]);

  useEffect(() => {
    setChargement(true);
    recharger().finally(() => setChargement(false));
  }, [recharger]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await recharger();
    setRefresh(false);
  }, [recharger]);

  // ── Recherche d'un utilisateur par email ──
  const lancerRecherche = useCallback(async () => {
    if (!moiId) { setResultat({ erreur: 'Reconnecte-toi pour utiliser les amis.' }); return; }
    if (!emailRecherche.includes('@')) { setResultat({ erreur: 'Entre un email valide.' }); return; }
    setRecherche(true);
    setResultat(null);
    const res = await rechercherParEmail(emailRecherche.trim().toLowerCase(), moiId);
    setRecherche(false);
    if (res.ok) setResultat(res.user);
    else setResultat({ erreur: res.message });
  }, [emailRecherche, moiId]);

  const ajouter = useCallback(async (user) => {
    const res = await envoyerDemande(moiId, user.id);
    if (res.ok) {
      setResultat({ ...user, statut: 'PENDING' });
      Alert.alert('Demande envoyée', `Ta demande a été envoyée à ${user.prenom}.`);
    } else {
      Alert.alert('Oups', res.message);
    }
  }, [moiId]);

  const repondre = useCallback(async (demande, accepter) => {
    const fn = accepter ? accepterDemande : refuserDemande;
    const res = await fn(demande.friendshipId, moiId);
    if (res.ok) { recharger(); }
    else Alert.alert('Erreur', res.message);
  }, [moiId, recharger]);

  // ── Défis ──
  const ouvrirDefi = useCallback((ami) => {
    setTypeDefi(TYPES_DEFI[0]);
    setCibleDefi(TYPES_DEFI[0].valeurs[2]);
    setDefiModal(ami);
  }, []);

  const creer = useCallback(async () => {
    if (!defiModal) return;
    await creerDefi({
      amiId: defiModal.userId,
      amiPrenom: defiModal.prenom,
      type: typeDefi.cle,
      cible: cibleDefi,
      unite: typeDefi.unite,
    });
    setDefiModal(null);
    setOnglet('Défis');
    recharger();
  }, [defiModal, typeDefi, cibleDefi, recharger]);

  // Progrès "moi" selon le type, à partir des compteurs du jour
  const monProgres = useCallback((defi) => {
    if (defi.type === 'pas') return jour?.pas || 0;
    if (defi.type === 'calories') return jour?.kcalBrulees || 0;
    return defi.progresMoi || 0;
  }, [jour]);

  const synchroniserDefi = useCallback(async (defi) => {
    await majProgres(defi.id, monProgres(defi));
    recharger();
  }, [monProgres, recharger]);

  if (chargement) {
    return (
      <SafeAreaView style={styles.safe}>
        <Entete navigation={navigation} nbDemandes={0} />
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.sage} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Entete navigation={navigation} nbDemandes={demandes.length} />

      {/* Onglets */}
      <View style={styles.tabs}>
        {ONGLETS.map((o) => (
          <TouchableOpacity key={o} style={[styles.tab, onglet === o && styles.tabOn]} onPress={() => setOnglet(o)}>
            <Text style={[styles.tabTxt, onglet === o && styles.tabTxtOn]}>
              {o}{o === 'Demandes' && demandes.length > 0 ? ` (${demandes.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={COLORS.sage} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ───────── AMIS ───────── */}
        {onglet === 'Amis' && (
          <>
            {/* Recherche par email */}
            <View style={styles.searchCard}>
              <Text style={styles.searchTitle}>Ajouter un ami</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Email de la personne"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailRecherche}
                  onChangeText={setEmail}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={lancerRecherche} disabled={recherche}>
                  {recherche ? <ActivityIndicator color={COLORS.cream} size="small" /> : <MaterialIcons name="search" size={22} color={COLORS.cream} />}
                </TouchableOpacity>
              </View>

              {resultat && (
                resultat.erreur ? (
                  <Text style={styles.searchErr}>{resultat.erreur}</Text>
                ) : (
                  <View style={styles.resultRow}>
                    <View style={[styles.avatar, { backgroundColor: COLORS.sage }]}>
                      <Text style={styles.avatarTxt}>{(resultat.prenom || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultNom}>{resultat.prenom} {resultat.nom}</Text>
                      <Text style={styles.resultObj}>{resultat.objectif || 'Objectif non défini'}</Text>
                    </View>
                    {resultat.statut === 'ACCEPTED' ? (
                      <Text style={styles.dejaAmi}>Déjà ami</Text>
                    ) : resultat.statut === 'PENDING' ? (
                      <Text style={styles.enAttente}>En attente</Text>
                    ) : (
                      <TouchableOpacity style={styles.addBtn} onPress={() => ajouter(resultat)}>
                        <MaterialIcons name="person-add" size={18} color={COLORS.cream} />
                      </TouchableOpacity>
                    )}
                  </View>
                )
              )}
            </View>

            {/* Liste d'amis + comparatif */}
            {amis.length === 0 ? (
              <View style={styles.vide}>
                <MaterialIcons name="group-add" size={40} color={COLORS.muted} />
                <Text style={styles.videTxt}>{message || "Pas encore d'amis. Ajoute-les par email pour vous motiver mutuellement !"}</Text>
              </View>
            ) : (
              amis.map((ami) => (
                <View key={ami.friendshipId} style={styles.amiCard}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.forest }]}>
                    <Text style={styles.avatarTxt}>{(ami.prenom || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amiNom}>{ami.prenom} {ami.nom}</Text>
                    <View style={styles.objRow}>
                      <MaterialIcons name="flag" size={13} color={COLORS.sage} />
                      <Text style={styles.amiObj}>{ami.objectif || 'Objectif non défini'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.defiBtn} onPress={() => ouvrirDefi(ami)}>
                    <MaterialIcons name="sports-score" size={16} color={COLORS.forest} />
                    <Text style={styles.defiBtnTxt}>Défier</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {amis.length > 0 && (
              <Text style={styles.note}>
                Astuce : lance un défi à un ami pour comparer vos progrès du jour
                et garder la motivation 💪
              </Text>
            )}
          </>
        )}

        {/* ───────── DEMANDES ───────── */}
        {onglet === 'Demandes' && (
          demandes.length === 0 ? (
            <View style={styles.vide}>
              <MaterialIcons name="mark-email-read" size={40} color={COLORS.muted} />
              <Text style={styles.videTxt}>Aucune demande en attente.</Text>
            </View>
          ) : (
            demandes.map((d) => (
              <View key={d.friendshipId} style={styles.amiCard}>
                <View style={[styles.avatar, { backgroundColor: COLORS.warning }]}>
                  <Text style={styles.avatarTxt}>{(d.prenom || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.amiNom}>{d.prenom} {d.nom}</Text>
                  <Text style={styles.amiObj}>{d.email}</Text>
                </View>
                <TouchableOpacity style={styles.okBtn} onPress={() => repondre(d, true)}>
                  <MaterialIcons name="check" size={20} color={COLORS.cream} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.noBtn} onPress={() => repondre(d, false)}>
                  <MaterialIcons name="close" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))
          )
        )}

        {/* ───────── DÉFIS ───────── */}
        {onglet === 'Défis' && (
          defis.length === 0 ? (
            <View style={styles.vide}>
              <MaterialIcons name="emoji-events" size={40} color={COLORS.muted} />
              <Text style={styles.videTxt}>Aucun défi en cours. Va dans « Amis » pour en lancer un !</Text>
            </View>
          ) : (
            defis.map((defi) => {
              const progres = monProgres(defi);
              const pct = Math.min(Math.round((progres / defi.cible) * 100), 100);
              const typeInfo = TYPES_DEFI.find((t) => t.cle === defi.type) || TYPES_DEFI[0];
              return (
                <View key={defi.id} style={styles.defiCard}>
                  <View style={styles.defiHead}>
                    <MaterialIcons name={typeInfo.icone} size={22} color={COLORS.sage} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.defiTitre}>Défi {typeInfo.label} vs {defi.amiPrenom}</Text>
                      <Text style={styles.defiSub}>Objectif : {defi.cible.toLocaleString()} {defi.unite}</Text>
                    </View>
                    {defi.statut === 'termine' && <MaterialIcons name="check-circle" size={22} color={COLORS.sage} />}
                  </View>

                  <View style={styles.defiBar}>
                    <View style={[styles.defiFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={styles.defiStats}>
                    <Text style={styles.defiProgres}>{progres.toLocaleString()} / {defi.cible.toLocaleString()} {defi.unite} ({pct}%)</Text>
                    <View style={styles.defiActions}>
                      <TouchableOpacity onPress={() => synchroniserDefi(defi)}>
                        <MaterialIcons name="sync" size={20} color={COLORS.sage} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { supprimerDefi(defi.id).then(recharger); }}>
                        <MaterialIcons name="delete-outline" size={20} color={COLORS.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal création de défi */}
      <Modal visible={!!defiModal} transparent animationType="slide" onRequestClose={() => setDefiModal(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Défier {defiModal?.prenom}</Text>
              <TouchableOpacity onPress={() => setDefiModal(null)}>
                <MaterialIcons name="close" size={24} color={COLORS.forest} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLbl}>Type de défi</Text>
            <View style={styles.typeRow}>
              {TYPES_DEFI.map((t) => (
                <TouchableOpacity
                  key={t.cle}
                  style={[styles.typeChip, typeDefi.cle === t.cle && styles.typeChipOn]}
                  onPress={() => { setTypeDefi(t); setCibleDefi(t.valeurs[2]); }}
                >
                  <MaterialIcons name={t.icone} size={18} color={typeDefi.cle === t.cle ? COLORS.cream : COLORS.sage} />
                  <Text style={[styles.typeTxt, typeDefi.cle === t.cle && styles.typeTxtOn]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLbl}>Objectif à atteindre</Text>
            <View style={styles.cibleRow}>
              {typeDefi.valeurs.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.cibleChip, cibleDefi === v && styles.cibleChipOn]}
                  onPress={() => setCibleDefi(v)}
                >
                  <Text style={[styles.cibleTxt, cibleDefi === v && styles.cibleTxtOn]}>{v.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.creerBtn} onPress={creer} activeOpacity={0.85}>
              <Text style={styles.creerTxt}>Lancer le défi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Entete({ navigation, nbDemandes }) {
  return (
    <View style={styles.header}>
      {navigation && (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.cream} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1, marginLeft: navigation ? 12 : 0 }}>
        <Text style={styles.headerTitle}>Mes amis & défis</Text>
        <Text style={styles.headerSub}>Progressez ensemble, restez motivés</Text>
      </View>
      {nbDemandes > 0 && (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{nbDemandes}</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: { backgroundColor: COLORS.forest, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  headerTitle: { color: COLORS.cream, fontSize: 18, fontWeight: '700' },
  headerSub: { color: COLORS.creamMuted, fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: COLORS.danger, borderRadius: 999, minWidth: 24, height: 24, paddingHorizontal: 7, justifyContent: 'center', alignItems: 'center' },
  badgeTxt: { color: COLORS.cream, fontSize: 12, fontWeight: '700' },

  tabs: { flexDirection: 'row', backgroundColor: COLORS.forest, paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(247,243,236,0.12)', alignItems: 'center' },
  tabOn: { backgroundColor: COLORS.cream },
  tabTxt: { color: COLORS.creamMuted, fontWeight: '600', fontSize: 13 },
  tabTxtOn: { color: COLORS.forest },

  body: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  vide: { alignItems: 'center', paddingTop: 40, gap: 10 },
  videTxt: { color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  note: { fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: 16, lineHeight: 18 },

  searchCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  searchTitle: { fontSize: 15, fontWeight: '700', color: COLORS.forest, marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, backgroundColor: COLORS.cream, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, color: COLORS.forest, borderWidth: 1, borderColor: COLORS.border },
  searchBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.sage, justifyContent: 'center', alignItems: 'center' },
  searchErr: { color: COLORS.danger, fontSize: 13, marginTop: 10 },

  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  resultNom: { fontSize: 15, fontWeight: '700', color: COLORS.forest },
  resultObj: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  dejaAmi: { fontSize: 12, color: COLORS.sage, fontWeight: '700' },
  enAttente: { fontSize: 12, color: COLORS.warning, fontWeight: '700' },
  addBtn: { backgroundColor: COLORS.sage, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: COLORS.cream, fontWeight: '700', fontSize: 18 },

  amiCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  amiNom: { fontSize: 15, fontWeight: '700', color: COLORS.forest },
  objRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  amiObj: { fontSize: 12, color: COLORS.muted },
  defiBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: COLORS.sage, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  defiBtnTxt: { color: COLORS.forest, fontWeight: '700', fontSize: 12 },

  okBtn: { backgroundColor: COLORS.sage, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  noBtn: { backgroundColor: 'rgba(192,57,43,0.1)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },

  defiCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  defiHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  defiTitre: { fontSize: 15, fontWeight: '700', color: COLORS.forest },
  defiSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  defiBar: { height: 10, backgroundColor: 'rgba(28,58,46,0.1)', borderRadius: 10 },
  defiFill: { height: 10, backgroundColor: COLORS.sage, borderRadius: 10 },
  defiStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  defiProgres: { fontSize: 13, color: COLORS.forest, fontWeight: '600' },
  defiActions: { flexDirection: 'row', gap: 14 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.forest },
  modalLbl: { fontSize: 13, fontWeight: '600', color: COLORS.forest, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  typeChip: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, backgroundColor: COLORS.white },
  typeChipOn: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  typeTxt: { fontSize: 12, fontWeight: '700', color: COLORS.forest },
  typeTxtOn: { color: COLORS.cream },
  cibleRow: { flexDirection: 'row', gap: 8, marginBottom: 22, flexWrap: 'wrap' },
  cibleChip: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: COLORS.white },
  cibleChipOn: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  cibleTxt: { fontSize: 14, fontWeight: '700', color: COLORS.forest },
  cibleTxtOn: { color: COLORS.cream },
  creerBtn: { backgroundColor: COLORS.forest, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  creerTxt: { color: COLORS.cream, fontSize: 16, fontWeight: '700' },
});
