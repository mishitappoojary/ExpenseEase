import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Moment } from 'moment';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  LayoutAnimation,
  LayoutChangeEvent,
  Platform,
  RefreshControl,
  ScrollView,
  UIManager,
  Button,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import FlexContainer from '../../components/FlexContainer';
import Header from '../../components/Header';
import HorizontalBar from '../../components/HorizontalBar';
import Money from '../../components/Money';
import MonthYearPicker from '../../components/MonthYearPicker';
import ScreenContainer from '../../components/ScreenContainer';
import Text from '../../components/Text';
import { useAppContext } from '../../contexts/AppContext';
import { checkCurrentMonth, formatMonthYearDate, NOW } from '../../utils/date';
import plaidApi from '../../services/pluggy/apiAdapter';
import {
  BalanceContainer,
  BalanceFillLine,
  BalanceLine,
  BottomSheet,
  ConnectionsButton,
  Divider,
  HorizontalBarContainer,
  SeeMoreButton,
  TopContainer,
  TransactionListContainer,
  SectionHeader,
  BalanceWithTreding,
} from './styles';

const TRANSACTION_LIST_MIN_CAPACITY = 3;

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const Home: React.FC = () => {
  const formatMonthYearDate = (value: Moment): string => {
    return value.format('MMMM YYYY');
  };

  const { user, logout } = useAuth();
  const userName = user?.displayName || 'User';
  const [monthYearPickerOpened, setMonthYearPickerOpened] = useState(false);
  const [transactionListCapacity, setTransactionListCapacity] = useState(0);
  const [headerTitle, setHeaderTitle] = useState(formatMonthYearDate(NOW)); 
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const theme = useTheme();
  const navigation = useNavigation();

  const toggleUserDropdown = () => {
    setShowUserDropdown((prev) => !prev); // <-- NEW
  };

  const {
    isLoading,
    setIsLoading,
    hideValues,
    date,
    setDate,
    lastUpdateDate,
    updateItems,
    fetchItems,
    transactions,
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
  } = useAppContext();

  console.log('🔍 fetchLiabilities:', fetchLiabilities);
  console.log('🔍 fetchIncome:', fetchIncome);
  console.log('🔍 fetchInvestments:', fetchInvestments);
  console.log('🔍 fetchTransactions:', fetchTransactions);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchInvestments();
    fetchIncome();
    fetchLiabilities();
  }, [date]);

  const isCurrentMonth = checkCurrentMonth(date);
  const balance = totalIncomes - totalExpenses;
  const showTrendingIcon = hideValues ? false : balance !== 0;

  const incomesBarGrow =
    totalIncomes >= totalExpenses ? 1 : totalIncomes / totalExpenses;
  const expensesBarGrow =
    totalExpenses >= totalIncomes ? 1 : totalExpenses / totalIncomes;
  const expensesSurplusGrow =
    totalIncomes >= totalExpenses
      ? 0
      : (totalExpenses - totalIncomes) / totalExpenses;

  const lastTransactions = useMemo(() => {
    const amount = Math.max(
      transactionListCapacity,
      TRANSACTION_LIST_MIN_CAPACITY,
    );
    return transactions.slice(0, amount);
  }, [transactions, transactionListCapacity]);

  const onTransactionListLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    const listCapacity = Math.round(height / (40 + 24));
    setTransactionListCapacity(listCapacity);
  };

  const animatedChangeDate = (value: Moment) => {
    const isNextValueCurrentMonth = checkCurrentMonth(value);
    if (isNextValueCurrentMonth) {
      setTransactionListCapacity(TRANSACTION_LIST_MIN_CAPACITY);
    }
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
      'Do you want to synchronize connections?',
      'When synchronizing connections, the latest data will be obtained. This may take a few minutes.\n\nRefreshing will only get what has already been synced previously.',
      [
        { text: 'Update', onPress: async () => await fetchItems() },
        { text: 'Synchronize', onPress: async () => await updateItems() },
      ],
      { cancelable: true },
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Are you sure?",
      "Do you really want to log out?",
      [
        {
          text: "No",
          onPress: () => console.log("Cancel logout"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
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
        contentContainerStyle={{ flexGrow: 1, overflow: 'hidden' }}
      >
        <TopContainer>
          <Header
            userIcon ='account-circle'
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
                icon: 'logout',
                onPress: handleLogout,
                title: 'logout',
              }
            ]}
          />
          <BalanceContainer>
            <HorizontalBarContainer>
              <HorizontalBar grow={incomesBarGrow} color="income" />
              <HorizontalBar grow={expensesBarGrow} color="expense" />
              <HorizontalBar grow={expensesSurplusGrow} color="error" />
            </HorizontalBarContainer>
            <BalanceWithTreding>
              <Text>
                Balance: <Money value={balance} variant="default-bold" />
              </Text>
              {showTrendingIcon ? (
                <MaterialIcons
                  name={balance > 0 ? 'trending-up' : 'trending-down'}
                  color={balance > 0 ? theme.colors.income : theme.colors.error}
                  size={16}
                />
              ) : null}
            </BalanceWithTreding>
          </BalanceContainer>
          <FlexContainer style={{ marginTop: 16, paddingHorizontal: 16 }}>
            <Text>
              Total Balance:
              <Money value={totalBalance} variant="default-bold" />
            </Text>
            <Text>
              Total Investment:
              <Money value={totalInvestment} variant="default-bold" />
            </Text>
            <Text>
              Total Invoice:
              <Money value={totalInvoice} variant="default-bold" />
            </Text>
          </FlexContainer>
        </TopContainer>
      </ScrollView>
    </ScreenContainer>
  );
};


export default Home;
