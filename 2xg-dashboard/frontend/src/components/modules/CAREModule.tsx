import { useEffect, useState } from 'react';
import { useDateFilter } from '../../contexts/DateFilterContext';
import { careService } from '../../services/care.service';
import MetricCard from '../dashboard/MetricCard';
import { Headphones } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TicketCategory } from '../../types';

const CAREModule = () => {
  const { dateRange } = useDateFilter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState({
    total: 0,
    byCategory: [] as TicketCategory[]
  });

  useEffect(() => {
    fetchCAREData();
  }, [dateRange]);

  const fetchCAREData = async () => {
    setLoading(true);
    try {
      const [total, byCategory] = await Promise.all([
        careService.getTotalTickets(dateRange.startDate, dateRange.endDate),
        careService.getTicketsByCategory(dateRange.startDate, dateRange.endDate)
      ]);

      setTickets({
        total: total.data.total,
        byCategory: byCategory.data
      });
    } catch (error) {
      console.error('Error fetching CARE data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="care" className="mb-8">
        <h2 className="text-2xl font-bold mb-4">2XG CARE - Service Module</h2>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="care" className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">2XG CARE - Service Module</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Tickets Card */}
        <div className="flex items-center">
          <MetricCard
            title="Total Service Tickets Raised"
            value={tickets.total}
            icon={Headphones}
            colorClass="blue"
          />
        </div>

        {/* Category-wise Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Category-wise Ticket Breakdown</h3>
          {tickets.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tickets.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No ticket data available
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CAREModule;
