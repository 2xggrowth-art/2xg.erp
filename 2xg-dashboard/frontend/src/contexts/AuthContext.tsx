import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User, LoginCredentials } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('AuthProvider: Initializing authentication');

      try {
        const token = authService.getToken();
        const storedUser = authService.getUser();

        if (token && storedUser) {
          console.log('AuthProvider: Found existing token, verifying...');

          try {
            // Verify token with backend
            const verifiedUser = await authService.verifyToken();
            console.log('AuthProvider: Token verified, user:', verifiedUser);
            setUser(verifiedUser);
          } catch (error) {
            console.error('AuthProvider: Token verification failed:', error);
            // Token is invalid, clear storage
            authService.logout();
            setUser(null);
          }
        } else {
          console.log('AuthProvider: No existing auth found');
        }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      console.log('AuthContext: Attempting login for:', credentials.email);

      const response = await authService.login(credentials);

      console.log('AuthContext: Login successful, user:', response.user);
      setUser(response.user);

      return true;
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out');
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  const refreshUser = async () => {
    try {
      const verifiedUser = await authService.verifyToken();
      setUser(verifiedUser);
    } catch (error) {
      console.error('AuthContext: Failed to refresh user:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        refreshUser
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
