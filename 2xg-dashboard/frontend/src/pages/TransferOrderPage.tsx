import { FileText, Package, Truck, CheckCircle, XCircle, Plus, ClipboardCheck } from 'lucide-react';
import ProcessFlow from '../components/common/ProcessFlow';

const TransferOrderPage = () => {
  const transferOrderSteps = [
    {
      icon: FileText,
      title: 'Create Transfer Order',
      description: 'Initiate transfer between warehouses',
    },
    {
      icon: Package,
      title: 'Prepare Items',
      description: 'Pack and prepare items for transfer',
    },
    {
      icon: Truck,
      title: 'Ship Items',
      description: 'Items are shipped to destination warehouse',
    },
    {
      icon: ClipboardCheck,
      title: 'Receive at Destination',
      description: 'Destination warehouse receives and verifies items',
    },
    {
      icon: CheckCircle,
      title: 'Transfer Complete',
      description: 'Inventory updated in both warehouses',
      status: 'success' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Transfer Orders</h1>
            <p className="text-slate-600 mt-2">
              Transfer inventory between warehouses and locations.
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
            <Plus size={20} />
            <span className="font-medium">New Transfer Order</span>
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Start Your Transfer Order Process
          </h2>
          <p className="text-slate-600 mb-6">
            Transfer inventory between warehouses and track shipments.
          </p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md">
            NEW TRANSFER ORDER
          </button>
        </div>

        {/* Process Flow */}
        <ProcessFlow title="Life cycle of a Transfer Order" steps={transferOrderSteps} />
      </div>
    </div>
  );
};

export default TransferOrderPage;
