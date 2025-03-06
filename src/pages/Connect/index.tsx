import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview'; // Use WebView for Plaid Link
import { useTransaction } from '../../contexts/TransactionContext';
import { StackRouteParamList } from '../../routes/stack.routes';
import { Container } from './styles';

const Connect: React.FC<NativeStackScreenProps<StackRouteParamList, 'connect'>> = ({
  route,
  navigation,
}) => {
  const updateItemId = route.params?.updateItemId;

  const [isLoading, setIsLoading] = useState(true);

  const { linkToken, initializeLinkToken, handlePublicTokenExchange } = useTransaction();

  const handleOnClose = () => {
    navigation.goBack();
  };

  const handleOnSuccess = async (publicToken: string) => {
    try {
      // Exchange the public token for an access token and fetch transactions
      await handlePublicTokenExchange(publicToken);
      navigation.goBack();
    } catch (error) {
      console.error('Error during public token exchange:', error);
    }
  };

  useEffect(() => {
    const initLinkToken = async () => {
      try {
        await initializeLinkToken(); // Generate the link token
      } catch (error) {
        console.error('Error initializing link token:', error);
        navigation.goBack();
      }
      setIsLoading(false);
    };

    initLinkToken();
  }, [initializeLinkToken, navigation]);

  return (
    <Container>
      {isLoading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : linkToken ? (
        <WebView
          source={{ uri: `https://cdn.plaid.com/link/v2/stable/link.html?token=${linkToken}` }}
          onMessage={(event) => {
            const { public_token } = JSON.parse(event.nativeEvent.data);
            handleOnSuccess(public_token);
          }}
          onNavigationStateChange={handleOnClose}
        />
      ) : null}
    </Container>
  );
};

export default Connect;
