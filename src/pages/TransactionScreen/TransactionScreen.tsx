import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const API_URL = 'http://127.0.0.1:8000/api/plaid/transactions/';

const TransactionsScreen = ({ navigation }: any) => {
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer YOUR_AUTH_TOKEN`, // Replace with actual token
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transactions = await response.json();
      setTransactionHistory(transactions);

      // Calculate total balance
      const balance = transactions.reduce(
        (sum: number, transaction: any) => sum + transaction.amount,
        0
      );
      setTotalBalance(balance);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Total Balance: ₹{totalBalance.toFixed(2)}</Text>

      <Button
        title="Add Manual Transaction"
        onPress={() => navigation.navigate('AddTransaction')}
      />

      <Text style={styles.historyTitle}>Latest Transactions</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={transactionHistory}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <Text style={styles.transactionText}>
                ₹{item.amount.toFixed(2)} - {item.description}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  transactionItem: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    padding: 10,
  },
  transactionText: {
    color: '#333',
    fontSize: 16,
  },
});

export default TransactionsScreen;
