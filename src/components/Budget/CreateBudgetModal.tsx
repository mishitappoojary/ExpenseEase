import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import CategoryPicker from '../Categories/CategoryPicker'; 
import { plaidApi } from '../../services/pluggy/apiAdapter'; // Adjust if needed
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


interface CreateBudgetModalProps {
  onClose: () => void;
  onCreate: (budgetData: any) => void;
}

const categoryIconMap: { [key: string]: string } = {
  'Food': 'restaurant',
  'Transportation': 'directions-car',
  'Groceries': 'shopping-cart',
  'Entertainment': 'movie',
  'Health': 'fitness-center',
  'Housing': 'home',
  'Utilities': 'bolt',
  'Education': 'school',
  'Savings': 'savings',
  'Others': 'category',
};

const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({ onClose, onCreate }) => {
  const [budgetName, setBudgetName] = useState('');
  const [budgetCategory, setBudgetCategory] = useState<any>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);

  // 🔥 Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await plaidApi.get('/budget/suggestions/');
        setSuggestions(res.data);
      } catch (error) {
        console.error('Failed to fetch suggestions', error);
      }
    };

    fetchSuggestions();
  }, []);

  const handleCreate = () => {
    if (!budgetName || !budgetCategory || !budgetAmount) {
      alert('Please fill all fields');
      return;
    }
  
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
  
    const budgetData = {
      name: budgetName,
      category: budgetCategory.name,  // important!
      amount: parseFloat(budgetAmount),
      period,
      start_date: formatDate(today),
      end_date: formatDate(nextMonth),
    };
  
    console.log('Sending budget data:', budgetData);
    onCreate(budgetData);
  };
  

  const handleSuggestionPress = (suggestion: any) => {
    const iconName = categoryIconMap[suggestion.category] || 'category'; // fallback to 'category' if not found
  
    setBudgetName(`${suggestion.category} Budget`);
    setBudgetCategory({ id: null, name: suggestion.category, icon: iconName });
    setBudgetAmount(suggestion.suggested_amount.toString());
  };

  return (
    <>
      <Modal visible animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Create New Budget</Text>

            {/* 🔥 Suggestions Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionCard}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion.category}</Text>
                  <Text style={styles.suggestionAmount}>${suggestion.suggested_amount}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Budget Name"
              value={budgetName}
              onChangeText={setBudgetName}
            />

            <TouchableOpacity style={styles.categoryButton} onPress={() => setCategoryPickerVisible(true)}>
              {budgetCategory ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {budgetCategory.icon && (
                    <MaterialIcons
                      name={budgetCategory.icon}
                      size={20}
                      color="black"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text style={{ color: 'black' }}>{budgetCategory.name}</Text>
                </View>
              ) : (
                <Text style={{ color: '#999' }}>Select Category</Text>
              )}
            </TouchableOpacity>


            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={budgetAmount}
              onChangeText={setBudgetAmount}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <CategoryPicker
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        onSelect={(category) => setBudgetCategory(category)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  suggestionCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionAmount: {
    fontSize: 12,
    color: '#0369A1',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    justifyContent: 'flex-start',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CreateBudgetModal;
