import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Define the type for a Budget
interface Budget {
  amount: number;
  category: string;
  id: number;
}

interface SuggestedBudgetProps {
  budgets: Budget[];
}

const SuggestedBudget = ({ budgets }: SuggestedBudgetProps) => {
  // Calculate the total amount of all budgets
  const total = budgets.reduce((sum, b) => sum + parseFloat(b.amount.toString()), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Suggested Total</Text>
      <Text style={styles.total}>₹{total.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D1E7DC',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  total: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#388E3C',
  },
});

export default SuggestedBudget;
