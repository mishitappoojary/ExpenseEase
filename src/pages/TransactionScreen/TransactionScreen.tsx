import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNonPlaidTransactions } from '../../contexts/NonApiTransactionsContext';
import { useCategories } from '../../contexts/CategoriesContext';
import CategoryPicker from '../../components/Categories/CategoryPicker';
import plaidApi from '../../services/pluggy/apiAdapter';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import styles from './styles';

const TransactionScreen = () => {
  const { manualTransactions, fetchAllTransactions } = useNonPlaidTransactions();
  const { categories } = useCategories();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [expandedTransactions, setExpandedTransactions] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAllTransactions("manual");
    console.log('Fetched transactions:', manualTransactions);
  }, []);

  const handleAddTransaction = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('Error', 'Please enter amount, description, and category.');
      return;
    }

    const transactionData = {
      amount: parseFloat(amount),
      description,
      category: selectedCategory.name,
      type,
      date: new Date().toISOString(),
      source: 'manual',
    };

    try {
      await plaidApi.post('/transactions/', transactionData);
      Alert.alert('Success', 'Transaction added successfully!');
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setType('debit');
      fetchAllTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to add transaction.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTransactions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedTransactions[item.id];
    const isCredit = item.type === 'credit';
    const cardBackgroundColor = isCredit ? '#28a745' : '#dc3545'; // green for credit, red for debit
    const category = categories.find((category) => category.name === item.category);
    const categoryIcon = category ? category.icon : 'category';
    
    return (
      <TouchableOpacity
        style={[styles.transactionItem, { backgroundColor: cardBackgroundColor }]}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionDetails}>
          <View style={styles.leftCircle}>
            <MaterialIcons
              name={isCredit ? 'arrow-downward' : 'arrow-upward'}
              size={20}
              color="#000"
            />
          </View>
  
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionName}>{item.merchantName}</Text>
  
            <View style={styles.amountContainer}>
              <Text style={styles.transactionAmount}>
                ₹{item.amount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.categoryContainer}>
          <View style={styles.categoryCircle}>
            <MaterialIcons
              name={categoryIcon}
              size={20}
              color="#fff"
              style={styles.categoryIcon}
            />
          </View>
        </View>
  
        {isExpanded && (
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const manualOnly = manualTransactions.filter(txn => txn.source === 'manual');
  const displayedTransactions = showAll ? manualOnly : manualOnly.slice(0, 5);


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Transaction </Text>

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

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'debit' && styles.selectedTypeButton]}
            onPress={() => setType('debit')}
          >
            <Text style={[styles.typeButtonText, type === 'debit' && styles.selectedTypeText]}>
              Debit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'credit' && styles.selectedTypeButton]}
            onPress={() => setType('credit')}
          >
            <Text style={[styles.typeButtonText, type === 'credit' && styles.selectedTypeText]}>
              Credit
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setPickerVisible(true)}
        >
          {selectedCategory ? (
            <View style={styles.selectedCategory}>
              <MaterialIcons name={selectedCategory.icon} size={24} color="white" />
              <Text style={styles.categoryButtonText}>{selectedCategory.name}</Text>
            </View>
          ) : (
            <View style={styles.selectedCategory}>
              <MaterialIcons name="category" size={24} color="white" />
              <Text style={styles.categoryButtonText}>Add Category</Text>
            </View>
          )}
        </TouchableOpacity>

        <CategoryPicker
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onSelect={(category) => setSelectedCategory(category)}
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subheader}>Transaction History</Text>

      {manualTransactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions yet</Text>
      ) : (
        <>
          <FlatList
            data={displayedTransactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
          />
          {manualTransactions.length > 5 && (
            <TouchableOpacity
              onPress={() => setShowAll(!showAll)}
              style={styles.showMoreButton}
            >
              <Text style={styles.showMoreText}>
                {showAll ? 'Show Less' : 'Show More'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default TransactionScreen;
