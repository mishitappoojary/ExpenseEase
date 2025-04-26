import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { StackRouteParamList } from '../../routes/stack.routes';
import { useAppContext } from '../../contexts/AppContext';

const API_BASE_URL = 'http://10.0.2.2:8000/api/auth';
// const API_BASE_URL = 'http://192.168.0.103:8000/api/auth';



const SignInScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<StackRouteParamList>>();
  const { login } = useAppContext();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      console.log("Sending login request with:", { username: email, password });
      const response = await axios.post(`${API_BASE_URL}/login/`, { username: email, password });
      const accessToken = response.data.access;
      await login(accessToken);
      console.log('✅ Authentication Successful, Token Saved');
      
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        // source={require('../../assets/adaptive-icon.png')}
        source={require('../../assets/adaptive-icon2.jpg')}
        style={styles.logo}
      />
      <Text style={styles.title}>Sign In</Text>

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      )}

      <View style={styles.signUpContainer}>
        <Text style={styles.text}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('signUp')}>
          <Text style={styles.link}>Sign Up</Text>
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
  signInButton: { width: '100%', backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  signInButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  signUpContainer: { flexDirection: 'row', marginTop: 20 },
  text: { fontSize: 16 },
  link: { fontSize: 16, color: 'blue', marginLeft: 5 },
});

export default SignInScreen;
