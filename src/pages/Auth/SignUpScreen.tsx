import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackRouteParamList } from '../../routes/stack.routes';
import { styles } from './styles';

const API_BASE_URL = 'http://10.0.2.2:8000/api/accounts';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StackRouteParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    console.log("📌 SignUpScreen Component Mounted!");
    AsyncStorage.getItem('access_token').then(token => {
      console.log("🔍 Access Token in SignUpScreen:", token ? token : "Not Found");
    });
  }, []);
  
  const handleSignUp = async () => {
    console.log('🔄 Attempting Sign Up...');
    try {
      const response = await axios.post(`${API_BASE_URL}/signup/`, { email, password });
      console.log('✅ Sign-up successful:', response.data);

      await AsyncStorage.setItem('access_token', response.data.token);
      Alert.alert('Success', 'Account created successfully!');
      
      navigation.replace('home');
    } catch (error: any) {
      console.error('❌ Sign-up error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to sign up. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/adaptive-icon.png')} style={styles.logo} />
      <Text style={styles.title}>Sign Up</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={styles.signUpButtonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpScreen;
