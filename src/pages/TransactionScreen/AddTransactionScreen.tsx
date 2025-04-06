import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'styled-components/native';
import Text from '../../components/Text';
import ScreenContainer from '../../components/ScreenContainer';
import plaidApi from '../../services/pluggy/apiAdapter';
import styles from './styles';

const AddTransaction: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const themedStyles = styles(theme);
  const navigation = useNavigation();

  const handleAddTransaction = async () => {
    if (!amount.trim() || !description.trim()) {
      Alert.alert('Error', 'Please enter both an amount and description.');
      return;
    }
  
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
  
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken'); // get stored token
      if (!token) throw new Error('No access token found');
  
      const transactionData = {
        amount: parsedAmount,
        description: description.trim(),
      };
  
      await plaidApi.post('/transactions/', transactionData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      Alert.alert('Success', 'Transaction added successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <ScreenContainer>
      <Text variant="title">Add Transaction</Text>

      <TextInput
        style={themedStyles.input}
        placeholder="Transaction Description"
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity style={themedStyles.addButton} onPress={handleAddTransaction} disabled={loading}>
        <Text style={themedStyles.addButtonText}>{loading ? 'Adding...' : 'Add Transaction'}</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
};

export default AddTransaction;
