import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect technicians to technician login, others to admin login
    const loginType = authService.getLoginType();
    authService.clearLoginType();
    return <Navigate to={loginType === 'technician' ? '/technician-login' : '/login'} replace />;
  }

  // Technicians can only access /buildline routes
  const isTechnician = user?.buildline_role === 'technician' && user?.role !== 'Admin';
  if (isTechnician && !location.pathname.startsWith('/buildline')) {
    return <Navigate to="/buildline" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
