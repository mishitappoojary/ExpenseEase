import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  Button,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import plaidApi from '../../services/pluggy/apiAdapter';
import { useCategories } from '../../contexts/CategoriesContext';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  date: string;
  category: string;
  type: 'debit' | 'credit';
  ref_number?: string;
  bank?: string;
  source: 'sms' | 'ocr' | 'manual';
}

const ResolveTransactions = () => {
    const navigation = useNavigation();
    const { categories } = useCategories();
    const [unknownTransactions, setUnknownTransactions] = useState<Transaction[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    
    useEffect(() => {
      fetchUnknownTransactions();
    }, []);
    
    const fetchUnknownTransactions = async () => {
      try {
        const res = await plaidApi.get('/transactions/unknown/');
        setUnknownTransactions(res.data);  
      } catch (err) {
        console.error('❌ Failed to fetch unknown transactions', err);
      }
    };
    
    // Function to update the category (both single and bulk update)
    const updateCategory = async (id: number | null, description: string | null, category: string) => {
      try {
        if (description) {
          // Bulk update
          const res = await plaidApi.patch('/transactions/bulk_update_category/', { description, category });
          console.log('Bulk update successful:', res.data);
        } else if (id) {
          // Single update
          const res = await plaidApi.patch(`/transactions/${id}/`, { category });
          console.log('Transaction updated:', res.data);
        }
        fetchUnknownTransactions();  // Refresh the list
        Alert.alert('Success', 'Transaction category updated successfully!', [{ text: 'OK' }]);
      } catch (err) {
        console.error('❌ Failed to update transaction', err);
      }
    };

    const handleCategorySelect = (txn: Transaction, newCategory: string) => {
      const matches = unknownTransactions.filter(
        (t) => t.description?.toLowerCase() === txn.description?.toLowerCase()
      );
    
      if (matches.length > 1) {
        // Multiple transactions with the same description, show the modal for bulk update
        Alert.alert(
          'Update All Matching?',
          `We found ${matches.length} transactions with "${txn.description}". Update all?`,
          [
            { text: 'No', onPress: () => updateCategory(txn.id, null, newCategory), style: 'cancel' },  // Update single
            { text: 'Yes', onPress: () => updateCategory(null, txn.description, newCategory) },           // Bulk update
          ]
        );
      } else {
        // If only one transaction matches, update it directly
        updateCategory(txn.id, null, newCategory);
      }
    };
    
    // Function to handle category selection from the modal
    const handleModalCategorySelect = (category: string) => {
      if (selectedTransaction) {
        handleCategorySelect(selectedTransaction, category)
        setModalVisible(false);
      }
    };
    
    // Function to open the category selection modal
    const handleCategorySelectModal = (txn: Transaction) => {
      setSelectedTransaction(txn);
      setModalVisible(true);
    };
    
    const renderTransaction = ({ item }: { item: Transaction }) => (
      <View style={styles.transactionCard}>
        <Text style={styles.descText}>
          ₹{item.amount} — {item.description || 'No description'}
        </Text>
        <View style={styles.categoryRow}>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => handleCategorySelectModal(item)} // Open modal to select category
          >
            <Text style={styles.categoryName}>{item.category || 'Select Category'}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
    

  return (
    <View style={styles.container}>
      <Text style={styles.title}> Resolve Unknown Transactions</Text>

      <FlatList
        data={unknownTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>🎉 No unknown transactions!</Text>
        }
      />

        {selectedTransaction && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Choose Category</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                    {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={styles.modalOption}
                        onPress={() => handleModalCategorySelect(cat.name)}
                    >
                        <View style={styles.modalOptionContent}>
                            <MaterialIcons name={cat.icon} size={24} color="#fff" />
                            <Text style={styles.modalOptionText}>{cat.name}</Text>
                        </View>
                    </TouchableOpacity>
                    ))}
                </ScrollView>
                <Button title="Close" onPress={() => setModalVisible(false)} />
                </View>
            </View>
            </TouchableWithoutFeedback>
        </Modal>
        )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#284D63', 
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 20,
    marginTop: 20,
    color: '#fff', 
    textAlign: 'center',
  },
  transactionCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 3, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  descText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor:  '#3C6E71',
    borderRadius: 8,
    width: 100,
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 14,
    color: '#fff',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalOption: {
    padding: 12,
    backgroundColor:  '#3C6E71',
    marginBottom: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignContent: 'center',
  },
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
});

export default ResolveTransactions;
