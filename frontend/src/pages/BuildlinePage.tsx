import { useAuth } from '../contexts/AuthContext';
import { SupervisorDashboard } from '../components/buildline/supervisor/SupervisorDashboard';
import { TechnicianDashboard } from '../components/buildline/technician/TechnicianDashboard';
import { PwaInstallBanner } from '../components/buildline/shared/PwaInstallBanner';

const BuildlinePage = () => {
  const { user } = useAuth();

  const buildlineRole = user?.buildline_role;

  // Technicians see the technician dashboard
  // Everyone else (Admin, supervisor) sees the supervisor dashboard
  if (buildlineRole === 'technician') {
    return (
      <>
        <PwaInstallBanner />
        <TechnicianDashboard />
      </>
    );
  }

  return (
    <>
      <PwaInstallBanner />
      <SupervisorDashboard />
    </>
  );
};

export default BuildlinePage;
