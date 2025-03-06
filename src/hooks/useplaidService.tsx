// src/hooks/usePlaidService.tsx

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { plaidApi } from '../services/pluggy/apiAdapter';

// Add types for API responses
interface PlaidAccount {
  id: string;
  name: string;
  type: string;
  subtype: string;
  balance: {
    available: number;
    current: number;
    limit?: number;
  };
  mask: string;
  institution_name: string;
}

interface Transaction {
  id: string;
  amount: number;
  date: Date | null;
  setDate: (date: Date | null) => void;
  minimumDateWithData: Date | null;
  description: string;
  category?: string[];
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

// Define the context shape with updated types
interface PlaidServiceContextType {
  createLinkToken: () => Promise<string>;
  exchangePublicToken: (publicToken: string) => Promise<void>;
  fetchTransactions: () => Promise<PlaidTransaction[]>;
  fetchAccounts: () => Promise<PlaidAccount[]>;
  fetchInvestments: () => Promise<any[]>;
  deleteItem: (itemId: string) => Promise<void>;
  refreshAccountData: (itemId: string) => Promise<void>;
  getInstitutionDetails: (institutionId: string) => Promise<any>;
  isLoading: boolean;
  error: Error | null;
}

// Create the Plaid service context with a default undefined value
const PlaidServiceContext = createContext<PlaidServiceContextType | undefined>(undefined);

// Create a provider component with error handling and loading state
export const PlaidServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Wrap API calls with loading and error handling
  const createLinkToken = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await plaidApi.createLinkToken();
      return token;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create link token');
      setError(error);
      throw error;
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
      const error = err instanceof Error ? err : new Error('Failed to exchange public token');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (): Promise<PlaidTransaction[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const transactions = await plaidApi.fetchTransactions();
      return transactions;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch transactions');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async (): Promise<PlaidAccount[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await plaidApi.fetchAccounts();
      return accounts;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch accounts');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvestments = async (): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const investments = await plaidApi.fetchInvestments();
      return investments;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch investments');
      setError(error);
      throw error;
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
      const error = err instanceof Error ? err : new Error('Failed to delete item');
      setError(error);
      throw error;
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
      const error = err instanceof Error ? err : new Error('Failed to refresh account data');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getInstitutionDetails = async (institutionId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const details = await plaidApi.getInstitutionDetails(institutionId);
      return details;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get institution details');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: PlaidServiceContextType = {
    createLinkToken,
    exchangePublicToken,
    fetchTransactions,
    fetchAccounts,
    fetchInvestments,
    deleteItem,
    refreshAccountData,
    getInstitutionDetails,
    isLoading,
    error
  };

  return (
    <PlaidServiceContext.Provider value={value}>
      {children}
    </PlaidServiceContext.Provider>
  );
};

// Custom hook to use the Plaid context
export const usePlaidContext = (): PlaidServiceContextType => {
  const context = useContext(PlaidServiceContext);
  if (context === undefined) {
    throw new Error('usePlaidContext must be used within a PlaidServiceProvider');
  }
  return context;
};
