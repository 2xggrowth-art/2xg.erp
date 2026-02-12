import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Colors
const COLORS = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
};

// API using fetch instead of axios
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
};

// Auth Context
interface User {
  id: string;
  phone_number: string;
  employee_name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

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
    const res = await api.post('/mobile-auth/login', { phoneNumber: phone, pin });
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
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Login Screen
function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (phone.length < 10 || pin.length !== 4) {
      Alert.alert('Error', 'Enter valid phone and 4-digit PIN');
      return;
    }
    setLoading(true);
    try {
      await login(phone.replace(/\D/g, '').slice(-10), pin);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <View style={styles.loginHeader}>
        <Text style={styles.loginIcon}>📦</Text>
        <Text style={styles.loginTitle}>StockCount</Text>
      </View>
      <View style={styles.loginForm}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Text style={styles.label}>PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="4-digit PIN"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          value={pin}
          onChangeText={setPin}
        />
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Dashboard Screen
function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = async () => {
    try {
      const res = await api.get(`/stock-counts?assigned_to=${user?.id}`);
      if (res.success) setCounts(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchCounts();
  }, [user?.id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const active = counts.filter(c => ['pending', 'in_progress', 'recount'].includes(c.status));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.employee_name}</Text>
        <Text style={styles.headerTitle}>My Counts</Text>
      </View>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCounts(); }} />}
      >
        {active.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No active counts assigned</Text>
          </View>
        ) : (
          active.map(count => (
            <TouchableOpacity
              key={count.id}
              style={styles.card}
              onPress={() => navigation.navigate('CountDetail', { countId: count.id })}
            >
              <Text style={styles.cardTitle}>{count.location_name}</Text>
              <Text style={styles.cardSub}>{count.count_number} - {count.total_items} items</Text>
              <View style={styles.progress}>
                <View style={[styles.progressBar, { width: `${(count.counted_items / count.total_items) * 100}%` }]} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Count Detail Screen
function CountDetailScreen({ route, navigation }: any) {
  const { countId } = route.params;
  const [count, setCount] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCount();
  }, [countId]);

  const fetchCount = async () => {
    try {
      const res = await api.get(`/stock-counts/${countId}`);
      if (res.success) {
        setCount(res.data);
        if (['pending', 'recount'].includes(res.data.status)) {
          await api.post(`/stock-counts/${countId}/start`);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: string, qty: number) => {
    try {
      await api.put(`/stock-counts/${countId}/items/${itemId}`, { counted_quantity: qty });
      fetchCount();
    } catch (e) {
      Alert.alert('Error', 'Failed to save');
    }
  };

  const submitCount = async () => {
    try {
      await api.post(`/stock-counts/${countId}/submit`);
      Alert.alert('Success', 'Count submitted!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit');
    }
  };

  if (loading || !count) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{count.location_name}</Text>
      </View>
      <ScrollView style={styles.content}>
        {count.items?.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.item_name}</Text>
              <Text style={styles.itemExp}>Expected: {item.expected_quantity}</Text>
            </View>
            <TextInput
              style={styles.qtyInput}
              keyboardType="number-pad"
              placeholder="Qty"
              defaultValue={item.counted_quantity?.toString() || ''}
              onEndEditing={(e) => updateItem(item.id, parseInt(e.nativeEvent.text) || 0)}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.submitBtn} onPress={() => Alert.alert('Submit?', 'Submit count for review?', [{ text: 'Cancel' }, { text: 'Submit', onPress: submitCount }])}>
          <Text style={styles.submitBtnText}>Submit Count</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Profile Screen
function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.profileContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.employee_name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.profileName}>{user?.employee_name}</Text>
        <Text style={styles.profilePhone}>{user?.phone_number}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout }])}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Navigation
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORS.primary }}>
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CountDetail" component={CountDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

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

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  screen: { flex: 1, backgroundColor: COLORS.gray50 },
  header: { backgroundColor: COLORS.white, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.gray900 },
  greeting: { fontSize: 14, color: COLORS.gray500, marginBottom: 4 },
  backBtn: { fontSize: 16, color: COLORS.primary, marginBottom: 8 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: COLORS.white, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.gray100 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  cardSub: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },
  progress: { height: 6, backgroundColor: COLORS.gray200, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: COLORS.gray400 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.gray100 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.gray800 },
  itemExp: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  qtyInput: { width: 60, height: 40, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 8, textAlign: 'center', fontSize: 16 },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  loginContainer: { flex: 1, backgroundColor: COLORS.gray50 },
  loginHeader: { backgroundColor: COLORS.primary, paddingTop: 80, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  loginIcon: { fontSize: 48, marginBottom: 12 },
  loginTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  loginForm: { flex: 1, padding: 24, marginTop: -20, backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray500, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, padding: 14, fontSize: 16 },
  loginBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  profileContent: { flex: 1, alignItems: 'center', paddingTop: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.primary },
  profileName: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  profilePhone: { fontSize: 14, color: COLORS.gray400, marginTop: 4 },
  logoutBtn: { backgroundColor: COLORS.danger, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, marginTop: 40 },
  logoutBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
