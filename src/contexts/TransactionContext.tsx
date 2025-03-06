// src/hooks/TransactionContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePlaidContext } from '../hooks/useplaidService';

// Define interfaces for the data structures
interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category: string[];
  pending: boolean;
}

interface TransactionContextType {
  transactionHistory: Transaction[];
  totalBalance: number;
  linkToken: string | null;
  isLoading: boolean;
  error: string | null;
  initializePlaidLink: () => Promise<void>;
  handlePublicTokenExchange: (publicToken: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addManualTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

// Create the Transaction Context with proper typing
const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get Plaid service methods from the context
  const { createLinkToken, exchangePublicToken, fetchTransactions } = usePlaidContext();

  // Initialize Plaid Link
  const initializePlaidLink = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await createLinkToken();
      setLinkToken(token);
    } catch (err) {
      setError('Failed to initialize Plaid Link');
      console.error('Error initializing Plaid Link:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle public token exchange
  const handlePublicTokenExchange = async (publicToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await exchangePublicToken(publicToken);
      await refreshTransactions();
    } catch (err) {
      setError('Failed to exchange public token');
      console.error('Error exchanging public token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh transactions
  const refreshTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const transactions = await fetchTransactions();
      setTransactionHistory(transactions);
      calculateTotalBalance(transactions);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total balance from transactions
  const calculateTotalBalance = (transactions: Transaction[]) => {
    const total = transactions.reduce((sum, transaction) => {
      // Only include non-pending transactions in the total
      return transaction.pending ? sum : sum + transaction.amount;
    }, 0);
    setTotalBalance(total);
  };

  // Add manual transaction
  const addManualTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `manual-${Date.now()}`,
    };

    setTransactionHistory((prev) => [newTransaction, ...prev]);
    if (!transaction.pending) {
      setTotalBalance((prev) => prev + transaction.amount);
    }
  };

  // Initial load of transactions
  useEffect(() => {
    refreshTransactions();
  }, []);

  const contextValue: TransactionContextType = {
    transactionHistory,
    totalBalance,
    linkToken,
    isLoading,
    error,
    initializePlaidLink,
    handlePublicTokenExchange,
    refreshTransactions,
    addManualTransaction,
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};

// Custom hook to use the Transaction Context
export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};

// Example usage of the hook:
/*
const MyComponent = () => {
  const {
    transactionHistory,
    totalBalance,
    isLoading,
    error,
    initializePlaidLink,
    handlePublicTokenExchange,
  } = useTransaction();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2>Total Balance: ${totalBalance.toFixed(2)}</h2>
      <button onClick={initializePlaidLink}>Connect Bank Account</button>
      <TransactionList transactions={transactionHistory} />
    </div>
  );
};
*/
