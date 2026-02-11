import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Success'>;
  route: RouteProp<RootStackParamList, 'Success'>;
};

export default function SuccessScreen({ navigation, route }: Props) {
  const { expenseNumber, amount, isAutoApproved } = route.params;

  const formattedAmount = amount.toLocaleString('en-IN');

  const handleAddAnother = () => {
    Vibration.vibrate(10);
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.successIcon}>
        <Text style={styles.checkmark}>✓</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Expense Added!</Text>
      <Text style={styles.expenseNumber}>{expenseNumber}</Text>

      {/* Status Badge */}
      <View style={[styles.statusBadge, isAutoApproved ? styles.approvedBadge : styles.pendingBadge]}>
        <Text style={[styles.statusText, isAutoApproved ? styles.approvedText : styles.pendingText]}>
          {isAutoApproved ? '✓ Auto-Approved' : '⏳ Pending Approval'}
        </Text>
      </View>

      {/* Amount */}
      <Text style={styles.amount}>₹{formattedAmount}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddAnother}>
          <Text style={styles.primaryButtonIcon}>+</Text>
          <Text style={styles.primaryButtonText}>Add Another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 48,
    color: '#059669',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  expenseNumber: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 32,
  },
  approvedBadge: {
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  approvedText: {
    color: '#059669',
  },
  pendingText: {
    color: '#D97706',
  },
  amount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 48,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
