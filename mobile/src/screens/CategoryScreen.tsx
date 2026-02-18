import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Vibration,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { expenseService } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Category'>;
  route: RouteProp<RootStackParamList, 'Category'>;
};

// Category icon and color mapping
const categoryIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  'local delivery': { icon: '🚚', color: '#2563EB', bgColor: '#BFDBFE' },
  'lunch and tea': { icon: '☕', color: '#EA580C', bgColor: '#FED7AA' },
  'godown logistics': { icon: '🏭', color: '#16A34A', bgColor: '#BBF7D0' },
  cleaning: { icon: '🧹', color: '#0891B2', bgColor: '#A5F3FC' },
  'petrol and diesel': { icon: '⛽', color: '#D97706', bgColor: '#FDE68A' },
  'office expense': { icon: '🏢', color: '#7C3AED', bgColor: '#DDD6FE' },
};

const getIconConfig = (categoryName: string) => {
  const lowerName = categoryName.toLowerCase();

  if (categoryIcons[lowerName]) {
    return categoryIcons[lowerName];
  }

  for (const [key, config] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return config;
    }
  }

  return { icon: '📋', color: '#6B7280', bgColor: '#E5E7EB' };
};

export default function CategoryScreen({ navigation, route }: Props) {
  const { imageUri, amount } = route.params;
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.getCategories();
      const data = response.data || response || [];
      const list = Array.isArray(data) ? data.slice(0, 6) : [];
      setCategories(list);
      if (list.length === 0) {
        setError('No expense categories found. Please add categories from the web dashboard.');
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to load categories. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (category: any) => {
    Vibration.vibrate(10);
    navigation.navigate('Payment', {
      imageUri,
      amount,
      categoryId: category.id,
      categoryName: category.category_name,
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
        <Text style={styles.headerTitle}>Select Category</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Amount Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryAmount}>₹{formattedAmount}</Text>
      </View>

      {/* Categories Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.categoriesContainer}>
          <View style={styles.grid}>
            {categories.map((category) => {
              const config = getIconConfig(category.category_name);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleSelect(category)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                    <Text style={styles.icon}>{config.icon}</Text>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.category_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
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
    padding: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
});
