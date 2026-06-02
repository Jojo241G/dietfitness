import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';

// Écrans Auth
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Onglets principaux
import HomeScreen from '../screens/home/HomeScreen';
import FitnessScreen from '../screens/fitness/FitnessScreen';
import ParcoursScreen from '../screens/fitness/ParcoursScreen';
import ExercisePlayerScreen from '../screens/fitness/ExercisePlayerScreen';
import PoseCoachScreen from '../screens/fitness/PoseCoachScreen';
import NutritionScreen from '../screens/nutrition/NutritionScreen';
import PlanningScreen from '../screens/nutrition/PlanningScreen';
import SocialScreen from '../screens/social/SocialScreen';
import FriendsScreen from '../screens/social/FriendsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const NutritionStack = createNativeStackNavigator();
const FitnessStack = createNativeStackNavigator();
const SocialStack = createNativeStackNavigator();

function SocialNavigator() {
  return (
    <SocialStack.Navigator screenOptions={{ headerShown: false }}>
      <SocialStack.Screen name="Feed" component={SocialScreen} />
      <SocialStack.Screen name="Amis" component={FriendsScreen} />
    </SocialStack.Navigator>
  );
}

function NutritionNavigator() {
  return (
    <NutritionStack.Navigator screenOptions={{ headerShown: false }}>
      <NutritionStack.Screen name="NutritionListe" component={NutritionScreen} />
      <NutritionStack.Screen name="Planning" component={PlanningScreen} />
    </NutritionStack.Navigator>
  );
}

function FitnessNavigator() {
  return (
    <FitnessStack.Navigator screenOptions={{ headerShown: false }}>
      <FitnessStack.Screen name="FitnessAccueil" component={FitnessScreen} />
      <FitnessStack.Screen name="Parcours" component={ParcoursScreen} />
      <FitnessStack.Screen name="ExercisePlayer" component={ExercisePlayerScreen} />
      <FitnessStack.Screen name="PoseCoach" component={PoseCoachScreen} />
    </FitnessStack.Navigator>
  );
}

// ─── Palette de la charte graphique ──────────────────────────────────────────
const COLORS = {
  forest: '#1c3a2e',
  sage: '#3d6b52',
  cream: '#f7f3ec',
  muted: 'rgba(247,243,236,0.45)',
};

// ─── Icônes par onglet ────────────────────────────────────────────────────────
const TAB_ICONS = {
  Accueil: { active: 'home', inactive: 'home' },
  Fitness: { active: 'fitness-center', inactive: 'fitness-center' },
  Nutrition: { active: 'restaurant', inactive: 'restaurant' },
  Communauté: { active: 'groups', inactive: 'groups' },
  Profil: { active: 'person', inactive: 'person' },
};

// ─── Tab Navigator ────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const icons = TAB_ICONS[route.name] || { active: 'circle', inactive: 'radio-button-unchecked' };
          const name = focused ? icons.active : icons.inactive;
          const color = focused ? COLORS.cream : COLORS.muted;
          return <MaterialIcons name={name} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginBottom: 4,
        },
        tabBarActiveTintColor: COLORS.cream,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.forest,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 62,
          paddingTop: 6,
        },
        tabBarIndicatorStyle: { backgroundColor: COLORS.sage },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Fitness" component={FitnessNavigator} />
      <Tab.Screen name="Nutrition" component={NutritionNavigator} />
      <Tab.Screen name="Communauté" component={SocialNavigator} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.forest} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f3ec',
  },
});
