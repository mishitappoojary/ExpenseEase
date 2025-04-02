import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from '../pages/Auth/SignInScreen';
import SignUpScreen from '../pages/Auth/SignUpScreen';

export type AuthStackParamList = {
  signIn: undefined;
  signUp: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthRoutes = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="signIn"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="signIn" component={SignInScreen} />
      <AuthStack.Screen name="signUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

export default AuthRoutes;
