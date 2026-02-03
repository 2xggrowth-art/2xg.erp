import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Vibration,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, AuthContext } from '../../App';
import { expenseService } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Review'>;
  route: RouteProp<RootStackParamList, 'Review'>;
};

const AUTO_APPROVAL_THRESHOLD = 2000;

export default function ReviewScreen({ navigation, route }: Props) {
  const { imageUri, amount, categoryId, categoryName, paymentMethod, notes } = route.params;
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const formattedAmount = amount.toLocaleString('en-IN');
  const isAutoApproved = amount < AUTO_APPROVAL_THRESHOLD;
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleSubmit = async () => {
    setLoading(true);
    Vibration.vibrate(10);

    try {
      const expenseData = {
        category_id: categoryId,
        expense_item: notes || categoryName,
        amount: amount,
        payment_mode: paymentMethod,
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
      }
    } catch (error: any) {
      console.error('Error creating expense:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to create expense'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Submit</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Card */}
        <View style={styles.card}>
          {/* Receipt Preview */}
          {imageUri && (
            <View style={styles.receiptContainer}>
              <Image source={{ uri: imageUri }} style={styles.receiptImage} />
            </View>
          )}

          {/* Details */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <View style={styles.detailRight}>
              <Text style={styles.amountText}>₹{formattedAmount}</Text>
              {isAutoApproved && (
                <Text style={styles.autoApprovedText}>Auto-approved</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Category', { imageUri, amount })}>
              <Text style={styles.detailValue}>{categoryName} ✏️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Payment', { imageUri, amount, categoryId, categoryName })
              }
            >
              <Text style={styles.detailValue}>{paymentMethod} ✏️</Text>
            </TouchableOpacity>
          </View>

          {notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{notes}</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{today}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted By</Text>
            <Text style={styles.detailValue}>{user?.employee_name || 'Mobile User'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitText}>Submit Expense</Text>
              <Text style={styles.submitArrow}>✓</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  receiptContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  receiptImage: {
    width: 150,
    height: 120,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  autoApprovedText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  submitArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 8,
  },
});
