import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ViewProps } from 'react-native';
import { useTheme } from 'styled-components/native';
import Money from '../Money';
import Text from '../Text';
import { ListItem, ListItemAmount, ListItemContent } from './styles';

// Define the transaction type based on Django API response
export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category?: string | string[]; // Handle both array and string cases
}

export interface TransactionListItemProps extends ViewProps {
  item: Transaction;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({
  item,
  ...viewProps
}) => {
  const theme = useTheme();

  // Fix category type issue (ensure it's an array)
  const categories = Array.isArray(item.category)
    ? item.category
    : item.category
    ? [item.category]
    : [];

  // In most finance apps, negative amounts indicate expenses
  const isExpense = item.amount < 0;
  const value = Math.abs(item.amount); // Ensure positive value display

  return (
    <ListItem {...viewProps}>
      <MaterialIcons
        name={isExpense ? 'shopping-cart' : 'attach-money'}
        size={28}
        color={isExpense ? theme.colors.expense : theme.colors.income}
      />
      <ListItemContent>
        {categories.length > 0 ? (
          <Text variant="extra-light" color="textLight">
            {categories.join(', ')}
          </Text>
        ) : null}
        <Text numberOfLines={2} ellipsizeMode="tail">
          {item.name}
        </Text>
      </ListItemContent>
      <ListItemAmount>
        <Money variant="default-bold" value={value} />
      </ListItemAmount>
    </ListItem>
  );
};

export default TransactionListItem;
