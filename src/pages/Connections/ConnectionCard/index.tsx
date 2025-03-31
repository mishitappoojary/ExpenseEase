import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import React, { useCallback, useContext, useRef } from 'react';
import { Alert, ViewProps } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SvgWithCssUri } from 'react-native-svg';
import { useTheme } from 'styled-components/native';
import Divider from '../../../components/Divider';
import FlexContainer from '../../../components/FlexContainer';
import Money from '../../../components/Money';
import Text from '../../../components/Text';
import { useAppContext } from '../../../contexts/AppContext';
import {
  Account,
  PlaidAccountSubType,
  Item,
  ItemStatus,
} from '../../../services/pluggy';
import { LastUpdateDateFormat } from '../../../utils/contants';
import ConnectionMenu, { Option } from '../ConnectionMenu';

import {
  AccountLine,
  Card,
  CardContent,
  CardErrorContainer,
  CardErrorMessage,
  CardHeader,
  CardHeaderContent,
  ListItemAvatar,
} from './styles';

const accountName: Record<PlaidAccountSubType, string> = {
  checking: 'Current account',
  savings: 'Savings account',
  'credit card': 'Credit card',
  mortgage: 'Mortgage',
  auto: 'Auto loan',
  student: 'Student loan',
  brokerage: 'Brokerage account',
  'cash management': 'Cash management account',
  other: 'Other account',
};

const itemStatusMessage: Record<ItemStatus, string> = {
  UPDATED: '',
  UPDATING: '',
  LOGIN_ERROR: 'Update the connection credentials.',
  WAITING_USER_INPUT: 'Two-step authentication requested.',
  OUTDATED: 'Sync the connection again.',
};

export interface ConnectionCardProps extends ViewProps {
  item: Item;
  accounts: Account[];
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  item,
  accounts,
  ...viewProps
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const { deleteItem } = useAppContext();

  const theme = useTheme();
  const navigation = useNavigation();

  const itemAccounts = accounts.filter((account) => account.itemId === item.id);

  const lastUpdateDate = item.status
    ? moment(item.status).format(LastUpdateDateFormat)
    : 'never';

  const hasError = !(item.status === 'UPDATED' || item.status === 'UPDATING');

  const handleCardOptionPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleUpdateItem = () => {
    navigation.navigate('connect', { updateItemId: item.id });
  };

  const handleDeleteItem = async () => {
    Alert.alert(
      'Delete connection?',
      'Are you sure you want to delete the connection?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            if (item.id) {
              await deleteItem(item.id); // Pass only the item ID
            } else {
              console.error('Item ID is missing');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };
  

  const handleMenuOptionPress = (option: Option) => {
    bottomSheetModalRef.current?.dismiss();

    if (option === 'update') {
      return handleUpdateItem();
    }

    if (option === 'delete') {
      return handleDeleteItem();
    }
  };

  return (
    <>
      <Card {...viewProps}>
        {hasError ? (
          <CardErrorContainer>
            <MaterialIcons
              name="error"
              size={24}
              color={theme.colors.textWhite}
            />
            <CardErrorMessage>
              <Text variant="light" color="textWhite">
                Unable to sync data!
              </Text>
              <Text variant="light" color="textWhite">
                {itemStatusMessage[item.status] || 'unknown error' }
              </Text>
            </CardErrorMessage>
          </CardErrorContainer>
        ) : null}
        <CardContent>
          <CardHeader>
            <ListItemAvatar
              color={'#' + item.connector.primaryColor || '000000'}
            >
              <SvgWithCssUri
                height="100%"
                width="100%"
                uri={item.connector.imageUrl || ''}
              />
            </ListItemAvatar>
            <CardHeaderContent>
              <Text>{item.connector.name}</Text>
              <Text variant="extra-light" color="textLight">
                Synced on: {lastUpdateDate}
              </Text>
            </CardHeaderContent>
            <TouchableOpacity>
              <MaterialIcons
                name="more-vert"
                size={24}
                color={theme.colors.primary}
                onPress={handleCardOptionPress}
              />
            </TouchableOpacity>
          </CardHeader>
          <Divider />
          <FlexContainer gap={16}>
            {itemAccounts.map((account, index) => (
              <AccountLine key={index}>
                <Text>
                  {accountName[account.subtype as PlaidAccountSubType] ??
                    'Unknown account'}
                </Text>
                <Money
                  variant="default-bold"
                  value={
                    account.type === 'credit'
                      ? -1 * account.balances.current
                      : account.balances.current
                  }
                />
              </AccountLine>
            ))}
          </FlexContainer>
        </CardContent>
      </Card>
      <ConnectionMenu
        onPress={handleMenuOptionPress}
        ref={bottomSheetModalRef}
      />
    </>
  );
};

export default ConnectionCard;
