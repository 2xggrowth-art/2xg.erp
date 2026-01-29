import { useEffect, useState } from 'react';
import { useDateFilter } from '../../contexts/DateFilterContext';
import { erpService } from '../../services/erp.service';
import MetricCard from '../dashboard/MetricCard';
import { DollarSign, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import type { CategorySales, InventoryItem } from '../../types';

const ERPModule = () => {
  const { dateRange } = useDateFilter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalSales: 0,
    categorySales: [] as CategorySales[],
    overdueAmount: 0,
    hotSelling: [] as InventoryItem[],
    lowStock: [] as InventoryItem[]
  });

  useEffect(() => {
    fetchERPData();
  }, [dateRange]);

  const fetchERPData = async () => {
    setLoading(true);
    try {
      const [sales, categories, overdue, hot, low] = await Promise.all([
        erpService.getTotalSales(dateRange.startDate, dateRange.endDate),
        erpService.getSalesByCategory(dateRange.startDate, dateRange.endDate),
        erpService.getOverdueAmount(dateRange.startDate, dateRange.endDate),
        erpService.getHotSellingItems(),
        erpService.getLowStockItems()
      ]);

      setData({
        totalSales: sales.data?.totalSales || 0,
        categorySales: Array.isArray(categories.data) ? categories.data : [],
        overdueAmount: overdue.data?.amount || 0,
        hotSelling: Array.isArray(hot.data) ? hot.data : [],
        lowStock: Array.isArray(low.data) ? low.data : []
      });
    } catch (error) {
      console.error('Error fetching ERP data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="erp" className="mb-8">
        <h2 className="text-2xl font-bold mb-4">ERP Section - Sales & Inventory</h2>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="erp" className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">ERP Section - Sales & Inventory</h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard
          title="Total Category Sales"
          value={data.categorySales.length}
          icon={Package}
          colorClass="gray"
        />
        <MetricCard
          title="Total Sales Value"
          value={`₹${(data.totalSales || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          colorClass="green"
        />
        <MetricCard
          title="Daily Overdue Amount"
          value={`₹${data.overdueAmount.toLocaleString('en-IN')}`}
          icon={AlertTriangle}
          colorClass="red"
        />
      </div>

      {/* Inventory Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Selling Items */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Hot Selling Items</h3>
          </div>
          <ul className="space-y-2">
            {data.hotSelling.length > 0 ? (
              data.hotSelling.map((item) => (
                <li key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{item.product_name}</span>
                  <span className="font-semibold text-green-600">{item.sales_count} sold</span>
                </li>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </ul>
        </div>

        {/* Low Inventory Alert */}
        <div className="bg-white p-6 rounded-lg shadow border border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="text-lg font-semibold text-red-700">Low Inventory Alert</h3>
          </div>
          <ul className="space-y-2">
            {data.lowStock.length > 0 ? (
              data.lowStock.map((item) => (
                <li key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{item.product_name}</span>
                  <span className="text-sm">
                    <span className="text-red-600 font-semibold">{item.current_stock}</span>
                    {' / '}
                    <span className="text-gray-500">{item.reorder_point}</span>
                  </span>
                </li>
              ))
            ) : (
              <p className="text-green-600 text-sm">All items are sufficiently stocked!</p>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ERPModule;
