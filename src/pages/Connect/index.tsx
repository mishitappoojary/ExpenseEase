import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Button, Alert } from 'react-native';
import { PlaidLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';
import { StackRouteParamList } from '../../routes/stack.routes';
import { Container } from './styles';

const API_URL = 'http://127.0.0.1:8000/api/plaid'; // Adjust as needed

const Connect: React.FC<
  NativeStackScreenProps<StackRouteParamList, 'connect'>
> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // ✅ Fetch the link token from Django backend
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await fetch(`${API_URL}/create_link_token/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to get link token');
        }

        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (error) {
        console.error('Error initializing link token:', error);
        Alert.alert('Error', 'Could not initialize Plaid link.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkToken();
  }, [navigation]);

  // ✅ Handle public token exchange
  const handlePublicTokenExchange = async (publicToken: string) => {
    try {
      const response = await fetch(`${API_URL}/exchange_public_token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange public token');
      }

      Alert.alert('Success', 'Your bank account is now linked.');
    } catch (error) {
      console.error('Error exchanging public token:', error);
      Alert.alert('Error', 'Could not exchange public token.');
    }
  };

  // ✅ Handlers for Plaid events
  const onSuccess = async (success: LinkSuccess) => {
    console.log('Plaid Success:', success);
    await handlePublicTokenExchange(success.publicToken);
    navigation.goBack();
  };

  const onExit = (exit: LinkExit) => {
    console.log('Plaid Exit:', exit);
    navigation.goBack();
  };

  return (
    <Container>
      {isLoading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : linkToken ? (
        <PlaidLink
          token={linkToken}
          onSuccess={onSuccess}
          onExit={onExit}
        >
          <Button title="Connect with Plaid" />
        </PlaidLink>
      ) : (
        <View />
      )}
    </Container>
  );
};

export default Connect;
