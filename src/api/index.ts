import axios from 'axios';

// const BASE_URL = 'http://localhost:8000/api';
const BASE_URL = 'http://127.0.0.1:8000/api/plaid'; //For expo

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Define Account interface based on Plaid API
export interface Account {
  id: string;
  itemId: string;
  name: string;
  official_name?: string;
  type: 'depository' | 'investment' | 'credit' | 'loan' | 'other';
  balance: {
    available: number | null;
    current: number;
    limit?: number | null;
    currency: string;
  };
  institution_id?: string;
  subtype?:
    | 'checking'
    | 'savings'
    | 'money market'
    | 'cd'
    | 'credit card'
    | 'mortgage'
    | 'auto'
    | 'student'
    | 'personal'
    | 'other'; // ✅ Enforced valid subtypes
}

// Define Item interface for Plaid integration
export interface Item {
  id: string;
  institution_id?: string;
  webhook?: string;
  available_products: string[];
  billed_products: string[];
  error?: string | null;
  consent_expiration_time?: string | null;
}

