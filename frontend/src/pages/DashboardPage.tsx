import ERPModule from '../components/modules/ERPModule';
import LogisticsModule from '../components/modules/LogisticsModule';
import CAREModule from '../components/modules/CAREModule';
import CRMModule from '../components/modules/CRMModule';
import MainContent from '../components/layout/MainContent';

const DashboardPage = () => {
  return (
    <MainContent>
      <ERPModule />
      <LogisticsModule />
      <CAREModule />
      <CRMModule />
    </MainContent>
  );
};

export default DashboardPage;
