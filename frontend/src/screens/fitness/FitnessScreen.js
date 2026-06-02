import React, { useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileContext } from '../../context/ProfileContext';
import { caloriesExercice } from '../../services/exerciseUtils';

// Base de données locale des exercices avec de vraies URLs d'animations (GIFs)
const EXERCISES_DATABASE = [
  // --- PERTE DE POIDS ---
  {
    id: '1',
    title: 'Jumping Jacks',
    duration: '45 secondes',
    difficulty: 'Facile',
    targetMuscles: 'Tout le corps / Cardio',
    objective: 'Perte de poids',
    animationUrl: 'https://cdn.shopify.com/s/files/1/0618/9462/3460/files/original-b7327e47be94975940e98b26277e5ead.gif?v=1744619058',
  },
  {
    id: '2',
    title: 'Burpees',
    duration: '30 secondes',
    difficulty: 'Difficile',
    targetMuscles: 'Tout le corps / Cardio',
    objective: 'Perte de poids',
    animationUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXUzcHdhcXB3c2czM2xuN2R0YTJ5aW9mOG9idjB2cXlpbjQ0NThxNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lEYcevSwZ55Go/giphy.gif',
  },
  {
    id: '3',
    title: 'Mountain Climbers',
    duration: '40 secondes',
    difficulty: 'Intermédiaire',
    targetMuscles: 'Abdominaux / Cardio',
    objective: 'Perte de poids',
    animationUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2s0cGpoMTBlM200eGlhbDZ4ZHMzaHR0ZzFqc3p1dmpiOXN4ODlzMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/vI2BMBcFDgbbFrB0bA/giphy.gif',
  },
  // --- PRISE DE MASSE ---
  {
    id: '4',
    title: 'Pompes Classiques',
    duration: '4 séries x 12',
    difficulty: 'Intermédiaire',
    targetMuscles: 'Pectoraux / Triceps',
    objective: 'Prise de masse',
    animationUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHR1Mnplb3lqZ2o4eGp5N3JjaTRkMThoODlnMXJkd3FrdWVxcm1lcSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EBluiNdrfnAoSXCV4r/giphy.gif',
  },
  {
    id: '5',
    title: 'Squats Jump',
    duration: '4 séries x 10',
    difficulty: 'Difficile',
    targetMuscles: 'Cuisses / Fessiers',
    objective: 'Prise de masse',
    animationUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2ZxaGhyM2ljcTluNmdwNXk5OGh3ZDAxMXNqdzRrNG1seGg4OHF5ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3mgBYwj3yju1Uqd4R6/giphy.gif',
  },
  {
    id: '6',
    title: 'Dips sur Chaise',
    duration: '3 séries x 15',
    difficulty: 'Facile',
    targetMuscles: 'Triceps / Épaules',
    objective: 'Prise de masse',
    animationUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHN3ZDM5cHZjcGc3ODhlemIyN2M3aXUxNmRkMzhhNHlpdXBzbnprNCZlcD12MV9naWZzX3JlYXJjaCZjdD1n/qZNYZCjuXqw1IwFzrZ/giphy.gif',
  },
  // --- MAINTIEN DE FORME ---
  {
    id: '7',
    title: 'Gainage Planche',
    duration: '3 séries x 1 min',
    difficulty: 'Facile',
    targetMuscles: 'Sangle abdominale / Core',
    objective: 'Maintien de forme',
    animationUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHZweWZwZzd3dGN5bWo0ajA0amNvbzB0ZnZiZHQ2czRhcDExdWVoYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/d3mlADRlF7SMFQRy/giphy.gif',
  },
  {
    id: '8',
    title: 'Fentes Avant',
    duration: '3 séries x 20 alternées',
    difficulty: 'Intermédiaire',
    targetMuscles: 'Quadriceps / Ischios',
    objective: 'Maintien de forme',
    animationUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2pjZnBid3dvbzdzYXZ4em1jdW95ZjR3MThjbTBsY2lkOHN6bTR1aCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2hARkeBv5avQhQEoo0/giphy.gif',
  },
];

export default function FitnessScreen({ navigation }) {
  const { profil } = useContext(ProfileContext) || {};
  const userObjective = profil?.objectif || 'Maintien de forme';

  const filteredExercises = EXERCISES_DATABASE.filter(
    (exercise) => exercise.objective?.toLowerCase() === userObjective?.toLowerCase()
  );

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate('ExercisePlayer', { exercice: item })}
    >
      <View style={styles.animationContainer}>
        <Image
          source={{ uri: item.animationUrl }}
          style={styles.animationImage}
          resizeMode="cover"
        />
        <View style={styles.playOverlay}>
          <MaterialIcons name="play-circle-fill" size={44} color="#f7f3ec" />
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.exerciseTitle}>{item.title}</Text>
        <Text style={styles.targetMuscles}>Cible : {item.targetMuscles}</Text>

        <View style={styles.badgeContainer}>
          <View style={[styles.badge, styles.durationBadge]}>
            <Text style={styles.badgeText}>{item.duration}</Text>
          </View>
          <View style={[styles.badge, styles.difficultyBadge]}>
            <Text style={styles.badgeText}>{item.difficulty}</Text>
          </View>
          <View style={[styles.badge, styles.kcalBadge]}>
            <Text style={styles.badgeText}>~{caloriesExercice(item, profil?.poids || 70)} kcal</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ec" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Programme Fitness</Text>
        <Text style={styles.headerSubtitle}>
          Objectif ciblé : {userObjective}
        </Text>

        {navigation && (
          <>
            <TouchableOpacity
              style={styles.parcoursBtn}
              onPress={() => navigation.navigate('Parcours')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="directions-run" size={18} color="#f7f3ec" />
              <Text style={styles.parcoursBtnTxt}>Parcours course / marche (GPS)</Text>
              <MaterialIcons name="chevron-right" size={20} color="#f7f3ec" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.coachBtn}
              onPress={() => navigation.navigate('PoseCoach')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="camera-alt" size={18} color="#1c3a2e" />
              <Text style={styles.coachBtnTxt}>Coach IA caméra en direct</Text>
              <MaterialIcons name="chevron-right" size={20} color="#1c3a2e" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun exercice trouvé pour cet objectif.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ec',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f7f3ec',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c3a2e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#3d6b52',
    marginTop: 4,
  },
  parcoursBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1c3a2e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  parcoursBtnTxt: { flex: 1, color: '#f7f3ec', fontWeight: '700', fontSize: 13 },
  coachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f7f3ec',
    borderWidth: 1,
    borderColor: '#1c3a2e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  coachBtnTxt: { flex: 1, color: '#1c3a2e', fontWeight: '700', fontSize: 13 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  animationContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#eae5db',
    position: 'relative',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(28,58,46,0.18)',
  },
  animationImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c3a2e',
    marginBottom: 4,
  },
  targetMuscles: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  durationBadge: {
    backgroundColor: '#3d6b52',
  },
  difficultyBadge: {
    backgroundColor: '#1c3a2e',
  },
  kcalBadge: {
    backgroundColor: '#d4a017',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
  },
});
