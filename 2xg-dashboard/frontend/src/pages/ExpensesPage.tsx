import ComingSoon from '../components/common/ComingSoon';

const ExpensesPage = () => {
  return (
    <ComingSoon
      moduleName="Expense Tracking"
      description="Monitor and manage all business expenses with detailed categorization and reporting."
      features={[
        'Expense entry and categorization',
        'Receipt upload and attachment',
        'Multi-currency expense tracking',
        'Approval workflows',
        'Vendor expense tracking',
        'Project-wise expense allocation',
        'Billable vs non-billable expenses',
        'Expense reports and analytics',
        'Tax calculation and reporting'
      ]}
    />
  );
};

export default ExpensesPage;
