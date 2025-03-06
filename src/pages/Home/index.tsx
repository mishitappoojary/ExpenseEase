// src/contexts/AppContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of your app context
interface AppContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  // Add all the other properties used in Home.tsx
  hideValues: boolean;
  date: any; // Use proper type
  setDate: (date: any) => void;
  minimumDateWithData: any;
  lastUpdateDate: string;
  setHideValues: (hide: boolean) => void;
  updateItems: () => Promise<void>;
  fetchItems: () => Promise<void>;
  transactions: any[];
  totalBalance: number;
  totalInvestment: number;
  totalInvoice: number;
  totalIncomes: number;
  totalExpenses: number;
}

// Create the context with a default value
const AppContext = createContext<AppContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  isLoading: false,
  setIsLoading: () => {},
  hideValues: false,
  date: null,
  setDate: () => {},
  minimumDateWithData: null,
  lastUpdateDate: '',
  setHideValues: () => {},
  updateItems: async () => {},
  fetchItems: async () => {},
  transactions: [],
  totalBalance: 0,
  totalInvestment: 0,
  totalInvoice: 0,
  totalIncomes: 0,
  totalExpenses: 0
});

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // App theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hideValues, setHideValues] = useState<boolean>(false);
  const [date, setDate] = useState(null); // Use proper initial value
  
  // Add mock implementations for other required values
  const minimumDateWithData = null;
  const lastUpdateDate = '';
  const transactions = [];
  const totalBalance = 0;
  const totalInvestment = 0;
  const totalInvoice = 0;
  const totalIncomes = 0;
  const totalExpenses = 0;
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Mock implementations for functions
  const updateItems = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const fetchItems = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const contextValue: AppContextType = {
    isDarkMode,
    toggleDarkMode,
    isLoading,
    setIsLoading,
    hideValues,
    date,
    setDate,
    minimumDateWithData,
    lastUpdateDate,
    setHideValues,
    updateItems,
    fetchItems,
    transactions,
    totalBalance,
    totalInvestment,
    totalInvoice,
    totalIncomes,
    totalExpenses,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

// Export the context as default
export default AppContext;
