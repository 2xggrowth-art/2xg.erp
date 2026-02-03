import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { AuthContext } from '../../App';
import { authService } from '../services/api';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const pinInputRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (!pin || pin.length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    Vibration.vibrate(10);

    try {
      const response = await authService.login(phoneNumber, pin);

      if (response.success) {
        Vibration.vibrate(50);
        login(response.data.token, response.data.user);
      } else {
        Alert.alert('Login Failed', response.error || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.error || 'Unable to connect to server'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);

    // Auto-focus to PIN when phone is complete
    if (cleaned.length === 10) {
      pinInputRef.current?.focus();
    }
  };

  const handlePinChange = (text: string) => {
    // Only allow numbers, max 4 digits
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(cleaned);

    // Auto-submit when PIN is complete
    if (cleaned.length === 4 && phoneNumber.length === 10) {
      Vibration.vibrate(10);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>2XG</Text>
          <Text style={styles.subtitle}>Expense Tracker</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.phoneInput}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            placeholder="Enter 10-digit number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus
          />

          <Text style={styles.label}>4-Digit PIN</Text>
          <TextInput
            ref={pinInputRef}
            style={styles.pinInput}
            value={pin}
            onChangeText={handlePinChange}
            placeholder="••••"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />

          <TouchableOpacity
            style={[
              styles.loginButton,
              (loading || phoneNumber.length !== 10 || pin.length !== 4) &&
                styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading || phoneNumber.length !== 10 || pin.length !== 4}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Contact admin if you don't have login credentials
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#111827',
    marginBottom: 20,
    letterSpacing: 2,
  },
  pinInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 24,
    fontSize: 14,
  },
});
