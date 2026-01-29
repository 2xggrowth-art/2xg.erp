import ComingSoon from '../components/common/ComingSoon';

const PurchasesPage = () => {
  return (
    <ComingSoon
      moduleName="Purchase Orders"
      description="Streamline your procurement process with intelligent purchase order management."
      features={[
        'Create and manage purchase orders',
        'Supplier management and contact database',
        'Automated PO generation from low stock items',
        'Multi-currency support',
        'PO approval workflows',
        'Partial delivery tracking',
        'Purchase history and analytics',
        'Email POs directly to suppliers'
      ]}
    />
  );
};

export default PurchasesPage;
