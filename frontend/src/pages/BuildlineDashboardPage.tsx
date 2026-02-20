import { useState, useEffect } from 'react';
import { Bike, CheckCircle, Clock, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { assemblyService } from '../services/assembly.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ASSEMBLY_STATUS_LABELS,
  STATUS_COLORS,
} from '../constants/assemblyConstants';
import toast from 'react-hot-toast';
import { DashboardStats, TechnicianWorkload, AssemblyStatus } from '../types/assembly';

interface StatusBreakdown {
  name: string;
  value: number;
  color: string;
}

const BuildlineDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await assemblyService.getDashboard();
      if (response.data.success) {
        const data = response.data.data;
        setStats(data.stats || data);
        setTechnicians(data.technicians || []);
        setLastRefreshed(new Date());
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="mx-auto text-gray-400 animate-spin mb-3" size={32} />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">Failed to load dashboard data.</p>
          <button
            onClick={loadDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Build status breakdown for pie chart
  const statusBreakdown: StatusBreakdown[] = (
    Object.keys(ASSEMBLY_STATUS_LABELS) as AssemblyStatus[]
  )
    .map((status) => ({
      name: ASSEMBLY_STATUS_LABELS[status],
      value: stats[status as keyof DashboardStats] as number || 0,
      color: STATUS_COLORS[status],
    }))
    .filter((item) => item.value > 0);

  // Build technician chart data
  const technicianChartData = technicians.map((tech) => ({
    name: tech.technician_name.split(' ')[0], // First name only for chart
    fullName: tech.technician_name,
    assigned: tech.assigned_count,
    in_progress: tech.in_progress_count,
    completed_today: tech.completed_today,
    total: tech.total_completed,
  }));

  const summaryCards = [
    {
      label: 'Total Bikes',
      value: stats.total_bikes,
      icon: Bike,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      label: 'Ready for Sale',
      value: stats.ready_for_sale,
      icon: CheckCircle,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: Clock,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Technicians',
      value: technicians.length,
      icon: Users,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Issues',
      value: stats.parts_missing_count + stats.damage_reported_count,
      icon: AlertTriangle,
      color: 'bg-red-500',
      lightColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Buildline Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Assembly line performance overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.lightColor}`}>
                  <Icon className={card.textColor} size={20} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Today Inwarded</h3>
          <div className="text-3xl font-bold text-indigo-600">{stats.today_inwarded}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Today Completed</h3>
          <div className="text-3xl font-bold text-green-600">{stats.today_completed}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Avg Assembly Time</h3>
          <div className="text-3xl font-bold text-blue-600">
            {stats.avg_assembly_time_hours
              ? `${stats.avg_assembly_time_hours.toFixed(1)}h`
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status Distribution</h3>
          {statusBreakdown.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No bikes in the system yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Technician Workload Bar */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Technician Workload</h3>
          {technicianChartData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No technician data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={technicianChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return (payload[0].payload as { fullName: string }).fullName;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="assigned"
                  name="Assigned"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="in_progress"
                  name="In Progress"
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="completed_today"
                  name="Completed Today"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Issues Summary */}
      {(stats.parts_missing_count > 0 || stats.damage_reported_count > 0) && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Active Issues
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.parts_missing_count > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Parts Missing</p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      Bikes waiting for parts
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-orange-700">
                    {stats.parts_missing_count}
                  </span>
                </div>
              </div>
            )}
            {stats.damage_reported_count > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Damage Reported</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Bikes with damage issues
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-red-700">
                    {stats.damage_reported_count}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technician Table */}
      {technicians.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Technician Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Progress
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Today
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Completed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {technicians.map((tech) => (
                  <tr key={tech.technician_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {tech.technician_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {tech.technician_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          tech.assigned_count > 0
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {tech.assigned_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          tech.in_progress_count > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {tech.in_progress_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          tech.completed_today > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {tech.completed_today}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-gray-900">
                        {tech.total_completed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildlineDashboardPage;
