import React, { useState, useEffect, useContext, useCallback, useRef, createContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Vibration,
  FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Modal, Animated, RefreshControl,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';

// ============================================================================
// SECTION 1: CONSTANTS & COLORS
// ============================================================================

const COLORS = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1D4ED8',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
  black: '#000000',
};

// ============================================================================
// SECTION 2: TYPES & INTERFACES
// ============================================================================

interface User {
  id: string;
  employee_name: string;
  phone_number: string;
  role: 'admin' | 'counter' | 'staff';
}

interface StockCountItem {
  id: string;
  item_id: string;
  item_name: string;
  sku: string;
  serial_number: string | null;  // For serial-tracked items
  bin_code: string | null;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  notes: string | null;
}

interface StockCount {
  id: string;
  stock_count_number: string;
  count_number?: string;
  description: string | null;
  location_name: string | null;
  bin_code?: string;
  status: 'pending' | 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'recount';
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
  items: StockCountItem[];
  total_items?: number;
  counted_items?: number;
  mismatches?: number;
  accuracy?: number;
  type?: string;
}

interface BinLocation {
  id: string;
  bin_code: string;
  location_id?: string;
  location_name?: string;
  description?: string;
  status: string;
  items?: BinItem[];
}

interface BinItem {
  item_id: string;
  item_name: string;
  sku: string;
  quantity: number;
}

// Navigation types
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================================
// SECTION 3: API SERVICE
// ============================================================================

const API_URL = 'https://api.erp.2xg.in/api';

const api = {
  async request(method: string, endpoint: string, data?: any) {
    const token = await SecureStore.getItemAsync('authToken');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config: RequestInit = { method, headers };
    if (data) config.body = JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, config);
    return response.json();
  },
  get: (endpoint: string) => api.request('GET', endpoint),
  post: (endpoint: string, data?: any) => api.request('POST', endpoint, data),
  put: (endpoint: string, data?: any) => api.request('PUT', endpoint, data),
  patch: (endpoint: string, data?: any) => api.request('PATCH', endpoint, data),
};

// ============================================================================
// SECTION 4: AUTH CONTEXT
// ============================================================================

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const res = await api.get('/mobile-auth/verify');
        if (res.success) setUser(res.data);
        else await SecureStore.deleteItemAsync('authToken');
      }
    } catch {
      await SecureStore.deleteItemAsync('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, pin: string) => {
    const res = await api.post('/mobile-auth/login', { phone_number: phone, pin });
    if (res.success) {
      await SecureStore.setItemAsync('authToken', res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.error || 'Login failed');
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};

// ============================================================================
// SECTION 5: REUSABLE COMPONENTS
// ============================================================================

// StatCard
const StatCard = ({ value, label, color = 'primary', icon }: {
  value: string | number; label: string; color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple'; icon?: string;
}) => {
  const colorMap = {
    primary: { bg: COLORS.primaryLight, text: COLORS.primary },
    success: { bg: COLORS.successLight, text: COLORS.success },
    warning: { bg: COLORS.warningLight, text: COLORS.warning },
    danger: { bg: COLORS.dangerLight, text: COLORS.danger },
    purple: { bg: COLORS.purpleLight, text: COLORS.purple },
  };
  const c = colorMap[color];
  return (
    <View style={[styles.statCard, { backgroundColor: c.bg }]}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

// Badge
const Badge = ({ type, children }: { type: 'progress' | 'pending' | 'done' | 'mismatch' | 'draft' | 'rejected'; children: React.ReactNode; }) => {
  const typeMap = {
    progress: { bg: COLORS.primaryLight, text: COLORS.primary },
    pending: { bg: COLORS.warningLight, text: COLORS.warning },
    done: { bg: COLORS.successLight, text: COLORS.success },
    mismatch: { bg: COLORS.dangerLight, text: COLORS.danger },
    draft: { bg: COLORS.gray200, text: COLORS.gray600 },
    rejected: { bg: COLORS.dangerLight, text: COLORS.danger },
  };
  const c = typeMap[type];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{children}</Text>
    </View>
  );
};

// ProgressBar
const ProgressBar = ({ progress, color = COLORS.primary }: { progress: number; color?: string }) => (
  <View style={styles.progressBarBg}>
    <View style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%`, backgroundColor: color }]} />
  </View>
);

// CountCard
const CountCard = ({ count, onPress }: { count: StockCount; onPress: () => void }) => {
  const progress = count.total_items ? Math.round(((count.counted_items || 0) / count.total_items) * 100) : 0;
  const badgeType = { draft: 'draft', pending: 'pending', in_progress: 'progress', submitted: 'pending', approved: 'done', rejected: 'rejected', recount: 'mismatch' }[count.status] as any;

  return (
    <TouchableOpacity style={styles.countCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.countCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.countCardLocation}>{count.location_name || 'Unknown'} {count.bin_code && `— ${count.bin_code}`}</Text>
          <Text style={styles.countCardNumber}>{count.stock_count_number || count.count_number}</Text>
        </View>
        <Badge type={badgeType}>{count.status.replace('_', ' ')}</Badge>
      </View>
      <View style={styles.countCardMeta}>
        <Text style={styles.countCardItems}>{count.total_items || count.items?.length || 0} items</Text>
        {count.due_date && <Text style={styles.countCardDue}>Due: {count.due_date}</Text>}
      </View>
      {['in_progress', 'recount'].includes(count.status) && (
        <View style={styles.countCardProgress}>
          <View style={{ flex: 1 }}><ProgressBar progress={progress} /></View>
          <Text style={styles.countCardPct}>{progress}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ApprovalCard
const ApprovalCard = ({ count, onPress }: { count: StockCount; onPress: () => void }) => (
  <TouchableOpacity style={styles.approvalCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.approvalCardHeader}>
      <Text style={styles.approvalCardLocation}>{count.location_name} {count.bin_code && `— ${count.bin_code}`}</Text>
      {count.mismatches !== undefined && count.mismatches > 0 && <Badge type="mismatch">{count.mismatches} mismatches</Badge>}
    </View>
    <Text style={styles.approvalCardNumber}>{count.stock_count_number || count.count_number}</Text>
    <View style={styles.approvalCardMeta}>
      <Text style={styles.approvalCardAssignee}>By: {count.assigned_to_name || 'Unknown'}</Text>
      {count.accuracy !== undefined && <Text style={styles.approvalCardAccuracy}>{count.accuracy.toFixed(1)}% accuracy</Text>}
    </View>
  </TouchableOpacity>
);

// ItemRow
const ItemRow = ({ item, onPress, showVariance = false }: { item: StockCountItem; onPress?: () => void; showVariance?: boolean; }) => {
  const isCounted = item.counted_quantity !== null;
  const hasVariance = isCounted && item.counted_quantity !== item.expected_quantity;
  const isSerial = !!item.serial_number;

  return (
    <TouchableOpacity style={[styles.itemRow, hasVariance && styles.itemRowVariance, isSerial && styles.itemRowSerial]} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.itemRowIcon, isSerial && styles.itemRowIconSerial]}><Text style={styles.itemRowEmoji}>{isSerial ? '🏷️' : '📦'}</Text></View>
      <View style={styles.itemRowContent}>
        <Text style={styles.itemRowName} numberOfLines={1}>{item.item_name}</Text>
        {isSerial ? (
          <Text style={styles.itemRowSerialText}>{item.serial_number}</Text>
        ) : (
          <Text style={styles.itemRowSku}>{item.sku || 'No SKU'}</Text>
        )}
      </View>
      <View style={styles.itemRowQty}>
        {showVariance && isCounted ? (
          <>
            <Text style={styles.itemRowExp}>Exp: {item.expected_quantity}</Text>
            <Text style={[styles.itemRowCounted, hasVariance && styles.itemRowCountedVar]}>Got: {item.counted_quantity}</Text>
          </>
        ) : (
          <>
            <Text style={styles.itemRowExp}>{item.expected_quantity}</Text>
            <Text style={[styles.itemRowStatus, isCounted && (hasVariance ? styles.itemRowStatusMismatch : styles.itemRowStatusMatch)]}>
              {!isCounted ? '—' : hasVariance ? '!' : '✓'}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ScheduleBanner
const ScheduleBanner = ({ days }: { days: { name: string; status: 'done' | 'today' | 'upcoming' }[] }) => (
  <View style={styles.scheduleBanner}>
    <Text style={styles.scheduleBannerTitle}>This Week's Schedule</Text>
    <View style={styles.scheduleDays}>
      {days.map((d, i) => (
        <View key={i} style={[styles.scheduleDay, d.status === 'done' && styles.scheduleDayDone, d.status === 'today' && styles.scheduleDayToday]}>
          <Text style={[styles.scheduleDayText, d.status === 'today' && styles.scheduleDayTextToday]}>{d.name}</Text>
          {d.status === 'done' && <Text style={styles.scheduleDayCheck}>✓</Text>}
          {d.status === 'today' && <View style={styles.scheduleDayDot} />}
        </View>
      ))}
    </View>
  </View>
);

// Header
const Header = ({ title, onBack, rightAction }: { title: string; onBack?: () => void; rightAction?: { label: string; onPress: () => void }; }) => (
  <View style={styles.header}>
    {onBack ? (
      <TouchableOpacity onPress={onBack} style={styles.headerBack}><Text style={styles.headerBackText}>← Back</Text></TouchableOpacity>
    ) : <View style={{ width: 60 }} />}
    <Text style={styles.headerTitle}>{title}</Text>
    {rightAction ? (
      <TouchableOpacity onPress={rightAction.onPress} style={styles.headerAction}><Text style={styles.headerActionText}>{rightAction.label}</Text></TouchableOpacity>
    ) : <View style={{ width: 60 }} />}
  </View>
);

// ============================================================================
// SECTION 6: AUTH SCREENS
// ============================================================================

function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const pinRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (phone.length < 10) { Alert.alert('Error', 'Enter valid phone'); return; }
    if (pin.length !== 4) { Alert.alert('Error', 'Enter 4-digit PIN'); return; }
    setLoading(true);
    try {
      await login(phone.replace(/\D/g, '').slice(-10), pin);
      Vibration.vibrate(50);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.loginHeader}>
        <Text style={styles.loginIcon}>📦</Text>
        <Text style={styles.loginTitle}>StockCount</Text>
        <Text style={styles.loginSubtitle}>2XG ERP</Text>
      </View>
      <View style={styles.loginForm}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.loginInput}
          value={phone}
          onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); if (t.replace(/\D/g, '').length >= 10) pinRef.current?.focus(); }}
          placeholder="Enter 10-digit number"
          placeholderTextColor={COLORS.gray400}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <Text style={styles.inputLabel}>4-Digit PIN</Text>
        <TextInput
          ref={pinRef}
          style={styles.loginPinInput}
          value={pin}
          onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          placeholderTextColor={COLORS.gray400}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.primaryBtn, (loading || phone.length < 10 || pin.length !== 4) && styles.primaryBtnDisabled]} onPress={handleLogin} disabled={loading || phone.length < 10 || pin.length !== 4}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// SECTION 7: COUNTER SCREENS
// ============================================================================

// CounterDashboard
function CounterDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get(`/stock-counts?assigned_to=${user?.id}`);
      if (res.success) setCounts(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const activeCounts = counts.filter(c => ['pending', 'draft', 'in_progress', 'recount'].includes(c.status));
  const pendingReview = counts.filter(c => c.status === 'submitted').length;
  const completed = counts.filter(c => c.status === 'approved').length;

  const schedule = [
    { name: 'Mon', status: 'done' as const },
    { name: 'Tue', status: 'done' as const },
    { name: 'Wed', status: 'today' as const },
    { name: 'Thu', status: 'upcoming' as const },
    { name: 'Fri', status: 'upcoming' as const },
  ];

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.employee_name || 'Counter'}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }])} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.dashboardContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>
        <View style={styles.statsRow}>
          <StatCard value={activeCounts.length} label="Active" color="primary" icon="📋" />
          <StatCard value={pendingReview} label="Pending" color="warning" icon="⏳" />
          <StatCard value={completed} label="Done" color="success" icon="✓" />
        </View>

        <ScheduleBanner days={schedule} />

        <Text style={styles.sectionTitle}>My Assigned Counts</Text>
        {activeCounts.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyStateIcon}>📭</Text><Text style={styles.emptyStateText}>No active counts assigned</Text></View>
        ) : (
          activeCounts.map(count => (
            <CountCard key={count.id} count={count} onPress={() => navigation.navigate('CountDetail', { countId: count.id })} />
          ))
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('ItemLookup')}>
            <Text style={styles.quickActionIcon}>🔍</Text>
            <Text style={styles.quickActionLabel}>Item Lookup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('BinInventory')}>
            <Text style={styles.quickActionIcon}>📦</Text>
            <Text style={styles.quickActionLabel}>Bin Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('DamageReport')}>
            <Text style={styles.quickActionIcon}>⚠️</Text>
            <Text style={styles.quickActionLabel}>Damage</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// CountDetail
function CountDetailScreen({ navigation, route }: any) {
  const { countId } = route.params;
  const [count, setCount] = useState<StockCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [countedValues, setCountedValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'remaining' | 'counted'>('all');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/stock-counts/${countId}`);
      if (res.success) {
        let sc = res.data;

        // Auto-start if pending - update local state with new status
        if (['pending', 'recount'].includes(sc.status)) {
          const startRes = await api.post(`/stock-counts/${countId}/start`);
          if (startRes.success && startRes.data) {
            sc = { ...sc, status: 'in_progress' };
          }
        }

        setCount(sc);
        const vals: Record<string, string> = {};
        (sc.items || []).forEach((item: StockCountItem) => {
          if (item.counted_quantity !== null) vals[item.id] = String(item.counted_quantity);
        });
        setCountedValues(vals);
      }
    } catch (e: any) { Alert.alert('Error', e.message); navigation.goBack(); }
    finally { setLoading(false); }
  }, [countId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const getFilteredItems = () => {
    if (!count) return [];
    const items = count.items || [];
    if (activeTab === 'remaining') return items.filter(i => !countedValues[i.id]);
    if (activeTab === 'counted') return items.filter(i => countedValues[i.id]);
    return items;
  };

  const getProgress = () => {
    if (!count) return { counted: 0, total: 0, pct: 0 };
    const total = count.items?.length || 0;
    const counted = Object.keys(countedValues).filter(k => countedValues[k] !== '').length;
    return { counted, total, pct: total > 0 ? Math.round((counted / total) * 100) : 0 };
  };

  const handleSave = async () => {
    if (!count) return;
    const items = Object.entries(countedValues).filter(([_, v]) => v !== '' && !isNaN(Number(v))).map(([id, v]) => ({ id, counted_quantity: Number(v) }));
    if (items.length === 0) { Alert.alert('No Counts', 'Enter at least one quantity'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/stock-counts/${countId}/items`, { items });
      Alert.alert('Saved', 'Counts saved');
      fetchData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
  };

  const handleReviewSubmit = () => {
    if (!count) return;
    navigation.navigate('EndCount', {
      countId: count.id,
      countNumber: count.stock_count_number || count.count_number,
      items: count.items.map(item => ({
        ...item,
        counted_quantity: countedValues[item.id] !== undefined ? Number(countedValues[item.id]) : item.counted_quantity,
      })),
    });
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!count) return null;

  const isEditable = ['in_progress', 'recount'].includes(count.status);
  const progress = getProgress();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={count.stock_count_number || count.count_number || 'Count'} onBack={() => navigation.goBack()} />

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>{count.location_name} {count.bin_code && `— ${count.bin_code}`}</Text>
        <Text style={styles.infoText}>{count.items?.length || 0} items • {count.status.replace('_', ' ')}</Text>
      </View>

      {isEditable && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>{progress.counted}/{progress.total} items</Text>
            <Text style={styles.progressPct}>{progress.pct}%</Text>
          </View>
          <ProgressBar progress={progress.pct} color={progress.pct === 100 ? COLORS.success : COLORS.primary} />
        </View>
      )}

      {isEditable && (
        <View style={styles.tabs}>
          {(['all', 'remaining', 'counted'] as const).map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={getFilteredItems()}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, item.serial_number && styles.itemCardSerial]}>
            <View style={styles.itemCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
                {item.serial_number ? (
                  <View style={styles.serialBadgeSmall}>
                    <Text style={styles.serialBadgeSmallText}>SN: {item.serial_number}</Text>
                  </View>
                ) : (
                  <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
                )}
              </View>
              {item.bin_code && <View style={styles.binBadge}><Text style={styles.binBadgeText}>{item.bin_code}</Text></View>}
              {item.serial_number && countedValues[item.id] && (
                <View style={styles.serialCountedBadge}><Text style={styles.serialCountedBadgeText}>✓</Text></View>
              )}
            </View>
            <View style={styles.itemCardRow}>
              <View style={styles.qtyBox}>
                <Text style={styles.qtyLabel}>Expected</Text>
                <Text style={styles.qtyValue}>{item.expected_quantity}</Text>
              </View>
              <View style={styles.qtyBox}>
                <Text style={styles.qtyLabel}>Counted</Text>
                {isEditable && !item.serial_number ? (
                  <TextInput
                    style={[styles.qtyInput, countedValues[item.id] && Number(countedValues[item.id]) !== item.expected_quantity && styles.qtyInputVariance]}
                    value={countedValues[item.id] || ''}
                    onChangeText={v => setCountedValues(prev => ({ ...prev, [item.id]: v }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.gray400}
                  />
                ) : (
                  <Text style={[styles.qtyValue, item.serial_number && countedValues[item.id] && styles.qtyValueSerial]}>{countedValues[item.id] || (item.counted_quantity ?? '—')}</Text>
                )}
              </View>
            </View>
            {item.serial_number && !countedValues[item.id] && isEditable && (
              <Text style={styles.serialScanHint}>Scan barcode to count</Text>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.actions}>
        {isEditable && (
          <>
            <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('Scanner', { countId: count.id, items: count.items })}>
              <Text style={styles.scanBtnText}>📷 Scan Barcode</Text>
            </TouchableOpacity>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, marginRight: 8 }]} onPress={handleSave} disabled={submitting}>
                <Text style={styles.secondaryBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.successBtn, { flex: 1, marginLeft: 8 }]} onPress={handleReviewSubmit}>
                <Text style={styles.successBtnText}>Review & Submit</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {count.status === 'submitted' && <View style={styles.statusBanner}><Text style={styles.statusBannerText}>Submitted — Awaiting approval</Text></View>}
        {count.status === 'approved' && <View style={[styles.statusBanner, { backgroundColor: COLORS.successLight }]}><Text style={[styles.statusBannerText, { color: COLORS.success }]}>Approved — Stock adjusted</Text></View>}
        {count.status === 'rejected' && <View style={[styles.statusBanner, { backgroundColor: COLORS.dangerLight }]}><Text style={[styles.statusBannerText, { color: COLORS.danger }]}>Rejected — Please re-count</Text></View>}
      </View>
    </KeyboardAvoidingView>
  );
}

// Scanner
function ScannerScreen({ navigation, route }: any) {
  const { countId, items } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  useEffect(() => { if (!permission?.granted) requestPermission(); }, [permission]);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || lookingUp) return;
    setScanned(true);
    setLookingUp(true);
    Vibration.vibrate(50);

    try {
      // First, check for serial number match (exact match for serial-tracked items)
      const serialMatched = items.find((i: StockCountItem) =>
        i.serial_number && i.serial_number.toLowerCase() === data.toLowerCase()
      );
      if (serialMatched) {
        navigation.navigate('ScannedItem', { item: serialMatched, countId, isSerial: true });
        return;
      }

      // Then check SKU match
      const skuMatched = items.find((i: StockCountItem) =>
        i.sku?.toLowerCase() === data.toLowerCase() || i.sku?.includes(data)
      );
      if (skuMatched) {
        navigation.navigate('ScannedItem', { item: skuMatched, countId, isSerial: false });
        return;
      }

      // Try API lookup for barcode/serial
      const res = await api.get(`/items/barcode/${encodeURIComponent(data)}`);
      const apiItem = res.data || res;

      // Check if matched serial exists in our items list
      if (apiItem.matched_serial) {
        const serialItem = items.find((i: StockCountItem) =>
          i.serial_number === apiItem.matched_serial
        );
        if (serialItem) {
          navigation.navigate('ScannedItem', { item: serialItem, countId, isSerial: true });
          return;
        }
      }

      // Fallback to item_id match
      const apiMatched = items.find((i: StockCountItem) => i.item_id === apiItem.id);
      if (apiMatched) {
        navigation.navigate('ScannedItem', { item: apiMatched, countId, isSerial: false });
      } else {
        navigation.navigate('ScanUnknown', { barcode: data, countId });
      }
    } catch {
      Alert.alert('Not Found', `No item for: ${data}`, [
        { text: 'Scan Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLookingUp(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}><Text style={styles.primaryBtnText}>Grant Permission</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" enableTorch={flashOn} barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'upc_a', 'qr'] }} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} />
      <View style={styles.scannerOverlay}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.scannerHeaderText}>Cancel</Text></TouchableOpacity>
          <Text style={styles.scannerHeaderTitle}>Scan Barcode</Text>
          <TouchableOpacity onPress={() => setFlashOn(!flashOn)}><Text style={styles.scannerHeaderText}>{flashOn ? '🔦 On' : '🔦 Off'}</Text></TouchableOpacity>
        </View>
        <View style={styles.scannerFrame}>
          <View style={[styles.scannerCorner, styles.scannerCornerTL]} />
          <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
          <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
          <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] }) }] }]} />
        </View>
        <Text style={styles.scannerInstruction}>{lookingUp ? 'Looking up...' : 'Point at barcode'}</Text>
        <Text style={styles.scannerItemCount}>
          {items.filter((i: StockCountItem) => i.serial_number).length > 0
            ? `${items.filter((i: StockCountItem) => i.serial_number).length} serial items • ${items.filter((i: StockCountItem) => !i.serial_number).length} regular items`
            : `${items.length} items in count`
          }
        </Text>
      </View>
    </View>
  );
}

// ScannedItem
function ScannedItemScreen({ navigation, route }: any) {
  const { item, countId, isSerial = false } = route.params;
  const [quantity, setQuantity] = useState(item.counted_quantity?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  // For serial-tracked items, auto-count as 1 and save immediately
  useEffect(() => {
    if (isSerial && item.serial_number && !autoSaved && item.counted_quantity === null) {
      setAutoSaved(true);
      autoSaveSerial();
    }
  }, [isSerial, item.serial_number]);

  const autoSaveSerial = async () => {
    setSaving(true);
    try {
      await api.patch(`/stock-counts/${countId}/items`, { items: [{ id: item.id, counted_quantity: 1 }] });
      Vibration.vibrate([0, 50, 100, 50]); // Double vibrate for serial scan success
      Alert.alert('Serial Counted!', `${item.item_name}\nSerial: ${item.serial_number}`, [
        { text: 'Scan Next', onPress: () => navigation.goBack() },
        { text: 'Done', onPress: () => navigation.navigate('CountDetail', { countId }) },
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) { Alert.alert('Invalid', 'Enter a valid quantity'); return; }
    setSaving(true);
    try {
      await api.patch(`/stock-counts/${countId}/items`, { items: [{ id: item.id, counted_quantity: qty }] });
      Vibration.vibrate(50);
      Alert.alert('Saved', `${item.item_name}: ${qty}`, [
        { text: 'Scan More', onPress: () => navigation.goBack() },
        { text: 'Done', onPress: () => navigation.navigate('CountDetail', { countId }) },
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  // For serial items that are auto-saving, show a different UI
  if (isSerial && item.serial_number && (saving || autoSaved)) {
    return (
      <View style={styles.container}>
        <Header title="Serial Scanned" onBack={() => navigation.goBack()} />
        <View style={[styles.centered, { padding: 24 }]}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.scannedItemName}>{item.item_name}</Text>
          <View style={styles.serialBadge}>
            <Text style={styles.serialBadgeText}>{item.serial_number}</Text>
          </View>
          {saving && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Item Found" onBack={() => navigation.goBack()} />
      <View style={styles.scannedItemContent}>
        <View style={styles.scannedItemCard}>
          <Text style={styles.scannedItemIcon}>📦</Text>
          <Text style={styles.scannedItemName}>{item.item_name}</Text>
          {item.serial_number ? (
            <View style={styles.serialBadge}>
              <Text style={styles.serialBadgeText}>SN: {item.serial_number}</Text>
            </View>
          ) : (
            <Text style={styles.scannedItemSku}>SKU: {item.sku || 'N/A'}</Text>
          )}
          {item.bin_code && <Badge type="progress">{item.bin_code}</Badge>}
        </View>
        <View style={styles.scannedItemExpected}>
          <Text style={styles.scannedItemExpLabel}>Expected Quantity</Text>
          <Text style={styles.scannedItemExpValue}>{item.expected_quantity}</Text>
        </View>
        {!item.serial_number && (
          <>
            <Text style={styles.inputLabel}>Enter Counted Quantity</Text>
            <TextInput style={styles.bigInput} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.gray400} autoFocus />
          </>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Save Count'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ScanUnknown
function ScanUnknownScreen({ navigation, route }: any) {
  const { barcode, countId } = route.params;
  return (
    <View style={styles.container}>
      <Header title="Unknown Item" onBack={() => navigation.goBack()} />
      <View style={styles.centered}>
        <Text style={styles.unknownIcon}>❓</Text>
        <Text style={styles.unknownTitle}>Item Not in Count</Text>
        <Text style={styles.unknownBarcode}>Barcode: {barcode}</Text>
        <Text style={styles.unknownDesc}>This item is not part of the current stock count.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// EndCount
function EndCountScreen({ navigation, route }: any) {
  const { countId, countNumber, items } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const mismatches = items.filter((i: StockCountItem) => i.counted_quantity !== null && i.counted_quantity !== i.expected_quantity);
  const uncounted = items.filter((i: StockCountItem) => i.counted_quantity === null);
  const accuracy = items.length > 0 ? ((items.length - mismatches.length) / items.length * 100).toFixed(1) : '100';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/stock-counts/${countId}/submit`);
      navigation.navigate('Submitted', { countNumber });
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <View style={styles.container}>
      <Header title="Review Count" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.endCountContent}>
        <View style={styles.statsRow}>
          <StatCard value={items.length} label="Total" color="primary" />
          <StatCard value={mismatches.length} label="Mismatches" color={mismatches.length > 0 ? 'danger' : 'success'} />
          <StatCard value={`${accuracy}%`} label="Accuracy" color="success" />
        </View>
        {uncounted.length > 0 && <View style={styles.warningBox}><Text style={styles.warningText}>⚠️ {uncounted.length} items not counted</Text></View>}
        {mismatches.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Mismatches ({mismatches.length})</Text>
            {mismatches.map((item: StockCountItem) => <ItemRow key={item.id} item={item} showVariance />)}
          </>
        )}
      </ScrollView>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.primaryBtnText}>{submitting ? 'Submitting...' : 'Submit for Approval'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Submitted
function SubmittedScreen({ navigation, route }: any) {
  const { countNumber } = route.params;
  return (
    <View style={[styles.container, styles.centered]}>
      <Text style={styles.successIcon}>✓</Text>
      <Text style={styles.successTitle}>Count Submitted!</Text>
      <Text style={styles.successSubtitle}>{countNumber}</Text>
      <Text style={styles.successDesc}>Your count has been submitted for admin review.</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.popToTop()}>
        <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

// CountHistory
function CountHistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.get(`/stock-counts?assigned_to=${user?.id}`)
      .then(res => setCounts((res.data || []).filter((c: StockCount) => ['submitted', 'approved', 'rejected'].includes(c.status))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}><Text style={styles.screenHeaderTitle}>Count History</Text></View>
      <FlatList
        data={counts}
        keyExtractor={c => c.id}
        renderItem={({ item }) => <CountCard count={item} onPress={() => navigation.navigate('CountDetail', { countId: item.id })} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyStateIcon}>📋</Text><Text style={styles.emptyStateText}>No completed counts yet</Text></View>}
      />
    </View>
  );
}

// Profile
function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}><Text style={styles.screenHeaderTitle}>Profile</Text></View>
      <View style={styles.profileContent}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{user?.employee_name?.charAt(0) || 'U'}</Text></View>
        <Text style={styles.profileName}>{user?.employee_name}</Text>
        <Text style={styles.profileRole}>{user?.role}</Text>
        <Text style={styles.profilePhone}>{user?.phone_number}</Text>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.danger, marginTop: 40 }]} onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }])}>
          <Text style={styles.primaryBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ItemLookup
function ItemLookupScreen({ navigation }: any) {
  const [barcode, setBarcode] = useState('');
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!barcode) return;
    setLoading(true);
    try {
      const res = await api.get(`/items/barcode/${encodeURIComponent(barcode)}`);
      setItem(res.data || res);
    } catch { Alert.alert('Not Found', 'No item found'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Header title="Item Lookup" onBack={() => navigation.goBack()} />
      <View style={styles.lookupContent}>
        <TextInput style={styles.searchInput} value={barcode} onChangeText={setBarcode} placeholder="Enter barcode or SKU" placeholderTextColor={COLORS.gray400} onSubmitEditing={handleLookup} />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLookup} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? 'Searching...' : 'Search'}</Text>
        </TouchableOpacity>
        {item && (
          <View style={styles.lookupResult}>
            <Text style={styles.lookupItemName}>{item.item_name || item.name}</Text>
            <Text style={styles.lookupItemSku}>SKU: {item.sku}</Text>
            <Text style={styles.lookupItemStock}>Stock: {item.current_stock || 0}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// BinInventory
function BinInventoryScreen({ navigation }: any) {
  const [bins, setBins] = useState<BinLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.get('/bin-locations/stock/all')
      .then(res => setBins(res.data || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <Header title="Bin Inventory" onBack={() => navigation.goBack()} />
      <FlatList
        data={bins}
        keyExtractor={b => b.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.binCard}>
            <Text style={styles.binCardCode}>{item.bin_code}</Text>
            <Text style={styles.binCardLocation}>{item.location_name || 'Unknown'}</Text>
            <Text style={styles.binCardItems}>{item.items?.length || 0} items</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// DamageReport
function DamageReportScreen({ navigation }: any) {
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!itemId || !quantity) { Alert.alert('Required', 'Enter item and quantity'); return; }
    setSubmitting(true);
    try {
      await api.post('/damage-reports', { item_id: itemId, quantity: Number(quantity), description });
      Alert.alert('Submitted', 'Damage report submitted', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <View style={styles.container}>
      <Header title="Damage Report" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.formContent}>
        <Text style={styles.inputLabel}>Item ID / Barcode</Text>
        <TextInput style={styles.formInput} value={itemId} onChangeText={setItemId} placeholder="Scan or enter item" placeholderTextColor={COLORS.gray400} />
        <Text style={styles.inputLabel}>Damaged Quantity</Text>
        <TextInput style={styles.formInput} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.gray400} />
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Describe the damage..." placeholderTextColor={COLORS.gray400} multiline />
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.danger }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.primaryBtnText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// SECTION 8: ADMIN SCREENS
// ============================================================================

// AdminDashboard
function AdminDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.get('/stock-counts?status=submitted')
      .then(res => setPendingApprovals(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.dashboardHeader}>
        <View><Text style={styles.greeting}>Admin Dashboard</Text><Text style={styles.userName}>{user?.employee_name}</Text></View>
        <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }])} style={styles.logoutBtn}><Text style={styles.logoutBtnText}>Logout</Text></TouchableOpacity>
      </View>
      <ScrollView style={styles.dashboardContent}>
        <View style={styles.statsRow}>
          <StatCard value={pendingApprovals.length} label="Pending" color="warning" icon="⏳" />
          <StatCard value={0} label="Active" color="primary" icon="📋" />
          <StatCard value={0} label="Today" color="success" icon="✓" />
        </View>
        <View style={styles.adminQuickActions}>
          <TouchableOpacity style={styles.adminQuickAction} onPress={() => navigation.navigate('AssignCount')}><Text style={styles.adminQuickActionIcon}>➕</Text><Text style={styles.adminQuickActionLabel}>Assign Count</Text></TouchableOpacity>
          <TouchableOpacity style={styles.adminQuickAction} onPress={() => navigation.navigate('Schedule')}><Text style={styles.adminQuickActionIcon}>📅</Text><Text style={styles.adminQuickActionLabel}>Schedule</Text></TouchableOpacity>
          <TouchableOpacity style={styles.adminQuickAction} onPress={() => navigation.navigate('Workload')}><Text style={styles.adminQuickActionIcon}>👥</Text><Text style={styles.adminQuickActionLabel}>Workload</Text></TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Pending Approvals ({pendingApprovals.length})</Text>
        {pendingApprovals.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyStateIcon}>✓</Text><Text style={styles.emptyStateText}>All caught up!</Text></View>
        ) : (
          pendingApprovals.slice(0, 5).map(c => <ApprovalCard key={c.id} count={c} onPress={() => navigation.navigate('ReviewCount', { countId: c.id })} />)
        )}
      </ScrollView>
    </View>
  );
}

// AssignCount
function AssignCountScreen({ navigation }: any) {
  const [bins, setBins] = useState<BinLocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBin, setSelectedBin] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/bin-locations'), api.get('/mobile-auth/users')])
      .then(([binsRes, usersRes]) => {
        setBins(binsRes.data || binsRes || []);
        setUsers((usersRes.data || usersRes || []).filter((u: User) => u.role !== 'admin'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!selectedBin || !selectedUser) { Alert.alert('Required', 'Select bin and counter'); return; }
    setCreating(true);
    try {
      await api.post('/stock-counts', { bin_location_id: selectedBin, assigned_to: selectedUser });
      Alert.alert('Created', 'Stock count assigned', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setCreating(false); }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <Header title="Assign Count" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.formContent}>
        <Text style={styles.inputLabel}>Select Bin</Text>
        <View style={styles.pickerContainer}>
          {bins.map(b => (
            <TouchableOpacity key={b.id} style={[styles.pickerOption, selectedBin === b.id && styles.pickerOptionSelected]} onPress={() => setSelectedBin(b.id)}>
              <Text style={[styles.pickerOptionText, selectedBin === b.id && styles.pickerOptionTextSelected]}>{b.bin_code}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.inputLabel}>Assign To</Text>
        <View style={styles.pickerContainer}>
          {users.map(u => (
            <TouchableOpacity key={u.id} style={[styles.pickerOption, selectedUser === u.id && styles.pickerOptionSelected]} onPress={() => setSelectedUser(u.id)}>
              <Text style={[styles.pickerOptionText, selectedUser === u.id && styles.pickerOptionTextSelected]}>{u.employee_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={creating}>
          <Text style={styles.primaryBtnText}>{creating ? 'Creating...' : 'Create & Assign'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ApprovalsList
function ApprovalsListScreen({ navigation }: any) {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'submitted' | 'approved' | 'rejected'>('submitted');

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.get(`/stock-counts?status=${filter}`)
      .then(res => setCounts(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]));

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}><Text style={styles.screenHeaderTitle}>Approvals</Text></View>
      <View style={styles.tabs}>
        {(['submitted', 'approved', 'rejected'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={counts}
          keyExtractor={c => c.id}
          renderItem={({ item }) => <ApprovalCard count={item} onPress={() => navigation.navigate('ReviewCount', { countId: item.id })} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyStateText}>No counts</Text></View>}
        />
      )}
    </View>
  );
}

// ReviewCount
function ReviewCountScreen({ navigation, route }: any) {
  const { countId } = route.params;
  const [count, setCount] = useState<StockCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.get(`/stock-counts/${countId}`)
      .then(res => setCount(res.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [countId]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await api.post(`/stock-counts/${countId}/approve`);
      Alert.alert('Approved', 'Stock count approved', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setProcessing(false); }
  };

  const handleReject = () => {
    Alert.prompt('Reject', 'Enter reason for rejection', [
      { text: 'Cancel' },
      { text: 'Reject', style: 'destructive', onPress: async (reason) => {
        setProcessing(true);
        try {
          await api.post(`/stock-counts/${countId}/reject`, { reason: reason || 'Rejected' });
          Alert.alert('Rejected', 'Stock count rejected', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (e: any) { Alert.alert('Error', e.message); }
        finally { setProcessing(false); }
      }},
    ]);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!count) return null;

  const mismatches = count.items?.filter(i => i.counted_quantity !== null && i.counted_quantity !== i.expected_quantity) || [];

  return (
    <View style={styles.container}>
      <Header title="Review Count" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewNumber}>{count.stock_count_number || count.count_number}</Text>
          <Text style={styles.reviewLocation}>{count.location_name} {count.bin_code && `— ${count.bin_code}`}</Text>
          <Text style={styles.reviewAssignee}>Counted by: {count.assigned_to_name}</Text>
        </View>
        <View style={styles.statsRow}>
          <StatCard value={count.items?.length || 0} label="Items" color="primary" />
          <StatCard value={mismatches.length} label="Mismatches" color={mismatches.length > 0 ? 'danger' : 'success'} />
        </View>
        {mismatches.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Mismatches</Text>
            {mismatches.map(item => <ItemRow key={item.id} item={item} showVariance />)}
          </>
        )}
      </ScrollView>
      {count.status === 'submitted' && (
        <View style={styles.reviewActions}>
          <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, marginRight: 8, borderColor: COLORS.danger }]} onPress={handleReject} disabled={processing}>
            <Text style={[styles.secondaryBtnText, { color: COLORS.danger }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.successBtn, { flex: 1, marginLeft: 8 }]} onPress={handleApprove} disabled={processing}>
            <Text style={styles.successBtnText}>{processing ? '...' : 'Approve'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Placeholder screens
function WorkloadScreen({ navigation }: any) {
  return <View style={styles.container}><Header title="Workload" onBack={() => navigation.goBack()} /><View style={styles.centered}><Text style={styles.placeholderIcon}>👥</Text><Text style={styles.placeholderText}>Coming soon</Text></View></View>;
}

function ScheduleScreen({ navigation }: any) {
  return <View style={styles.container}><Header title="Schedule" onBack={() => navigation.goBack()} /><View style={styles.centered}><Text style={styles.placeholderIcon}>📅</Text><Text style={styles.placeholderText}>Coming soon</Text></View></View>;
}

// ============================================================================
// SECTION 9: NAVIGATION
// ============================================================================

function CounterTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.gray200, height: 60, paddingBottom: 8 }, tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: COLORS.gray400 }}>
      <Tab.Screen name="Home" component={CounterDashboard} options={{ tabBarLabel: 'Home', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
      <Tab.Screen name="History" component={CountHistoryScreen} options={{ tabBarLabel: 'History', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.gray200, height: 60, paddingBottom: 8 }, tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: COLORS.gray400 }}>
      <Tab.Screen name="Dashboard" component={AdminDashboard} options={{ tabBarLabel: 'Dashboard', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }} />
      <Tab.Screen name="Approvals" component={ApprovalsListScreen} options={{ tabBarLabel: 'Approvals', tabBarIcon: () => <Text style={{ fontSize: 20 }}>✓</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={isAdmin ? AdminTabs : CounterTabs} />
            {/* Counter screens */}
            <Stack.Screen name="CountDetail" component={CountDetailScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="ScannedItem" component={ScannedItemScreen} />
            <Stack.Screen name="ScanUnknown" component={ScanUnknownScreen} />
            <Stack.Screen name="EndCount" component={EndCountScreen} />
            <Stack.Screen name="Submitted" component={SubmittedScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="ItemLookup" component={ItemLookupScreen} />
            <Stack.Screen name="BinInventory" component={BinInventoryScreen} />
            <Stack.Screen name="DamageReport" component={DamageReportScreen} />
            {/* Admin screens */}
            <Stack.Screen name="AssignCount" component={AssignCountScreen} />
            <Stack.Screen name="ReviewCount" component={ReviewCountScreen} />
            <Stack.Screen name="Workload" component={WorkloadScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================================================
// SECTION 10: MAIN APP
// ============================================================================

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// ============================================================================
// SECTION 11: STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  headerBack: { width: 60 },
  headerBackText: { fontSize: 16, color: COLORS.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray900 },
  headerAction: { width: 60, alignItems: 'flex-end' },
  headerActionText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  screenHeader: { backgroundColor: COLORS.white, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  screenHeaderTitle: { fontSize: 24, fontWeight: '700', color: COLORS.gray900 },

  // Dashboard
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  greeting: { fontSize: 14, color: COLORS.gray500 },
  userName: { fontSize: 20, fontWeight: '600', color: COLORS.gray900 },
  logoutBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.dangerLight, borderRadius: 8 },
  logoutBtnText: { color: COLORS.danger, fontWeight: '600' },
  dashboardContent: { flex: 1, padding: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, color: COLORS.gray600, marginTop: 4 },

  // Badge
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

  // Progress
  progressBarBg: { height: 6, backgroundColor: COLORS.gray200, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // CountCard
  countCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  countCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  countCardLocation: { fontSize: 15, fontWeight: '600', color: COLORS.gray900 },
  countCardNumber: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  countCardMeta: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  countCardItems: { fontSize: 12, color: COLORS.gray500 },
  countCardDue: { fontSize: 12, color: COLORS.warning },
  countCardProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  countCardPct: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // ApprovalCard
  approvalCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  approvalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  approvalCardLocation: { fontSize: 15, fontWeight: '600', color: COLORS.gray900 },
  approvalCardNumber: { fontSize: 13, color: COLORS.gray500 },
  approvalCardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  approvalCardAssignee: { fontSize: 12, color: COLORS.gray500 },
  approvalCardAccuracy: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },

  // ItemRow
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 12, borderRadius: 8, marginBottom: 8 },
  itemRowVariance: { borderLeftWidth: 3, borderLeftColor: COLORS.danger },
  itemRowIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemRowEmoji: { fontSize: 20 },
  itemRowContent: { flex: 1 },
  itemRowName: { fontSize: 14, fontWeight: '500', color: COLORS.gray900 },
  itemRowSku: { fontSize: 12, color: COLORS.gray400 },
  itemRowQty: { alignItems: 'flex-end' },
  itemRowExp: { fontSize: 12, color: COLORS.gray500 },
  itemRowCounted: { fontSize: 14, fontWeight: '600', color: COLORS.gray900 },
  itemRowCountedVar: { color: COLORS.danger },
  itemRowStatus: { fontSize: 16, fontWeight: '600', color: COLORS.gray400 },
  itemRowStatusMatch: { color: COLORS.success },
  itemRowStatusMismatch: { color: COLORS.danger },
  itemRowSerial: { borderLeftWidth: 2, borderLeftColor: COLORS.purple },
  itemRowIconSerial: { backgroundColor: COLORS.purpleLight },
  itemRowSerialText: { fontSize: 11, color: COLORS.purple, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Schedule
  scheduleBanner: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  scheduleBannerTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray700, marginBottom: 12 },
  scheduleDays: { flexDirection: 'row', justifyContent: 'space-between' },
  scheduleDay: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center' },
  scheduleDayDone: { backgroundColor: COLORS.successLight },
  scheduleDayToday: { backgroundColor: COLORS.primary },
  scheduleDayText: { fontSize: 12, fontWeight: '500', color: COLORS.gray600 },
  scheduleDayTextToday: { color: COLORS.white },
  scheduleDayCheck: { fontSize: 10, color: COLORS.success },
  scheduleDayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.white, marginTop: 2 },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray700, marginTop: 16, marginBottom: 12 },

  // QuickActions
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, alignItems: 'center' },
  quickActionIcon: { fontSize: 24, marginBottom: 8 },
  quickActionLabel: { fontSize: 12, fontWeight: '500', color: COLORS.gray700 },
  adminQuickActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  adminQuickAction: { flex: 1, backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 16, alignItems: 'center' },
  adminQuickActionIcon: { fontSize: 24, marginBottom: 8 },
  adminQuickActionLabel: { fontSize: 12, fontWeight: '500', color: COLORS.primary },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateIcon: { fontSize: 48, marginBottom: 12 },
  emptyStateText: { fontSize: 15, color: COLORS.gray500 },

  // Login
  loginHeader: { backgroundColor: COLORS.primary, paddingTop: 80, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  loginIcon: { fontSize: 48, marginBottom: 12 },
  loginTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  loginSubtitle: { fontSize: 14, color: COLORS.primaryLight, marginTop: 4 },
  loginForm: { flex: 1, padding: 24, marginTop: -20, backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray700, marginBottom: 8, marginTop: 16 },
  loginInput: { backgroundColor: COLORS.gray100, borderRadius: 12, padding: 16, fontSize: 18, color: COLORS.gray900, letterSpacing: 2 },
  loginPinInput: { backgroundColor: COLORS.gray100, borderRadius: 12, padding: 16, fontSize: 24, color: COLORS.gray900, textAlign: 'center', letterSpacing: 8 },

  // Buttons
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  primaryBtnDisabled: { backgroundColor: COLORS.gray400 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  secondaryBtn: { backgroundColor: COLORS.gray100, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray200 },
  secondaryBtnText: { color: COLORS.gray700, fontSize: 16, fontWeight: '600' },
  successBtn: { backgroundColor: COLORS.success, borderRadius: 12, padding: 16, alignItems: 'center' },
  successBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  scanBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  scanBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },

  // Actions
  actions: { padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray200 },
  actionRow: { flexDirection: 'row' },
  reviewActions: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray200 },

  // Info
  infoBar: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  infoText: { fontSize: 13, color: COLORS.gray500 },

  // Progress
  progressSection: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 13, color: COLORS.gray500 },
  progressPct: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: COLORS.gray100 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.gray600 },
  tabTextActive: { color: COLORS.white },

  // List
  listContent: { padding: 16, paddingBottom: 100 },

  // ItemCard
  itemCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  itemCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  itemName: { fontSize: 15, fontWeight: '600', color: COLORS.gray900 },
  itemSku: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  binBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  binBadgeText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  itemCardRow: { flexDirection: 'row' },
  qtyBox: { flex: 1, alignItems: 'center' },
  qtyLabel: { fontSize: 11, color: COLORS.gray400, marginBottom: 4, textTransform: 'uppercase' },
  qtyValue: { fontSize: 18, fontWeight: '600', color: COLORS.gray900 },
  qtyInput: { fontSize: 18, fontWeight: '600', color: COLORS.gray900, textAlign: 'center', borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 70 },
  qtyInputVariance: { borderColor: COLORS.warning, backgroundColor: COLORS.warningLight },

  // Status
  statusBanner: { backgroundColor: COLORS.warningLight, borderRadius: 12, padding: 16, alignItems: 'center' },
  statusBannerText: { color: COLORS.warning, fontSize: 15, fontWeight: '600' },

  // Scanner
  scannerContainer: { flex: 1, backgroundColor: COLORS.black },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  scannerHeaderText: { color: COLORS.white, fontSize: 16 },
  scannerHeaderTitle: { color: COLORS.white, fontSize: 18, fontWeight: '600' },
  scannerFrame: { width: 280, height: 200, alignSelf: 'center', position: 'relative' },
  scannerCorner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.primary, borderWidth: 4 },
  scannerCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  scannerCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  scannerCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  scannerCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', left: 10, right: 10, height: 2, backgroundColor: COLORS.primary },
  scannerInstruction: { color: COLORS.white, fontSize: 16, textAlign: 'center', marginBottom: 8 },
  scannerItemCount: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginBottom: 100 },
  permissionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.gray900, marginBottom: 16 },

  // ScannedItem
  scannedItemContent: { flex: 1, padding: 24 },
  scannedItemCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  scannedItemIcon: { fontSize: 48, marginBottom: 16 },
  scannedItemName: { fontSize: 18, fontWeight: '600', color: COLORS.gray900, textAlign: 'center' },
  scannedItemSku: { fontSize: 14, color: COLORS.gray500, marginTop: 4, marginBottom: 8 },
  scannedItemExpected: { backgroundColor: COLORS.gray100, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  scannedItemExpLabel: { fontSize: 12, color: COLORS.gray500, marginBottom: 4 },
  scannedItemExpValue: { fontSize: 32, fontWeight: '700', color: COLORS.gray900 },
  bigInput: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 32, fontWeight: '600', textAlign: 'center', color: COLORS.gray900, marginBottom: 24, borderWidth: 1, borderColor: COLORS.gray200 },

  // Unknown
  unknownIcon: { fontSize: 64, marginBottom: 16 },
  unknownTitle: { fontSize: 20, fontWeight: '600', color: COLORS.gray900, marginBottom: 8 },
  unknownBarcode: { fontSize: 14, color: COLORS.gray500, marginBottom: 16 },
  unknownDesc: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: 24, paddingHorizontal: 32 },

  // Success
  successIcon: { fontSize: 64, width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.successLight, textAlign: 'center', lineHeight: 96, color: COLORS.success, marginBottom: 24, overflow: 'hidden' },
  successTitle: { fontSize: 24, fontWeight: '700', color: COLORS.gray900, marginBottom: 8 },
  successSubtitle: { fontSize: 16, color: COLORS.gray500, marginBottom: 8 },
  successDesc: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: 32 },

  // Lookup
  lookupContent: { padding: 24 },
  searchInput: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.gray900, borderWidth: 1, borderColor: COLORS.gray200 },
  lookupResult: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginTop: 24 },
  lookupItemName: { fontSize: 18, fontWeight: '600', color: COLORS.gray900 },
  lookupItemSku: { fontSize: 14, color: COLORS.gray500, marginTop: 4 },
  lookupItemStock: { fontSize: 14, color: COLORS.primary, fontWeight: '500', marginTop: 8 },

  // Bin
  binCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  binCardCode: { fontSize: 16, fontWeight: '600', color: COLORS.gray900 },
  binCardLocation: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  binCardItems: { fontSize: 12, color: COLORS.primary, marginTop: 4 },

  // Form
  formContent: { flex: 1, padding: 24 },
  formInput: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.gray900, marginBottom: 16, borderWidth: 1, borderColor: COLORS.gray200 },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  pickerOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.gray100 },
  pickerOptionSelected: { backgroundColor: COLORS.primary },
  pickerOptionText: { fontSize: 14, color: COLORS.gray700 },
  pickerOptionTextSelected: { color: COLORS.white },

  // Review
  reviewContent: { flex: 1, padding: 16 },
  reviewHeader: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  reviewNumber: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
  reviewLocation: { fontSize: 14, color: COLORS.gray500, marginTop: 4 },
  reviewAssignee: { fontSize: 13, color: COLORS.primary, marginTop: 8 },

  // Warning
  warningBox: { backgroundColor: COLORS.warningLight, borderRadius: 12, padding: 16, marginBottom: 16 },
  warningText: { color: COLORS.warning, fontSize: 14, fontWeight: '500' },

  // EndCount
  endCountContent: { flex: 1, padding: 16 },

  // Profile
  profileContent: { flex: 1, alignItems: 'center', paddingTop: 40 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  profileAvatarText: { fontSize: 32, fontWeight: '600', color: COLORS.primary },
  profileName: { fontSize: 20, fontWeight: '600', color: COLORS.gray900 },
  profileRole: { fontSize: 14, color: COLORS.primary, textTransform: 'capitalize', marginTop: 4 },
  profilePhone: { fontSize: 14, color: COLORS.gray500, marginTop: 8 },

  // Placeholder
  placeholderIcon: { fontSize: 64, marginBottom: 16 },
  placeholderText: { fontSize: 16, color: COLORS.gray500 },

  // Serial Number
  serialBadge: { backgroundColor: COLORS.purpleLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8 },
  serialBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.purple, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  serialBadgeSmall: { backgroundColor: COLORS.purpleLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 2, alignSelf: 'flex-start' },
  serialBadgeSmallText: { fontSize: 11, fontWeight: '600', color: COLORS.purple, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  serialCountedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  serialCountedBadgeText: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  itemCardSerial: { borderLeftWidth: 3, borderLeftColor: COLORS.purple },
  qtyValueSerial: { color: COLORS.success },
  serialScanHint: { fontSize: 11, color: COLORS.purple, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
});
