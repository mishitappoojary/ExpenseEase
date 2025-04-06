import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { StackRouteParamList } from '../../routes/stack.routes';
import { styles } from './styles';
import { useAppContext } from '../../contexts/AppContext'; // Use your existing context

const API_BASE_URL = 'http://10.0.2.2:8000/api/accounts';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StackRouteParamList>>();
  const { login } = useAppContext(); // Use the login function from app context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    console.log('🔄 Attempting Sign Up...');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/signup/`, { email, password });
      console.log('✅ Sign-up successful:', response.data);

      // Use the login function from context which handles token storage and state update
      await login(response.data.access);
      
      Alert.alert('Success', 'Account created successfully!');
      // No need to navigate - the stack will automatically switch to authenticated routes
      // when isAuthenticated becomes true in the context
    } catch (error: any) {
      console.error('❌ Sign-up error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to sign up. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/adaptive-icon2.jpg')} style={styles.logo} />
      <Text style={styles.title}>Sign Up</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        editable={!loading}
        keyboardType="email-address"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword}
        editable={!loading} 
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.signInButton} 
        onPress={() => navigation.navigate('signIn')}
        disabled={loading}
      >
        <Text style={styles.signInButtonText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpScreen;