import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Vibration,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, AuthContext } from '../../App';
import { expenseService } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', icon: '💵', color: '#16A34A', bgColor: '#D1FAE5' },
  { id: 'UPI', label: 'UPI', icon: '📱', color: '#7C3AED', bgColor: '#EDE9FE' },
];

export default function PaymentScreen({ navigation, route }: Props) {
  const { imageUri, amount, categoryId, categoryName } = route.params;
  const { user } = useContext(AuthContext);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = async (methodId: string) => {
    Vibration.vibrate(10);
    setSelectedMethod(methodId);

    // Submit expense directly after payment method selection
    setLoading(true);
    try {
      const expenseData = {
        category_id: categoryId,
        expense_item: notes || categoryName,
        amount: amount,
        payment_mode: methodId,
        expense_date: new Date().toISOString().split('T')[0],
        paid_by_id: user?.id || 'mobile-user',
        paid_by_name: user?.employee_name || 'Mobile User',
        branch: user?.branch || 'Head Office',
        description: notes || undefined,
      };

      const response = await expenseService.createExpense(expenseData, imageUri);

      if (response.success) {
        const expense = response.data;
        Vibration.vibrate(50);
        navigation.replace('Success', {
          expenseNumber: expense.expense_number,
          amount: amount,
          isAutoApproved: expense.approval_status === 'Approved',
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to create expense');
        setSelectedMethod('');
      }
    } catch (error: any) {
      console.error('Error creating expense:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create expense. Check your connection.'
      );
      setSelectedMethod('');
    } finally {
      setLoading(false);
    }
  };

  const formattedAmount = amount.toLocaleString('en-IN');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={loading}>
          <Text style={[styles.backText, loading && styles.backTextDisabled]}>←</Text>
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
                loading && styles.methodCardDisabled,
              ]}
              onPress={() => handleSelect(method.id)}
              disabled={loading}
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
            style={[styles.notesInput, loading && styles.notesInputDisabled]}
            value={notes}
            onChangeText={setNotes}
            placeholder="What was this expense for?"
            placeholderTextColor="#9CA3AF"
            multiline
            editable={!loading}
          />
        </View>
      </ScrollView>

      {/* Loading indicator or instruction */}
      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Submitting expense...</Text>
          </View>
        ) : (
          <Text style={styles.instructionText}>Tap a payment method to submit</Text>
        )}
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
  backTextDisabled: {
    color: '#D1D5DB',
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
  methodCardDisabled: {
    opacity: 0.5,
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
  notesInputDisabled: {
    opacity: 0.5,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
