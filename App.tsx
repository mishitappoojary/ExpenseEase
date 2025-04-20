import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, SafeAreaView, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from 'styled-components/native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import * as Updates from 'expo-updates';
import { AppContextProvider } from './src/contexts/AppContext';
import { CategoriesProvider } from './src/contexts/CategoriesContext';
import HooksProvider from './src/hooks';
import { PlaidServiceProvider } from './src/hooks/useplaidService';
import StackRoutes from './src/routes/stack.routes';
import dark from './src/theme/dark';
import light from './src/theme/light';

import { NonPlaidProvider } from './src/contexts/NonApiTransactionsContext';  


SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;

  const loadFonts = async () => {
    await Font.loadAsync({
      Inter_400Regular,
      Inter_700Bold,
    });
    setFontsLoaded(true);
  };

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
    (async () => {
      await loadFonts();
      await checkAuth();
    })();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  console.log('🔍 isAuthenticated:', isAuthenticated);
  console.log('🔍 Showing:', isAuthenticated ? 'StackRoutes (Home)' : 'AuthRoutes (SignIn)');

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <PlaidServiceProvider>
        <ThemeProvider theme={theme}>
          <NonPlaidProvider>
          <AppContextProvider>
          <CategoriesProvider>
            <HooksProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                  <SafeAreaView style={{ flex: 1 }}>
                  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={theme.colors.primary} />
                    <Toast />
                    <StackRoutes />
                  </SafeAreaView>
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
            </HooksProvider>
            </CategoriesProvider>
          </AppContextProvider>
          </NonPlaidProvider>
        </ThemeProvider>
      </PlaidServiceProvider>
    </NavigationContainer>
    
  );
}