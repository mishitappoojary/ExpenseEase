import { CurrencyCode } from './common';

export type Transaction = {
  transaction_id: string;
  account_id: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  description: string;
  name: string;
  merchant_name?: string;
  pending: boolean;
  category?: string[];
  payment_meta?: {
    by_order_of?: string;
    payee?: string;
    payer?: string;
    payment_method?: string;
    reason?: string;
  };
};
