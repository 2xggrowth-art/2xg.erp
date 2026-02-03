import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Vibration,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', icon: '💵', color: '#16A34A', bgColor: '#D1FAE5' },
  { id: 'UPI', label: 'UPI', icon: '📱', color: '#7C3AED', bgColor: '#EDE9FE' },
  { id: 'Debit Card', label: 'Debit', icon: '💳', color: '#2563EB', bgColor: '#DBEAFE' },
  { id: 'Credit Card', label: 'Credit', icon: '💳', color: '#EA580C', bgColor: '#FED7AA' },
  { id: 'Bank Transfer', label: 'Bank', icon: '🏦', color: '#6B7280', bgColor: '#E5E7EB' },
];

export default function PaymentScreen({ navigation, route }: Props) {
  const { imageUri, amount, categoryId, categoryName } = route.params;
  const [selectedMethod, setSelectedMethod] = useState('');
  const [notes, setNotes] = useState('');

  const handleSelect = (methodId: string) => {
    Vibration.vibrate(10);
    setSelectedMethod(methodId);
  };

  const handleContinue = () => {
    if (!selectedMethod) return;
    Vibration.vibrate(10);
    navigation.navigate('Review', {
      imageUri,
      amount,
      categoryId,
      categoryName,
      paymentMethod: selectedMethod,
      notes,
    });
  };

  const formattedAmount = amount.toLocaleString('en-IN');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryCategory}>{categoryName}</Text>
        <Text style={styles.summaryAmount}>₹{formattedAmount}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Payment Methods Grid */}
        <View style={styles.methodsGrid}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
              ]}
              onPress={() => handleSelect(method.id)}
            >
              <View style={[styles.methodIcon, { backgroundColor: method.bgColor }]}>
                <Text style={styles.methodEmoji}>{method.icon}</Text>
              </View>
              <Text
                style={[
                  styles.methodLabel,
                  selectedMethod === method.id && styles.methodLabelSelected,
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes Input */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="What was this expense for?"
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedMethod && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedMethod}
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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryCategory: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  methodCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  methodCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  methodEmoji: {
    fontSize: 28,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  methodLabelSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top',
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
