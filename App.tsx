import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, SafeAreaView, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from 'styled-components/native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';

import { TransactionProvider } from './src/contexts/TransactionContext';
import { AppContextProvider } from './src/contexts/AppContext';
import { AuthProvider } from './src/contexts/AuthContext';  
import { CategoriesProvider } from './src/contexts/CategoriesContext';
import HooksProvider from './src/hooks/index';
import Routes from './src/routes';
import dark from './src/theme/dark';
import light from './src/theme/light';
import { PlaidServiceProvider } from './src/hooks/useplaidService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token'); 
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
        <ThemeProvider theme={theme}> 
          <AuthProvider>
            <AppContextProvider>
              <TransactionProvider>
                <CategoriesProvider>
                  <HooksProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <BottomSheetModalProvider>
                        <SafeAreaView style={{ flex: 1 }}>
                          <StatusBar style="light" backgroundColor={theme.colors.primary} />
                          <Routes />
                          <Toast />
                        </SafeAreaView>
                      </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                  </HooksProvider>
                </CategoriesProvider>
              </TransactionProvider>
            </AppContextProvider>
          </AuthProvider>
        </ThemeProvider>
      </PlaidServiceProvider>
    </NavigationContainer>
  );
}
