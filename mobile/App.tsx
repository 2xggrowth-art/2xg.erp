import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import AmountScreen from './src/screens/AmountScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import SuccessScreen from './src/screens/SuccessScreen';

// Types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Capture: undefined;
  Amount: { imageUri?: string };
  Category: { imageUri?: string; amount: number };
  Payment: { imageUri?: string; amount: number; categoryId: string; categoryName: string };
  Review: {
    imageUri?: string;
    amount: number;
    categoryId: string;
    categoryName: string;
    paymentMethod: string;
    notes?: string;
  };
  Success: {
    expenseNumber: string;
    amount: number;
    isAutoApproved: boolean;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Auth Context
export const AuthContext = React.createContext<{
  user: any;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for stored token on app start
    const checkAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        const storedUser = await SecureStore.getItemAsync('user_data');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
    await SecureStore.setItemAsync('auth_token', newToken);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {!token ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              {/* Home is the new landing page */}
              <Stack.Screen name="Home" component={HomeScreen} />

              {/* Expense Flow */}
              <Stack.Screen name="Capture" component={CaptureScreen} />
              <Stack.Screen name="Amount" component={AmountScreen} />
              <Stack.Screen name="Category" component={CategoryScreen} />
              <Stack.Screen name="Payment" component={PaymentScreen} />
              <Stack.Screen name="Review" component={ReviewScreen} />
              <Stack.Screen
                name="Success"
                component={SuccessScreen}
                options={{ gestureEnabled: false }}
              />

            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
