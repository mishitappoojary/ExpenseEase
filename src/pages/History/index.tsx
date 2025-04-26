import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import Text from '../../components/Text';
import ScreenContainer from '../../components/ScreenContainer';
import Money from '../../components/Money';
import { useAppContext } from '../../contexts/AppContext'; // ✅ Import AppContext
import { StyledHeader, StyledFlatList, StyledDivider, TransactionItem, TransactionDetails } from './styles';

const History: React.FC = () => {
  const { allTransactions, fetchAllTransactions, fetchManualTransactions } = useAppContext(); // ✅ Get transactions & fetch function from context
  
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllTransactions(); // ✅ Refresh data from backend
    await fetchManualTransactions(); // ✅ Refresh manual transactions
    setRefreshing(false);
  };

  // Render individual transaction items
  const renderItem = ({ item }: { item: any }) => (
    <TransactionItem>
      <TransactionDetails>
        <Text variant="title">{item.description || 'Transaction'}</Text>
        <Text variant="subtitle">{new Date(item.date).toLocaleDateString()}</Text>
      </TransactionDetails>
      <Money value={item.amount} color={item.amount >= 0 ? 'income' : 'expense'} />
    </TransactionItem>
  );

  return (
    <ScreenContainer>
      <StyledHeader title="Transaction History" />
      {allTransactions.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>No transactions</Text>
        </View>
      ) : (
        <StyledFlatList
          data={allTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <StyledDivider />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}
    </ScreenContainer>
  );
};

export default History;
