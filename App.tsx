import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from 'styled-components/native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';

import { AppContextProvider } from './src/contexts/AppContext';
import HooksProvider from './src/hooks/index';
import Routes from './src/routes';
import dark from './src/theme/dark';
import light from './src/theme/light';
import { PlaidServiceProvider } from './src/hooks/useplaidService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token'); // Ensure consistency
      console.log('🔍 Retrieved access_token:', token);
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('❌ Failed to retrieve access token:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <PlaidServiceProvider>
        <ThemeProvider theme={dark}> 
          <AppContextProvider>
            <HooksProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                  <StatusBar style="light" backgroundColor="#000" />
                  <Routes />
                  <Toast />
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
            </HooksProvider>
          </AppContextProvider>
        </ThemeProvider>
      </PlaidServiceProvider>
    </NavigationContainer>
  );
}
