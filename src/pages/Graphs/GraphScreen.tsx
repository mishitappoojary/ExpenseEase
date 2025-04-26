import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, Button, TouchableOpacity } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useNonPlaidTransactions } from '../../contexts/NonApiTransactionsContext';

const GraphScreen = () => {
  const { fetchAllTransactions, manualTransactions, ocrTransactions, smsTransactions } = useNonPlaidTransactions();

  const [fetchedManual, setFetchedManual] = useState(false);
  const [fetchedOCR, setFetchedOCR] = useState(false);
  const [fetchedSMS, setFetchedSMS] = useState(false);
  const [allMonths, setAllMonths] = useState([]);
  const [selectedChart, setSelectedChart] = useState('spend');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!fetchedManual) {
        await fetchAllTransactions("manual");
        setFetchedManual(true);
      }
      if (!fetchedOCR) {
        await fetchAllTransactions("ocr");
        setFetchedOCR(true);
      }
      if (!fetchedSMS) {
        await fetchAllTransactions("sms");
        setFetchedSMS(true);
      }
    };

    fetchTransactions();
  }, [fetchedManual, fetchedOCR, fetchedSMS]);

  useEffect(() => {
    if (fetchedManual && fetchedOCR && fetchedSMS) {
      const combined = [...manualTransactions, ...ocrTransactions, ...smsTransactions];
      const monthsSet = new Set(
        combined.map(txn => txn.date.slice(0, 7))
      );
      const months = Array.from(monthsSet).sort().reverse();
      setAllMonths(months);
    }
  }, [fetchedManual, fetchedOCR, fetchedSMS, manualTransactions, ocrTransactions, smsTransactions]);

  const splitTransactionsByType = (transactions) => {
    const credits = [], debits = [];
    transactions.forEach(txn => {
      if (txn.type === 'credit') credits.push(txn);
      else if (txn.type === 'debit') debits.push(txn);
    });
    return { credits, debits };
  };

  const prepareChartData = (transactions) => {
    const { credits, debits } = splitTransactionsByType(transactions);
    const monthlySpending = {}, monthlyIncome = {};

    transactions.forEach(txn => {
      const txnMonth = txn.date.slice(0, 7);
      const amount = parseFloat(txn.amount) || 0;
      if (txn.type === 'debit') monthlySpending[txnMonth] = (monthlySpending[txnMonth] || 0) + amount;
      if (txn.type === 'credit') monthlyIncome[txnMonth] = (monthlyIncome[txnMonth] || 0) + amount;
    });

    return {
      spending: Object.values(monthlySpending),
      income: Object.values(monthlyIncome),
      months: Object.keys(monthlySpending).sort()
    };
  };

  const { spending, income, months } = prepareChartData([...manualTransactions, ...ocrTransactions, ...smsTransactions]);

  const minMaxStats = (data, months) => {
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const minMonth = months[data.indexOf(minValue)];
    const maxMonth = months[data.indexOf(maxValue)];
    return { minValue, maxValue, minMonth, maxMonth };
  };

  const spendingStats = minMaxStats(spending, months);
  const incomeStats = minMaxStats(income, months);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, marginTop: 20, backgroundColor: '#f9f9f9' }}>
      <Text style={{ fontSize: 26, fontWeight: '700', marginBottom: 16, color: '#333' }}>Spending vs Income</Text>

      {/* Toggle Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
        {['spend', 'earn'].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setSelectedChart(type)}
            style={{
              backgroundColor: selectedChart === type ? '#00a8a1' : '#e0e0e0',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 20,
              marginHorizontal: 10,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
            }}
          >
            <Text style={{ color: selectedChart === type ? '#fff' : '#333', fontWeight: '600' }}>
              {type === 'spend' ? 'Spending' : 'Earnings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart Container */}
      <View style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 24,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 10 }}>
          {selectedChart === 'spend' ? 'Spending Data' : 'Earnings Data'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ height: 280 }}>
            {selectedChart === 'spend' ? (
              <BarChart
                data={{
                  labels: months,
                  datasets: [{ data: spending }],
                }}
                width={Math.max(Dimensions.get('window').width, months.length * 80)}
                height={280}
                yAxisLabel="₹"
                fromZero
                showValuesOnTopOfBars
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                style={{ borderRadius: 16 }}
              />
            ) : (
              <LineChart
                data={{
                  labels: months,
                  datasets: [{ data: income, strokeWidth: 2 }],
                }}
                width={Math.max(Dimensions.get('window').width, months.length * 80)}
                height={280}
                yAxisLabel="₹"
                fromZero
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(0, 168, 161, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                style={{ borderRadius: 16 }}
              />
            )}
          </View>
        </ScrollView>

        {/* Summary Section */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 6 }}>
            {selectedChart === 'spend' ? 'Spending Summary' : 'Earnings Summary'}
          </Text>
          <Text style={{ marginBottom: 4 }}>
            Minimum: ₹{selectedChart === 'spend' ? spendingStats.minValue.toFixed(2) : incomeStats.minValue.toFixed(2)} in {new Date((selectedChart === 'spend' ? spendingStats.minMonth : incomeStats.minMonth) + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={{ marginBottom: 4 }}>
            Maximum: ₹{selectedChart === 'spend' ? spendingStats.maxValue.toFixed(2) : incomeStats.maxValue.toFixed(2)} in {new Date((selectedChart === 'spend' ? spendingStats.maxMonth : incomeStats.maxMonth) + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Text>
            Average: ₹{(selectedChart === 'spend' ? spending : income).reduce((a, b) => a + b, 0) / (selectedChart === 'spend' ? spending.length : income.length).toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default GraphScreen;
