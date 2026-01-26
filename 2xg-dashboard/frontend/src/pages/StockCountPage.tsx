import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StockCountWorkflow from '../components/common/StockCountWorkflow';
import { stockCountService, StockCount } from '../services/stockCount.service';
import BulkActionBar, { createBulkDeleteAction } from '../components/common/BulkActionBar';

const StockCountPage = () => {
  const navigate = useNavigate();
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCounts, setSelectedCounts] = useState<string[]>([]);

  useEffect(() => {
    loadStockCounts();
  }, []);

  const loadStockCounts = async () => {
    setIsLoading(true);
    try {
      const counts = await stockCountService.getAllStockCounts();
      setStockCounts(counts);
    } catch (error) {
      console.error('Error loading stock counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewStockCount = () => {
    navigate('/items/stock-count/new');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this stock count?')) {
      try {
        await stockCountService.deleteStockCount(id);
        loadStockCounts(); // Reload the list
        setSelectedCounts(prev => prev.filter(countId => countId !== id)); // Remove from selection if deleted
      } catch (error) {
        console.error('Error deleting stock count:', error);
        alert('Failed to delete stock count. Please try again.');
      }
    }
  };

  // Bulk Selection Handlers
  const handleSelectCount = (id: string) => {
    setSelectedCounts(prev =>
      prev.includes(id)
        ? prev.filter(countId => countId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCounts.length === stockCounts.length) {
      setSelectedCounts([]);
    } else {
      setSelectedCounts(stockCounts.map(count => count.id));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCounts.length} stock counts?`)) {
      try {
        // Delete sequentially or parallel
        await Promise.all(selectedCounts.map(id => stockCountService.deleteStockCount(id)));
        setSelectedCounts([]);
        loadStockCounts();
      } catch (error) {
        console.error('Error bulk deleting stock counts:', error);
        alert('Failed to delete some stock counts. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: StockCount['status']) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading stock counts...</p>
          </div>
        ) : stockCounts.length === 0 ? (
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
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCounts.length === stockCounts.length && stockCounts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Stock Count #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stockCounts.map((stockCount) => (
                    <tr key={stockCount.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/items/stock-count/${stockCount.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCounts.includes(stockCount.id)}
                          onChange={() => handleSelectCount(stockCount.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          {stockCount.stockCountNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-800">
                          {stockCount.description || '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {formatDate(stockCount.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {stockCount.location}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {stockCount.assignTo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {stockCount.items.length} items
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(stockCount.status)}`}>
                          {stockCount.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/items/stock-count/${stockCount.id}`);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/items/stock-count/edit/${stockCount.id}`);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(stockCount.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stock Count Workflow */}
        <StockCountWorkflow />
      </div>

      {/* Bulk Action Bar */}
      {
        selectedCounts.length > 0 && (
          <BulkActionBar
            selectedCount={selectedCounts.length}
            totalCount={stockCounts.length}
            onClearSelection={() => setSelectedCounts([])}
            onSelectAll={handleSelectAll}
            actions={[
              createBulkDeleteAction(handleBulkDelete),
            ]}
            entityName="stock count"
          />
        )
      }
    </div >
  );
};

export default StockCountPage;
