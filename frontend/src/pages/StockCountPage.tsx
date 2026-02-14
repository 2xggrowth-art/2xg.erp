import React, { useState, useEffect } from 'react';
import { Package, Search, ChevronDown, ChevronRight, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { binLocationService, BinItemStock } from '../services/binLocation.service';

interface StockItem {
  item_id: string;
  item_name: string;
  total_stock: number;
  unit_of_measurement: string;
  bins: Array<{
    bin_code: string;
    location_name: string;
    quantity: number;
    transactions: BinItemStock['transactions'];
  }>;
}

const StockCountPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [expandedBin, setExpandedBin] = useState<string | null>(null);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await binLocationService.getBinLocationsWithStock();

      if (response.success && response.data) {
        // Aggregate data by item across all bins
        const itemMap = new Map<string, StockItem>();

        for (const bin of response.data) {
          const locationName = bin.locations?.name || bin.warehouse || 'Unknown';

          for (const item of bin.items) {
            if (!itemMap.has(item.item_id)) {
              itemMap.set(item.item_id, {
                item_id: item.item_id,
                item_name: item.item_name,
                total_stock: 0,
                unit_of_measurement: item.unit_of_measurement,
                bins: [],
              });
            }

            const stockItem = itemMap.get(item.item_id)!;
            stockItem.total_stock += item.quantity;
            stockItem.bins.push({
              bin_code: bin.bin_code,
              location_name: locationName,
              quantity: item.quantity,
              transactions: item.transactions || [],
            });
          }
        }

        // Sort by item name
        const items = Array.from(itemMap.values()).sort((a, b) =>
          a.item_name.localeCompare(b.item_name)
        );
        setStockItems(items);
      } else {
        setError(response.error || 'Failed to load stock data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = stockItems.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowDownCircle size={14} className="text-green-600" />;
      case 'sale':
        return <ArrowUpCircle size={14} className="text-red-600" />;
      case 'transfer_in':
        return <ArrowRightLeft size={14} className="text-blue-600" />;
      case 'transfer_out':
        return <ArrowRightLeft size={14} className="text-orange-600" />;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Purchase (In)';
      case 'sale': return 'Sale (Out)';
      case 'transfer_in': return 'Transfer In';
      case 'transfer_out': return 'Transfer Out';
      default: return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-700 bg-green-50';
      case 'sale': return 'text-red-700 bg-red-50';
      case 'transfer_in': return 'text-blue-700 bg-blue-50';
      case 'transfer_out': return 'text-orange-700 bg-orange-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalItems = filteredItems.length;
  const totalStock = filteredItems.reduce((sum, item) => sum + item.total_stock, 0);
  const totalBins = new Set(filteredItems.flatMap(item => item.bins.map(b => b.bin_code))).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading stock data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchStockData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Count</h1>
            <p className="text-sm text-gray-500">View all items with bin-wise stock and movement history</p>
          </div>
        </div>
        <button
          onClick={fetchStockData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Stock (across bins)</p>
          <p className="text-2xl font-bold text-blue-600">{totalStock.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Bins</p>
          <p className="text-2xl font-bold text-green-600">{totalBins}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item Name</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Bins</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Stock</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Unit</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  {searchQuery ? 'No items match your search' : 'No stock data found in any bins'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isExpanded = expandedItem === item.item_id;
                return (
                  <React.Fragment key={item.item_id}>
                    {/* Item Row */}
                    <tr
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setExpandedItem(isExpanded ? null : item.item_id);
                        setExpandedBin(null);
                      }}
                    >
                      <td className="px-4 py-3">
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{item.item_name}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {item.bins.length} bin{item.bins.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900">{item.total_stock.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {item.unit_of_measurement}
                      </td>
                    </tr>

                    {/* Expanded: Bin Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50 px-6 py-4">
                          <div className="space-y-2">
                            {item.bins.map((bin) => {
                              const binKey = `${item.item_id}-${bin.bin_code}`;
                              const isBinExpanded = expandedBin === binKey;
                              return (
                                <div key={binKey} className="bg-white rounded-lg border border-gray-200">
                                  {/* Bin Header */}
                                  <div
                                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedBin(isBinExpanded ? null : binKey);
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      {isBinExpanded ? (
                                        <ChevronDown size={14} className="text-gray-500" />
                                      ) : (
                                        <ChevronRight size={14} className="text-gray-400" />
                                      )}
                                      <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                        {bin.bin_code}
                                      </span>
                                      <span className="text-sm text-gray-500">{bin.location_name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm font-semibold text-gray-900">
                                        {bin.quantity.toFixed(2)} {item.unit_of_measurement}
                                      </span>
                                      {bin.transactions.length > 0 && (
                                        <span className="text-xs text-gray-400">
                                          {bin.transactions.length} transaction{bin.transactions.length !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Transaction History */}
                                  {isBinExpanded && bin.transactions.length > 0 && (
                                    <div className="border-t border-gray-200 px-4 py-3">
                                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                        Movement History
                                      </h4>
                                      <div className="space-y-1.5">
                                        {bin.transactions
                                          .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
                                          .map((txn, idx) => (
                                          <div
                                            key={idx}
                                            className={`flex items-center justify-between px-3 py-2 rounded-md ${getTransactionColor(txn.type)}`}
                                          >
                                            <div className="flex items-center gap-2">
                                              {getTransactionIcon(txn.type)}
                                              <span className="text-xs font-medium">
                                                {getTransactionLabel(txn.type)}
                                              </span>
                                              {txn.reference && (
                                                <span className="text-xs opacity-75">
                                                  ({txn.reference})
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className="text-xs">{formatDate(txn.date || txn.created_at)}</span>
                                              <span className="text-xs font-bold">
                                                {(txn.type as string) === 'sale' || (txn.type as string) === 'transfer_out' ? '-' : '+'}
                                                {txn.quantity}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {isBinExpanded && bin.transactions.length === 0 && (
                                    <div className="border-t border-gray-200 px-4 py-3 text-center text-xs text-gray-400">
                                      No movement history available
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockCountPage;
