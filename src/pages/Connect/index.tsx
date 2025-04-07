import React, { useEffect, useState } from 'react';
import { View, Button, ActivityIndicator, Alert, Platform, Text } from 'react-native';
import * as PlaidLink from 'react-native-plaid-link-sdk';
import { plaidApi } from '../../services/pluggy/apiAdapter';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackRouteParamList } from '../../routes/stack.routes';

console.log("📦 PlaidLink module:", PlaidLink);

type Props = NativeStackScreenProps<StackRouteParamList, 'connect'>;

const Connect: React.FC<Props> = ({ navigation }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const token = await plaidApi.createLinkToken();
        console.log("🔑 Received link token:", token);
        setLinkToken(token);
      } catch (error) {
        console.error('Link token error:', error);
        setError(`Link token error: ${error}`);
        Alert.alert('Error', 'Unable to fetch link token.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkToken();
  }, [navigation]);

  const handleOpenPlaid = () => {
    console.log("🟢 handleOpenPlaid triggered");
    if (!linkToken) {
      console.warn('⚠️ linkToken is null in handleOpenPlaid');
      Alert.alert('Error', 'No link token available');
      return;
    }
  
    console.log("📲 Attempting to open Plaid with token:", linkToken);
    
    try {
      // Platform-specific implementation
      if (Platform.OS === 'ios') {
        console.log("📱 Using iOS-specific implementation");
        
        // For iOS, we'll try both the standard and iOS-specific approaches
        try {
          (PlaidLink as any).open({
            token: linkToken,
            onSuccess: handleSuccess,
            onExit: handleExit,
            onEvent: handleEvent,
          });
        } catch (error) {
          console.log("⚠️ Standard open failed, trying iOS-specific method");
          (PlaidLink as any).presentLinkViewController({
            token: linkToken,
            onSuccess: handleSuccess,
            onExit: handleExit,
            onEvent: handleEvent,
          });
        }
      } else if (Platform.OS === 'android') {
        console.log("🤖 Using Android-specific implementation");
        
        // For Android, we'll try both standard and Android-specific approaches
        try {
          (PlaidLink as any).open({
            token: linkToken,
            onSuccess: handleSuccess,
            onExit: handleExit,
            onEvent: handleEvent,
          });
        } catch (error) {
          console.log("⚠️ Standard open failed, trying Android-specific method");
          (PlaidLink as any).startLinkActivityForResult({
            token: linkToken,
            onSuccess: handleSuccess,
            onExit: handleExit,
            onEvent: handleEvent,
          });
        }
      } else {
        console.log("❓ Unknown platform, using standard implementation");
        (PlaidLink as any).open({
          token: linkToken,
          onSuccess: handleSuccess,
          onExit: handleExit,
          onEvent: handleEvent,
        });
      }
      
      console.log("⏱️ PlaidLink methods called - waiting for UI to appear...");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('🚨 PlaidLink threw an error:', errorMessage);
      setError(`PlaidLink error: ${errorMessage}`);
      Alert.alert('Error', 'Failed to open Plaid. Please try again.');
    }
  };
  
  // Extract callback functions for cleaner code
  const handleSuccess = (success: any) => {
    console.log('✅ onSuccess called with:', success);
    
    const publicToken = 
      success.publicToken || 
      success.public_token || 
      (success.metadata ? (success.metadata.public_token || success.metadata.publicToken) : null);
      
    console.log('✅ Success! Token:', publicToken);
    
    if (!publicToken) {
      console.error('❌ No public token found in success response:', success);
      Alert.alert('Error', 'No public token received.');
      return;
    }
    
    plaidApi.exchangePublicToken(publicToken)
      .then(() => {
        Alert.alert('Success', 'Bank linked successfully.');
        navigation.goBack();
      })
      .catch((error) => {
        console.error('❌ Token exchange failed', error);
        Alert.alert('Error', 'Failed to exchange token.');
      });
  };
  
  const handleExit = (exit: any) => {
    console.log('❌ onExit called with:', exit);
    
    const error = exit.error || (exit.metadata ? exit.metadata.error : null);
    if (error) {
      console.error("❌ Plaid exited with error:", error);
    } else {
      console.log("👋 User exited Plaid without error.");
    }
    navigation.goBack();
  };
  
  const handleEvent = (event: any) => {
    console.log("📡 Plaid event:", event);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : (
        <>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>
            Platform: {Platform.OS}
          </Text>
          
          {error && (
            <View style={{ padding: 10, backgroundColor: '#FFEEEE', marginBottom: 20, borderRadius: 5, width: '80%' }}>
              <Text style={{ color: 'red' }}>{error}</Text>
            </View>
          )}
          
          <Button 
            title="Connect Your Bank" 
            onPress={handleOpenPlaid}
            disabled={!linkToken} 
          />
          
          <View style={{ marginTop: 20 }}>
            <Button 
              title="Go Back" 
              onPress={() => navigation.goBack()}
              color="#888" 
            />
          </View>
        </>
      )}
    </View>
  );
};

export default Connect;