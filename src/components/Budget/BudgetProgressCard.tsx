import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressBar } from 'react-native-paper'; // Import from react-native-paper

interface Budget {
  category: string;
  amount: number;
  spent: number;
}

const BudgetProgressCard: React.FC<{ budget: Budget }> = ({ budget }) => {
  // Validate that 'budget.amount' and 'budget.spent' are defined
  const amount = budget.amount !== undefined && budget.amount !== null ? parseFloat(budget.amount.toString()) : 0;
  const spent = budget.spent !== undefined && budget.spent !== null ? parseFloat(budget.spent.toString()) : 0;

  // Calculate progress as a ratio of spent to allocated amount
  const progress = amount > 0 ? Math.min(spent / amount, 1) : 0;

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.categoryText}>{budget.category}</Text>
      <Text style={styles.allocatedText}>Allocated: ₹{amount.toFixed(2)}</Text>
      
      <ProgressBar
        progress={progress} // Set progress dynamically
        color="#4CAF50"
        style={styles.progressBar}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  categoryText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  allocatedText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  progressBar: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default BudgetProgressCard;
