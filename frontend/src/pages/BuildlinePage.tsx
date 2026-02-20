import { useAuth } from '../contexts/AuthContext';
import { SupervisorDashboard } from '../components/buildline/supervisor/SupervisorDashboard';
import { TechnicianDashboard } from '../components/buildline/technician/TechnicianDashboard';

const BuildlinePage = () => {
  const { user } = useAuth();

  const buildlineRole = user?.buildline_role;

  // Technicians see the technician dashboard
  // Everyone else (Admin, supervisor) sees the supervisor dashboard
  if (buildlineRole === 'technician') {
    return <TechnicianDashboard />;
  }

  return <SupervisorDashboard />;
};

export default BuildlinePage;
