import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ProfileProvider>
    </AuthProvider>
  );
}