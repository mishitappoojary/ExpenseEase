import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, ActivityIndicator, RefreshControl, Button, StyleSheet } from "react-native";
import { plaidApi } from "../../services/pluggy/apiAdapter";
import BudgetProgressCard from "../../components/Budget/BudgetProgressCard";
import SuggestedBudget from "../../components/Budget/SuggestedBudget";

// Define the type for Budget data
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

const AutoBudgetScreen = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]); // Type the budgets state
  const [loading, setLoading] = useState(true);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await plaidApi.getDynamicBudgets();
      setBudgets(data); // Ensure `data` is typed as Budget[]
    } catch (err) {
      console.error("Failed to fetch dynamic budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleGenerate = async () => {
    try {
      await plaidApi.generateDynamicBudget();  // Triggers backend POST
      await fetchBudgets();
    } catch (error) {
      console.error("Error generating budget:", error);
    }
  };

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBudgets} />}
      style={styles.container}
    >
      <Text style={styles.header}>Your Smart Budget</Text>

      <SuggestedBudget budgets={budgets} />

      <Button title="Regenerate Budget" onPress={handleGenerate} color="#4CAF50" />

      <View style={styles.budgetList}>
        {budgets.map((budget) => (
          <BudgetProgressCard key={budget.id} budget={budget} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  budgetList: {
    marginTop: 24,
  },
});

export default AutoBudgetScreen;
