import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackRouteParamList } from '../../routes/stack.routes';
import { StyleSheet } from 'react-native';
import { useAppContext } from '../../contexts/AppContext';

//const API_BASE_URL = 'http://10.0.2.2:8000/api/accounts';
const API_BASE_URL = 'http://192.168.0.103:8000/api/auth';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StackRouteParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAppContext();
  console.log("📌 Checking login function:", login);

  useEffect(() => {
    console.log("📌 SignUpScreen Component Mounted!");
    AsyncStorage.getItem('access_token').then(token => {
      console.log("🔍 Access Token in SignUpScreen:", token ? token : "Not Found");
    });
  }, []);
  
  const handleSignUp = async () => {
    console.log('🔄 Attempting Sign Up...');
    try {
      const response = await axios.post(`${API_BASE_URL}/signup/`, { username: email, password });
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

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: 200, height: 200, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10, paddingHorizontal: 10 },
  signUpButton: { width: '100%', backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  signUpButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default SignUpScreen;