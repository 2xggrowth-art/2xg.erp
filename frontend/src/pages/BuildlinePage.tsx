import { useAuth } from '../contexts/AuthContext';
import { SupervisorDashboard } from '../components/buildline/supervisor/SupervisorDashboard';
import { TechnicianDashboard } from '../components/buildline/technician/TechnicianDashboard';

const BuildlinePage = () => {
  const { user } = useAuth();

  // Admin and supervisor roles see the supervisor dashboard
  // Technicians see the technician dashboard
  // Default to supervisor view for Admin ERP role
  const role = user?.role;

  // For now, show supervisor dashboard (most common view)
  // In the future, can check user.buildlineRole from a profile endpoint
  return (
    <div>
      <SupervisorDashboard />
    </div>
  );
};

export default BuildlinePage;
