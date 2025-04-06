import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
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
import { useAppContext } from '../contexts/AppContext'; // Use your existing context

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
  const { isAuthenticated, authLoading } = useAppContext(); // Use your app context

  // Show loading indicator while authentication state is being determined
  if (authLoading) {
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
      {isAuthenticated ? (
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
      ) : (
        <>
          <Stack.Screen name="signUp" component={SignUpScreen} />
          <Stack.Screen name="signIn" component={SignInScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackRoutes;