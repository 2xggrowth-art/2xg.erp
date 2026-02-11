import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { itemLookupService } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ItemLookup'>;
};

interface ItemResult {
  id: string;
  item_name: string;
  name: string;
  sku: string;
  current_stock: number;
  cost_price: number;
  unit_price: number;
  unit_of_measurement: string;
  category_name?: string;
}

interface BinInfo {
  bin_code: string;
  bin_location_id: string;
  net_quantity: number;
}

export default function ItemLookupScreen({ navigation }: Props) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<ItemResult | null>(null);
  const [bins, setBins] = useState<BinInfo[]>([]);

  const doLookup = async () => {
    const query = barcode.trim();
    if (!query) {
      Alert.alert('Enter Barcode', 'Please type or scan a barcode/SKU to look up.');
      return;
    }

    try {
      setLoading(true);
      setItem(null);
      setBins([]);

      const result = await itemLookupService.lookupByBarcode(query);
      const itemData = result.data || result;
      setItem(itemData);

      // Fetch bin locations
      try {
        const binResult = await itemLookupService.getItemBins(itemData.id);
        setBins(binResult.data || []);
      } catch {
        // Bins might not exist
      }
    } catch (error: any) {
      Alert.alert('Not Found', error.message || 'No item found for this barcode/SKU.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `\u20B9${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Lookup</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={barcode}
          onChangeText={setBarcode}
          placeholder="Enter barcode, SKU, or UPC..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={doLookup}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={doLookup}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>{loading ? '...' : 'Search'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Looking up item...</Text>
          </View>
        )}

        {!loading && !item && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🔍</Text>
            <Text style={styles.placeholderText}>
              Enter a barcode or SKU above to find an item
            </Text>
          </View>
        )}

        {item && (
          <View style={styles.resultCard}>
            <Text style={styles.itemName}>{item.item_name || item.name}</Text>
            <Text style={styles.itemSku}>SKU: {item.sku || '—'}</Text>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock</Text>
              <Text style={[styles.detailValue, (item.current_stock || 0) <= 0 && styles.stockLow]}>
                {item.current_stock || 0} {item.unit_of_measurement || 'pcs'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cost Price</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.cost_price)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Selling Price</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.unit_price)}</Text>
            </View>
            {item.category_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{item.category_name}</Text>
              </View>
            )}

            {/* Bin Locations */}
            {bins.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>Bin Locations</Text>
                {bins.map((bin, idx) => (
                  <View key={idx} style={styles.binRow}>
                    <View style={styles.binBadge}>
                      <Text style={styles.binCode}>{bin.bin_code}</Text>
                    </View>
                    <Text style={styles.binQty}>{bin.net_quantity} units</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centered: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  placeholder: {
    alignItems: 'center',
    paddingTop: 80,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  stockLow: {
    color: '#DC2626',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  binRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  binBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  binCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  binQty: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});
