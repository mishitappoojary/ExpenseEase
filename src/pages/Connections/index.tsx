import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RefreshControl, ScrollView } from 'react-native';
import { useTheme } from 'styled-components/native';
import FlexContainer from '../../components/FlexContainer';
import ScreenContainer from '../../components/ScreenContainer';
import Text from '../../components/Text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import ConnectionCard from './ConnectionCard';
import { BottomSheet, StyledHeader } from './styles';

// const API_BASE_URL = 'http://localhost:8000/api/plaid'; //for web
//const API_BASE_URL = 'http://127.0.0.1:8000/api/plaid'; //For expo
// const API_BASE_URL = 'http://10.0.2.2:8000/api'; // For Emulator
const API_BASE_URL = 'http://192.168.0.103:8000/api/auth';


interface Item {
  id: string;
  institution_name: string;
}

interface Account {
  id: string;
  item_id: string;
  name: string;
  type: string;
  balance: number;
}

const Connections: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [hideValues, setHideValues] = useState(false);

  const theme = useTheme();
  const navigation = useNavigation<any>();

  // Fetch linked items (bank accounts) from Django backend
  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/items/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch items');

      setItems(data.items);
      setAccounts(data.accounts);
    } catch (error) {
      console.error('Error fetching items:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load bank connections',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const renderItem = useCallback(
    (item: Item) => {
      const itemAccounts = accounts.filter((account) => account.item_id === item.id);
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
