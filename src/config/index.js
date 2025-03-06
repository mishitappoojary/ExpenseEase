// src/config/index.js

import { Platform } from 'react-native';

// Default development configuration
const devConfig = {
    API_URL: 'http://localhost:8000/api/plaid',
};

// Production configuration
const prodConfig = {
    // Replace with your actual production backend URL
    API_URL: 'https://your-production-backend.com/api/plaid',
};

// Staging configuration
const stagingConfig = {
    API_URL: 'https://staging-backend.com/api/plaid',
};

// Determine which configuration to use based on environment
const getConfig = () => {
    if (__DEV__) {
        // Use different localhost URL based on platform
        if (Platform.OS === 'android') {
            // Android emulator needs special IP for localhost
            devConfig.API_URL = 'http://10.0.2.2:8000/api/plaid';
        } else if (Platform.OS === 'ios') {
            // iOS simulator can use localhost
            devConfig.API_URL = 'http://localhost:8000/api/plaid';
        }
        return devConfig;
    }

    // Check for staging environment
    if (process.env.ENVIRONMENT === 'staging') {
        return stagingConfig;
    }

    // Default to production
    return prodConfig;
};

export const config = getConfig();

// Initialize API with the correct base URL
import { plaidApi } from '../services/plaidApiAdapter';
plaidApi.setBaseUrl(config.API_URL);
