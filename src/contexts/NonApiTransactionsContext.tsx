import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { plaidApi } from '../services/pluggy/apiAdapter';

export type NonPlaidTransaction = {
  id: string;
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  source: 'manual' | 'ocr' | 'sms';
  type?: 'debit' | 'credit'; 
};

type NonPlaidContextType = {
  manualTransactions: NonPlaidTransaction[];
  ocrTransactions: NonPlaidTransaction[];
  smsTransactions: NonPlaidTransaction[];
  allNonPlaidTransactions: NonPlaidTransaction[];
  fetchAllTransactions: (source?: 'manual' | 'ocr' | 'sms') => Promise<void>;
  deleteAllTransactions: () => void;
};

const NonPlaidContext = createContext<NonPlaidContextType | undefined>(undefined);

export const NonPlaidProvider = ({ children }: { children: React.ReactNode }) => {
  const [manualTransactions, setManualTransactions] = useState<NonPlaidTransaction[]>([]);
  const [ocrTransactions, setOCRTransactions] = useState<NonPlaidTransaction[]>([]);
  const [smsTransactions, setSMSTransactions] = useState<NonPlaidTransaction[]>([]);

  const fetchAllTransactions = async (source?: 'manual' | 'ocr' | 'sms') => {
    let data;
    if (source) {
      data = await plaidApi.fetchTransactionsBySource(source);
      data = data.filter((t: any) => t.source === source); 
    } else {
      data = await plaidApi.fetchAllTransactions();
    }

    const normalized = data.map((t: any) => ({
      id: t.id.toString(),
      merchantName: t.description || t.merchant_name || 'Unknown',
      amount: parseFloat(t.amount),
      date: t.date,
      category: t.category || 'Unknown',
      type: t.type || 'debit',
      source: t.source?.toLowerCase() as 'manual' | 'ocr' | 'sms',
    }));

    if (source === 'manual') {
      setManualTransactions(normalized);
    } else if (source === 'ocr') {
      setOCRTransactions(normalized);
    } else if (source === 'sms') {
      setSMSTransactions(normalized);
    } else {
      const manual = normalized.filter((t) => t.source === 'manual');
      const ocr = normalized.filter((t) => t.source === 'ocr');
      const sms = normalized.filter((t) => t.source === 'sms');

      setManualTransactions(manual);
      setOCRTransactions(ocr);
      setSMSTransactions(sms);
    }
  };

  useEffect(() => {
    fetchAllTransactions(); // Fetch transactions on mount
  }, []); 

  const allNonPlaidTransactions = useMemo(
    () =>
      [...manualTransactions, ...ocrTransactions, ...smsTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [manualTransactions, ocrTransactions, smsTransactions]
  );

  return (
    <NonPlaidContext.Provider
      value={{
        manualTransactions,
        ocrTransactions,
        smsTransactions,
        allNonPlaidTransactions,
        fetchAllTransactions,
      }}
    >
      {children}
    </NonPlaidContext.Provider>
  );
};


export const useNonPlaidTransactions = () => {
  const context = useContext(NonPlaidContext);
  if (!context) {
    throw new Error('useNonPlaidTransactions must be used within a NonPlaidProvider');
  }
  return context;
};