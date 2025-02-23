import { CurrencyCode } from './common';

export type PlaidAccountType = 'depository' | 'credit' | 'loan' | 'investment' | 'other';

export type PlaidAccountSubType =
  | 'checking'
  | 'savings'
  | 'credit card'
  | 'mortgage'
  | 'auto'
  | 'student'
  | 'brokerage'
  | 'cash management'
  | 'other';

export type Account = {
  account_id: string;
  name: string;
  official_name?: string;
  type: PlaidAccountType;
  subtype: PlaidAccountSubType;
  mask?: string;
  currency: CurrencyCode;
  balances: {
    available?: number;
    current: number;
    limit?: number;
    iso_currency_code?: string;
    unofficial_currency_code?: string;
  };
};
