import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNonPlaidTransactions } from '../../contexts/NonApiTransactionsContext';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useCategories } from '../../contexts/CategoriesContext';
import { MaterialIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const CategoryScreen = () => {
  const { fetchAllTransactions, manualTransactions, ocrTransactions, smsTransactions } = useNonPlaidTransactions();
  const {categories} = useCategories();
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [allMonths, setAllMonths] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categorizedExpenses, setCategorizedExpenses] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('transactions'); // To manage tabs

  useEffect(() => {
    const fetchData = async () => {
      await fetchAllTransactions('manual');
      await fetchAllTransactions('ocr');
      await fetchAllTransactions('sms');
    };
    fetchData();
  }, []);

  useEffect(() => {
    const combined = [...manualTransactions, ...ocrTransactions, ...smsTransactions];
    const monthsSet = new Set(combined.map(txn => txn.date.slice(0, 7)));
    const months = Array.from(monthsSet).sort().reverse();
    setAllMonths(months);

    if (!selectedMonth && months.length > 0) {
      setSelectedMonth(months[0]);
    }

  }, [manualTransactions, ocrTransactions, smsTransactions]);

  useEffect(() => {
    if (!selectedMonth) return;

    const allTxns = [...manualTransactions, ...ocrTransactions, ...smsTransactions];
    const monthTxns = allTxns.filter(txn => txn.date.slice(0, 7) === selectedMonth);
    setFilteredTransactions(monthTxns);

    const categorized = {};
    monthTxns.forEach(txn => {
      const cat = txn.category || 'Other';
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(txn);
    });

    setCategorizedExpenses(categorized);
    setSelectedCategory(null); // reset if month changes
  }, [selectedMonth, manualTransactions, ocrTransactions, smsTransactions]);

  const getBarChartData = () => {
    const labels = Object.keys(categorizedExpenses);
    const data = labels.map(cat =>
      categorizedExpenses[cat].reduce((sum, txn) => sum + parseFloat(txn.amount), 0)
    );

    return {
      labels,
      datasets: [{ data }]
    };
  };

  const getPieChartData = () => {
    return Object.keys(categorizedExpenses).map((cat, index) => ({
      name: cat,
      amount: categorizedExpenses[cat].reduce((sum, txn) => sum + parseFloat(txn.amount), 0),
      color: ['#ff7675', '#74b9ff', '#55efc4', '#ffeaa7', '#a29bfe'][index % 5],
      legendFontColor: '#333',
      legendFontSize: 14
    }));
  };

  const renderCategoryButtons = () => {
    return Object.keys(categorizedExpenses).map(category => (
      <TouchableOpacity
        key={category}
        style={styles.categoryButton}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={styles.categoryButtonText}>{category}</Text>
      </TouchableOpacity>
    ));
  };

  const renderMerchantSummary = txns => {
    const merchantMap = {};
    txns.forEach(txn => {
      const desc = txn.merchantName || 'Unknown';
      if (!merchantMap[desc]) merchantMap[desc] = 0;
      merchantMap[desc] += 1;
    });
  
    return Object.keys(merchantMap).map((desc, index, arr) => (
      <View key={desc} style={styles.summaryEntry}>
        <Text style={styles.summaryText}>
          {desc}: <Text style={{ fontWeight: '600' }}>{merchantMap[desc]} times</Text>
        </Text>
        {index !== arr.length - 1 && <View style={styles.divider} />}
      </View>
    ));
  };
  

  const getTopMerchantsData = () => {
    const merchantMap = {};
  
    filteredTransactions
      .filter(txn => txn.type === 'debit')  // Only process 'debit' type transactions
      .forEach(txn => {
        const merchant = txn.merchantName || 'Unknown';
        const amount = parseFloat(txn.amount);
        if (!merchantMap[merchant]) merchantMap[merchant] = 0;
        merchantMap[merchant] += amount;
      });
  
    const sorted = Object.entries(merchantMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 merchants
  
    const labels = sorted.map(([merchant]) => merchant);
    const data = sorted.map(([_, amount]) => amount);
  
    return {
      labels,
      datasets: [{ data }]
    };
  };

  const getTopMerchantsList = () => {
    const merchantStats = {};
  
    filteredTransactions.forEach(txn => {
      const name = txn.merchantName || 'Unknown';
      if (!merchantStats[name]) {
        merchantStats[name] = {
          merchantName: name,
          totalSpent: 0,
          count: 0,
          categoryCounts: {},
        };
      }
  
      merchantStats[name].totalSpent += parseFloat(txn.amount);
      merchantStats[name].count += 1;
      const category = txn.category || 'Other';
  
      if (!merchantStats[name].categoryCounts[category]) {
        merchantStats[name].categoryCounts[category] = 0;
      }
      merchantStats[name].categoryCounts[category]++;
    });
  
    const list = Object.values(merchantStats).map(entry => {
      const topCategory = Object.entries(entry.categoryCounts).sort((a, b) => b[1] - a[1])[0][0];
      return {
        merchantName: entry.merchantName,
        totalSpent: entry.totalSpent,
        count: entry.count,
        topCategory: topCategory,
      };
    });
  
    return list.sort((a, b) => b.totalSpent - a.totalSpent); // Most spent first
  };
  
  const renderMerchantCard = ({ item }) => {
    const matchedCategory = categories.find(
      cat => cat.name.toLowerCase() === item.topCategory.toLowerCase()
    );
  
    return (
      <View style={styles.txnCard}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={matchedCategory?.icon || 'category'}
            size={28}
            color="#00A8A1"
          />
        </View>
        <View style={styles.txnDetails}>
          <Text style={styles.txnText}>
            <Text style={styles.bold}>{item.merchantName}</Text>
          </Text>
          <Text style={styles.txnText}>
            Total Spent: ₹{item.totalSpent.toFixed(2)}
          </Text>
          <Text style={styles.txnText}>
          <Text style={styles.bold}> {item.count} Spends </Text>
          </Text>
        </View>
      </View>
    );
  };
  

  const renderTransactionItem = ({ item }) => {
    const matchedCategory = categories.find(
      cat => cat.name.toLowerCase() === (item.category?.toLowerCase() || '')
    );
  
    return (
      <View style={styles.txnCard}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={matchedCategory?.icon || 'category'}
            size={28}
            color="#00A8A1"
          />
        </View>
        <View style={styles.txnDetails}>
          <Text style={styles.txnText}>
            <Text style={styles.bold}>{item.merchantName}</Text>
          </Text>
          <Text style={styles.txnText}>
           ₹{item.amount}
          </Text>
          <Text style={styles.txnText}>
          {item.date.slice(0, 10)}
          </Text>
        </View>
      </View>
    );
  };
  

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={styles.container}>
      <Text style={{ fontSize: 26, fontWeight: '700', marginBottom: 16, color: '#333' }}>Category Classification</Text>
      <Text style={styles.header}>Select Month</Text>
      <Picker
        selectedValue={selectedMonth}
        onValueChange={setSelectedMonth}
        mode="dialog"
        style={{ height: 50, width: '100%' }}
      >
        {allMonths.map(month => (
          <Picker.Item key={month} label={month} value={month} />
        ))}
      </Picker>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={styles.tabButtonText}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={styles.tabButtonText}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'merchants' && styles.activeTab]}
          onPress={() => setActiveTab('merchants')}
        >
          <Text style={styles.tabButtonText}>Merchants</Text>
        </TouchableOpacity>
      </View>

      {/* Content based on Active Tab */}
      {activeTab === 'transactions' && selectedMonth && (
        <>
          <Text style={styles.sectionTitle}>All Transactions ({filteredTransactions.length})</Text>
          <FlatList
            data={[...filteredTransactions].reverse()}
            renderItem={renderTransactionItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </>
      )}

      {activeTab === 'categories' && selectedMonth && (
        <>
              <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Pie Chart of Expenses</Text>
              <PieChart
                data={getPieChartData()}
                width={screenWidth - 32}
                height={200}
                chartConfig={{
                  color: () => '#000',
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="10"
                absolute
              />
            </View>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoryContainer}>
                {renderCategoryButtons()}
              </View>

          {selectedCategory && (
            <>
              <Text style={styles.sectionTitle}>Spending in {selectedCategory}</Text>
              <Text style={{ marginBottom: 5 }}>
                Total: ₹
                {categorizedExpenses[selectedCategory]
                  .reduce((sum, txn) => sum + parseFloat(txn.amount), 0)
                  .toFixed(2)}
              </Text>

              <FlatList
                data={categorizedExpenses[selectedCategory]}
                renderItem={renderTransactionItem}
                keyExtractor={(item, index) => index.toString()}
              />

              <View style={styles.summaryCard}>
              <Text style={styles.mersectionTitle}>Merchant Summary</Text>
                {renderMerchantSummary(categorizedExpenses[selectedCategory])}
              </View>
            </>
          )}
        </>
      )}

      {activeTab === 'merchants' && selectedMonth && (
        <>
          <Text style={styles.sectionTitle}>Top 5 Merchants by Spend (₹)</Text>
          <ScrollView horizontal style={{ marginVertical: 8, borderRadius: 12 }}>
            <BarChart
              data={getTopMerchantsData()}
              width={screenWidth * 1.5}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: () => '#555',
                barPercentage: 0.6,
                decimalPlaces: 0,
              }}
              verticalLabelRotation={0}
              style={{ marginVertical: 8, borderRadius: 12 }}
            />
          </ScrollView>
          <Text style={styles.sectionTitle}>Merchant Breakdown</Text>
            <FlatList
              data={getTopMerchantsList()}
              renderItem={renderMerchantCard}
              keyExtractor={(item, index) => index.toString()}
              style={{ marginBottom: 20 }}
            />

        </>
      )}      
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flexGrow: 1, marginTop: 20, backgroundColor: '#f9f9f9'},
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  mersectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 10, color: '#284D63' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: {
    backgroundColor: '#00A8A1',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  categoryButtonText: { color: '#fff', fontSize: 14 },
  txnCard: {
    backgroundColor: '#284D63',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  txnText: { fontSize: 14, color: '#fff' },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 20,
  },
  tabButton: {
    backgroundColor: '#dfe4ea',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 100,
  },
  activeTab: { backgroundColor: '#3C6E71' },
  tabButtonText: { color: '#333', fontWeight: 'bold' },
  txnCard: {
    flexDirection: 'row',
    backgroundColor: '#284D63',
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  
  iconContainer: {
    backgroundColor: '#3C6E71',
    borderRadius: 30,
    padding: 10,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  txnDetails: {
    flex: 1,
  },
  
  txnText: {
    color: '#dfe4ea',
    fontSize: 14,
    marginBottom: 2,
  },
  
  bold: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: '#00A8A1',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    elevation: 4, // Android shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  summaryEntry: {
    paddingVertical: 8,
  },
  
  summaryText: {
    fontSize: 16,
    color: '#fff',
  },
  
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginTop: 8,
    opacity: 0.6,
  },
  
  
});

export default CategoryScreen;
