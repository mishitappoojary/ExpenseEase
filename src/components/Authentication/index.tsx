// src/components/Authentication/index.tsx
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useState } from 'react';
import Text from '../Text';
import { AuthButton, Container, SplashImage } from './styles';
import { View } from 'react-native';

export type AuthenticateProps = {
  children: React.ReactNode;
};

const AuthenticationProvider: React.FC<AuthenticateProps> = ({ children }) => {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const authenticationRoutine = useCallback(async () => {
    console.log('📝 Starting authentication routine...');
    const isAuthenticated = __DEV__ || (await authenticate());
    setAuthenticated(isAuthenticated);
    setLoading(false);
    console.log('📝 Authentication complete. Is authenticated:', isAuthenticated);
  }, []);

  const authenticate = async () => {
    console.log('🔐 Initiating biometric authentication...');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your phone',
      });
  
      console.log('🔐 Authentication Result:', result);
      return result.success;
    } catch (error) {
      console.error('❌ Biometric Auth Error:', error);
      return false;
    }
  };


  useEffect(() => {
    authenticationRoutine();
  }, [authenticationRoutine]);

  console.log('✅ Authentication passed, rendering children...');
  return isAuthenticated ? (
    <View>{children}</View> // Wrapped in View
  ) : (
    <Container>
      <SplashImage source={require('../../assets/splash.png')} />
      <AuthButton onPress={authenticationRoutine}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
          Use phone password
        </Text>
      </AuthButton>
    </Container>
  );
};

export default AuthenticationProvider;