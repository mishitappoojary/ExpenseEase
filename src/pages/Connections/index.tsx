// src/pages/Connections/index.tsx
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RefreshControl, ScrollView } from 'react-native';
import { useTheme } from 'styled-components/native';
import FlexContainer from '../../components/FlexContainer';
import ScreenContainer from '../../components/ScreenContainer';
import Text from '../../components/Text';
import { AppContext } from '../../contexts/AppContext';
import { Item } from '../../services/pluggy';
import ConnectionCard from './ConnectionCard';
import { BottomSheet, StyledHeader } from './styles';
import { usePlaidLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const API_BASE_URL = 'http://localhost:8000/api/plaid';

interface AppContextType {
  isLoading: boolean;
  items: Item[];
  accounts: any[]; 
  hideValues: boolean;
  setHideValues: (hide: boolean) => void;
  fetchItems: () => Promise<void>;
}

const Connections: React.FC = () => {
  const { isLoading, items, accounts, hideValues, setHideValues, fetchItems } =
    useContext(AppContext) as AppContextType;

  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLinkTokenLoading, setIsLinkTokenLoading] = useState(false);

  const fetchLinkToken = async () => {
    try {
      setIsLinkTokenLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/create-link-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch link token');
      }
      
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error fetching link token:', error);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Could not initialize bank connection',
      });
    } finally {
      setIsLinkTokenLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkToken();
  }, []);

  const handlePlaidSuccess = async (success: LinkSuccess) => {
    const { publicToken, metadata } = success;
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/exchange-public-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          public_token: publicToken,
          institution_id: metadata.institution?.id || '',
          institution_name: metadata.institution?.name || '',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to exchange token');
      }
      
      console.log('Access token saved:', data);
      Toast.show({
        type: 'success',
        text1: 'Bank Connected',
        text2: `Successfully connected ${metadata.institution?.name || 'bank account'}`,
      });
      
      await fetchItems();
    } catch (error) {
      console.error('Error exchanging public token:', error);
      Toast.show({
        type: 'error',
        text1: 'Connection Failed',
        text2: 'Could not connect bank account',
      });
    }
  };

  const handlePlaidExit = (exit: LinkExit) => {
    console.log('Plaid Link exited:', exit);
    if (exit && exit.error && exit.error.errorCode) {
      Toast.show({
        type: 'info',
        text1: 'Connection Cancelled',
        text2: 'Bank connection was cancelled',
      });
    }
  };

  const { open, ready } = usePlaidLink({
    tokenConfig: {
      token: linkToken || '',
    },
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
  });

  const handleAddBank = () => {
    if (ready && linkToken) {
      open();
    } else {
      fetchLinkToken().then(() => {
        if (linkToken) {
          open();
        } else {
          Toast.show({
            type: 'error',
            text1: 'Connection Error',
            text2: 'Could not initialize bank connection',
          });
        }
      });
    }
  };

  const renderItem = useCallback(
    (item: Item) => {
      const itemAccounts = accounts.filter((account) => account.itemId === item.id);
      return <ConnectionCard key={item.id} item={item} accounts={itemAccounts} />;
    },
    [accounts],
  );

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchItems}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
        stickyHeaderIndices={[0]}
      >
        <StyledHeader
          title="Connections"
          actions={[
            {
              icon: hideValues ? 'visibility-off' : 'visibility',
              onPress: () => setHideValues(!hideValues),
            },
            {
              icon: 'add-circle-outline',
              onPress: handleAddBank,
              // Removed the 'disabled' property since it's not supported by the Action type
            },
          ]}
        />
        
        <BottomSheet>
          <Text variant="light" color="textLight">
            {items.length} Connections
          </Text>
          <FlexContainer gap={24}>{items.map(renderItem)}</FlexContainer>
        </BottomSheet>
      </ScrollView>
    </ScreenContainer>
  );
};

export default Connections;
