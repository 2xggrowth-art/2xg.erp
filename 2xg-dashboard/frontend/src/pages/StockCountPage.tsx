import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StockCountWorkflow from '../components/common/StockCountWorkflow';

const StockCountPage = () => {
  const navigate = useNavigate();

  const handleNewStockCount = () => {
    navigate('/items/stock-count/new');
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Stock Counts</h1>
            <p className="text-slate-600 mt-2">
              Create, count, submit, and make inventory adjustments.
            </p>
          </div>
          <button
            onClick={handleNewStockCount}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus size={20} />
            <span className="font-medium">New Stock Count</span>
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Start Your Stock Counting Process
          </h2>
          <p className="text-slate-600 mb-6">
            Create, count, submit, and make inventory adjustments.
          </p>
          <button
            onClick={handleNewStockCount}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            NEW STOCK COUNT
          </button>
        </div>

        {/* Stock Count Workflow */}
        <StockCountWorkflow />
      </div>
    </div>
  );
};

export default StockCountPage;
