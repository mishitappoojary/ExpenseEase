import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import SignInScreen from '../pages/Auth/SignInScreen';
import SignUpScreen from '../pages/Auth/SignUpScreen';
import Home from '../pages/Home';
import Connect from '../pages/Connect';
import Connections from '../pages/Connections';
import History from '../pages/History';
import Transactions from '../pages/Transactions';
import ManualConnect from '../pages/ManualConnect';
import AddTransactionScreen from '../pages/TransactionScreen/TransactionScreen';
import CameraScreen from '../pages/CameraScreen/CameraScreen';

export type StackRouteParamList = {
  home: undefined;
  signIn: undefined;
  signUp: undefined;
  connections: undefined;
  connect: { updateItemId?: string };
  manualConnect: undefined;
  transactions: undefined;
  history: undefined;
  AddTransaction: undefined;
  CameraScreen: undefined;
};

const Stack = createNativeStackNavigator<StackRouteParamList>();

const StackRoutes: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token'); 
      console.log('🔍 Access Token:', accessToken ? 'Exists' : 'Not Found');
      setIsAuthenticated(!!accessToken);
    } catch (error) {
      console.error('❌ Error retrieving access token:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, [])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#4CAF50' }}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated === false ? (
        <>
          {console.log("🟢 Showing SignUpScreen")}
          <Stack.Screen name="signUp" component={SignUpScreen} />
          <Stack.Screen name="signIn" component={SignInScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="home" component={Home} />
          <Stack.Screen name="connections" component={Connections} />
          <Stack.Screen name="connect" component={Connect} />
          <Stack.Screen name="manualConnect" component={ManualConnect} />
          <Stack.Screen name="transactions" component={Transactions} />
          <Stack.Screen name="history" component={History} />
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
          <Stack.Screen name="CameraScreen" component={CameraScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackRoutes;
