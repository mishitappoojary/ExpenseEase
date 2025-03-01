import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getReactNativePersistence } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
const firebaseConfig = {
  apiKey: 'AIzaSyBIpnNq3FZziU17N0nH69kzSoozh3DDn_4',
  authDomain: 'expenseease-49365.firebaseapp.com',
  projectId: 'expenseease-49365',
  storageBucket: 'expenseease-49365.firebasestorage.app',
  messagingSenderId: '468531748319',
  appId: '1:468531748319:web:cd78aee2ab4dd641cff86a',
  measurementId: 'G-H27H34Q8RJ',
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
