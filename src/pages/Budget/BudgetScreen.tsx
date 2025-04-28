import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import BudgetProgressCard from '../../components/Budget/BudgetProgressCard';
import CreateBudgetModal from '../../components/Budget/CreateBudgetModal';
import EditBudgetModal from '../../components/Budget/EditBudgetModal';
import { plaidApi } from '../../services/pluggy/apiAdapter';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import styles from './styles';

interface Budget {
  id: number;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  period: string;
  is_nearing_limit: boolean;
  start_date: string;
  end_date: string;
}

const BudgetScreen = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: Budget[] = await plaidApi.getBudgets();
      setBudgets(data);
    } catch (error) {
      setError('Failed to fetch budgets. Please try again later.');
      console.error('Failed to fetch budgets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingBudget(null);
    fetchBudgets();
  };

  const handleBudgetCreation = async (budgetData: Omit<Budget, 'id' | 'spent' | 'remaining' | 'is_nearing_limit'>) => {
    try {
      const createdBudget: Budget = await plaidApi.createBudget(budgetData);
      setBudgets(prev => [...prev, createdBudget]);
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create the budget. Please try again.');
      console.error('Create budget error:', error);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const renderItem = ({ item }: { item: Budget }) => (
    <TouchableOpacity
      style={[styles.budgetCard, { backgroundColor: item.is_nearing_limit ? '#FFD700' : '#fff' }]}
      onPress={() => handleEdit(item)}
    >
      <BudgetProgressCard budget={item} />
      {item.is_nearing_limit && (
        <Text style={styles.warningText}>Warning: You are nearing your budget limit!</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Budgets</Text>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={styles.createButtonText}>Create New Budget</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#40BEBE" />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No budgets found. Create one!</Text>}
      />

      {/* Create Budget Modal */}
      {showCreateModal && (
        <CreateBudgetModal onClose={closeModals} onCreate={handleBudgetCreation} />
      )}

      {/* Edit Budget Modal */}
      {editingBudget && (
        <EditBudgetModal budget={editingBudget} onClose={closeModals} />
      )}
    </View>
  );
};

export default BudgetScreen;
