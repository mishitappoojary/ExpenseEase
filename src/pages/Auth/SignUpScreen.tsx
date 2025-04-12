import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { StackRouteParamList } from '../../routes/stack.routes';
import { StyleSheet } from 'react-native';
import { useAppContext } from '../../contexts/AppContext';

//const API_BASE_URL = 'http://10.0.2.2:8000/api/accounts';
const API_BASE_URL = 'http://192.168.0.108:8000/api/accounts';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StackRouteParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAppContext();
  const [loading, setLoading] = useState(false);
  console.log("📌 Checking login function:", login);

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
      console.log('🔎 Full error object:', error);
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

        <View style={styles.signInContainer}>
                <Text style={styles.text}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('signIn')}>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  logo: { width: 250, height: 250 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textTransform: 'uppercase' },
  input: { width: '100%', height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10, paddingHorizontal: 10 },
  signUpButton: { width: '100%', backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  signUpButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  signInContainer: { flexDirection: 'row', marginTop: 20 },
  text: { fontSize: 16 },
  link: { fontSize: 16, color: 'blue', marginLeft: 5 },
});

export default SignUpScreen;