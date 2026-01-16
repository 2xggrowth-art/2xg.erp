import { useEffect, useState } from 'react';
import { useDateFilter } from '../../contexts/DateFilterContext';
import { crmService } from '../../services/crm.service';
import MetricCard from '../dashboard/MetricCard';
import { TrendingUp } from 'lucide-react';
import type { Customer } from '../../types';

const CRMModule = () => {
  const { dateRange } = useDateFilter();
  const [loading, setLoading] = useState(true);
  const [crm, setCrm] = useState({
    leadVolume: 0,
    totalValue: 0,
    customers: [] as Customer[]
  });

  useEffect(() => {
    fetchCRMData();
  }, [dateRange]);

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const [leads, customers] = await Promise.all([
        crmService.getLeadReporting(dateRange.startDate, dateRange.endDate),
        crmService.getCustomers(dateRange.startDate, dateRange.endDate)
      ]);

      setCrm({
        leadVolume: leads.data?.volume || 0,
        totalValue: leads.data?.totalValue || 0,
        customers: Array.isArray(customers.data) ? customers.data.slice(0, 20) : [] // Limit to 20 for display
      });
    } catch (error) {
      console.error('Error fetching CRM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'qualified':
        return 'bg-blue-100 text-blue-800';
      case 'proposal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <section id="crm" className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Sales Pipeline - CRM</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="crm" className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Sales Pipeline - CRM</h2>

      <div className="grid grid-cols-1 gap-6">
        {/* Lead Reporting Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            title="2XG Earn Reporting - Lead Volume"
            value={crm.leadVolume}
            icon={TrendingUp}
            colorClass="green"
          />
          <MetricCard
            title="Total Expected Value"
            value={`₹${crm.totalValue.toLocaleString('en-IN')}`}
            icon={TrendingUp}
            colorClass="blue"
          />
        </div>

        {/* Customer Data Table */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Customer Data</h3>
          {crm.customers.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Expected Value</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Lead Date</th>
                </tr>
              </thead>
              <tbody>
                {crm.customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{customer.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.customer_phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.customer_email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(customer.status)}`}>
                        {customer.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {customer.expected_value ? `₹${customer.expected_value.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(customer.lead_date).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No customer data available
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CRMModule;
