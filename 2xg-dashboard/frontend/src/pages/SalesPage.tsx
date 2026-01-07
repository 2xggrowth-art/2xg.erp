import ComingSoon from '../components/common/ComingSoon';

const SalesPage = () => {
  return (
    <ComingSoon
      moduleName="Sales Management"
      description="Advanced sales order processing and customer relationship management."
      features={[
        'Sales order creation and tracking',
        'Customer database and history',
        'Quotation management',
        'Invoice generation and printing',
        'Payment tracking and reminders',
        'Sales analytics and reporting',
        'Discount and promotion management',
        'Delivery note generation'
      ]}
    />
  );
};

export default SalesPage;
