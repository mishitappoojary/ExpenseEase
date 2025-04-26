import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Alert, Text, StyleSheet } from 'react-native';
import { LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';

import { EmbeddedLinkView,  LinkIOSPresentationStyle } from 'react-native-plaid-link-sdk';

import { plaidApi } from '../../services/pluggy/apiAdapter';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackRouteParamList } from '../../routes/stack.routes';

import * as PlaidSDK from 'react-native-plaid-link-sdk';
console.log('PlaidSDK exports:', Object.keys(PlaidSDK));

type Props = NativeStackScreenProps<StackRouteParamList, 'connect'>;

const Connect: React.FC<Props> = ({ navigation }: { navigation: any } ) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const token = await plaidApi.createLinkToken();
        console.log("🔑 Received link token:", token);
        setLinkToken(token);
      } catch (error) {
        console.error('Link token error:', error);
        Alert.alert('Error', 'Unable to fetch link token.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkToken();
  }, [navigation]);

  const onSuccess = useCallback(
    async (success: LinkSuccess) => {
      console.log('✅ Plaid Link Success:', success);
      try {
        // Extract the public token
        const publicToken = success.publicToken;
        
        // Exchange public token for access token
        await plaidApi.exchangePublicToken(publicToken);
        
        Alert.alert('Success', 'Bank linked successfully!');
        navigation.goBack();
      } catch (error) {
        console.error('❌ Token exchange failed:', error);
        Alert.alert('Error', 'Failed to link your bank account.');
      }
    },
    [navigation]
  );

  const onExit = useCallback(
    (exit: LinkExit) => {
      console.log('👋 User exited Plaid Link:', exit);
      
      // Only show error alert if there was an actual error
      if (exit.error && exit.error.errorCode && 
          !['USER_EXITED', 'ITEM_NOT_FOUND'].includes(exit.error.errorCode)) {
        Alert.alert('Connection Error', 
          'There was a problem connecting to your bank. Please try again later.');
      }
      
      navigation.goBack();
    },
    [navigation],
  );
  
  const onEvent = useCallback((event: any) => {
    console.log('🔔 Plaid Link Event:', event);
  }, []);

  console.log("🔗 linkToken before rendering:", linkToken);
  if (!linkToken) {
    return null; // or show a loader
  }
  
  if (isLoading || !linkToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Preparing to connect your bank...</Text>
      </View>
    );
  }

  console.log('🧠 Final props sanity check:', {
    linkToken,
    hasOnSuccess: !!onSuccess,
    hasOnExit: !!onExit,  
    hasOnEvent: !!onEvent
  });

  return (
    
    <View style={styles.container}>
      {linkToken ? (
      <EmbeddedLinkView
        token={linkToken}
        onSuccess={onSuccess}
        onExit={onExit}
        onEvent={onEvent}
        iOSPresentationStyle={LinkIOSPresentationStyle.FULL_SCREEN}
        style={{ flex: 1 }}
      />
      
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>Loading your banking options...</Text>
        </View>
      )}
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  }
});

export default Connect;