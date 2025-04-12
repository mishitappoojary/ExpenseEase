import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// const API_BASE_URL =
//   Platform.OS === "android"
//     ? "http://10.0.2.2:8000/api"
//     : "http://127.0.0.1:8000/api";

    const API_BASE_URL = 'http://192.168.0.108:8000/api';
    

// ✅ Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ Retrieve Auth Token from AsyncStorage
async function getAuthToken() {
  try {
    return await AsyncStorage.getItem("access_token");
  } catch (error) {
    console.error("Error retrieving access token:", error);
    return null;
  }
}

// ✅ Attach Token to API Requests
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Refresh Access Token
async function refreshAccessToken() {
  try {
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    if (!refreshToken) {
      console.warn("No refresh token found. Logging out user...");
      await authApi.logout();
      return null;
    }

    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: refreshToken,
    });

    if (response.data.access) {
      await AsyncStorage.setItem("access_token", response.data.access);
      return response.data.access;
    } else {
      console.warn("Failed to refresh token. Logging out user...");
      await authApi.logout();
      return null;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    await authApi.logout();
    return null;
  }
}

// ✅ Handle Expired Tokens (Auto Refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ Plaid API Wrapper
const plaidApi = {
  createLinkToken: async () => {
    try {
      const response = await api.post("/plaid/create-link-token/");
      if (!response.data?.link_token) {
        throw new Error("No link_token received from server");
      }
      return response.data.link_token;
    } catch (error) {
      console.error("Plaid link token error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create Plaid link"
      );
    }
  },

  exchangePublicToken: async (publicToken) => {
    try {
      const response = await api.post("/plaid/exchange-public-token/", { 
        public_token: publicToken 
      });
      
      if (!response.data?.success) {
        throw new Error("Token exchange failed on server");
      }
      return response.data;
    } catch (error) {
      console.error("Public token exchange error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to exchange public token"
      );
    }
  }, 
  fetchTransactions: async () =>
    api.get("/plaid/transactions/").then((res) => res.data.transactions),
  fetchManualTransactions: async () =>
    api.get("/transactions/").then((res) => res.data),
  fetchAccounts: async () =>
    api.get("/plaid/accounts/").then((res) => res.data.accounts),
  fetchLiabilities: async () =>
    api.get("/plaid/liabilities/").then((res) => res.data.liabilities),
  fetchInvestments: async () =>
    api.get("/plaid/investments/").then((res) => res.data.investments),
  fetchIncome: async () =>
    api.get("/plaid/incomes/").then((res) => res.data.incomes),
  fetchInstitutions: async () =>
    api.get("/plaid/institutions/").then((res) => res.data.institutions),
  getInstitutionDetails: async (institutionId) =>
    api.get(`/plaid/institutions/${institutionId}/`).then((res) => res.data),
  deleteItem: async (itemId) =>
    api.delete(`/plaid/items/${itemId}/`),
  refreshAccountData: async (itemId) =>
    api.post(`/plaid/items/${itemId}/refresh/`),
  getItemStatus: async (itemId) =>
    api.get(`/plaid/items/${itemId}/status/`).then((res) => res.data),
};

// ✅ Authentication API
const authApi = {
  login: async (credentials) =>
    api.post("/auth/login/", credentials).then(async (res) => {
      await AsyncStorage.setItem("access_token", res.data.access);
      await AsyncStorage.setItem("refresh_token", res.data.refresh);
      return res.data;
    }),
  refreshToken: async (refreshToken) =>
    api
      .post("/auth/token/refresh/", { refresh: refreshToken })
      .then((res) => res.data),
  logout: async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    console.log("Logged out successfully");
  },
};

// ✅ User Account API
const accountsApi = {
  signUp: async (userData) =>
    api.post("/accounts/signup/", userData).then((res) => res.data),
  getProfile: async () => api.get("/accounts/profile/").then((res) => res.data),
  updateProfile: async (profileData) =>
    api.put("/accounts/profile/update/", profileData).then((res) => res.data),
  changePassword: async (passwordData) =>
    api.post("/accounts/change-password/", passwordData).then((res) => res.data),
  getPreferences: async () =>
    api.get("/accounts/preferences/").then((res) => res.data),
  updatePreferences: async (preferencesData) =>
    api.put("/accounts/preferences/update/", preferencesData).then(
      (res) => res.data
    ),
  getStatistics: async () =>
    api.get("/accounts/stats/").then((res) => res.data),
  linkAccount: async (accountData) =>
    api.post("/accounts/link-account/", accountData).then((res) => res.data),
  unlinkAccount: async (accountId) =>
    api.delete(`/accounts/unlink-account/${accountId}/`).then((res) => res.data),
  getNotifications: async () =>
    api.get("/accounts/notifications/").then((res) => res.data),
  markNotificationRead: async (notificationId) =>
    api
      .post(`/accounts/notifications/mark-read/${notificationId}/`)
      .then((res) => res.data),
};

// ✅ Export API handlers
export { plaidApi, authApi, accountsApi };
export default api;
