import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Vibration,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Amount'>;
  route: RouteProp<RootStackParamList, 'Amount'>;
};

const AUTO_APPROVAL_THRESHOLD = 200;

export default function AmountScreen({ navigation, route }: Props) {
  const { imageUri } = route.params;
  const [amount, setAmount] = useState('0');

  const handleDigit = (digit: string) => {
    Vibration.vibrate(10);
    setAmount((prev) => {
      if (prev === '0') return digit;
      if (prev.length >= 8) return prev;
      return prev + digit;
    });
  };

  const handleDelete = () => {
    Vibration.vibrate(20);
    setAmount((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    Vibration.vibrate(50);
    setAmount('0');
  };

  const handleContinue = () => {
    Vibration.vibrate(10);
    navigation.navigate('Category', {
      imageUri,
      amount: parseFloat(amount),
    });
  };

  const formattedAmount = parseInt(amount).toLocaleString('en-IN');
  const isAutoApproved = parseFloat(amount) < AUTO_APPROVAL_THRESHOLD;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Amount</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Receipt Preview */}
      {imageUri && (
        <View style={styles.receiptContainer}>
          <Image source={{ uri: imageUri }} style={styles.receiptImage} />
        </View>
      )}

      {/* Amount Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.currencyLabel}>INR</Text>
        <Text style={styles.amountText}>₹{formattedAmount}</Text>
        {parseFloat(amount) > 0 && isAutoApproved && (
          <View style={styles.autoApprovedBadge}>
            <Text style={styles.autoApprovedText}>Will be auto-approved</Text>
          </View>
        )}
      </View>

      {/* Numeric Keypad */}
      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <TouchableOpacity
            key={digit}
            style={styles.keypadButton}
            onPress={() => handleDigit(digit)}
          >
            <Text style={styles.keypadText}>{digit}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.keypadButton, styles.clearButton]} onPress={handleClear}>
          <Text style={[styles.keypadText, styles.clearText]}>C</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.keypadButton} onPress={() => handleDigit('0')}>
          <Text style={styles.keypadText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.keypadButton} onPress={handleDelete}>
          <Text style={styles.keypadText}>⌫</Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, parseFloat(amount) <= 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={parseFloat(amount) <= 0}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Text style={styles.continueArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  receiptContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  receiptImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  currencyLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
  },
  autoApprovedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  autoApprovedText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  keypadButton: {
    width: '33.33%',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#111827',
  },
  clearButton: {},
  clearText: {
    color: '#DC2626',
    fontSize: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  continueArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 8,
  },
});
