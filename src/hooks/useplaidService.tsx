import React, { createContext, useContext, ReactNode, useState } from 'react';
import { plaidApi } from '../services/pluggy/apiAdapter';
import { Text, View } from 'react-native';

// Define types
export interface PlaidAccount {
  id: string;
  itemId: string;
  name: string;
  official_name?: string; // ✅ Now it's correctly defined
  type: 'depository' | 'investment' | 'credit' | 'loan' | 'other';
  subtype: string;
  balance: {
    available: number | null;
    current: number;
    limit?: number | null;
    currency: string;
  };
}

interface PlaidTransaction {
  id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category: string[];
  pending: boolean;
}

interface PlaidServiceContextType {
  createLinkToken: () => Promise<string>;
  exchangePublicToken: (publicToken: string) => Promise<void>;
  fetchItemStatus: (
    itemId: string,
  ) => Promise<{ status: string; statusDetail: string }>;
  fetchTransactions: () => Promise<PlaidTransaction[]>;
  fetchAccounts: (itemId?: string) => Promise<PlaidAccount[]>;
  fetchInvestments: () => Promise<any[]>;
  deleteItem: (itemId: string) => Promise<void>;
  refreshAccountData: (itemId: string) => Promise<void>;
  getInstitutionDetails: (institutionId: string) => Promise<any>;
  isLoading: boolean;
  error: Error | null;
}

// Create context
const PlaidServiceContext = createContext<PlaidServiceContextType | undefined>(
  undefined,
);

// Provider component
export const PlaidServiceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createLinkToken = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      return await plaidApi.createLinkToken();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err : new Error('Failed to create link token'),
      );
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  const exchangePublicToken = async (publicToken: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await plaidApi.exchangePublicToken(publicToken);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to exchange public token'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (): Promise<PlaidTransaction[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await plaidApi.fetchTransactions();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch transactions'),
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItemStatus = async (
    itemId: string,
  ): Promise<{ status: string; statusDetail: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      return await plaidApi.getItemStatus(itemId);
    } catch (err) {
      console.error('Error fetching item status:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch item status'),
      );
      return { status: 'error', statusDetail: 'Failed to fetch item status' };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async (itemId?: string): Promise<PlaidAccount[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await plaidApi.fetchAccounts();
      return itemId
        ? accounts.filter((account: PlaidAccount) => account.itemId === itemId)
        : accounts;
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch accounts'),
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvestments = async (): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await plaidApi.fetchInvestments();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch investments'),
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (itemId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await plaidApi.deleteItem(itemId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Failed to delete item'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccountData = async (itemId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await plaidApi.refreshAccountData(itemId);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to refresh account data'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getInstitutionDetails = async (institutionId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      return await plaidApi.getInstitutionDetails(institutionId);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to get institution details'),
      );
      return {};
    } finally {
      setIsLoading(false);
    }
  };

  const value: PlaidServiceContextType = {
    createLinkToken,
    exchangePublicToken,
    fetchItemStatus,
    fetchTransactions,
    fetchAccounts,
    fetchInvestments,
    deleteItem,
    refreshAccountData,
    getInstitutionDetails,
    isLoading,
    error,
  };

  return (
    <PlaidServiceContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {error ? <Text style={{ color: 'red' }}>{error.message}</Text> : null}
        {isLoading ? <Text>Loading Plaid Service...</Text> : null}
        {children}
      </View>
    </PlaidServiceContext.Provider>
  );
};


// Custom hook
export const usePlaidContext = (): PlaidServiceContextType => {
  const context = useContext(PlaidServiceContext);
  if (!context) {
    throw new Error(
      'usePlaidContext must be used within a PlaidServiceProvider',
    );
  }
  return context;
};

export default PlaidServiceProvider;
