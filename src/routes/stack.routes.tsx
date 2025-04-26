import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAppContext } from '../contexts/AppContext'; // App context with auth
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
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
import AddCategories from '../pages/Categories/AddCategories';
import GoalsScreen from '../pages/Goals/GoalsScreen';
import ResolveTransactions from '../pages/TransactionScreen/ResolveTransactions';
import MainGraphScreen from '../pages/Graphs/MainGraphScreen';
import FinancialInsights from '../pages/FinancialInsights/FinancialInsights';
import ChatbotScreen from '../pages/Chatbot/ChatbotScreen';

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
  AddCategories: undefined;
  goals: undefined;
  resolveTransactions: undefined;
  graphScreen: undefined;
  financialInsights: undefined;
  chatBot: undefined;
};

const Stack = createNativeStackNavigator<StackRouteParamList>();

const StackRoutes: React.FC = () => {
  const { isAuthenticated, authLoading } = useAppContext();

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

  console.log("🔍 isAuthenticated:", isAuthenticated);
  console.log("🔍 Initial Route:", isAuthenticated === false ? "signIn" : "home");

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
          <Stack.Screen name="AddCategories" component={AddCategories} />
          <Stack.Screen name="goals" component={GoalsScreen} />
          <Stack.Screen name="resolveTransactions" component={ResolveTransactions} />
          <Stack.Screen name="graphScreen" component={MainGraphScreen} />
          <Stack.Screen name="financialInsights" component={FinancialInsights} />
          <Stack.Screen name="chatBot" component={ChatbotScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="signIn" component={SignInScreen} />
          <Stack.Screen name="signUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackRoutes;
