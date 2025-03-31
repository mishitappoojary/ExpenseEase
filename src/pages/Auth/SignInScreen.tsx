import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackRouteParamList } from '../../routes/stack.routes';
import { styles } from './styles';
import { useAppContext } from '../../contexts/AppContext';


const API_BASE_URL = 'http://10.0.2.2:8000//api/auth';

const SignInScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<StackRouteParamList>>();

  console.log('Rendering SignInScreen...');

  const { login } = useAppContext();

  const handleSignIn = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login/`, { email, password });
      const accessToken = response.data.access;  // JWT access token
  
      await login(accessToken);  // ✅ Call login to update auth state
  
      console.log('✅ Authentication Successful, Token Saved');
      navigation.navigate('home');  // ✅ Navigate after login
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to sign in. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/adaptive-icon.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Sign In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.signUpButton}
        onPress={() => navigation.navigate('signUp')}
      >
        <Text style={styles.signUpButtonText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignInScreen;
