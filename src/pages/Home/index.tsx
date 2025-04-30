import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Moment } from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import { useNonPlaidTransactions } from '../../contexts/NonApiTransactionsContext';
import { useCategories } from '../../contexts/CategoriesContext';
import { categorizeMerchant } from '../../utils/category';
import plaidApi from '../../services/pluggy/apiAdapter';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Animated,
  RefreshControl,
  ScrollView,
  UIManager,
  Button,
  Image,
  FlatList,
  StyleSheet,
  PermissionsAndroid,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { Camera } from 'expo-camera'; 
import { useTheme } from 'styled-components/native';
import FlexContainer from '../../components/FlexContainer';
import Header from '../../components/Header';
import HorizontalBar from '../../components/HorizontalBar';
import Money from '../../components/Money';
import MonthYearPicker from '../../components/MonthYearPicker';
import AddTransactionButton from '../../components/AddTransactionButton/AddTransactionButton';
import ScreenContainer from '../../components/ScreenContainer';
import { useAppContext } from '../../contexts/AppContext';
import { checkCurrentMonth, formatMonthYearDate, NOW } from '../../utils/date';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { styles } from './styles';
import { FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Home: React.FC = () => {
  const formatMonthYearDate = (value: Moment): string => {
    return value.format('MMMM YYYY');
  };

  // Use a default name instead of user data
  const userName = 'User';
  const { categories } = useCategories();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [monthYearPickerOpened, setMonthYearPickerOpened] = useState(false);
  const [transactionListCapacity, setTransactionListCapacity] = useState(0);
  const [headerTitle, setHeaderTitle] = useState(formatMonthYearDate(NOW)); 
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [hasCameraPermission, setCameraPermission] = useState<boolean | null>(null,);
  const [plaidModalVisible, setPlaidModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const latestTimestampRef = useRef(0);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const { fetchAllTransactions, manualTransactions, ocrTransactions, smsTransactions } = useNonPlaidTransactions();
  const [balance, setBalance] = useState(50000);

  const theme = useTheme();
  const navigation = useNavigation();

  const toggleUserDropdown = () => {
    setShowUserDropdown((prev) => !prev);
  };

  const {
    isLoading,
    hideValues,
    date,
    setDate,
    totalBalance,
    totalInvestment,
    totalInvoice,
    totalIncomes,
    totalExpenses,
    fetchAccounts,
    fetchTransactions,
    fetchInvestments,
    fetchIncome,
    fetchLiabilities,
    logout, 
  } = useAppContext();

  const isCurrentMonth = checkCurrentMonth(date);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchInvestments();
    fetchIncome();
    fetchLiabilities();
  }, [date]);


  useEffect(() => {
    if (Platform.OS === 'android') {
      requestSmsPermission();
    }
  }, []);

  const [fetchedManual, setFetchedManual] = useState(false);
  const [fetchedOCR, setFetchedOCR] = useState(false);
  const [fetchedSMS, setFetchedSMS] = useState(false);
  const [allNonPlaidTransactions, setAllNonPlaidTransactions] = useState([]);

  useEffect(() => {
    const fetchsTransactions = async () => {
      if (!fetchedManual) {
        await fetchAllTransactions("manual");
        setFetchedManual(true); // Set flag to prevent re-fetching
      }
      
      if (!fetchedOCR) {
        await fetchAllTransactions("ocr");
        setFetchedOCR(true); // Set flag to prevent re-fetching
      }
  
      if (!fetchedSMS) {
        await fetchAllTransactions("sms");
        setFetchedSMS(true); // Set flag to prevent re-fetching
      }
    };
  
    fetchsTransactions();
  }, [fetchedManual, fetchedOCR, fetchedSMS]); 
  
  useEffect(() => {
    if (fetchedManual && fetchedOCR && fetchedSMS) {
      let newBalance = 50000;

  // Combine the transactions from all sources (manual, ocr, sms) and sort them by date
      const combinedTransactions = [
        ...manualTransactions,
        ...ocrTransactions,
        ...smsTransactions,
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAllNonPlaidTransactions(combinedTransactions); 

       combinedTransactions.forEach((transaction) => {
        if (transaction.type === 'debit') {
          newBalance -= transaction.amount;  // Subtract for debit
        } else if (transaction.type === 'credit') {
          newBalance += transaction.amount;  // Add for credit
        }
      });
  
      setBalance(newBalance);  // Update the balance
    }
  }, [fetchedManual, fetchedOCR, fetchedSMS, manualTransactions, ocrTransactions, smsTransactions]);  // Re-run when transactions are updated
  

  const showTrendingIcon = hideValues ? false : balance !== 0;

  const animatedChangeDate = (value: Moment) => {
    const isNextValueCurrentMonth = checkCurrentMonth(value);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDate(value);
  };

  const handleMonthYearPickerChange = (value: Moment) => {
    animatedChangeDate(value);
    setHeaderTitle(formatMonthYearDate(value));
    setMonthYearPickerOpened(false);
  };
  
  const handleRefreshPage = async () => {
    Alert.alert(
      'Synchronize Data',
      'Would you like to refresh or fully synchronize your financial data?',
      [
        { text: 'Refresh', onPress: async () => await fetchTransactions() },
        { text: 'Sync All', onPress: async () => {
            await fetchAccounts();
            await fetchInvestments();
            await fetchIncome();
            await fetchLiabilities();
          } },
      ],
      { cancelable: true }
    );
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setCameraPermission(true);
      navigation.navigate('CameraScreen');
    } else {
      setCameraPermission(false);
      console.log('Camera permission not granted');
    }
  };
  const toggleMenu = () => {
    setIsChecked(!isChecked);
    Animated.timing(animation, {
      toValue: isChecked ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const iconStyle = (index: number) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -60 * (index + 1)],
    });
    const opacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return {
      transform: [{ translateY }],
      opacity,
    };
  };
  
  const handleFetchTransactions = async () => {
  navigation.navigate('history');
  }
  
  const handleLogout = () => {
    Alert.alert(
      "Are you sure?",
      "Do you really want to log out?",
      [
        {
          text: "No",
          onPress: () => console.log("❌ Logout cancelled"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await logout();
              console.log("✅ User logged out successfully");
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'signUp',
                })
              );
            } catch (error) {
              console.error("Error during logout:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleConnectBank = () => {
    setPlaidModalVisible(true); // Later you might replace this with Plaid Link screen
  };

  const requestSmsPermission = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'This app needs access to read your bank transaction SMS.',
        buttonPositive: 'OK',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      reloadMessages(); // Initial fetch of messages after permission
    }
  };
  const visibleTransactions = showAllTransactions
  ? transactions
  : transactions.slice(0, 10);


  // Reload messages function to fetch SMS data
  const reloadMessages = () => {
    console.log("🔁 Reloading messages from timestamp:", latestTimestampRef.current);
  
    SmsAndroid.list(
      JSON.stringify({
        box: 'inbox',
        maxCount: 1000,
        minDate: latestTimestampRef.current || 0,
      }),
      (fail) => {
        console.log('SMS fetch failed:', fail);
      },
      async (count, smsList) => {
        const parsed = JSON.parse(smsList);
        const filtered = parsed.filter(
          (msg) =>
            msg.address &&
            (msg.address.toUpperCase().includes('SBIUPI') ||
             msg.address.toUpperCase().includes('HDFCBK'))
        );
  
        console.log(`📬 Filtered ${filtered.length} relevant messages`);
  
        const uniqueRefs = new Set(transactions.map((tx) => tx.refNumber));
        const newMessages = [];
  
        for (const msg of filtered) {
          console.log('💬 SMS BODY:', msg.body, '| DATE:', msg.date);
          const cleaned = parseBankSMS(msg);
          if (cleaned && !uniqueRefs.has(cleaned.refNumber)) {
            uniqueRefs.add(cleaned.refNumber);
            newMessages.push(cleaned);
  
            // 🔁 Use your existing logic here
            const categoryName = categorizeMerchant(cleaned.merchant);
            const transactionData = {
              amount: cleaned.amount,
              description: cleaned.merchant,
              category: categoryName,
              type: cleaned.type,
              date: new Date(cleaned.timestamp).toISOString(),
              source: 'sms',
              ref_number: cleaned.refNumber,
              bank: cleaned.bank,
            };
  
            try {
              await plaidApi.post('/transactions/', transactionData);
              console.log(`✅ Added SMS Transaction: ${cleaned.merchant}`);
            } catch (error) {
              console.error(
                `❌ Failed to add SMS Transaction: ${cleaned.merchant}`,
                error.response?.data || error.message
              );
            }
          }
        }
  
        if (newMessages.length > 0) {
          const newestTimestamp = Math.max(...filtered.map((msg) => msg.date));
          latestTimestampRef.current = Math.max(latestTimestampRef.current, newestTimestamp);
          setTransactions((prev) => [...newMessages, ...prev]);
  
          Alert.alert('Success', `${newMessages.length} new transactions pushed to backend!`);
        } else {
          Alert.alert('No New Transactions', 'No new SMS transactions found.');
        }
      }
    );
  };
  
  
  // Parse the SMS body to extract relevant data
  const parseBankSMS = (msg) => {
    const { body, address, date } = msg;
    const upperAddr = address.toUpperCase();
    const lowerBody = body.toLowerCase();

    // Check for SBI bank transactions
    if (upperAddr.includes('SBI')) {
      const creditMatch = body.match(/credited by Rs\.?(\d+(\.\d+)?)/i);
      const debitMatch = body.match(/debited by (\d+(\.\d+)?)/i);
      const merchantMatch = body.match(/(?:trf|transfer) (?:to|from) (.+?) Ref(?: No)?/i);
      const refMatch =
        body.match(/Ref(?: No)?[ :]?(\d+)/i) || body.match(/Refno (\d+)/i);

      if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
        const amount = parseFloat((creditMatch || debitMatch)[1]);
        return {
          bank: 'SBI',
          amount,
          type: creditMatch ? 'credit' : 'debit',
          merchant: merchantMatch[1].trim(),
          refNumber: refMatch[1],
          timestamp: date,
        };
      }
    }

    // Check for HDFC transactions
    if (upperAddr.includes('HDFC')) {
      const creditMatch = body.match(/Received Rs\.?(\d+(\.\d+)?)/i);
      const debitMatch = body.match(/Sent Rs\.?(\d+(\.\d+)?)/i);
      const merchantMatch = body.match(/(?:to|from) ([^\n]+?)(?:\n| on)/i);
      const refMatch = body.match(/Ref[: ](\d+)/i);

      if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
        const amount = parseFloat((creditMatch || debitMatch)[1]);
        return {
          bank: 'HDFC',
          amount,
          type: creditMatch ? 'credit' : 'debit',
          merchant: merchantMatch[1].trim(),
          refNumber: refMatch[1],
          timestamp: date,
        };
      }
    }
    return null;
  };

  const fetchCategoryFromBackend = async (merchant) => {
    try {
      const response = await fetch('http://192.168.0.103:8000/api/get-merchant-category/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchant: merchant }),
      });
  
      const data = await response.json();
      if (data.category) {
        console.log("Merchant Category:", data.category);
        // Now you can use this category as needed
      } else {
        console.error("Error fetching category:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const sendSMSTransactionsToBackend = async () => {
    // Use the transactions state directly
    const smsParsedList = transactions; // This is now the parsed list of transactions
  
    for (const sms of smsParsedList) {
      const categoryName = categorizeMerchant(sms.merchant);
      const transactionData = {
        amount: sms.amount,
        description: sms.merchant,
        category: categoryName,
        type: sms.type,
        date: new Date(sms.timestamp).toISOString(),
        source: 'sms',
        ref_number: sms.refNumber,
        bank: sms.bank,
      };
  
      try {
        // Send the SMS transaction to the backend
        await plaidApi.post('/transactions/', transactionData);
        console.log(`✅ Added SMS Transaction: ${sms.merchant}`);
      } catch (error) {
        console.error(
          `❌ Failed to add SMS Transaction: ${sms.merchant}`,
          error.response?.data || error.message
        );
      }
    }
  
    Alert.alert('Success', `${smsParsedList.length} SMS transactions pushed to backend!`);
  };

  const handleCategoryChange = async (categoryName) => {
    if (!selectedTransaction) return;
  
    try {
      // Find the selected category
      const selectedCategory = categories.find((cat) => cat.name === categoryName);
      const selectedIcon = selectedCategory ? selectedCategory.icon : 'category';
  
      // Update the category and icon of the selected transaction
      setAllNonPlaidTransactions((prev) =>
        prev.map((tx) =>
          tx.id === selectedTransaction.id
            ? {
                ...tx,
                category: categoryName, // Update category
                icon: selectedIcon,     // Update icon
                _updated: Date.now(),   // Optional: force rerender if memoized
              }
            : tx
        )
      );
  
      // Send PATCH request to update the backend
      await plaidApi.patch(`/transactions/${selectedTransaction.id}/`, {
        category: categoryName,
      });
  
      console.log('✅ Category updated to:', categoryName);
      reloadMessages();
  
    } catch (error) {
      console.error('❌ Failed to update category:', error.response?.data || error.message);
    } finally {
      setModalVisible(false);
      setSelectedTransaction(null); // Clear selected transaction
    }
  };

  const renderItem = ({ item }) => {
    const isCredit = item.type === 'credit';
    const transactionColor = isCredit ? '#4CAF50' : '#F44336';
    const transactionType = isCredit ? 'Credited' : 'Debited';
  
    // Get the category and icon based on the selected category
    const category = categories.find(cat => cat.name.toLowerCase() === item.category?.toLowerCase());
    const categoryIcon = item.icon || (category ? category.icon : 'category');
  
    return (
      <View style={styles.transactionItem}>
        <View style={[styles.leftIcon, { backgroundColor: transactionColor }]}>
          <MaterialIcons name={isCredit ? 'arrow-downward' : 'arrow-upward'} size={16} color="#fff" />
        </View>
  
        <View style={styles.transactionContent}>
          <Text style={styles.bankLine}>
            <Text style={styles.bankName}>{transactionType}</Text>
          </Text>
          <Text style={styles.transactionText}>
            ₹ {item.amount} {isCredit ? 'from' : 'to'} {item.merchantName}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
  
        <TouchableOpacity
          onPress={() => {
            setSelectedTransaction(item);
            setModalVisible(true);
          }}
          style={styles.categoryCircle}
        >
          <MaterialIcons name={categoryIcon} size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };
  

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefreshPage}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.topContainer}>
          <Header
            userIcon="account-circle"
            userName={userName}
            title={headerTitle} 
            titleIcon="expand-more"
            onUserPress={toggleUserDropdown}
            onTitlePress={() => setMonthYearPickerOpened(true)}
            actions={[
              {
                icon: 'undo',
                onPress: () => animatedChangeDate(NOW),
                hidden: isCurrentMonth,
              },
              {
                icon: hideValues ? 'visibility-off' : 'visibility',
                onPress: () => {},
              },
              {
                icon: 'logout',
                onPress: handleLogout,
              }
            ]}
          />

          {/* <View style={styles.summaryContainer}>
            <LinearGradient
              colors={['#28a745', '#284D63']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Image
            source={{ uri: 'https://brandlogos.net/wp-content/uploads/2014/10/visa-logo-300x300.png' }}
            style={styles.cardLogo}
          />
          <Image
            source={{ uri: 'https://brandslogos.com/wp-content/uploads/images/large/chip-logo.png' }}
            style={styles.chip}
          />
          </View>

              <View style={styles.cardContent}>
                <Text style={styles.itemTitle}>Total Balance:</Text>
                <Money value={totalBalance} variant="default-bold" style={styles.moneyText} />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.itemTitle}>Total Investment:</Text>
                <Money value={totalInvestment} variant="default-bold" style={styles.moneyText} />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.itemTitle}>Total Invoice:</Text>
                <Money value={totalInvoice} variant="default-bold" style={styles.moneyText} />
              </View>
            </LinearGradient>
          </View> */}

<View style={styles.summaryContainer}>
            <LinearGradient
              colors={['#3C6E71', '#284D63']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Image
            source={{ uri: 'https://companieslogo.com/img/orig/V.D-e36aebe0.png?t=1720244494' }}
            style={styles.cardLogo}
          />
          <Image
            source={{ uri: 'https://brandslogos.com/wp-content/uploads/images/large/chip-logo.png' }}
            style={styles.chip}
          />
          </View>

              <View style={styles.cardContent}>
                <Text style={styles.itemTitle}>Total Balance:</Text>
                <Text style={styles.moneyText}>
                ₹ {balance.toFixed(2)}
                </Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.itemTitle}>Total Investment:</Text>
                <Money value={totalInvestment} variant="default-bold" style={styles.moneyText} />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.itemTitle}>Total Invoice:</Text>
                <Text style={styles.moneyText}>
                ₹ {balance.toFixed(2)}
                </Text>
              </View>
            </LinearGradient>
          </View>




         <View style={styles.balanceWithTrending}>
            <View style={styles.balanceWithTrending}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 10, paddingTop: 5 }}>
                Balance: ₹ {balance.toFixed(2)}
              </Text>
              {showTrendingIcon && (
                <MaterialIcons
                  name={balance > 0 ? 'trending-up' : 'trending-down'}
                  color={balance > 0 ? theme.colors.income : theme.colors.error}
                  size={16}
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.connectBankButton}
              onPress={() => navigation.navigate('connect')}
            >
              <MaterialIcons name="account-balance" size={18} color="#fff" />
              <Text style={styles.connectBankText}>Connect Bank</Text>
            </TouchableOpacity>
          </View>


          <View style={styles.reminderContainer}>
            <Text style={styles.reminderTitle}>Bill Reminders</Text>

            {/* {billReminders.length > 0 ? (
              billReminders.map((bill, idx) => (
                <View key={idx} style={styles.reminderCard}>
                  <Text style={styles.reminderText}>
                    💡 {bill.name || "Unnamed Bill"} of ₹{bill.amount} is due on{' '}
                    {new Date(bill.date).toDateString()}
                  </Text>
                </View>
              ))
            ) : ( */}
              <Text style={styles.noBills}>✅ No bills due!</Text>
            {/* )} */}
          </View>


          <View style={styles.SMScontainer}>
          <Text style={styles.header}>Extracted Transactions</Text>
          <TouchableOpacity onPress={reloadMessages}>
              <Text style={styles.reloadButton}>Reload ↺ </Text>
            </TouchableOpacity>


            <FlatList
              data={allNonPlaidTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListFooterComponent={
                transactions.length > 10 && (
                  <TouchableOpacity
                    onPress={() => setShowAllTransactions(!showAllTransactions)}
                    style={{ alignItems: 'center', padding: 10 }}
                  >
                    <Text style={{ color: '#40BEBE', fontWeight: 'bold' }}>
                      {showAllTransactions ? 'Show Less ▲' : 'Show More ▼'}
                    </Text>
                  </TouchableOpacity>
                )
              }
            />
          </View>


        </View>
      </ScrollView>
        <TouchableOpacity
          style={styles.PlaidActionsButton}
          onPress={() => setPlaidModalVisible(true)}
        >
          <MaterialIcons name="sync" size={24} color="#fff" />
          <Text style={styles.addTransactionText}>Fetch Data</Text>
        </TouchableOpacity>

        <View style={styles.container}>
              <TouchableOpacity style={styles.addButton} onPress={toggleMenu}>
                <Text style={styles.addButtonText}>{'+'}</Text>
              </TouchableOpacity>
              {isChecked ? (
                <>
                  <Animated.View style={[styles.iconContainer, iconStyle(0)]}>
                    <TouchableOpacity onPress={requestCameraPermission}>
                      <View style={styles.iconBackground}>
                        <FontAwesome5 name="camera" size={20} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                  <Animated.View style={[styles.iconContainer, iconStyle(1)]}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('AddTransaction')}
                    >
                      <View style={styles.iconBackground}>
                        <FontAwesome5 name="keyboard" size={20} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              ) : null}
            </View>

        <Modal
          visible={plaidModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPlaidModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={() => setPlaidModalVisible(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFetchTransactions}><Text>Fetch Transactions</Text></TouchableOpacity>
            <TouchableOpacity onPress={fetchInvestments}><Text>Fetch Investments</Text></TouchableOpacity>
            <TouchableOpacity onPress={fetchIncome}><Text>Fetch Income</Text></TouchableOpacity>
            <TouchableOpacity onPress={fetchLiabilities}><Text>Fetch Liabilities</Text></TouchableOpacity>
          </View>
        </Modal>

        <Modal
          visible={plaidModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPlaidModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={() => setPlaidModalVisible(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFetchTransactions}><Text>Fetch Transactions</Text></TouchableOpacity>
            <TouchableOpacity onPress={fetchInvestments}><Text>Fetch Investments</Text></TouchableOpacity>
            <TouchableOpacity onPress={fetchIncome}><Text>Fetch Income</Text></TouchableOpacity>
            <TouchableOpacity onPress={fetchLiabilities}><Text>Fetch Liabilities</Text></TouchableOpacity>
          </View>
        </Modal>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryOption}
                    onPress={() => handleCategoryChange(item.name)}  // Update category
                  >
                    <MaterialIcons name={item.icon} size={20} color="#333" />
                    <Text style={styles.categoryText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <MonthYearPicker
        isOpen={monthYearPickerOpened}
        selectedDate={date}
        onChange={(value) => handleMonthYearPickerChange(value)}
        onClose={() => setMonthYearPickerOpened(false)}
      />
    </ScreenContainer>
  );
};

export default Home;