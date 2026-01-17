import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing auth on mount
  useEffect(() => {
    console.log('AuthProvider: Checking for existing auth');
    const authUser = localStorage.getItem('authUser');
    console.log('AuthProvider: authUser from localStorage:', authUser);
    if (authUser) {
      try {
        const parsedUser = JSON.parse(authUser);
        console.log('AuthProvider: Setting user:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing auth user:', error);
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const usersData = localStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : [];

      const foundUser = users.find((u: any) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.status === 'Active'
      );

      if (foundUser) {
        const authUser: AuthUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
          isAuthenticated: true
        };

        setUser(authUser);
        localStorage.setItem('authUser', JSON.stringify(authUser));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
