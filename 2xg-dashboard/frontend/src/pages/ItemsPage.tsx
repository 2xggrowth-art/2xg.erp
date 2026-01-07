import ComingSoon from '../components/common/ComingSoon';

const ItemsPage = () => {
  return (
    <ComingSoon
      moduleName="Items Management"
      description="Comprehensive product and inventory item management system with advanced tracking capabilities."
      features={[
        'Complete product catalog with SKU management',
        'Real-time stock level tracking',
        'Automatic reorder point alerts',
        'Barcode and QR code support',
        'Multi-warehouse inventory tracking',
        'Product categorization and tagging',
        'Batch and serial number tracking',
        'Product image gallery'
      ]}
    />
  );
};

export default ItemsPage;
