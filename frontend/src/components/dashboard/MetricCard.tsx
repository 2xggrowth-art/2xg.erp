import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: 'green' | 'red' | 'blue' | 'gray' | 'orange' | 'purple';
  trend?: 'up' | 'down';
  trendValue?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  colorClass = 'blue',
  trend,
  trendValue
}: MetricCardProps) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[colorClass]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <Icon size={24} />
      </div>
      <div className="text-3xl font-bold mt-2">{value}</div>
      {trend && trendValue && (
        <div className="mt-2 text-sm">
          <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
