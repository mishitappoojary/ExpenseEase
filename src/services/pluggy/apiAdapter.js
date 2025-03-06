// src/services/plaidApiAdapter.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This will be updated with your actual deployed backend URL
const API_BASE_URL = 'http://localhost:8000/api/plaid';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for handling Django CSRF tokens
});

// Map frontend endpoint names to backend endpoint names
const endpointMap = {
  // Token endpoints
  '/create_link_token/': '/create-link-token/',
  '/exchange_public_token/': '/exchange-public-token/',
  
  // Account endpoints
  '/accounts/': '/item-accounts/',
  
  // Transaction endpoints - we'll need to implement this in the backend
  '/transactions/': '/transactions/',
  
  // Item management endpoints
  '/items/': '/remove/',
  
  // Other endpoints
  '/investments/': '/investments/',
  '/institutions/': '/institutions/',
};

// Add an authentication interceptor
api.interceptors.request.use(async (config) => {
  // Get the authentication token from AsyncStorage instead of localStorage
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error accessing AsyncStorage:', error);
  }
  
  // Map the endpoint if needed
  const originalUrl = config.url;
  for (const [frontendPath, backendPath] of Object.entries(endpointMap)) {
    if (originalUrl.startsWith(frontendPath)) {
      config.url = originalUrl.replace(frontendPath, backendPath);
      break;
    }
  }
  
  return config;
});

// Add a response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific HTTP errors
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access
          console.error('Unauthorized: Please log in again');
          break;
        case 403:
          // Handle forbidden access
          console.error('Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          // Handle not found
          console.error('Not found: The requested resource does not exist');
          break;
        case 500:
          // Handle server errors
          console.error('Server error: Something went wrong on the server');
          break;
      }
    }
    return Promise.reject(error);
  },
);

export const plaidApi = {
  // Create Link Token
  createLinkToken: async () => {
    try {
      const response = await api.post('/create_link_token/');
      return response.data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw error;
    }
  },

  // Exchange Public Token for Access Token
  exchangePublicToken: async (publicToken) => {
    try {
      const response = await api.post('/exchange_public_token/', {
        public_token: publicToken,
      });
      return response.data;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw error;
    }
  },

  // Fetch Transactions
  fetchTransactions: async () => {
    try {
      const response = await api.get('/transactions/');
      return response.data.transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Fetch Accounts
  fetchAccounts: async () => {
    try {
      const response = await api.get('/accounts/');
      return response.data.accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Fetch Investments
  fetchInvestments: async () => {
    try {
      const response = await api.get('/investments/');
      return response.data.investments;
    } catch (error) {
      console.error('Error fetching investments:', error);
      throw error;
    }
  },

  // Delete an Item (disconnect from Plaid)
  deleteItem: async (itemId) => {
    try {
      await api.delete(`/items/${itemId}/`);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  // Refresh Account Data
  refreshAccountData: async (itemId) => {
    try {
      await api.post(`/items/${itemId}/refresh/`);
    } catch (error) {
      console.error('Error refreshing account data:', error);
      throw error;
    }
  },

  // Get Institution Details
  getInstitutionDetails: async (institutionId) => {
    try {
      const response = await api.get(`/institutions/${institutionId}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting institution details:', error);
      throw error;
    }
  },
  
  // Update API base URL (for deployment)
  setBaseUrl: (url) => {
    api.defaults.baseURL = url;
  }
};

export default plaidApi;
