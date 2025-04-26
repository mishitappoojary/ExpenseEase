import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons'; // Use this or react-native-vector-icons
import { useNonPlaidTransactions } from '../../contexts/NonApiTransactionsContext';

const SummaryScreen = () => {
  const { manualTransactions, ocrTransactions, smsTransactions } = useNonPlaidTransactions();
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [previousMonthSpend, setPreviousMonthSpend] = useState(0);
  const [adviceList, setAdviceList] = useState([]);
  const [allMonths, setAllMonths] = useState([]);

  const getTransactionsForMonth = (allTxns, month) => {
    return allTxns.filter(txn => txn.date.slice(0, 7) === month);
  };

  const generateAdvice = (txns, previousMonthSpend) => {
    if (txns.length === 0) return [{ icon: 'info-outline', message: "No transactions to analyze this month." }];

    const spendTxns = txns.filter(txn => txn.type === 'debit');
    const totalSpend = spendTxns.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
    const dailySpendMap = {};
    const merchantMap = {};
    const categoryMap = {};

    spendTxns.forEach(txn => {
      const day = txn.date.slice(0, 10);
      dailySpendMap[day] = (dailySpendMap[day] || 0) + parseFloat(txn.amount);

      const merchant = txn.merchantName || 'Unknown';
      merchantMap[merchant] = (merchantMap[merchant] || 0) + parseFloat(txn.amount);

      const category = txn.category || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + parseFloat(txn.amount);
    });

    const highestDay = Object.entries(dailySpendMap).sort((a, b) => b[1] - a[1])[0];
    const topMerchant = Object.entries(merchantMap).sort((a, b) => b[1] - a[1])[0];
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];

    const advice = [];

    if (topCategory[1] > totalSpend * 0.3) {
      advice.push({
        icon: 'pie-chart',
        message: `High spending on ${topCategory[0]} this month (₹${topCategory[1].toFixed(2)}). Consider setting a budget.`
      });
    }

    if (highestDay[1] > totalSpend * 0.25) {
      advice.push({
        icon: 'flash-on',
        message: `Impulsive spend detected on ${highestDay[0]} – ₹${highestDay[1].toFixed(2)} in a single day.`
      });
    }

    if (topMerchant[1] > totalSpend * 0.2) {
      advice.push({
        icon: 'store',
        message: `Frequent spending on ${topMerchant[0]} (₹${topMerchant[1].toFixed(2)}). Consider if it's essential.`
      });
    }

    if (totalSpend < 1000) {
      advice.push({
        icon: 'check-circle',
        message: "You're doing great this month. Keep up the good saving habits!"
      });
    } else if (totalSpend > 10000) {
      advice.push({
        icon: 'money-off',
        message: "You've been spending a lot. Try to dial it back next month."
      });
    }

    if (previousMonthSpend !== 0) {
      const difference = ((totalSpend - previousMonthSpend) / previousMonthSpend) * 100;
      advice.push({
        icon: 'trending-up',
        message: difference > 0
          ? `You spent ${difference.toFixed(2)}% more than last month. Time to review your budget.`
          : `Great job! You spent ${Math.abs(difference.toFixed(2))}% less than last month.`
      });
    }

    return advice;
  };

  useEffect(() => {
    const allTxns = [...manualTransactions, ...ocrTransactions, ...smsTransactions];
    const months = Array.from(new Set(allTxns.map(txn => txn.date.slice(0, 7)))).sort().reverse();
    setAllMonths(months);

    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0]);
    }

    if (selectedMonth) {
      const monthlyTxns = getTransactionsForMonth(allTxns, selectedMonth);
      const previousMonth = months[months.indexOf(selectedMonth) + 1];
      if (previousMonth) {
        const prevMonthTxns = getTransactionsForMonth(allTxns, previousMonth);
        const prevMonthSpend = prevMonthTxns.filter(txn => txn.type === 'debit')
          .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
        setPreviousMonthSpend(prevMonthSpend);
      }

      const advice = generateAdvice(monthlyTxns, previousMonthSpend);
      setAdviceList(advice);
    }
  }, [manualTransactions, ocrTransactions, smsTransactions, selectedMonth, previousMonthSpend]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Spending Summary</Text>

      <Text style={styles.label}>Select a Month:</Text>
      <Picker
        selectedValue={selectedMonth}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedMonth(itemValue)}
      >
        {allMonths.map((month) => (
          <Picker.Item key={month} label={month} value={month} />
        ))}
      </Picker>

      <ScrollView style={{ flex: 1, marginTop: 10 }}>
        {adviceList.length > 0 ? (
          adviceList.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.iconTextRow}>
                <MaterialIcons name={item.icon} size={22} color="#284D63" />
                <Text style={styles.cardText}>{item.message}</Text>
              </View>
              {item.message.includes('setting a budget') && (
                <TouchableOpacity style={styles.budgetButton} onPress={() => alert('Setting Budget functionality')}>
                  <Text style={styles.budgetButtonText}>Set Budget</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noAdvice}>Select a month to see the summary.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 25,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 26, 
    fontWeight: '700', 
    marginBottom: 20, 
    marginTop:20,
    color: '#333'

  },
  label: {
    fontSize: 16,
    color: '#3C6E71',
    marginBottom: 6,
  },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    height: 50,
    width: 180,
    color: '#284D63',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
    width: 300,
    alignSelf: 'stretch',
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardText: {
    fontSize: 15,
    color: '#284D63',
    flex: 1,
  },
  budgetButton: {
    marginTop: 10,
    backgroundColor: '#00A8A1',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  budgetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  noAdvice: {
    fontSize: 16,
    color: '#284D63',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default SummaryScreen;
