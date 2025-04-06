import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Moment } from 'moment';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Animated,
  RefreshControl,
  ScrollView,
  UIManager,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { Camera } from 'expo-camera'; // Import camera functionality
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { styles } from './styles';
import { FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Home: React.FC = () => {
  const [monthYearPickerOpened, setMonthYearPickerOpened] = useState(false);

  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const [hasCameraPermission, setCameraPermission] = useState<boolean | null>(
      null,
    );
  const [plaidModalVisible, setPlaidModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);

  const theme = useTheme();
  const navigation = useNavigation();
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
  } = useAppContext();

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchInvestments();
    fetchIncome();
    fetchLiabilities();
  }, [date]);

  const balance = totalIncomes - totalExpenses;
  const showTrendingIcon = hideValues ? false : balance !== 0;

  const animatedChangeDate = (value: Moment) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDate(value);
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token'); // Clear token
      await AsyncStorage.removeItem('user_data'); // Clear any stored user info
      console.log('✅ AsyncStorage cleared, user logged out');
  
      navigation.dispatch(CommonActions.navigate('signUp'));
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  const handleConnectBank = () => {
    setPlaidModalVisible(true); // Later you might replace this with Plaid Link screen
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
            title={formatMonthYearDate(date)}
            titleIcon="expand-more"
            onTitlePress={() => setMonthYearPickerOpened(true)}
            actions={[
              {
                icon: 'undo',
                onPress: () => animatedChangeDate(NOW),
              },
              {
                icon: hideValues ? 'visibility-off' : 'visibility',
                onPress: () => {},
              },
              {
                icon: 'logout',
                onPress: handleLogout,
              },
            ]}
            hideGoBackIcon={true}
          />

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Financial Overview</Text>
            <FlexContainer style={styles.overviewContainer}>
              <Text>
                Total Balance: <Money value={totalBalance} variant="default-bold" />
              </Text>
              <Text>
                Total Investment: <Money value={totalInvestment} variant="default-bold" />
              </Text>
              <Text>
                Total Invoice: <Money value={totalInvoice} variant="default-bold" />
              </Text>
            </FlexContainer>
          </View>

          <View style={styles.balanceWithTrending}>
            <View style={styles.balanceWithTrending}>
              <Text>
                Balance: <Money value={balance} variant="default-bold" />
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
    </ScreenContainer>
  );
};

export default Home;
