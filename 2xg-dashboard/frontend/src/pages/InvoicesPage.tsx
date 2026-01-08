import { FileText, Send, Eye, CreditCard, CheckCircle, Plus } from 'lucide-react';
import ProcessFlow from '../components/common/ProcessFlow';

const InvoicesPage = () => {
  const invoiceSteps = [
    {
      icon: FileText,
      title: 'Create Invoice',
      description: 'Generate invoice from sales order',
    },
    {
      icon: Send,
      title: 'Send to Customer',
      description: 'Email invoice to customer',
    },
    {
      icon: Eye,
      title: 'Customer Views',
      description: 'Customer reviews invoice details',
    },
    {
      icon: CreditCard,
      title: 'Payment Received',
      description: 'Customer makes payment',
      status: 'success' as const,
    },
    {
      icon: CheckCircle,
      title: 'Invoice Closed',
      description: 'Invoice marked as paid and closed',
      status: 'success' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>
            <p className="text-slate-600 mt-2">
              Create, send, and track customer invoices.
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
            <Plus size={20} />
            <span className="font-medium">New Invoice</span>
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Start Creating Invoices
          </h2>
          <p className="text-slate-600 mb-6">
            Generate invoices, send to customers, and track payments.
          </p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md">
            NEW INVOICE
          </button>
        </div>

        {/* Process Flow */}
        <ProcessFlow title="Life cycle of an Invoice" steps={invoiceSteps} />
      </div>
    </div>
  );
};

export default InvoicesPage;
