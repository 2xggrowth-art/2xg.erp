import ComingSoon from '../components/common/ComingSoon';

const ReportsPage = () => {
  return (
    <ComingSoon
      moduleName="Reports & Analytics"
      description="Generate comprehensive business reports with customizable templates and scheduling."
      features={[
        'Pre-built report templates',
        'Custom report builder',
        'Scheduled report generation',
        'Multi-format export (PDF, Excel, CSV)',
        'Interactive data visualization',
        'Cross-module reporting',
        'Comparative analysis',
        'Email report distribution',
        'Report history and archiving'
      ]}
    />
  );
};

export default ReportsPage;
