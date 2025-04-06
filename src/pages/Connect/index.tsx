import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Button, Alert } from 'react-native';
import { LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';
import PlaidLink from 'react-native-plaid-link-sdk';
import { StackRouteParamList } from '../../routes/stack.routes';
import { Container } from './styles';
import { plaidApi } from '../../services/pluggy/apiAdapter';

const Connect: React.FC<
  NativeStackScreenProps<StackRouteParamList, 'connect'>
> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // ✅ Use plaidApi.createLinkToken
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const token = await plaidApi.createLinkToken();
        setLinkToken(token);
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

  // ✅ Use plaidApi.exchangePublicToken
  const handlePublicTokenExchange = async (publicToken: string) => {
    try {
      const result = await plaidApi.exchangePublicToken(publicToken);
      if (result.success) {
        Alert.alert('Success', 'Your bank account is now linked.');
      } else {
        throw new Error('Exchange failed');
      }
    } catch (error) {
      console.error('Error exchanging public token:', error);
      Alert.alert('Error', 'Could not exchange public token.');
    }
  };

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
