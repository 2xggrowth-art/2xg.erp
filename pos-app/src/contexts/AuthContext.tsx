import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Cashier' | 'Salesperson';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('pos-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, _password: string): Promise<boolean> => {
    // For local POS, we use a simplified auth
    // In production, this would validate against cloud ERP
    const localUser: User = {
      id: '1',
      name: email.split('@')[0] || 'Cashier',
      email,
      role: 'Admin',
    };
    setUser(localUser);
    localStorage.setItem('pos-user', JSON.stringify(localUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pos-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'Admin' }}>
      {children}
    </AuthContext.Provider>
  );
};
