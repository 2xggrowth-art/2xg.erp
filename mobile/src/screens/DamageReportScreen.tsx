import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { itemLookupService, damageReportService } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DamageReport'>;
};

const damageTypes = [
  { value: 'broken', label: 'Broken' },
  { value: 'water_damage', label: 'Water Damage' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' },
];

export default function DamageReportScreen({ navigation }: Props) {
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [barcode, setBarcode] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selected item
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form fields
  const [quantity, setQuantity] = useState('1');
  const [damageType, setDamageType] = useState('broken');
  const [description, setDescription] = useState('');

  const searchItem = async () => {
    const query = barcode.trim();
    if (!query) {
      Alert.alert('Enter Barcode', 'Please type a barcode or SKU to search.');
      return;
    }

    try {
      setSearching(true);
      const result = await itemLookupService.lookupByBarcode(query);
      const itemData = result.data || result;
      setSelectedItem(itemData);
      setStep('form');
    } catch (error: any) {
      Alert.alert('Not Found', error.message || 'No item found for this barcode/SKU.');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }

    try {
      setSubmitting(true);
      await damageReportService.create({
        item_id: selectedItem.id,
        item_name: selectedItem.item_name || selectedItem.name,
        quantity: qty,
        damage_type: damageType,
        description: description.trim() || undefined,
      });

      Alert.alert('Report Submitted', 'Damage report has been created successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create damage report');
    } finally {
      setSubmitting(false);
    }
  };

  const resetSearch = () => {
    setStep('search');
    setSelectedItem(null);
    setBarcode('');
    setQuantity('1');
    setDamageType('broken');
    setDescription('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Damage Report</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'search' && (
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Find Item</Text>
            <Text style={styles.sectionSubtitle}>Search by barcode or SKU</Text>

            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Enter barcode or SKU..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={searchItem}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={searchItem}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Search Item</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'form' && selectedItem && (
          <View style={styles.formSection}>
            {/* Selected Item Info */}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{selectedItem.item_name || selectedItem.name}</Text>
              <Text style={styles.itemSku}>SKU: {selectedItem.sku || '—'}</Text>
              <Text style={styles.itemStock}>
                Current Stock: {selectedItem.current_stock || 0}
              </Text>
              <TouchableOpacity onPress={resetSearch}>
                <Text style={styles.changeItem}>Change Item</Text>
              </TouchableOpacity>
            </View>

            {/* Quantity */}
            <Text style={styles.fieldLabel}>Damaged Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#9CA3AF"
            />

            {/* Damage Type */}
            <Text style={styles.fieldLabel}>Damage Type</Text>
            <View style={styles.typeGrid}>
              {damageTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    damageType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setDamageType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      damageType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.fieldLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the damage..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.primaryButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Damage Report</Text>
              )}
            </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    paddingTop: 40,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
  },
  formSection: {},
  itemInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemStock: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  changeItem: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    width: '100%',
  },
  textArea: {
    height: 90,
    paddingTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#DC2626',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#DC2626',
    marginTop: 32,
    marginBottom: 40,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
