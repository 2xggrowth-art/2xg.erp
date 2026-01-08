import { FileEdit, Send, CheckCircle, Package, Truck, Receipt, Plus } from 'lucide-react';
import ProcessFlow from '../components/common/ProcessFlow';

const SalesOrderPage = () => {
  const salesOrderSteps = [
    {
      icon: FileEdit,
      title: 'Create Sales Order',
      description: 'Create order with customer details and items',
    },
    {
      icon: CheckCircle,
      title: 'Confirm Order',
      description: 'Customer confirms the sales order',
      status: 'success' as const,
    },
    {
      icon: Package,
      title: 'Pack Items',
      description: 'Prepare and pack items for shipment',
    },
    {
      icon: Truck,
      title: 'Ship Order',
      description: 'Ship items to customer',
    },
    {
      icon: Receipt,
      title: 'Generate Invoice',
      description: 'Create invoice for payment',
    },
    {
      icon: CheckCircle,
      title: 'Order Complete',
      description: 'Order fulfilled and payment received',
      status: 'success' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Sales Orders</h1>
            <p className="text-slate-600 mt-2">
              Create and manage customer sales orders.
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
            <Plus size={20} />
            <span className="font-medium">New Sales Order</span>
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Start Creating Sales Orders
          </h2>
          <p className="text-slate-600 mb-6">
            Create orders, pack items, ship to customers, and generate invoices.
          </p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md">
            NEW SALES ORDER
          </button>
        </div>

        {/* Process Flow */}
        <ProcessFlow title="Life cycle of a Sales Order" steps={salesOrderSteps} />
      </div>
    </div>
  );
};

export default SalesOrderPage;
