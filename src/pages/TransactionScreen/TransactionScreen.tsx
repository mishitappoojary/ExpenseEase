import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAppContext } from '../../contexts/AppContext';
import plaidApi from '../../services/pluggy/apiAdapter';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles';

const TransactionScreen = () => {
  const { transactions, fetchTransactions } = useAppContext();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleAddTransaction = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please enter both an amount and description.');
      return;
    }
  
    try {
      const transactionData = {
        amount: parseFloat(amount),
        description,
      };
  
      await plaidApi.post('/transactions/', transactionData); // No headers needed here
  
      Alert.alert('Success', 'Transaction added successfully!');
      setAmount('');
      setDescription('');
      fetchTransactions(); // Refresh list
    } catch (error) {
      console.error('Error adding transaction:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to add transaction.');
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>

      {/* ✅ Transaction Entry Form (Always Visible) */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Description"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ List of Transactions */}
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions yet</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <Text style={styles.transactionName}>{item.description}</Text>
              <Text style={styles.transactionAmount}>${item.amount}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default TransactionScreen;
