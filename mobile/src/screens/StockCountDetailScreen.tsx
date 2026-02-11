import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { stockCountService } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StockCountDetail'>;
  route: RouteProp<RootStackParamList, 'StockCountDetail'>;
};

interface StockCountItem {
  id: string;
  item_id: string;
  item_name: string;
  sku: string;
  bin_code: string | null;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  notes: string | null;
}

interface StockCount {
  id: string;
  stock_count_number: string;
  description: string | null;
  location_name: string | null;
  status: string;
  items: StockCountItem[];
}

export default function StockCountDetailScreen({ navigation, route }: Props) {
  const { stockCountId } = route.params;
  const [stockCount, setStockCount] = useState<StockCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [countedValues, setCountedValues] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const data = await stockCountService.getById(stockCountId);
      const sc = data.data || data;
      setStockCount(sc);

      // Init counted values from existing data
      const vals: Record<string, string> = {};
      (sc.items || []).forEach((item: StockCountItem) => {
        if (item.counted_quantity !== null && item.counted_quantity !== undefined) {
          vals[item.id] = String(item.counted_quantity);
        }
      });
      setCountedValues(vals);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load stock count');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [stockCountId, navigation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateCountedValue = (itemId: string, value: string) => {
    setCountedValues((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSave = async () => {
    if (!stockCount) return;

    const items = Object.entries(countedValues)
      .filter(([_, val]) => val !== '' && !isNaN(Number(val)))
      .map(([id, val]) => ({
        id,
        counted_quantity: Number(val),
      }));

    if (items.length === 0) {
      Alert.alert('No Counts', 'Please enter at least one counted quantity before saving.');
      return;
    }

    try {
      setSubmitting(true);
      await stockCountService.updateCounted(stockCount.id, items);
      Alert.alert('Saved', 'Counted quantities saved successfully.');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save counts');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!stockCount) return;

    const totalItems = stockCount.items?.length || 0;
    const countedItems = Object.values(countedValues).filter((v) => v !== '' && !isNaN(Number(v))).length;

    if (countedItems < totalItems) {
      Alert.alert(
        'Incomplete Count',
        `You have counted ${countedItems} of ${totalItems} items. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: doSubmit },
        ]
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    if (!stockCount) return;
    try {
      setSubmitting(true);

      // Save counted values first
      const items = Object.entries(countedValues)
        .filter(([_, val]) => val !== '' && !isNaN(Number(val)))
        .map(([id, val]) => ({
          id,
          counted_quantity: Number(val),
        }));

      if (items.length > 0) {
        await stockCountService.updateCounted(stockCount.id, items);
      }

      // Then update status to submitted
      await stockCountService.updateStatus(stockCount.id, 'submitted');
      Alert.alert('Submitted', 'Stock count submitted for approval.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit stock count');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCounting = async () => {
    if (!stockCount) return;
    try {
      setSubmitting(true);
      await stockCountService.updateStatus(stockCount.id, 'in_progress');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start counting');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: StockCountItem }) => {
    const canEdit = stockCount?.status === 'in_progress';
    const counted = countedValues[item.id];
    const hasVariance = counted !== '' && counted !== undefined && Number(counted) !== item.expected_quantity;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
            <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
          </View>
          {item.bin_code && (
            <View style={styles.binBadge}>
              <Text style={styles.binText}>{item.bin_code}</Text>
            </View>
          )}
        </View>

        <View style={styles.itemRow}>
          <View style={styles.qtyBox}>
            <Text style={styles.qtyLabel}>Expected</Text>
            <Text style={styles.qtyValue}>{item.expected_quantity}</Text>
          </View>

          <View style={styles.qtyBox}>
            <Text style={styles.qtyLabel}>Counted</Text>
            {canEdit ? (
              <TextInput
                style={[styles.qtyInput, hasVariance && styles.qtyInputVariance]}
                value={counted || ''}
                onChangeText={(val) => updateCountedValue(item.id, val)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.qtyValue}>
                {item.counted_quantity !== null ? item.counted_quantity : '—'}
              </Text>
            )}
          </View>

          {item.variance !== null && item.variance !== undefined && (
            <View style={styles.qtyBox}>
              <Text style={styles.qtyLabel}>Variance</Text>
              <Text style={[
                styles.qtyValue,
                item.variance === 0 ? styles.varianceZero : styles.varianceNonZero,
              ]}>
                {item.variance > 0 ? `+${item.variance}` : item.variance}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading stock count...</Text>
      </View>
    );
  }

  if (!stockCount) return null;

  const isEditable = stockCount.status === 'in_progress';
  const isDraft = stockCount.status === 'draft';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stockCount.stock_count_number}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Info Bar */}
      <View style={styles.infoBar}>
        {stockCount.location_name && (
          <Text style={styles.infoText}>Location: {stockCount.location_name}</Text>
        )}
        <Text style={styles.infoText}>
          Items: {stockCount.items?.length || 0} | Status: {stockCount.status.replace(/_/g, ' ')}
        </Text>
      </View>

      {/* Items */}
      <FlatList
        data={stockCount.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {/* Actions */}
      <View style={styles.actions}>
        {isDraft && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartCounting}
            disabled={submitting}
          >
            <Text style={styles.actionButtonText}>
              {submitting ? 'Starting...' : 'Start Counting'}
            </Text>
          </TouchableOpacity>
        )}
        {isEditable && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton, { flex: 1, marginRight: 8 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              <Text style={styles.saveButtonText}>
                {submitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton, { flex: 1, marginLeft: 8 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.actionButtonText}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {stockCount.status === 'submitted' && (
          <View style={styles.submittedBanner}>
            <Text style={styles.submittedText}>Submitted — Awaiting approval</Text>
          </View>
        )}
        {stockCount.status === 'approved' && (
          <View style={[styles.submittedBanner, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.submittedText, { color: '#059669' }]}>Approved — Stock adjusted</Text>
          </View>
        )}
        {stockCount.status === 'rejected' && (
          <View style={[styles.submittedBanner, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.submittedText, { color: '#DC2626' }]}>Rejected — Please re-count</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  infoBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  itemSku: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  binBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  binText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBox: {
    flex: 1,
    alignItems: 'center',
  },
  qtyLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  qtyInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
    backgroundColor: '#FFFFFF',
  },
  qtyInputVariance: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  varianceZero: {
    color: '#059669',
  },
  varianceNonZero: {
    color: '#DC2626',
  },
  actions: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2563EB',
  },
  saveButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submittedBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submittedText: {
    color: '#D97706',
    fontSize: 15,
    fontWeight: '600',
  },
});
