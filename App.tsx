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
import * as Updates from 'expo-updates';
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

  useEffect(() => {
    const clearStorageOnRestart = async () => {
      if (__DEV__) { // Only clear in development mode
        console.log("🗑️ Clearing AsyncStorage on Expo restart...");
        await AsyncStorage.clear();
      }
    };
    clearStorageOnRestart();
  }, []);

  // const checkAuth = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem('access_token'); // Ensure consistency
  //     console.log('🔍 Retrieved access_token:', token);
  //     setIsAuthenticated(!!token);
  //   } catch (error) {
  //     console.error('❌ Failed to retrieve access token:', error);
  //     setIsAuthenticated(false);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const checkAuth = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    console.log('🔍 Retrieved access_token:', token);
    
    if (token) {
      setIsAuthenticated(true);
    } else {
      console.log("🚫 No valid token found. Clearing storage...");
      await AsyncStorage.clear();  // Clears storage ONLY if there's no valid token
      setIsAuthenticated(false);
    }
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
